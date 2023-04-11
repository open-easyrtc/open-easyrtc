/* global module, require */

/**
 * @file        Maintains private object used within EasyRTC for holding in-memory state information
 * @module      OpenEasyRTC
 * @author      Open-EasyRTC
 * @copyright   Copyright 2022 Open-EasyRTC. All rights reserved.
 * @license     BSD v2, see LICENSE file in module root folder.
 */

// Externals dependencies
const async = require("async");
const _ = require("underscore"); // General utility functions external module

// Internals dependencies
const easyrtc_utils = require("./../utils"); // General utility functions local module

const EventEmitter = require('./event-emitter');
const Application = require('./application');
const defaultOptions = require("./server/default-options"); // EasyRTC global variable

// TODO migreate to ES6 or TypeScript
const Server = class Server {

    /**
     * EasyRTC Event handling object which contain most methods for interacting with EasyRTC events.
     * For convenience, this class has also been attached to the application, connection, session, and room classes.
     * @class
     */

    constructor(socketServer) {

        // TODO readonly
        this.serverStartOn = Date.now();

        // TODO readonly
        this.option = easyrtc_utils.deepCopy(defaultOptions);

        // TODO map readonly
        this.app = {};

        // Running the default listeners to initialize the events
        this.events = new EventEmitter();
        this.events.setDefaultListeners();
    }

    get listeners() {
        return this.events.listeners;
    }

    /**
     * Sets listener for a given EasyRTC event. Only one listener is allowed per event. Any other listeners for an event are removed before adding the new one.
     *
     * @private
     * @param       {String} event          Listener name.
     * @param       {Function} listener       Function
     */
    on(event, listener) {
        if (event && _.isFunction(listener)) {
            this.events.removeAllListeners(event);
            this.events.on(event, listener);
        }
        else {
            easyrtc_utils.logError("Unable to add listener to event '" + event + "'");
        }
    }

    /**
     * Removes all listeners for an event. If there is a default EasyRTC listener, it will be added.
     *
     * @private
     * @param       {String} event          Listener name.
     */
    removeAllListeners(event) {
        if (event) {
            this.events.removeAllListeners(event);
            this.events.setDefaultListener(event);
        }
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

    /**
     * Gets individual option value. The option value returned is for the server level.
     *
     * Note that some options can be set at the application or room level. If an option has not been set at the room level, it will check to see if it has been set at the application level, if not it will revert to the server level.
     *
     * @param       {String}    optionName  Option name
     * @return      {*}                     Option value (can be any JSON type)
     */
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
        //var appNames = Object.keys(socketServer.nsps);
        var appNames = Object.keys(this.app);
        callback(null, appNames);
    }

    /**
     * Returns a random available easyrtcid.
     *
     * @function
     * @return  {String} Available easyrtcid. A unique identifier for an EasyRTC connection.
     */
    getAvailableEasyrtcid() {
        var newEasyrtcid = "";
        var easyrtcidExists = false;

        do {
            newEasyrtcid = easyrtc_utils.randomString();
            easyrtcidExists = false;

            for (var key in this.app) {
                if (this.app[key].connection[newEasyrtcid]) {
                    easyrtcidExists = true;
                    break;
                }
            }
        } while (easyrtcidExists);

        return newEasyrtcid;
    }

    /**
     * Sends the count of the number of connections to the server to a provided callback.
     *
     * @param       {function(?Error, Number)} callback Callback with error and array containing all easyrtcids.
     */
    getConnectionCount(callback) {
        callback(null, getConnectionCountSync());
    }

    /**
     * Sends the count of the number of connections to the server to a provided callback.
     *
     * @returns     {Number} The current number of connections in a room.
     */
    getConnectionCountSync() {
        var connectionCount = 0;
        for (var appName in this.app) {
            if (this.app.hasOwnProperty(appName)) {
                connectionCount = connectionCount + _.size(this.app[appName].connection);
            }
        }
        return connectionCount;
    }

    /**
     * Gets app object for application which has an authenticated client with a given easyrtcid
     *
     * @param       {String} easyrtcid      Unique identifier for an EasyRTC connection.
     * @param       {function(?Error, Object=)} callback Callback with error and application object
     */
    getAppWithEasyrtcid(easyrtcid, callback) {
        for (var appName in this.app) {
            if (this.app.hasOwnProperty(appName)) {
                if (
                    this.app[appName].connection.hasOwnProperty(easyrtcid) &&
                        this.app[appName].connection[easyrtcid].isAuthenticated
                ) {
                    app(appName, callback);
                    return;
                }
            }
        }
        easyrtc_utils.logWarning("Can not find connection [" + easyrtcid + "]");
        callback(new easyrtc_utils.ConnectionWarning("Can not find connection [" + easyrtcid + "]"));
    }

    /**
     * Gets connection object for connection which has an authenticated client with a given easyrtcid
     *
     * @param       {string} easyrtcid      EasyRTC unique identifier for a socket connection.
     * @param       {function(?Error, Object=)} callback Callback with error and connection object
     */
    getConnectionWithEasyrtcid(easyrtcid, callback) {
        for (var appName in this.app) {
            if (this.app.hasOwnProperty(appName)) {
                if (
                    this.app[appName].connection.hasOwnProperty(easyrtcid) &&
                        this.app[appName].connection[easyrtcid].isAuthenticated
                ) {

                    app(appName, function(err, appObj) {
                        if (err) {
                            callback(err);
                            return;
                        }
                        appObj.connection(easyrtcid, callback);
                    });
                    return;
                }
            }
        }
        easyrtc_utils.logWarning("Can not find connection [" + easyrtcid + "]");
        callback(new easyrtc_utils.ConnectionWarning("Can not find connection [" + easyrtcid + "]"));
    }

    /**
     * Creates a new EasyRTC application with default values. If a callback is provided, it will receive the new application object.
     *
     * The callback may receive an Error object if unsuccessful. Depending on the severity, known errors have an "instanceof" ApplicationWarning or ApplicationError.
     *
     * @param       {string} appName        Application name which uniquely identifies it on the server.
     * @param       {?object} options       Options object with options to apply to the application. May be null.
     * @param       {appCallback} [callback] Callback with error and application object
     */
    createApp(appName, options, callback) {
        if (!_.isFunction(callback)) {
            callback = function(err, appObj) { };
        }
        if (!appName || !this.getOption("appNameRegExp").test(appName)) {
            easyrtc_utils.logWarning("Can not create application with improper name: '" + appName + "'");
            callback(new easyrtc_utils.ApplicationWarning("Can not create application with improper name: '" + appName + "'"));
            return;
        }
        if (this.app[appName]) {
            easyrtc_utils.logWarning("Can not create application which already exists: '" + appName + "'");
            callback(new easyrtc_utils.ApplicationWarning("Can not create application which already exists: '" + appName + "'"));
            return;
        }
        if (!_.isObject(options)) {
            options = {};
        }

        easyrtc_utils.logDebug("Creating application: '" + appName + "'");

        // TODO versus
        //this.app[appName] = new Application(appName, server);

        this.app[appName] = {
            appName: appName,
            connection: {},
            field: {},
            group: {},
            option: {},
            room: {},
            session: {}
        };

        // Get the new app object
        this.getApp(appName, (err, appObj) => {

            if (!appObj) {
                callback(new easyrtc_utils.ApplicationError("Could not set options when creating application: '" + appName + "'", err));
                return;
            }

            if (err) {
                callback(err);
                return;
            }

            // Set all options in options object. If any fail, an error will be sent to the callback.
            async.each(
                Object.keys(options),
                (currentOptionName, asyncCallback) => {
                    appObj.setOption(currentOptionName, options[currentOptionName]);
                    asyncCallback(null);
                },
                (err) => {
                    if (err) {
                        callback(new easyrtc_utils.ApplicationError("Could not set options when creating application: '" + appName + "'", err));
                        return;
                    }
                    // Set default application fields
                    var appDefaultFieldObj = appObj.getOption("appDefaultFieldObj");
                    if (_.isObject(appDefaultFieldObj)) {
                        for (var currentFieldName in appDefaultFieldObj) {
                            if (appDefaultFieldObj.hasOwnProperty(currentFieldName)) {
                                appObj.setField(
                                    currentFieldName,
                                    appDefaultFieldObj[currentFieldName].fieldValue,
                                    appDefaultFieldObj[currentFieldName].fieldOption,
                                    null
                                );
                            }
                        }
                    }

                    if (appObj.getOption("roomDefaultEnable")) {
                        this.events.emit("roomCreate", appObj, null, appObj.getOption("roomDefaultName"), null, function(err, roomObj) {
                            if (err) {
                                callback(err);
                                return;
                            }
                            // Return app object to callback
                            callback(null, appObj);
                        });
                    }
                    else {
                        // Return app object to callback
                        callback(null, appObj);
                    }
                }
            );
        });
    }

    /**
     * Contains the methods for interfacing with an EasyRTC application.
     *
     * The callback will receive an application object upon successful retrieval of application.
     *
     * The callback may receive an Error object if unsuccessful. Depending on the severity, known errors have an "instanceof" ApplicationWarning or ApplicationError.
     *
     * The function does return an application object which is useful for chaining, however the callback approach is safer and provides additional information in the event of an error.
     *
     * @param       {?string} appName        Application name which uniquely identifies it on the server. Uses default application if null.
     * @param       {appCallback} [callback] Callback with error and application object
     */
    getApp(appName, callback) {

        if (!appName) {
            appName = this.getOption("appDefaultName");
        }

        if (!_.isFunction(callback)) {
            callback = function(err, appObj) { };
        }

        if (!this.app[appName]) {
            easyrtc_utils.logDebug("Attempt to request non-existent application name: '" + appName + "'");
            callback(new easyrtc_utils.ApplicationWarning("Attempt to request non-existent application name: '" + appName + "'"));
            return;
        }

        const appObj = new Application(appName, this);

        callback(null, appObj);
    }
}

module.exports = Server;