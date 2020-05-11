"use strict"

const { parseStringPromise } = require("xml2js");

const transformXMLToJObject = async body => {
    console.log("Transforming to Javascript Object");
    try {
        const result = await parseStringPromise(body, {
            trim: true,
            explicitArray: false,
            mergeAttrs: true,
            includeWhiteChars: true,
            normalizeTags: true,
            charkey: "value"
        });
        return JSON.parse(JSON.stringify(result).replace(/(\r\n)+/gm,""));
    } catch (err) {
        console.error("Not a valid XML", err);
        return false;
    }
}

module.exports = {
    transformXMLToJObject
};