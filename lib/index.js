/* global module, require, console, process */

/**
 * Public interface for interacting with server. Contains the public object returned by the EasyRTC listen() function.
 *
 * @module      easyrtc_public_obj
 * @author      Open-EasyRTC
 * @copyright   Copyright 2022 Open-EasyRTC. All rights reserved.
 * @license     BSD v2, see LICENSE file in module root folder.
 */

// Externals dependencies
const events = require("events");
const path = require("path");
const async = require("async");
const _ = require("underscore"); // General utility functions external module

// Internals dependencies
const easyrtc_utils = require("./utils"); // General utility functions local module

const Server = require('./classes/server');
const Application = require('./classes/application');

// Check to ensure all required modules are available
const packagePath = path.resolve(__dirname, '../package.json');
easyrtc_utils.checkModules(packagePath);

// Create new server isntance
const easyrtcServer = new Server();

/**
 * The public object which is returned by the EasyRTC listen() function. Contains all public methods for interacting with EasyRTC server.
 *
 * @class
 */
const pub = module.exports;

/**
 * Gets EasyRTC Version. The format is in a major.minor.patch format with an optional letter following denoting alpha or beta status. The version is retrieved from the package.json file located in the EasyRTC project root folder.
 *
 * @return      {string}                EasyRTC Version
 */
pub.getVersion = () => easyrtc_utils.getPackageData(packagePath, "version");

/**
 * EasyRTC Event handling object which contain most methods for interacting with EasyRTC events.
 * For convenience, this class has also been attached to the application, connection, session, and room classes.
 * @class
 */
pub.events = easyrtcServer.events;

/**
 * Returns the listeners for an event.
 *
 * @private
 * @param       {String} event          Listener name.
 */
pub.listeners = easyrtcServer.listeners;

/**
 * Alias for Socket.io server object. Set during Listen().
 *
 * @member  {Object}    pub.socketServer
 * @example             <caption>Dump of all Socket.IO clients to server console</caption>
 * console.log(pub.socketServer.connected);
 */
pub.socketServer = null;

/**
 * Alias for Express app object. Set during Listen()
 *
 * @member  {Object}    pub.httpApp
 */
pub.httpApp = null;

/**
 * Alias for EasyRTC.server object. Set during Listen()
 *
 * @member  {Object}    pub.server
 */
pub.server = null;

/**
 * Returns a random available easyrtcid.
 *
 * @function
 * @return  {String} Available easyrtcid. A unique identifier for an EasyRTC connection.
 */
pub.getAvailableEasyrtcid = () => easyrtcServer.getAvailableEasyrtcid();

/**
 * Sends the count of the number of connections to the server to a provided callback.
 *
 * @param       {function(?Error, Number)} callback Callback with error and array containing all easyrtcids.
 */
pub.getConnectionCount = (callback) => easyrtcServer.getConnectionCount(callback);

/**
 * Sends the count of the number of connections to the server to a provided callback.
 *
 * @returns     {Number} The current number of connections in a room.
 */
pub.getConnectionCountSync = () => easyrtcServer.getConnectionCountSync();

/**
 * Gets app object for application which has an authenticated client with a given easyrtcid
 *
 * @param       {String} easyrtcid      Unique identifier for an EasyRTC connection.
 * @param       {function(?Error, Object=)} callback Callback with error and application object
 */
pub.getAppWithEasyrtcid = (easyrtcid, callback) => easyrtcServer.getAppWithEasyrtcid(easyrtcid, callback);

/**
 * Gets connection object for connection which has an authenticated client with a given easyrtcid
 *
 * @param       {string} easyrtcid      EasyRTC unique identifier for a socket connection.
 * @param       {function(?Error, Object=)} callback Callback with error and connection object
 */
pub.getConnectionWithEasyrtcid = (easyrtcid, callback) => easyrtcServer.getConnectionWithEasyrtcid(easyrtcid, callback);

/**
 * Creates a new EasyRTC application with default values. If a callback is provided, it will receive the new application object.
 *
 * The callback may receive an Error object if unsuccessful. Depending on the severity, known errors have an "instanceof" ApplicationWarning or ApplicationError.
 *
 * @param       {string} appName        Application name which uniquely identifies it on the server.
 * @param       {?object} options       Options object with options to apply to the application. May be null.
 * @param       {appCallback} [callback] Callback with error and application object
 */
pub.createApp = (appName, options, callback) => easyrtcServer.createApp(appName, options, callback);

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
pub.app = (appName, callback) => easyrtcServer.getApp(appName, callback);

/**
 * Sends an array of all application names to a callback.
 *
 * @param   {function(Error, Array.<string>)} callback Callback with error and array containing all application names.
 */
pub.getAppNames = (callback) => easyrtcServer.getAppNames(callback);

/**
 * Returns an EasyRTC options object with a copy of the default options.
 *
 * @returns     {Object}                EasyRTC options object
 */
pub.getDefaultOptions = () => easyrtcServer.getDefaultOptions();

/**
 * Sets individual option. The option value set is for the server level.
 *
 * Note that some options can be set at the application or room level. If an option has not been set at the room level, it will check to see if it has been set at the application level, if not it will revert to the server level.
 *
 * @param       {Object} optionName     Option name
 * @param       {Object} optionValue    Option value
 * @return      {Boolean}               true on success, false on failure
 */
pub.setOption = (optionName, optionValue) => easyrtcServer.setOption(optionName, optionValue);

/**
 * Gets individual option value. The option value returned is for the server level.
 *
 * Note that some options can be set at the application or room level. If an option has not been set at the room level, it will check to see if it has been set at the application level, if not it will revert to the server level.
 *
 * @param       {String}    optionName  Option name
 * @return      {*}                     Option value (can be any JSON type)
 */
pub.getOption = (optionName) => easyrtcServer.getOption(optionName);

/**
 * Determine if a given application name has been defined.
 *
 * @param       {string} appName        Application name which uniquely identifies it on the server.
 * @param       {function(?Error, boolean)} callback Callback with error and boolean of whether application is defined.
 */
pub.isApp = (appName, callback) => easyrtcServer.isApp(appName, callback);

/**
 * Sets listener for a given EasyRTC event. Only one listener is allowed per event. Any other listeners for an event are removed before adding the new one.
 *
 * @private
 * @param       {String} event          Listener name.
 * @param       {Function} listener       Function
 */
pub.on = (event, listener) => easyrtcServer.on(event, listener);

/**
 * Removes all listeners for an event. If there is a default EasyRTC listener, it will be added.
 *
 * @param       {String} event          Listener name.
 */
pub.removeAllListeners = (event) => easyrtcServer.removeAllListeners(event);

/**
 * Listener for starting the EasyRTC server. The successCallback can be used to determine when EasyRTC is fully running.
 *
 * @param       {Object} httpApp        express http object. Allows EasyRTC to interact with the http server.
 * @param       {Object} socketServer   socket.io server object. Allows EasyRTC to interact with the socket server.
 * @param       {Object} options        EasyRTC options object. Sets configurable options. If null, than defaults will be used.
 * @param       {function(Error, Object)} listenCallback Called when the start up routines are complete. In form of successCallback(err, pub). The parameter 'err' will null unless an error occurs and 'pub' is the EasyRTC public object for interacting with the server.
 */
pub.listen = (httpApp, socketServer, options, listenCallback) => {

    pub.util.logInfo("Starting EasyRTC Server (v" + pub.getVersion() +") on Node (" + process.version + ")");

    // Set server object references in public object
    pub.httpApp         = httpApp;
    pub.socketServer    = socketServer;
    pub.server          = easyrtcServer;

    // Register easyrtc in httpApp
    httpApp.set('easyrtc', pub);

    if (options) {

        // Check logLevel
        pub.util.logLevel = options.logLevel;
        pub.util.logMessagesEnable = !!options.logMessagesEnable;

        pub.util.logDebug("Overriding options", options);
        for (var optionName in options) {
            if (options.hasOwnProperty(optionName)) {
                pub.setOption(optionName, options[optionName]);
            }
        }
    }

    pub.util.logDebug("Emitting event 'startup'");
    pub.events.emit("startup", function(err) {
        if (err) {
            pub.util.logError("Error occurred upon startup", err);
            if(_.isFunction(listenCallback)) {
                listenCallback(err, null);
            }
        }
        else {
            pub.util.logInfo("EasyRTC Server Ready For Connections (v"+ pub.getVersion() + ")");
            if(_.isFunction(listenCallback)) {
                listenCallback(err, easyrtcServer);
            }
        }
    });

    // TODO listenCallback should return server
}

/**
 *
 */
pub.shutdown = (shutdownCallback) => {

    // Set server object references in public object
    pub.httpApp         = null;
    pub.socketServer    = null;
    pub.server          = null;

    pub.events.emit("shutdown", function(err) {
        if (err) {
            pub.util.logError("Error occurred upon shutdown", err);
            if(_.isFunction(shutdownCallback)) {
                shutdownCallback(err, null);
            }
        }
        else {
            pub.util.logInfo("EasyRTC Server terminated");
            if(_.isFunction(shutdownCallback)) {
                shutdownCallback(err, easyrtcServer);
            }
        }
    });
};

/**
 * Alias for easyrtc_utils object. Set during Listen()
 *
 * @member  {Object}    pub.util
 */
pub.util = easyrtc_utils;

// Setup event server log on logCallback
pub.util.logCallback = (level, logText, logFields) => easyrtcServer.events.emit("log", level, logText, logFields);

// Documenting global callbacks

/**
 * The next callback is called upon completion of a method. If the `err` parameter is null, than the method completed successfully.
 *
 * @callback nextCallback
 * @param {?Error}      err         Optional Error object. If it is null, than assume no error has occurred.
 */

/**
 * The application callback is called upon completion of a method which is meant to deliver an application object. If the `err` parameter is null, than the method completed successfully.
 *
 * @callback appCallback
 * @param {?Error}      err         Error object. If it is null, than assume no error has occurred.
 * @param {?Object}     appObj      Application object. Will be null if an error has occurred.
 */

/**
 * The connection callback is called upon completion of a method which is meant to deliver a connection object. If the `err` parameter is null, than the method completed successfully.
 *
 * @callback connectionCallback
 * @param {?Error}      err         Error object. If it is null, than assume no error has occurred.
 * @param {?Object}     connectionObj Connection object. Will be null if an error has occurred.
 */

/**
 * The room callback is called upon completion of a method which is meant to deliver a room object. If the `err` parameter is null, than the method completed successfully.
 *
 * @callback roomCallback
 * @param {?Error}      err         Error object. If it is null, than assume no error has occurred.
 * @param {?Object}     roomObj     Room object. Will be null if an error has occurred.
 */

// Documenting Custom Type-Definitions

/**
 * An error object
 *
 * @typedef {Object} Error
 */
