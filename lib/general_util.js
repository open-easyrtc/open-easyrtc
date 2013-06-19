/** 
 * @file        General utility functions not specific to easyRTC 
 * @module      general_util
 * @author      Priologic Software, info@easyrtc.com
 * @copyright   Copyright 2013 Priologic Software. All rights reserved.
 */


/**
 * Performs a deep copy of an object, returning the duplicate.
 * Do not use on objects with circular references.
 * 
 * @param       {Object} input          Input variable (or object) to be copied.
 * @returns     {Object}                New copy of variable
 */
var deepCopy = module.exports.deepCopy = function(input) {
    if (input == null
        || typeof input != "object"
        || (input.constructor != Object && input.constructor != Array)
    ) {
        return input;
    }
    
    if (
        input.constructor == Boolean
        || input.constructor == Date 
        || input.constructor == Function 
        || input.constructor == Number 
        || input.constructor == RegExp 
        || input.constructor == String 
    ) {
        return new input.constructor(input);
    }

    if (input instanceof Array) {
        var copy = [];
        for (var i = 0, len = input.length; i < len; i++) {
            copy[i] = deepCopy(input[i]);
        }
        return copy;
    }

    if (input instanceof Object) {
        var copy = {};
        for (var key in input) {
            if (input.hasOwnProperty(key)) {
                copy[key] = deepCopy(input[key]);
            }
        }
        return copy;
    }

    console.log("\n\nError cloning: ", input);
    return null;
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
