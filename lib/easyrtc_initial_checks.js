/** 
 * @file        Initial functions needed during server start. File is loaded before any external modules are loaded.
 * @module      easyrtc_initial_checks
 * @author      Priologic Software, info@easyrtc.com
 * @copyright   Copyright 2013 Priologic Software. All rights reserved.
 */


/**
 * Reads package.json and ensures all required modules are installed. Will exit if one or more is not found. 
 */
var checkModules = exports.checkModules = function () {
    try { 
        var easyrtcPackage = require('../package');
    }
    catch( e ) {
        console.log("ERROR: Could not load package.json from project root. This file is required for reading project properties.");
        process.exit(1);
    }

    var isModuleMissing = false;
    for (var key in easyrtcPackage.dependencies) {
        if (!moduleExists(key)) {
            isModuleMissing = true;
            console.log("ERROR: Missing module '" + key + "'");
        }
    };

    if (isModuleMissing) {
        console.log("ERROR: Required modules are not installed. Run 'npm install' from command line.");
        process.exit(1);
    }

    delete require.cache[easyrtcPackage];
}


/**
 * Checks to see if a given module exists. 
 * 
 * @param       {Object} modName
 * @returns     {Boolean}
 */
var moduleExists = function (modName) {
    try { return require.resolve(modName) }
    catch( e ) { return false }
}

