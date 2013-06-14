/** 
 * @file        Entry library for easyRTC server. Houses the primary listen function. 
 * @author      Priologic Software, info@easyrtc.com
 * @copyright   Copyright 2013 Priologic Software. All rights reserved.
 */

var easyrtc_initial_checks = require('./easyrtc_initial_checks');
easyrtc_initial_checks.checkModules();

var util        = require("util");                  // General utility functions core module
var _           = require("underscore");            // General utility functions external module
var g           = require("./general_util");        // General utility functions local module

var async       = require('async');                 // Asynchronous calls external module

var eu          = require("./easyrtc_util");        // easyRTC utility functions
var e           = require("./easyrtc_private_obj"); // easyRTC private object
var pub         = require("./easyrtc_public_obj");  // easyRTC public object
var eEvents     = require("./easyrtc_events");      // easyRTC event handler


/**
 * Listener for starting the easyRTC server. The successCallback can be used to determine when easyRTC is fully running.
 * 
 * @param       {Object} httpApp        express http object. Allows easyRTC to interact with the http server.
 * @param       {Object} socketServer   socket.io server object. Allows easyRTC to interact with the socket server.
 * @param       {Object} options        easyRTC options object. Sets configurable options. If null, than defaults will be used.
 * @param       {Object} listenCallback Called when the start up routines are complete. In form of successCallback(err, pub). The parameter 'err' will null unless an error occurs and 'pub' is the easyRTC public object for interacting with the server.
 * @returns     {Object}                easyRTC public object which includes methods for interacting with the server.
 */
exports.listen = function(httpApp, socketServer, options, listenCallback) {
    eu.logInfo('Starting easyRTC Server (v' + e.version +') on Node (' + process.version + ')');

    if (options){
        eu.logDebug("Overriding options", options);
        eu.setInitialOptions(options);
    }

    eu.logDebug("Emitting event 'startup'");
    eEvents.emit("startup", httpApp, socketServer, function(err) {
        if (err) {
            eu.logError("Error occured upon startup", err);
            if(_.isFunction(listenCallback)) {
                listenCallback(err, null);
            }
        }
        else {
            eu.logInfo("easyRTC Server Ready For Connections (v"+ e.version + ")");
            if(_.isFunction(listenCallback)) {
                listenCallback(err, pub);
            }
            eu.logDebug("Emitting event 'afterStartup'");
            eEvents.emit("afterStartup", httpApp, socketServer);            
        }
    });            

    return pub;
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
        eEvents.removeAllListeners(event);
        eEvents.on(event, listener);
    }
    else {
        eu.logError("Unable to add listener to event '" + event + "'");
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
        eEvents.removeAllListeners(event);
        eEvents.setDefaultListener(event);
    }
}

/**
 * Returns the listeners for an event.
 * 
 * @param       {String} event          Listener name.
 */
exports.listeners   = eEvents.listeners;


/**
 * General logging function which emits a log event
 * 
 * @param       {String} level      Log severity level. Can be ('debug'|'info'|'warning'|'error')     
 * @param       {String} logText    Text for log
 * @param       {Object} logFields  Simple JSON object which contains extra fields to be logged. 
 */
exports.log = eu.log;
exports.logDebug    = eu.logDebug;
exports.logInfo     = eu.logInfo;
exports.logWarning  = eu.logWarning;
exports.logError    = eu.logError;

/**
 * Sets individual option.
 * 
 * @param       {Object} option Option name     
 * @param       {Object} value  Option value
 * @returns     {Boolean} true on success, false on failure
 */
exports.setOption   = eu.setOption;


