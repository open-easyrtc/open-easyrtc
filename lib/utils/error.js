const util = require("util");

const easyrtc_utils = module.exports;

/* An abstract error object which should be easy to extend for custom Error classes.
 *
 * @copyright Based on code in article by Dustin Seno.
 *
 * @param   {String}    Custom error message.
 * @param   {Object}    Constructor property.
 *
 */
easyrtc_utils.AbstractError = function(msg, constr){
    Error.captureStackTrace(this, constr || this);
    this.message = msg || "Error";
};
util.inherits(easyrtc_utils.AbstractError, Error);
easyrtc_utils.AbstractError.prototype.name = "Abstract Error";


/**
 * Custom Error Object for EasyRTC Application Errors.
 *
 * @extends     Error
 * @param       {string} msg            Text message describing the error.
 * @returns     {Error}
 */
easyrtc_utils.ApplicationError = function(msg) {
    easyrtc_utils.ApplicationError.super_.call(this, msg, this.constructor);
};
util.inherits(easyrtc_utils.ApplicationError, easyrtc_utils.AbstractError);
easyrtc_utils.ApplicationError.prototype.name = "Application Error";
easyrtc_utils.ApplicationError.prototype.errorLevel = "error";


/**
 * Custom Error Object for EasyRTC Application Warnings.
 *
 * @extends     Error
 * @param       {string} msg            Text message describing the error.
 * @returns     {Error}
 */
easyrtc_utils.ApplicationWarning = function(msg) {
    easyrtc_utils.ApplicationWarning.super_.call(this, msg, this.constructor);
};
util.inherits(easyrtc_utils.ApplicationWarning, easyrtc_utils.AbstractError);
easyrtc_utils.ApplicationWarning.prototype.name = "Application Warning";
easyrtc_utils.ApplicationWarning.prototype.errorLevel = "warning";


/**
 * Custom Error Object for EasyRTC C Errors.
 *
 * @function
 * @extends     Error
 * @param       {string} msg            Text message describing the error.
 * @returns     {Error}
 */
easyrtc_utils.ConnectionError = function(msg) {
    easyrtc_utils.ConnectionError.super_.call(this, msg, this.constructor);
};
util.inherits(easyrtc_utils.ConnectionError, easyrtc_utils.AbstractError);
easyrtc_utils.ConnectionError.prototype.name = "Connection Error";
easyrtc_utils.ConnectionError.prototype.errorLevel = "error";

/**
 * Custom Error Object for EasyRTC Connection Warnings.
 *
 * @function
 * @extends     Error
 * @param       {string} msg            Text message describing the error.
 * @returns     {Error}
 */
easyrtc_utils.ConnectionWarning = function(msg) {
    easyrtc_utils.ConnectionWarning.super_.call(this, msg, this.constructor);
};
util.inherits(easyrtc_utils.ConnectionWarning, easyrtc_utils.AbstractError);
easyrtc_utils.ConnectionWarning.prototype.name = "Connection Warning";
easyrtc_utils.ConnectionWarning.prototype.errorLevel = "warning";


/**
 * Custom Error Object for EasyRTC Server Errors.
 *
 * @function
 * @extends     Error
 * @param       {string} msg            Text message describing the error.
 * @returns     {Error}
 */
easyrtc_utils.ServerError = function(msg) {
    easyrtc_utils.ServerError.super_.call(this, msg, this.constructor);
};
util.inherits(easyrtc_utils.ServerError, easyrtc_utils.AbstractError);
easyrtc_utils.ServerError.prototype.name = "Server Error";
easyrtc_utils.ServerError.prototype.errorLevel = "error";


/**
 * Custom Error Object for EasyRTC Server Warnings.
 *
 * @function
 * @extends     Error
 * @param       {string} msg            Text message describing the error.
 * @returns     {Error}
 */
easyrtc_utils.ServerWarning = function(msg) {
    easyrtc_utils.ServerWarning.super_.call(this, msg, this.constructor);
};
util.inherits(easyrtc_utils.ServerWarning, easyrtc_utils.AbstractError);
easyrtc_utils.ServerWarning.prototype.name = "Server Warning";
easyrtc_utils.ServerWarning.prototype.errorLevel = "warning";



/**
 * Determines if an Error object is an instance of ApplicationError, ConnectionError, or ServerError. If it is, it will return true.
 *
 * @function
 * @param       {*|Error}               Will accept any value, but will only return true for appropriate error objects.
 * @return      {Boolean}
 */
easyrtc_utils.isError = function(err) {
    if (err && ((err instanceof easyrtc_utils.ConnectionError)||(err instanceof easyrtc_utils.ApplicationError)||(err instanceof easyrtc_utils.ServerError)||(err instanceof Error))) {
        return true;
    } else {
        return false;
    }
};


/**
 * Determines if an Error object is an instance of ApplicationWarning, ConnectionWarning, or ServerWarning. If it is, it will return true.
 *
 * @function
 * @param       {*|Error}               Will accept any value, but will only return true for appropriate error objects.
 * @return      {Boolean}
 */
easyrtc_utils.isWarning = function(err) {
    if (err && ((err instanceof easyrtc_utils.ConnectionWarning)||(err instanceof easyrtc_utils.ApplicationWarning)||(err instanceof easyrtc_utils.ServerWarning))) {
        return true;
    } else {
        return false;
    }
};