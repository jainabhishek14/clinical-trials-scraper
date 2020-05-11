"use strict"

const rp = require("request-promise");

// rp.debug = process.env !== "production";

const config = require("./config");
const loadDB = require("./db");
const loadES = require("./es");
const { transformXMLToJObject } = require("./utils");

const esClient = loadES();
//TODO: response may contain \r\n handle it.
//save versioning
let db;

const fetchUnprocessedTrials = async () => {
    try{
        db = await loadDB();
        db = db.collection(config.db.collection);
        return await db.find({processed: false});
    } catch (err) {
        console.error(`Unable to fetch trials from database`, err);
        return false;
    }
}

const processTrial = async (options) => {
    try{
        const {clinical_study: {required_header, ...info}} =  await rp(options);
        return info;
    } catch (err) {
        console.error(`Unable to process trial`, err);
        return false;
    }
}

const updateTrial = async (info) => {
    try {
        if(await db.updateOne({nct_id: info.id_info.nct_id}, {$set: {...info, processed: true, processed_on: new Date().toISOString()}})){
            let updatedObject = await db.findOne({
                nct_id: info.id_info.nct_id
            });
            const { _id, ...doc } = updatedObject;
            await esClient.index({
                index: 'clinical-trials',
                type: '_doc',
                body: doc
            });
            return true;
        }

        return { elasticSave: false }
    } catch (err) {
        console.error(`Error while updating trial ${info.id_info.nct_id}`, err);
        return false;
    }
}

const start = async () => {
    try {
        const trials = await fetchUnprocessedTrials();
        trials.forEach(async trial => {
            const options = {
                uri: `${config.TRIALS_URI}/show/${trial.nct_id}`,
                qs: {
                    displayxml: true
                },
                transform2xxOnly: true,
                useQuerystring: true,
                transform: transformXMLToJObject,
                async: true
            };
            
            const info = await processTrial(options);
            if(info && await updateTrial(info)){
                console.log("Update Successful");
            }
        });
        return true;
    } catch (err) {
        console.error(`Error`, err);
        return false;
    }
}

start();