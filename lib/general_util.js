/**
 * @file        General utility functions not specific to EasyRTC
 * @module      general_util
 * @author      Priologic Software, info@easyrtc.com
 * @copyright   Copyright 2014 Priologic Software. All rights reserved.
 * @license     BSD v2, see LICENSE file in module root folder.
 */

var util = require("util");

var g = {};


/**
 * Performs a deep copy of an object, returning the duplicate.
 * Do not use on objects with circular references.
 *
 * @param       {Object} input          Input variable (or object) to be copied.
 * @returns     {Object}                New copy of variable.
 */
g.deepCopy = function(input) {
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
            copy[i] = g.deepCopy(input[i]);
        }
        return copy;
    }

    if (input instanceof Object) {
        var copy = {};
        for (var key in input) {
            if (input.hasOwnProperty(key)) {
                copy[key] = g.deepCopy(input[key]);
            }
        }
        return copy;
    }
    return null;
};


/**
 * Returns a field from the package.json file in the module root.
 * Giving null field name will return the full contents of the file.
 * If a field name is provided, it will return null if the field not found.
 *
 * @param       {Object} fieldName      Name of field you wish to return.
 * @returns     {Object}                Value of the given field, or the full contents of the file if a null field is given.
 */
g.getPackageData = function(fieldName) {
    var packageFile = require("../package");
    if (!fieldName) {
        return g.deepCopy(packageFile);
    }
    else if (packageFile[fieldName]) {
        return g.deepCopy(packageFile[fieldName]);
    }
    else {
        return null;
    }
};


/* An abstract error object which should be easy to extend for custom Error classes.
 *
 * @copyright Based on code in article by Dustin Seno.
 *
 * @param   {String}    Custom error message.
 * @param   {Object}    Constructor property.
 *
 */
g.AbstractError = function(msg, constr){
    Error.captureStackTrace(this, constr || this);
    this.message = msg || "Error";
};
util.inherits(g.AbstractError, Error);
g.AbstractError.prototype.name = "Abstract Error";


/**
 * Reads package.json and ensures all required modules are installed. Will exit if one or more is not found.
 */
g.checkModules = function () {
    try {
        var easyrtcPackage = require("../package");
    }
    catch( e ) {
        console.log("ERROR: Could not load package.json from project root. This file is required for reading project properties.");
        process.exit(1);
    }

    var moduleExists = function (modName) {
        try { return require.resolve(modName); }
        catch( e ) { return false; }
    };

    var isModuleMissing = false;
    for (var key in easyrtcPackage.dependencies) {
        if (!moduleExists(key)) {
            isModuleMissing = true;
            console.log("ERROR: Missing module '" + key + "'");
        }
    }

    if (isModuleMissing) {
        console.log("ERROR: Required modules are not installed. Run 'npm install' from command line.");
        process.exit(1);
    }

    delete require.cache[easyrtcPackage];
};


module.exports = g;