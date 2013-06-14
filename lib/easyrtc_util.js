/** 
 * @file        Utility functions specific to easyRTC 
 * @module      easyrtc_util
 * @author      Priologic Software, info@easyrtc.com
 * @copyright   Copyright 2013 Priologic Software. All rights reserved.
 */

var _               = require("underscore");                // General utility functions external module
var g               = require("./general_util");            // General utility functions local module
var e               = require("./easyrtc_private_obj");     // easyRTC private object
var eEvents         = require("./easyrtc_events");          // easyRTC event handler


/**
 * Sets initial options as provided to listen(). This function allows all options to be set.
 * 
 * @param       {Object} newOptions     
 */
exports.setInitialOptions = function(newOptions) {
    for (var optionName in newOptions) {
        if (!setOption(optionName, newOptions[optionName])) {
            callback("Error setting option. Unrecognised option name:" + optionName);
            return;
        }
    }
}


/**
 * Sets individual option.
 * 
 * @param       {Object} option Option name     
 * @param       {Object} value  Option value
 * @returns     {Boolean} true on success, false on failure
 */
var setOption = exports.setOption = function(optionName, optionValue) {
    // Can only set options which currently exist
    if (typeof e.options[optionName] == 'undefined') {
        log("error", "Error setting option. Unrecognised option name '" + optionName + "'.");
        return false;
     }

    // TODO: Use a case statement to handle specific option types to ensure they are set properly.
    
    e.options[optionName] = g.deepCopy(optionValue);
    return true;
}


/**
 * General logging function which emits a log event so long as the log level has a severity equal or greater than e.options.logLevel
 * 
 * @param       {String} level      Log severity level. Can be ('debug'|'info'|'warning'|'error')     
 * @param       {String} logText    Text for log
 * @param       {Object} logFields  Simple JSON object which contains extra fields to be logged. 
 */
var log = exports.log = function(level, logText, logFields) {
    switch(e.options.logLevel) {
        case 'error':
        if (level !='error') {break;}

        case 'warning':
        if (level =='info' ) {break;}

        case 'info':
        if (level =='debug') {break;}

        case 'debug':
        eEvents.emit("log", level, logText, logFields);
    }
}
exports.logDebug = function(logText, logFields) {
    switch(e.options.logLevel) {
        case 'debug':
        eEvents.emit("log", 'debug', logText, logFields);
    }
}
exports.logInfo = function(logText, logFields) {
    switch(e.options.logLevel) {
        case 'debug':
        case 'info':
        eEvents.emit("log", 'info', logText, logFields);
    }
}
exports.logWarning = function(logText, logFields) {
    switch(e.options.logLevel) {
        case 'debug':
        case 'info':
        case 'warning':
        eEvents.emit("log", 'warning', logText, logFields);
    }
}
exports.logError = function(logText, logFields) {
    switch(e.options.logLevel) {
        case 'debug':
        case 'info':
        case 'warning':
        case 'error':
        eEvents.emit("log", 'error', logText, logFields);
    }
}


/**
 * Disconnects socket. Failure results in a debug level log message.
 * 
 * @param       {Object} socket         Socket.io connection object.
 */
exports.socketDisconnect = function(socket) {
    try {
        socket.disconnect();
    } catch(err) {
        log("debug", "Socket disconnection command failed. Socket may already be disconnected.");
    }
}
