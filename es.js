"use strict"

const { Client } = require("@elastic/elasticsearch");
const config = require("./config");

let client;

const loadES = () => {
    try {
        client = new Client({ node: `http://${config.es.host}:${config.es.port}` });
        return client;
    } catch (err) {
        console.error(`Unable to connect to Elastic Server`, err);
        return false;
    }
};

module.exports = loadES;