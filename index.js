"use strict"
const rp = require("request-promise");
const moment = require("moment");

const config = require("./config");
const loadDB = require("./db");
const { transformXMLToJObject } = require("./utils");

const DEFAULT_CONFIG = {
    start: 0,
    length: 1000
};

let count = null;
let counter = 0;
let itemsCount = 0;
let db;

const initializeCollection = async () => {
    try {
        db = await loadDB();
        db = db.collection(config.db.collection);
        await db.createIndex({ nct_id: 1}, {unique: true});
        return true;
    } catch (err) {
        console.error(`Error while initializing collection`, err);
        return false;
    }       
}


const fetchContent = async options => {
    console.log(`Fetching URI: ${options.uri}`);
    try {
        const response = await rp(options);
        console.log("Response Found");
        count = response.search_results.count * 1 || count;
        itemsCount = itemsCount + response.search_results.clinical_study.length;
        return response.search_results.clinical_study;
    } catch (err) {
        console.log(err);
        return false;
    }
}

const saveToDB = async items => {
    try{
        await db.insertMany(items, {ordered: false});
        return true;
    } catch (err) {
        err.writeErrors.forEach(error => {
            if(error.code === 11000 && /duplicate key error/.test(error.errmsg)){
                console.error(`Already added: ${error.err.op.nct_id}`);
                return true;
            }
            console.error("Error while saving data into DB", error);
            return false;
        });
    }
}

const timeout = ms => {
    console.log(`Waiting for ${ms} ms...`);
    new Promise(resolve => setTimeout(resolve, ms))
};

const startProcess = async  () => {
    let startDate = moment().startOf('era');
    let endDate = moment();
    switch(process.argv[2]){
        case "day": 
            startDate = moment().subtract(1, 'days');
            break;
        case "week": 
            startDate = moment().subtract(1, 'weeks');
            break;
        case "month": 
            startDate = moment().subtract(1, 'months');
            break;
        default:
    }


    if(await initializeCollection()){
        while(itemsCount <= count){
            const start =  DEFAULT_CONFIG.start + (DEFAULT_CONFIG.length  * counter) + 1;
            const qs = {
                start,
                count: DEFAULT_CONFIG.length,
                displayxml: true
            };
            if(process.argv[2]){
                qs.lupd_s = startDate.format("MM/DD/YYYY"),
                qs.lupd_e = endDate.format("MM/DD/YYYY")
            }
            const options = {
                uri: `${config.TRIALS_URI}/results`,
                qs,
                transform2xxOnly: true,
                useQuerystring: true,
                transform: transformXMLToJObject
            }
            const waitingDuration = Math.random() * 1000;
            try {
                const [result] = await Promise.all([fetchContent(options), timeout(waitingDuration)]);
                await saveToDB(result.map(item => Object.assign(item, { processed: false, date_added: new Date().toISOString()})));
                counter++;
            } catch (err){
                console.error(err);
                return false;
            }
        }
        return true;
    }
    return false;
}

startProcess();