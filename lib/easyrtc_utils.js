/* global module, require */

/**
 * Utility functions specific to EasyRTC.
 *
 * @module      easyrtc_util
 * @author      Priologic Software, info@easyrtc.com
 * @copyright   Copyright 2016 Priologic Software. All rights reserved.
 * @license     BSD v2, see LICENSE file in module root folder.
 */

// Externals dependencies
var async = require("async");
var util = require("util");
var _ = require("underscore"); // General utility functions external module

// Internals dependencies
var easyrtc = require("./easyrtc_private_obj"); // EasyRTC private object
var utils = require("./utils");

/**
 *  Object to hold EasyRTC Utility methods and classes.
 *
 * @class
 */
var easyrtc_utils = module.exports;

/**
 * Performs a deep copy of an object, returning the duplicate.
 * Do not use on objects with circular references.
 *
 * @function
 * @param       {Object} input          Input variable (or object) to be copied.
 * @returns     {Object}                New copy of variable.
 */
easyrtc_utils.deepCopy = utils.deepCopy;

/**
 * Disconnects socket. Failure results in a debug level log message.
 *
 * @param       {Object} socket         Socket.io connection object.
 */
easyrtc_utils.socketDisconnect = function(socket) {
    try {
        socket.disconnect();
    } catch(err) {
        easyrtc_utils.log("debug", "Socket disconnection command failed. Socket may already be disconnected.");
    }
};


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
 * Returns an EasyRTC message error object for a specific error code. This is meant to be emitted or returned to a websocket client.
 *
 * @param       {String} errorCode      EasyRTC error code associated with an error.
 * @return      {Object}                EasyRTC message error object for the specific error code.
 */
easyrtc_utils.getErrorMsg = function(errorCode) {
    var msg = {
        msgType: "error",
        serverTime: Date.now(),
        msgData: {
            errorCode: errorCode,
            errorText: easyrtc_utils.getErrorText(errorCode)
        }
    };

    if (!msg.msgData.errorText) {
        msg.msgData.errorText = "Error occurred with error code: " + errorCode;
        easyrtc_utils.logWarning("Emitted unknown error with error code [" + errorCode + "]");
    }

    return msg;
};

var errorCodesToMessages = {
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

/**
 * Returns human readable text for a given error code. If an unknown error code is provided, a null value will be returned.
 *
 * @param       {String} errorCode      EasyRTC error code associated with an error.
 * @return      {string}                Human readable error string
 */
easyrtc_utils.getErrorText = function(errorCode) {
    if (errorCodesToMessages.hasOwnProperty(errorCode)) {
        return errorCodesToMessages[errorCode];
    } else {
        easyrtc_utils.logWarning("Unknown message errorCode requested [" + errorCode + "]");
        return null;
    }
};


/**
 * Returns an EasyRTC message error object for a specific error code. This is meant to be emitted or returned to a websocket client.
 *
 * @param       {String} errorCode      EasyRTC error code associated with an error.
 * @return      {Object}                EasyRTC message error object for the specific error code.
 */
easyrtc_utils.getErrorMsg = function(errorCode) {
    var msg = {
        msgType: "error",
        serverTime: Date.now(),
        msgData: {
            errorCode: errorCode,
            errorText: easyrtc_utils.getErrorText(errorCode)
        }
    };

    if (!msg.msgData.errorText) {
        msg.msgData.errorText = "Error occurred with error code: " + errorCode;
        easyrtc_utils.logWarning("Emitted unknown error with error code [" + errorCode + "]");
    }

    return msg;
};

var errorCodesToMessages = {
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

/**
 * Returns human readable text for a given error code. If an unknown error code is provided, a null value will be returned.
 *
 * @param       {String} errorCode      EasyRTC error code associated with an error.
 * @return      {string}                Human readable error string
 */
easyrtc_utils.getErrorText = function(errorCode) {
    if (errorCodesToMessages.hasOwnProperty(errorCode)) {
        return errorCodesToMessages[errorCode];
    } else {
        easyrtc_utils.logWarning("Unknown message errorCode requested [" + errorCode + "]");
        return null;
    }
};

/**
 * An empty dummy function, which is designed to be used as a default callback in functions when none has been provided.
 *
 * @param       {Error} err             Error object
 */
easyrtc_utils.nextToNowhere = function(err) {
};

/**
 * General logging function which emits a log event so long as the log level has a severity equal or greater than e.option.logLevel
 *
 * @param       {string} level          Log severity level. Can be ("debug"|"info"|"warning"|"error")
 * @param       {string} logText        Text for log.
 * @param       {?*} [logFields]        Simple JSON object which contains extra fields to be logged.
 */
easyrtc_utils.log = function(level, logText, logFields, callback) {
    callback = callback || function(level, logText, logFields) {
        console[level](logText, logFields)
    };
    switch (easyrtc.option.logLevel) {
        case "error":
            if (level !== "error") {
                break;
            }
            /* falls through */
        case "warning":
            if (level === "info") {
                break;
            }
            /* falls through */
        case "info":
            if (level === "debug") {
                break;
            }
            /* falls through */
        case "debug":
            callback("log", level, logText, logFields)
            break;
    }
};


/**
 * Convenience function for logging "debug" level items.
 *
 * @param       {string} logText        Text for log.
 * @param       {?*} [logFields]        Simple JSON object which contains extra fields to be logged.
 */
easyrtc_utils.logDebug = function(logText, logFields) {
    easyrtc_utils.log("debug", logText, logFields);
};


/**
 * Convenience function for logging "info" level items.
 *
 * @param       {string} logText        Text for log.
 * @param       {?*} [logFields]        Simple JSON object which contains extra fields to be logged.
 */
easyrtc_utils.logInfo = function(logText, logFields) {
    easyrtc_utils.log("info", logText, logFields);
};


/**
 * Convenience function for logging "warning" level items.
 *
 * @param       {string} logText        Text for log.
 * @param       {?*} [logFields]        Simple JSON object which contains extra fields to be logged.
 */
easyrtc_utils.logWarning = function(logText, logFields) {
    easyrtc_utils.log("warning", logText, logFields);
};


/**
 * Convenience function for logging "error" level items.
 *
 * @param       {string} logText        Text for log.
 * @param       {?*} [logFields]        Simple JSON object which contains extra fields to be logged.
 */
easyrtc_utils.logError = function(logText, logFields) {
    easyrtc_utils.log("error", logText, logFields);
};


/**
 * Sends a complete socket message to a given socketCallback. Provides additional checking and logging.
 *
 * @param       {string}    easyrtcid   EasyRTC unique identifier for a socket connection.
 * @param       {Function}  socketCallback Socket.io callback function
 * @param       {Object}    msg         Message object which contains the full message for a client; this can include the standard msgType and msgData fields.
 * @param       {?Object}   appObj      EasyRTC application object. Contains methods used for identifying and managing an application.
 */
easyrtc_utils.sendSocketCallbackMsg = function(easyrtcid, socketCallback, msg, appObj) {
    var appName;

    if (appObj) {
        appName = appObj.getAppName();
        if (!appObj.isConnectedSync(easyrtcid)) {
            easyrtc_utils.logDebug("["+appName+"]["+easyrtcid+"] Unable to return socket message. Peer no longer connected.");
            return false;
        }
    }

    if (!_.isFunction(socketCallback)) {
        easyrtc_utils.logWarning("["+appName+"]["+easyrtcid+"] Unable to return socket message. Provided socketCallback was not a function.");
        return false;
    }

    try {
        socketCallback(msg);
    } catch(err) {
        easyrtc_utils.logWarning("["+appName+"]["+easyrtcid+"] Unable to return socket message. Call to socketCallback failed.");
    }

    if (easyrtc.option.logMessagesEnable) {
        try {
            easyrtc_utils.logDebug("["+appName+"]["+easyrtcid+"] Returning socket.io message: ["+JSON.stringify(msg)+"]");
        }
        catch(err) {
            easyrtc_utils.logDebug("["+appName+"]["+easyrtcid+"] Returning socket.io message");
        }
    }
    return true;
};


/**
 * Sends an 'ack' socket message to a given socketCallback. Provides additional checking and logging.
 *
 * @param       {string}    easyrtcid   EasyRTC unique identifier for a socket connection.
 * @param       {Function}  socketCallback Socket.io callback function
 * @param       {?Object}   appObj      EasyRTC application object. Contains methods used for identifying and managing an application.
 */
easyrtc_utils.sendSocketCallbackAck = function(easyrtcid, socketCallback, appObj) {
    return easyrtc_utils.sendSocketCallbackMsg(easyrtcid, socketCallback, {"msgType":"ack"}, appObj);
};


