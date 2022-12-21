const util = require("util");

const easyrtc_error = module.exports;

// TODO move to error ?
easyrtc_error.errorCodesToMessages = {
    "BANNED_IP_ADDR": "Client IP address is banned. Socket will be disconnected.",
    "LOGIN_APP_AUTH_FAIL": "Authentication for application failed. Socket will be disconnected.",
    "LOGIN_BAD_APP_NAME": "Provided application name is improper. Socket will be disconnected.",
    "LOGIN_BAD_AUTH": "Authentication for application failed. Socket will be disconnected.",
    "LOGIN_BAD_ROOM": "Requested room is invalid or does not exist. Socket will be disconnected.",
    "LOGIN_BAD_STRUCTURE": "Authentication for application failed. The provided structure is improper. Socket will be disconnected.",
    "LOGIN_BAD_USER_CFG": "Provided configuration options improper or invalid. Socket will be disconnected.",
    "LOGIN_GEN_FAIL": "Authentication failed. Socket will be disconnected.",
    "LOGIN_NO_SOCKETS": "No sockets available for account. Socket will be disconnected.",
    "LOGIN_TIMEOUT": "Login has timed out. Socket will be disconnected.",
    "MSG_REJECT_BAD_DATA": "Message rejected. The provided msgData is improper.",
    "MSG_REJECT_BAD_ROOM": "Message rejected. Requested room is invalid or does not exist.",
    "MSG_REJECT_BAD_FIELD": "Message rejected. Problem with field structure or name.",
    "MSG_REJECT_BAD_SIZE": "Message rejected. Packet size is too large.",
    "MSG_REJECT_BAD_STRUCTURE": "Message rejected. The provided structure is improper.",
    "MSG_REJECT_BAD_TYPE": "Message rejected. The provided msgType is unsupported.",
    "MSG_REJECT_GEN_FAIL": "Message rejected. General failure occurred.",
    "MSG_REJECT_NO_AUTH": "Message rejected. Not logged in or client not authorized.",
    "MSG_REJECT_NO_ROOM_LIST": "Message rejected. Room list unavailable.",
    "MSG_REJECT_PRESENCE": "Message rejected. Presence could could not be set.",
    "MSG_REJECT_TARGET_EASYRTCID": "Message rejected. Target easyrtcid is invalid, not using same application, or no longer online.",
    "MSG_REJECT_TARGET_GROUP": "Message rejected. Target group is invalid or not defined.",
    "MSG_REJECT_TARGET_ROOM": "Message rejected. Target room is invalid or not created.",
    "SERVER_SHUTDOWN": "Server is being shutdown. Socket will be disconnected.",
};

/* An abstract error object which should be easy to extend for custom Error classes.
 *
 * @copyright Based on code in article by Dustin Seno.
 *
 * @param   {String}    Custom error message.
 * @param   {Object}    Constructor property.
 *
 */
easyrtc_error.AbstractError = function(msg, constr){
    Error.captureStackTrace(this, constr || this);
    this.message = msg || "Error";
};
util.inherits(easyrtc_error.AbstractError, Error);
easyrtc_error.AbstractError.prototype.name = "Abstract Error";


/**
 * Custom Error Object for EasyRTC Application Errors.
 *
 * @extends     Error
 * @param       {string} msg            Text message describing the error.
 * @returns     {Error}
 */
easyrtc_error.ApplicationError = function(msg) {
    easyrtc_error.ApplicationError.super_.call(this, msg, this.constructor);
};
util.inherits(easyrtc_error.ApplicationError, easyrtc_error.AbstractError);
easyrtc_error.ApplicationError.prototype.name = "Application Error";
easyrtc_error.ApplicationError.prototype.errorLevel = "error";


/**
 * Custom Error Object for EasyRTC Application Warnings.
 *
 * @extends     Error
 * @param       {string} msg            Text message describing the error.
 * @returns     {Error}
 */
easyrtc_error.ApplicationWarning = function(msg) {
    easyrtc_error.ApplicationWarning.super_.call(this, msg, this.constructor);
};
util.inherits(easyrtc_error.ApplicationWarning, easyrtc_error.AbstractError);
easyrtc_error.ApplicationWarning.prototype.name = "Application Warning";
easyrtc_error.ApplicationWarning.prototype.errorLevel = "warning";


/**
 * Custom Error Object for EasyRTC C Errors.
 *
 * @function
 * @extends     Error
 * @param       {string} msg            Text message describing the error.
 * @returns     {Error}
 */
easyrtc_error.ConnectionError = function(msg) {
    easyrtc_error.ConnectionError.super_.call(this, msg, this.constructor);
};
util.inherits(easyrtc_error.ConnectionError, easyrtc_error.AbstractError);
easyrtc_error.ConnectionError.prototype.name = "Connection Error";
easyrtc_error.ConnectionError.prototype.errorLevel = "error";

/**
 * Custom Error Object for EasyRTC Connection Warnings.
 *
 * @function
 * @extends     Error
 * @param       {string} msg            Text message describing the error.
 * @returns     {Error}
 */
easyrtc_error.ConnectionWarning = function(msg) {
    easyrtc_error.ConnectionWarning.super_.call(this, msg, this.constructor);
};
util.inherits(easyrtc_error.ConnectionWarning, easyrtc_error.AbstractError);
easyrtc_error.ConnectionWarning.prototype.name = "Connection Warning";
easyrtc_error.ConnectionWarning.prototype.errorLevel = "warning";


/**
 * Custom Error Object for EasyRTC Server Errors.
 *
 * @function
 * @extends     Error
 * @param       {string} msg            Text message describing the error.
 * @returns     {Error}
 */
easyrtc_error.ServerError = function(msg) {
    easyrtc_error.ServerError.super_.call(this, msg, this.constructor);
};
util.inherits(easyrtc_error.ServerError, easyrtc_error.AbstractError);
easyrtc_error.ServerError.prototype.name = "Server Error";
easyrtc_error.ServerError.prototype.errorLevel = "error";


/**
 * Custom Error Object for EasyRTC Server Warnings.
 *
 * @function
 * @extends     Error
 * @param       {string} msg            Text message describing the error.
 * @returns     {Error}
 */
easyrtc_error.ServerWarning = function(msg) {
    easyrtc_error.ServerWarning.super_.call(this, msg, this.constructor);
};
util.inherits(easyrtc_error.ServerWarning, easyrtc_error.AbstractError);
easyrtc_error.ServerWarning.prototype.name = "Server Warning";
easyrtc_error.ServerWarning.prototype.errorLevel = "warning";



/**
 * Determines if an Error object is an instance of ApplicationError, ConnectionError, or ServerError. If it is, it will return true.
 *
 * @function
 * @param       {*|Error}               Will accept any value, but will only return true for appropriate error objects.
 * @return      {Boolean}
 */
easyrtc_error.isError = function(err) {
    if (err && ((err instanceof easyrtc_error.ConnectionError)||(err instanceof easyrtc_error.ApplicationError)||(err instanceof easyrtc_error.ServerError)||(err instanceof Error))) {
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
easyrtc_error.isWarning = function(err) {
    if (err && ((err instanceof easyrtc_error.ConnectionWarning)||(err instanceof easyrtc_error.ApplicationWarning)||(err instanceof easyrtc_error.ServerWarning))) {
        return true;
    } else {
        return false;
    }
};