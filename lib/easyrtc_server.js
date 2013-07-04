/** 
 * @file        Entry library for easyRTC server. Houses the primary listen function. 
 * @author      Priologic Software, info@easyrtc.com
 * @copyright   Copyright 2013 Priologic Software. All rights reserved.
 */

var g           = require("./general_util");        // General utility functions local module
g.checkModules(); // Check to ensure all required modules are available

var util        = require("util");                  // General utility functions core module
var _           = require("underscore");            // General utility functions external module
var async       = require('async');                 // Asynchronous calls external module
var pub         = require("./easyrtc_public_obj");  // easyRTC public object


/**
 * Listener for starting the easyRTC server. The successCallback can be used to determine when easyRTC is fully running.
 * 
 * @param       {Object} httpApp        express http object. Allows easyRTC to interact with the http server.
 * @param       {Object} socketServer   socket.io server object. Allows easyRTC to interact with the socket server.
 * @param       {Object} options        easyRTC options object. Sets configurable options. If null, than defaults will be used.
 * @param       {function(Error, Object)} listenCallback Called when the start up routines are complete. In form of successCallback(err, pub). The parameter 'err' will null unless an error occurs and 'pub' is the easyRTC public object for interacting with the server.
 */
exports.listen = function(httpApp, socketServer, options, listenCallback) {
    var eu              = require("./easyrtc_util");        // easyRTC utility functions

    pub.util.logInfo('Starting easyRTC Server (v' + pub.getVersion() +') on Node (' + process.version + ')');

    // Set server object references in public object    
    pub.httpApp         = httpApp;
    pub.socketServer    = socketServer;

    if (options){
        pub.util.logDebug("Overriding options", options);

        for (var optionName in options) {
            pub.setOption(optionName, options[optionName]);
        }
    }

    pub.util.logDebug("Emitting event 'startup'");
    pub.eventHandler.emit("startup", function(err) {
        if (err) {
            pub.util.logError("Error occured upon startup", err);
            if(_.isFunction(listenCallback)) {
                listenCallback(err, null);
            }
        }
        else {
            pub.util.logInfo("easyRTC Server Ready For Connections (v"+ pub.getVersion() + ")");
            if(_.isFunction(listenCallback)) {
                listenCallback(err, pub);
            }
        }
    });            
}


/**
 * Returns an easyRTC options object with a copy of the default options.
 * 
 * @returns     {Object}                easyRTC options object
 */
exports.getDefaultOptions = function() {
    var defaultOptions = require("./easyrtc_default_options");
    return g.deepCopy(defaultOptions);
}


/**
 * Sets listener for a given easyRTC event. Only one listener is allowed per event. Any other listeners for an event are removed before adding the new one.
 * 
 * @param       {String} event          Listener name.
 * @param       {Object} listener       Function
 */
exports.on = function(event, listener) {
    if (event && _.isFunction(listener)) {
        pub.events.removeAllListeners(event);
        pub.events.on(event, listener);
    }
    else {
        pub.util.logError("Unable to add listener to event '" + event + "'");
    }
}


/**
 * Removes all listeners for an event. If there is a default easyRTC listener, it will be added.
 * 
 * @param       {String} event          Listener name.
 * @param       {Object} listener       Function
 */
exports.removeAllListeners = function(event) {
    if (event) {
        pub.events.removeAllListeners(event);
        pub.events.setDefaultListener(event);
    }
}


/**
 * Returns the listeners for an event.
 * 
 * @param       {String} event          Listener name.
 */
exports.listeners   = pub.events.listeners;


/**
 * General logging function which emits a log event
 * 
 * @param       {String} logText    Text for log
 * @param       {Object} logFields  Simple JSON object which contains extra fields to be logged. 
 */
exports.logDebug    = pub.util.logDebug;
exports.logInfo     = pub.util.logInfo;
exports.logWarning  = pub.util.logWarning;
exports.logError    = pub.util.logError;


/**
 * Sets individual option.
 * 
 * @param       {Object} option Option name     
 * @param       {Object} value  Option value
 * @returns     {Boolean} true on success, false on failure
 */
exports.setOption   = pub.setOption;
