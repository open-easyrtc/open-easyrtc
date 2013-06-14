/** 
 * @file        General utility functions not specific to easyRTC 
 * @module      general_util
 * @author      Priologic Software, info@easyrtc.com
 * @copyright   Copyright 2013 Priologic Software. All rights reserved.
 */


/**
 * Performs a deep copy of an object, returning the duplicate.
 * Currently using the JSON method as that has tested to work quickly in V8.
 * Should not be used for copying objects with functions.
 * 
 * @param       {Object} httpApp        express http object. Allows easyRTC to interact with the http server.
 * @returns     {Object}                easyRTC public object which includes methods for interacting with the server.
 */
var deepCopy = module.exports.deepCopy = function(input) {
    return JSON.parse(JSON.stringify(input));
}


/**
 * Returns a field from the package.json file in the module root.
 * Giving null field name will return the full contents of the file.
 * If a field name is provided, it will return null if the field not found.
 * 
 * @param       {Object} fieldName      name of field you wish to return
 * @returns     {Object}                value of the given field, or the full contents of the file if a null field is given
 */
module.exports.getPackageData = function(fieldName) {
    var packageFile = require('../package');
    if (!fieldName) {
        return deepCopy(packageFile);
    }
    else if (packageFile[fieldName]) {
        return deepCopy(packageFile[fieldName]);
    }
    else {
        return null;
    }
}
