/** 
 * @file        Utility functions specific to easyRTC 
 * @module      easyrtc_util
 * @author      Priologic Software, info@easyrtc.com
 * @copyright   Copyright 2013 Priologic Software. All rights reserved.
 */

var util            = require('util');
var _               = require("underscore");                // General utility functions external module
var g               = require("./general_util");            // General utility functions local module
var e               = require("./easyrtc_private_obj");     // easyRTC private object


// Object to hold easyRTC Utility methods and classes
var eu = {};


/**
 * General logging function which emits a log event so long as the log level has a severity equal or greater than e.option.logLevel
 * 
 * @param       {String} level      Log severity level. Can be ('debug'|'info'|'warning'|'error')     
 * @param       {String} logText    Text for log
 * @param       {Object} logFields  Simple JSON object which contains extra fields to be logged. 
 */
eu.log = function(level, logText, logFields) {
    var eEvents = require("./easyrtc_events");          // easyRTC event handler
    switch(e.option.logLevel) {
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
eu.logDebug = function(logText, logFields) {
    var eEvents = require("./easyrtc_events");          // easyRTC event handler
    switch(e.option.logLevel) {
        case 'debug':
        eEvents.emit("log", 'debug', logText, logFields);
    }
}
eu.logInfo = function(logText, logFields) {
    var eEvents = require("./easyrtc_events");          // easyRTC event handler
    switch(e.option.logLevel) {
        case 'debug':
        case 'info':
        eEvents.emit("log", 'info', logText, logFields);
    }
}
eu.logWarning = function(logText, logFields) {
    var eEvents = require("./easyrtc_events");          // easyRTC event handler
    switch(e.option.logLevel) {
        case 'debug':
        case 'info':
        case 'warning':
        eEvents.emit("log", 'warning', logText, logFields);
    }
}
eu.logError = function(logText, logFields) {
    var eEvents = require("./easyrtc_events");          // easyRTC event handler
    switch(e.option.logLevel) {
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
eu.socketDisconnect = function(socket) {
    try {
        socket.disconnect();
    } catch(err) {
        eu.log("debug", "Socket disconnection command failed. Socket may already be disconnected.");
    }
}


/* Custom Error Object for easyRTC Server Errors
 * 
 * @param msg   {String} Text message describing the error 
 */
eu.ServerError = function(msg) {
    eu.ServerError.super_.call(this, msg, this.constructor);
}
util.inherits(eu.ServerError, g.AbstractError);
eu.ServerError.prototype.name = 'Server Error';


/* Custom Error Object for easyRTC Application Errors
 * 
 * @param msg   {String} Text message describing the error 
 */
eu.ApplicationError = function(msg) {
    eu.ApplicationError.super_.call(this, msg, this.constructor);
}
util.inherits(eu.ApplicationError, g.AbstractError);
eu.ApplicationError.prototype.name = 'Application Error';


/* Custom Error Object for Connection Errors
 * 
 * @param msg   {String} Text message describing the error 
 */
eu.ConnectionError = function(msg) {
    eu.ConnectionError.super_.call(this, msg, this.constructor);
}
util.inherits(eu.ConnectionError, g.AbstractError);
eu.ConnectionError.prototype.name = 'Connection Error';


/* Custom Error Object for easyRTC Server Warnings
 * 
 * @param msg   {String} Text message describing the error 
 */
eu.ServerWarning = function(msg) {
    eu.ServerWarning.super_.call(this, msg, this.constructor);
}
util.inherits(eu.ServerWarning, g.AbstractError);
eu.ServerWarning.prototype.name = 'Server Warning';


/* Custom Error Object for easyRTC Application Warnings
 * 
 * @param msg   {String} Text message describing the error 
 */
eu.ApplicationWarning = function(msg) {
    eu.ApplicationWarning.super_.call(this, msg, this.constructor);
}
util.inherits(eu.ApplicationWarning, g.AbstractError);
eu.ApplicationWarning.prototype.name = 'Application Warning';


/* Custom Error Object for Connection Warnings
 * 
 * @param msg   {String} Text message describing the error 
 */
eu.ConnectionWarning = function(msg) {
    eu.ConnectionWarning.super_.call(this, msg, this.constructor);
}
util.inherits(eu.ConnectionWarning, g.AbstractError);
eu.ConnectionWarning.prototype.name = 'Connection Warning';


module.exports = eu;