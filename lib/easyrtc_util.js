/** 
 * @file        Utility functions specific to easyRTC 
 * @module      easyrtc_util
 * @author      Priologic Software, info@easyrtc.com
 * @copyright   Copyright 2013 Priologic Software. All rights reserved.
 */

var util            = require("util");
var _               = require("underscore");                // General utility functions external module
var g               = require("./general_util");            // General utility functions local module
var e               = require("./easyrtc_private_obj");     // easyRTC private object


// Object to hold easyRTC Utility methods and classes
var eu = {};


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
};


/* Custom Error Object for easyRTC Server Errors
 * 
 * @param msg   {String} Text message describing the error 
 */
eu.ServerError = function(msg) {
    eu.ServerError.super_.call(this, msg, this.constructor);
};
util.inherits(eu.ServerError, g.AbstractError);
eu.ServerError.prototype.name = "Server Error";
eu.ServerError.prototype.errorLevel = "error";


/* Custom Error Object for easyRTC Application Errors
 * 
 * @param msg   {String} Text message describing the error 
 */
eu.ApplicationError = function(msg) {
    eu.ApplicationError.super_.call(this, msg, this.constructor);
};
util.inherits(eu.ApplicationError, g.AbstractError);
eu.ApplicationError.prototype.name = "Application Error";
eu.ApplicationError.prototype.errorLevel = "error";


/* Custom Error Object for Connection Errors
 * 
 * @param msg   {String} Text message describing the error 
 */
eu.ConnectionError = function(msg) {
    eu.ConnectionError.super_.call(this, msg, this.constructor);
};
util.inherits(eu.ConnectionError, g.AbstractError);
eu.ConnectionError.prototype.name = "Connection Error";
eu.ConnectionError.prototype.errorLevel = "error";


/* Custom Error Object for easyRTC Server Warnings
 * 
 * @param msg   {String} Text message describing the error 
 */
eu.ServerWarning = function(msg) {
    eu.ServerWarning.super_.call(this, msg, this.constructor);
};
util.inherits(eu.ServerWarning, g.AbstractError);
eu.ServerWarning.prototype.name = "Server Warning";
eu.ServerWarning.prototype.errorLevel = "warning";


/* Custom Error Object for easyRTC Application Warnings
 * 
 * @param msg   {String} Text message describing the error 
 */
eu.ApplicationWarning = function(msg) {
    eu.ApplicationWarning.super_.call(this, msg, this.constructor);
};
util.inherits(eu.ApplicationWarning, g.AbstractError);
eu.ApplicationWarning.prototype.name = "Application Warning";
eu.ApplicationWarning.prototype.errorLevel = "warning";


/* Custom Error Object for Connection Warnings
 * 
 * @param msg   {String} Text message describing the error 
 */
eu.ConnectionWarning = function(msg) {
    eu.ConnectionWarning.super_.call(this, msg, this.constructor);
};
util.inherits(eu.ConnectionWarning, g.AbstractError);
eu.ConnectionWarning.prototype.name = "Connection Warning";
eu.ConnectionWarning.prototype.errorLevel = "warning";


eu.isError = function(err) {
    if (err && ((err instanceof eu.ConnectionError)||(err instanceof eu.ApplicationError)||(err instanceof eu.ServerError)||(err instanceof Error))) {
        return true;
    } else {
        return false;
    }
};
eu.isWarning = function(err) {
    if (err && ((err instanceof eu.ConnectionWarning)||(err instanceof eu.ApplicationWarning)||(err instanceof eu.ServerWarning))) {
        return true;
    } else {
        return false;
    }
};



module.exports = eu;