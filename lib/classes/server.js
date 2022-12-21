/* global module, require */

/**
 * @file        Maintains private object used within EasyRTC for holding in-memory state information
 * @module      easyrtc_private_obj
 * @author      Open-EasyRTC
 * @copyright   Copyright 2022 Open-EasyRTC. All rights reserved.
 * @license     BSD v2, see LICENSE file in module root folder.
 */

// Internals dependencies
var defaultOptions = require("./../easyrtc_default_options");    // EasyRTC global variable
var utils = require("./../utils");                      // General utility functions local module

// TODO migreate to ES6 or TypeScript
const Server = class Server {

    // TODO readonly
    serverStartOn = Date.now();

    // TODO readonly
    version = utils.getPackageData("version");

    // TODO get/set
    option = utils.deepCopy(defaultOptions);

    // TODO map
    app = {};

    constructor() {
    }

    /**
     * Gets EasyRTC Version. The format is in a major.minor.patch format with an optional letter following denoting alpha or beta status.
     * The version is retrieved from the package.json file located in the EasyRTC project root folder.
     *
     * @return      {string}                EasyRTC Version
     */
    getVersion() {
        return this.version;
    }

    /**
     * Sets individual option. The option value set is for the server level.
     *
     * Note that some option can be set at the application or room level. If an option has not been set at the room level,
     * it will check to see if it has been set at the application level, if not it will revert to the server level.
     *
     * @param       {Object} optionName     Option name
     * @param       {Object} optionValue    Option value
     * @return      {Boolean}               true on success, false on failure
     */
    setOption(optionName, optionValue) {
        // Can only set option which currently exist
        if (this.option.hasOwnProperty(optionName)) {
            this.option[optionName] = utils.deepCopy(optionValue);
            return true;
        } else {
            // TODO
            //pub.util.logError("Error setting option. Unrecognised option name '" + optionName + "'.");
            return false;
        }
    }

    getOption(optionName) {
        if(typeof this.option[optionName] === "undefined") {
            //pub.util.logError("Unknown option requested. Unrecognised option name '" + optionName + "'.");
            return null;
        }
        return this.option[optionName];
    }

    /**
     * Determine if a given application name has been defined.
     *
     * @param       {string} appName        Application name which uniquely identifies it on the server.
     * @param       {function(?Error, boolean)} callback Callback with error and boolean of whether application is defined.
     */
    // TODO promise
    isApp(appName, callback) {
        callback(null, (this.app[appName] ? true : false));
    }
}

module.exports = Server;