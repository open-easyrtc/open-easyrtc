/**
 * Utility functions specific to EasyRTC.
 *
 * @module      easyrtc_util
 * @author      Priologic Software, info@easyrtc.com
 * @copyright   Copyright 2014 Priologic Software. All rights reserved.
 * @license     BSD v2, see LICENSE file in module root folder.
 */

var util            = require("util");
var _               = require("underscore");                // General utility functions external module
var g               = require("./general_util");            // General utility functions local module
var e               = require("./easyrtc_private_obj");     // EasyRTC private object


/**
 *  Object to hold EasyRTC Utility methods and classes.
 *
 * @class
 */
var eu = module.exports;


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


/**
 * Custom Error Object for EasyRTC Server Errors.
 *
 * @extends     Error
 * @param       {string} msg            Text message describing the error.
 * @returns     {Error}
 */
eu.ServerError = function(msg) {
    eu.ServerError.super_.call(this, msg, this.constructor);
};
util.inherits(eu.ServerError, g.AbstractError);
eu.ServerError.prototype.name = "Server Error";
eu.ServerError.prototype.errorLevel = "error";


/**
 * Custom Error Object for EasyRTC Application Errors.
 *
 * @extends     Error
 * @param       {string} msg            Text message describing the error.
 * @returns     {Error}
 */
eu.ApplicationError = function(msg) {
    eu.ApplicationError.super_.call(this, msg, this.constructor);
};
util.inherits(eu.ApplicationError, g.AbstractError);
eu.ApplicationError.prototype.name = "Application Error";
eu.ApplicationError.prototype.errorLevel = "error";


/**
 * Custom Error Object for Connection Errors.
 *
 * @extends     Error
 * @param       {string} msg            Text message describing the error.
 * @returns     {Error}
 */
eu.ConnectionError = function(msg) {
    eu.ConnectionError.super_.call(this, msg, this.constructor);
};
util.inherits(eu.ConnectionError, g.AbstractError);
eu.ConnectionError.prototype.name = "Connection Error";
eu.ConnectionError.prototype.errorLevel = "error";


/**
 * Custom Error Object for EasyRTC Server Warnings.
 *
 * @extends     Error
 * @param       {string} msg            Text message describing the error.
 * @returns     {Error}
 */
eu.ServerWarning = function(msg) {
    eu.ServerWarning.super_.call(this, msg, this.constructor);
};
util.inherits(eu.ServerWarning, g.AbstractError);
eu.ServerWarning.prototype.name = "Server Warning";
eu.ServerWarning.prototype.errorLevel = "warning";


/**
 * Custom Error Object for EasyRTC Application Warnings.
 *
 * @extends     Error
 * @param       {string} msg            Text message describing the error.
 * @returns     {Error}
 */
eu.ApplicationWarning = function(msg) {
    eu.ApplicationWarning.super_.call(this, msg, this.constructor);
};
util.inherits(eu.ApplicationWarning, g.AbstractError);
eu.ApplicationWarning.prototype.name = "Application Warning";
eu.ApplicationWarning.prototype.errorLevel = "warning";


/**
 * Custom Error Object for Connection Warnings.
 *
 * @extends     Error
 * @param       {string} msg            Text message describing the error.
 * @returns     {Error}
 */
eu.ConnectionWarning = function(msg) {
    eu.ConnectionWarning.super_.call(this, msg, this.constructor);
};
util.inherits(eu.ConnectionWarning, g.AbstractError);
eu.ConnectionWarning.prototype.name = "Connection Warning";
eu.ConnectionWarning.prototype.errorLevel = "warning";


/**
 * Determines if an Error object is an instance of ApplicationError, ConnectionError, or ServerError. If it is, it will return true.
 *
 * @param   {Error}     err
 * @return  {Boolean}
 */
eu.isError = function(err) {
    if (err && ((err instanceof eu.ConnectionError)||(err instanceof eu.ApplicationError)||(err instanceof eu.ServerError)||(err instanceof Error))) {
        return true;
    } else {
        return false;
    }
};


/**
 * Determines if an Error object is an instance of ApplicationWarning, ConnectionWarning, or ServerWarning. If it is, it will return true.
 *
 * @param   {Error}     err
 * @return  {Boolean}
 */
eu.isWarning = function(err) {
    if (err && ((err instanceof eu.ConnectionWarning)||(err instanceof eu.ApplicationWarning)||(err instanceof eu.ServerWarning))) {
        return true;
    } else {
        return false;
    }
};
