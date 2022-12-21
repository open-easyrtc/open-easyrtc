/* global module, require */

/**
 * Utility functions specific to EasyRTC.
 *
 * @module      easyrtc_util
 * @author      Open-EasyRTC
 * @copyright   Copyright 2022 Open-EasyRTC. All rights reserved.
 * @license     BSD v2, see LICENSE file in module root folder.
 */

// Externals dependencies
var async = require("async");
var _ = require("underscore"); // General utility functions external module

// Internals dependencies
var utils = require("./utils");
var utils_error = require("./utils/error");
var utils_log = require("./utils/log");

/**
 *  Object to hold EasyRTC Utility methods and classes.
 *
 * @class
 */
var easyrtc_utils = module.exports = {
    ...utils_error,
    ...utils_log,

    get logLevel() {
        return utils_log.logLevel;
    },
    set logLevel(level) {
        return utils_log.logLevel = level;
    },
    get logCallback() {
        return utils_log.logCallback;
    },
    set logCallback(callback) {
        utils_log.logCallback = callback;
    }
};

/**
 * Performs a deep copy of an object, returning the duplicate.
 * Do not use on objects with circular references.
 *
 * @function
 * @param       {Object} input          Input variable (or object) to be copied.
 * @returns     {Object}                New copy of variable.
 */
easyrtc_utils.deepCopy = utils.deepCopy;

/*
 * Return a random string of characters
 *
 * @param {Integer} stringLength    Number of random characters the returned string should contain. Defaults to 16.
 * @param {String}  chars           Available characters to use in a strinutils. Defaults to [A-Za-z0-9]
 * @returns {String}                Generated random string
 *
 */
// TODO used by Server? use UUIDV4 ?
easyrtc_utils.randomString = function(stringLength, chars){
    var newString = "";

    if (!chars) {
        chars = "ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz0123456789";
    }

    if (!stringLength) {
        stringLength = 16;
    }

    for (var i=0; i < stringLength; i=i+1) {
        var randomNumber = Math.floor(Math.random() * chars.length);
        newString += chars.substring(randomNumber, randomNumber + 1);
    }

    return newString;
};

/**
 * An empty dummy function, which is designed to be used as a default callback in functions when none has been provided.
 *
 * @param       {Error} err             Error object
 */
easyrtc_utils.nextToNowhere = function(err) { };

//
// Errors
//

/**
 * Returns human readable text for a given error code. If an unknown error code is provided, a null value will be returned.
 *
 * @param       {String} errorCode      EasyRTC error code associated with an error.
 * @return      {string}                Human readable error string
 */
easyrtc_utils.getErrorText = function(errorCode) {
    if (utils_error.errorCodesToMessages.hasOwnProperty(errorCode)) {
        return utils_error.errorCodesToMessages[errorCode];
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

//
// Socket
//

// Log the full contents of incoming and outgoing messages. Also requires the logLevel to be set at "debug". Introduces security and performance concerns.
easyrtc_utils.logMessagesEnable = false;

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

    if (easyrtc_utils.logMessagesEnable) {
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