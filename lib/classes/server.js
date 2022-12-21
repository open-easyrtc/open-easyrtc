/* global module, require */

/**
 * @file        Maintains private object used within EasyRTC for holding in-memory state information
 * @module      easyrtc_private_obj
 * @author      Open-EasyRTC
 * @copyright   Copyright 2022 Open-EasyRTC. All rights reserved.
 * @license     BSD v2, see LICENSE file in module root folder.
 */

// Internals dependencies
var defaultOptions = require("./../easyrtc_default_options"); // EasyRTC global variable
var easyrtc_utils = require("./../easyrtc_utils"); // General utility functions local module
var EventEmitter = require('./event-emitter');

// import and map logs ?

// TODO migreate to ES6 or TypeScript
const Server = class Server {

    // TODO readonly
    serverStartOn = Date.now();

    // TODO get/set
    option = easyrtc_utils.deepCopy(defaultOptions);

    // TODO map
    app = {};

    /**
     * EasyRTC Event handling object which contain most methods for interacting with EasyRTC events.
     * For convenience, this class has also been attached to the application, connection, session, and room classes.
     * @class
     */
    events = new EventEmitter();

    constructor() {
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
            this.option[optionName] = easyrtc_utils.deepCopy(optionValue);
            return true;
        } else {
            // TODO
            easyrtc_utils.logError("Error setting option. Unrecognised option name '" + optionName + "'.");
            return false;
        }
    }

    getOption(optionName) {
        if(typeof this.option[optionName] === "undefined") {
            easyrtc_utils.logError("Unknown option requested. Unrecognised option name '" + optionName + "'.");
            return null;
        }
        return this.option[optionName];
    }

    /**
     * Returns an EasyRTC options object with a copy of the default options.
     *
     * @returns     {Object}                EasyRTC options object
     */
    getDefaultOptions() {
        return easyrtc_utils.deepCopy(defaultOptions);
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


    /**
     * Sends an array of all application names to a callback.
     *
     * @param   {function(Error, Array.<string>)} callback Callback with error and array containing all application names.
     */
    getAppNames(callback) {
        // TODO app == socket.io namespaces
        //var appNames = Object.keys(pub.socketServer.nsps);
        var appNames = Object.keys(this.app);
        callback(null, appNames);
    }
}

module.exports = Server;