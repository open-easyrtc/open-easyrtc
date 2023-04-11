/* global module, require */

const utils_easyrtc = require("./easyrtc");

/**
 * Utility functions specific to EasyRTC.
 *
 * @module      easyrtc_util
 * @author      Open-EasyRTC
 * @copyright   Copyright 2022 Open-EasyRTC. All rights reserved.
 * @license     BSD v2, see LICENSE file in module root folder.
 */

/**
 *  Object to hold EasyRTC Utility methods and classes.
 *
 * @class
 */
const package_utils = module.exports;

package_utils.getPackage = function(packagePath) {
    try {
        return require(packagePath);
    }
    catch( e ) {
        console.log("ERROR: Could not load package.json from project root. This file is required for reading project properties.");
        process.exit(1);
    }
};

/**
 * Returns a field from the package.json file in the module root.
 * Giving null field name will return the full contents of the file.
 * If a field name is provided, it will return null if the field not found.
 *
 * @param       {Object} fieldName      Name of field you wish to return.
 * @returns     {Object}                Value of the given field, or the full contents of the file if a null field is given.
 */
package_utils.getPackageData = function(packagePath, fieldName) {
    const package = package_utils.getPackage(packagePath);

    if (!fieldName) {
        return utils_easyrtc.deepCopy(package);
    }
    else if (package[fieldName]) {
        return utils_easyrtc.deepCopy(package[fieldName]);
    }
    else {
        return null;
    }
};

/**
 * Reads package.json and ensures all required modules are installed. Will exit if one or more is not found.
 */
package_utils.checkModules = function (packagePath) {

    const package = package_utils.getPackage(packagePath);

    const moduleExists = function (modName) {
        try { return require.resolve(modName); }
        catch( e ) { return false; }
    };

    let isModuleMissing = false;
    for (let moduleName in package.dependencies) {
        if (package.dependencies.hasOwnProperty(moduleName)) {
            if (!moduleExists(moduleName)) {
                isModuleMissing = true;
                console.log("ERROR: Missing module '" + moduleName + "'");
            }
        }
    }

    if (isModuleMissing) {
        console.log("ERROR: Required modules are not installed. Run 'npm install' from command line.");
        process.exit(1);
    }

    delete require.cache[package];
};