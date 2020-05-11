const config = {
    TRIALS_URI: process.env.TRIALS_URI || "https://clinicaltrials.gov/ct2",
    db: {
        host:  process.env.MONGODB_HOST || "localhost",
        port: process.env.MONGODB_PORT || "27017",
        dbname: process.env.DB_NAME || "trials",
        collection: "clinicaltrials"
    },
    es: {
        host: process.env.ES_CLUSTER_HOST || process.env.HOSTNAME || process.env.ES_NETWORK_HOST || "localhost",
        port: process.env.ES_NETWORK_PORT || "9200",
    }
}

module.exports = config;