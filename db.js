"use strict"

const { MongoClient } = require("mongodb");
const config = require("./config");

const DB_CONNECTION_STRING = `mongodb://${config.db.host}:${config.db.port}`;

let db;

const loadDB = async () => {
    if (db) {
        return db;
    }
    try {
        const client = await MongoClient.connect(DB_CONNECTION_STRING, { useUnifiedTopology: true });
        console.log(`Connection to DB: ${config.db.dbname} established !!`);
        db = client.db(config.db.dbname);
    } catch (err) {
        console.error(err);
    }
    return db;
};

module.exports = loadDB;
