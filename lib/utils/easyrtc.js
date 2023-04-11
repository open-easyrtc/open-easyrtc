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
const util = require("util");
const async = require("async");
const _ = require("underscore"); // General utility functions external module

// Internals dependencies
const utils_error = require("./error");
const utils_log = require("./log");

/**
 *  Object to hold EasyRTC Utility methods and classes.
 *
 * @class
 */
const easyrtc_utils = module.exports;

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
        utils_log.logWarning("Unknown message errorCode requested [" + errorCode + "]");
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
        utils_log.logWarning("Emitted unknown error with error code [" + errorCode + "]");
    }

    return msg;
};

//
// Socket
//

// Log the full contents of incoming and outgoing messages. Also requires the logLevel to be set at "debug". Introduces security and performance concerns.
utils_log.logMessagesEnable = false;

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
            utils_log.logDebug("["+appName+"]["+easyrtcid+"] Unable to return socket message. Peer no longer connected.");
            return false;
        }
    }

    if (!_.isFunction(socketCallback)) {
        utils_log.logWarning("["+appName+"]["+easyrtcid+"] Unable to return socket message. Provided socketCallback was not a function.");
        return false;
    }

    try {
        socketCallback(msg);
    } catch(err) {
        utils_log.logWarning("["+appName+"]["+easyrtcid+"] Unable to return socket message. Call to socketCallback failed.");
    }

    if (utils_log.logMessagesEnable) {
        try {
            utils_log.logDebug("["+appName+"]["+easyrtcid+"] Returning socket.io message: ["+JSON.stringify(msg)+"]");
        }
        catch(err) {
            utils_log.logDebug("["+appName+"]["+easyrtcid+"] Returning socket.io message");
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
        utils_log.log("debug", "Socket disconnection command failed. Socket may already be disconnected.");
    }
};

/**
 * Will attempt to deliver an EasyRTC session id via a cookie. Requires that session management be enabled from within Express.
 *
 * @param       {Object} req            Http request object
 * @param       {Object} res            Http result object
 */
easyrtc_utils.sendSessionCookie = function(req, res) {

    // If sessions or session cookies are disabled, return without an error.
    const server = req.app.get('easyrtc').server;
    if (!server.getOption("sessionEnable") || !server.getOption("sessionCookieEnable")) {
        return;
    }

    // TODO allow easyrtcsid value for cookie name options
    if (req.sessionID && (!req.cookies || !req.cookies.easyrtcsid || req.cookies.easyrtcsid !== req.sessionID)) {
        try {
            utils_log.logDebug("Sending easyrtcsid cookie [" + req.sessionID + "] to [" + req.ip + "] for request [" + req.url + "]");
            res.cookie("easyrtcsid", req.sessionID, {
                maxAge: 2592000000,
                httpOnly: false
            });
        } catch (e) {
            utils_log.logWarning("Problem setting easyrtcsid cookie [" + req.sessionID + "] to [" + req.ip + "] for request [" + req.url + "]");
        }
    }
};

/**
 * Will attempt to deliver an EasyRTC file via a sendFile.
 *
 * @param       {Object} req            Http request object
 * @param       {Object} res            Http result object
 * @param       {Object} filePath       Path of file to send
 */
easyrtc_utils.sendFileResponse = function(req, res, filePath) {

    const easyrtcRoot = __dirname + "/../../";

    (res.sendFile||res.sendfile).call(res, filePath,  {
        root: easyrtcRoot
    }, function (err) {
        if (err && err.status && res && !res._headerSent) {
            utils_log.logError("Send file error", err);
            res.status(404);
            res.end();
        }
    });
};

easyrtc_utils.isValidIncomingType = (type, msg, callback) => {
    // All messages follow the basic structure
    if (!_.isString(type)) {
        callback(null, false, "MSG_REJECT_BAD_TYPE");
        return;
    }
    if (!_.isObject(msg)) {
        callback(null, false, "MSG_REJECT_BAD_STRUCTURE");
        return;
    }
    if (!_.isString(msg.msgType)) {
        callback(null, false, "MSG_REJECT_BAD_TYPE");
        return;
    }

    // Incoming message syntactically valid
    callback(null, true, null);
};

easyrtc_utils.isValidIncomingAuth = (type, msg, obj, callback) => {

    if (msg.msgType !== "authenticate") {
        callback(null, false, "MSG_REJECT_BAD_TYPE");
        return;
    }
    if (!_.isObject(msg.msgData)) {
        callback(null, false, "MSG_REJECT_BAD_DATA");
        return;
    }

    // msgData.apiVersion (required)
    if (msg.msgData.apiVersion === undefined || !_.isString(msg.msgData.apiVersion) || !obj.getOption("apiVersionRegExp").test(msg.msgData.apiVersion)) {
        callback(null, false, "MSG_REJECT_BAD_STRUCTURE");
        return;
    }

    // msgData.appName
    if (msg.msgData.applicationName !== undefined && (!_.isString(msg.msgData.applicationName) || !obj.getOption("appNameRegExp").test(msg.msgData.applicationName))) {
        callback(null, false, "MSG_REJECT_BAD_STRUCTURE");
        return;
    }

    // msgData.easyrtcsid
    if (msg.msgData.easyrtcsid !== undefined && (!_.isString(msg.msgData.easyrtcsid) || !obj.getOption("easyrtcsidRegExp").test(msg.msgData.easyrtcsid))) {
        callback(null, false, "MSG_REJECT_BAD_STRUCTURE");
        return;
    }

    let isCallbackRun = false;
    async.waterfall([
            function(asyncCallback) {
                obj.app((msg.msgData.applicationName !== undefined ? msg.msgData.applicationName : obj.getOption("appDefaultName")), function(err, newAppObj) {
                    if (!err) {
                        obj = newAppObj;
                    }
                    asyncCallback(null);
                });
            },
            function(asyncCallback) {
            // msgData.username
            if (msg.msgData.username !== undefined && (!_.isString(msg.msgData.username) || !obj.getOption("usernameRegExp").test(msg.msgData.username))) {
                callback(null, false, "MSG_REJECT_BAD_STRUCTURE");
                isCallbackRun = true;
                return;
            }

            // msgData.credential
            if (msg.msgData.credential !== undefined && (!_.isObject(msg.msgData.credential) || _.isEmpty(msg.msgData.credential))) {
                callback(null, false, "MSG_REJECT_BAD_STRUCTURE");
                isCallbackRun = true;
                return;
            }

            // msgData.roomJoin
            if (msg.msgData.roomJoin !== undefined) {
                if (!_.isObject(msg.msgData.roomJoin)) {
                    callback(null, false, "MSG_REJECT_BAD_STRUCTURE");
                    isCallbackRun = true;
                    return;
                }

                for (var currentRoomName in msg.msgData.roomJoin) {
                    if (msg.msgData.roomJoin.hasOwnProperty(currentRoomName)) {
                        if (
                            !obj.getOption("roomNameRegExp").test(currentRoomName) ||
                                !_.isObject(msg.msgData.roomJoin[currentRoomName]) ||
                                    !_.isString(msg.msgData.roomJoin[currentRoomName].roomName) ||
                                        currentRoomName !== msg.msgData.roomJoin[currentRoomName].roomName
                        ) {
                            callback(null, false, "MSG_REJECT_BAD_STRUCTURE");
                            isCallbackRun = true;
                            return;
                        }
                        // if roomParameter field is defined, it must be an object
                        if (msg.msgData.roomJoin[currentRoomName].roomParameter !== undefined && !_.isObject(msg.msgData.roomJoin[currentRoomName].roomParameter)) {
                            callback(null, false, "MSG_REJECT_BAD_STRUCTURE");
                            isCallbackRun = true;
                            return;
                        }
                    }
                }
            }

            // msgData.setPresence
            if (msg.msgData.setPresence !== undefined) {
                if (!_.isObject(msg.msgData.setPresence) || _.isEmpty(msg.msgData.setPresence)) {
                    callback(null, false, "MSG_REJECT_BAD_STRUCTURE");
                    isCallbackRun = true;
                    return;
                }
                if (msg.msgData.setPresence.show !== undefined && (!_.isString(msg.msgData.setPresence.show) || !obj.getOption("presenceShowRegExp").test(msg.msgData.setPresence.show))) {
                    callback(null, false, "MSG_REJECT_BAD_STRUCTURE");
                    isCallbackRun = true;
                    return;
                }
                if (msg.msgData.setPresence.status !== undefined && (!_.isString(msg.msgData.setPresence.status) || !obj.getOption("presenceStatusRegExp").test(msg.msgData.setPresence.status))) {
                    callback(null, false, "MSG_REJECT_BAD_STRUCTURE");
                    isCallbackRun = true;
                    return;
                }
            }

            // TODO: setUserCfg
            if (msg.msgData.setUserCfg !== undefined) {

            }

            asyncCallback(null);

        }
        ],
        function(err) {
            if (err) {
                if (!isCallbackRun) {
                    callback(null, false, "MSG_REJECT_BAD_STRUCTURE");
                    isCallbackRun = true;
                }
            }
            else {
                // Incoming message syntactically valid
                callback(null, true, null);
            }
        }
    );
};

easyrtc_utils.isValidIncomingCmd = (type, msg, obj, callback) => {

    switch (msg.msgType) {
        case "candidate" :
        case "offer" :
        case "answer" :
            // candidate, offer, and answer each require a non-empty msgData object and a proper targetEasyrtcid
            if (!_.isObject(msg.msgData) || _.isEmpty(msg.msgData)) {
                callback(null, false, "MSG_REJECT_BAD_DATA");
                return;
            }
            if (!_.isString(msg.targetEasyrtcid) || !obj.getOption("easyrtcidRegExp").test(msg.targetEasyrtcid)) {
                callback(null, false, "MSG_REJECT_BAD_STRUCTURE");
                return;
            }
            break;
        case "reject" :
        case "hangup" :
            // reject, and hangup each require a targetEasyrtcid but no msgData
            if (msg.msgData !== undefined) {
                callback(null, false, "MSG_REJECT_BAD_DATA");
                return;
            }
            if (!_.isString(msg.targetEasyrtcid) || !obj.getOption("easyrtcidRegExp").test(msg.targetEasyrtcid)) {
                callback(null, false, "MSG_REJECT_BAD_STRUCTURE");
                return;
            }
            break;

        case "getIceConfig" :
            if (msg.msgData !== undefined && !_.isEmpty(msg.msgData)) {
                callback(null, false, "MSG_REJECT_BAD_DATA");
                return;
            }
            break;

        case "getRoomList" :
            if (msg.msgData !== undefined) {
                callback(null, false, "MSG_REJECT_BAD_DATA");
                return;
            }
            break;

        case "roomJoin" :
            if (!_.isObject(msg.msgData)) {
                callback(null, false, "MSG_REJECT_BAD_DATA");
                return;
            }
            if (!_.isObject(msg.msgData.roomJoin)) {
                callback(null, false, "MSG_REJECT_BAD_STRUCTURE");
                return;
            }

            for (var joinRoomName in msg.msgData.roomJoin) {
                if (msg.msgData.roomJoin.hasOwnProperty(joinRoomName)) {
                    if (
                        !obj.getOption("roomNameRegExp").test(joinRoomName) ||
                            !_.isObject(msg.msgData.roomJoin[joinRoomName]) ||
                                !_.isString(msg.msgData.roomJoin[joinRoomName].roomName) ||
                                    joinRoomName !== msg.msgData.roomJoin[joinRoomName].roomName
                    ) {
                        callback(null, false, "MSG_REJECT_BAD_STRUCTURE");
                        return;
                    }
                }
            }
            break;

        case "roomLeave" :
            if (!_.isObject(msg.msgData)) {
                callback(null, false, "MSG_REJECT_BAD_DATA");
                return;
            }
            if (!_.isObject(msg.msgData.roomLeave)) {
                callback(null, false, "MSG_REJECT_BAD_STRUCTURE");
                return;
            }

            for (var leaveRoomName in msg.msgData.roomLeave) {
                if (msg.msgData.roomLeave.hasOwnProperty(leaveRoomName)) {
                    if (
                        !obj.getOption("roomNameRegExp").test(leaveRoomName) ||
                            !_.isObject(msg.msgData.roomLeave[leaveRoomName]) ||
                                !_.isString(msg.msgData.roomLeave[leaveRoomName].roomName) ||
                                    leaveRoomName !== msg.msgData.roomLeave[leaveRoomName].roomName) {
                        callback(null, false, "MSG_REJECT_BAD_STRUCTURE");
                        return;
                    }
                }
            }
            break;

        case "stillAlive":
            // Deprecated
            break;

        case "setPresence" :
            if (!_.isObject(msg.msgData)) {
                callback(null, false, "MSG_REJECT_BAD_DATA");
                return;
            }
            if (!_.isObject(msg.msgData.setPresence) || _.isEmpty(msg.msgData.setPresence)) {
                callback(null, false, "MSG_REJECT_BAD_STRUCTURE");
                return;
            }
            if (msg.msgData.setPresence.show !== undefined && (!_.isString(msg.msgData.setPresence.show) || !obj.getOption("presenceShowRegExp").test(msg.msgData.setPresence.show))) {
                callback(null, false, "MSG_REJECT_BAD_STRUCTURE");
                return;
            }
            if (msg.msgData.setPresence.status !== undefined && (!_.isString(msg.msgData.setPresence.status) || !obj.getOption("presenceStatusRegExp").test(msg.msgData.setPresence.status))) {
                callback(null, false, "MSG_REJECT_BAD_STRUCTURE");
                return;
            }
            break;

        case "setRoomApiField" :
            if (!_.isObject(msg.msgData)) {
                callback(null, false, "MSG_REJECT_BAD_DATA");
                return;
            }
            if (!_.isObject(msg.msgData.setRoomApiField) || _.isEmpty(msg.msgData.setRoomApiField)) {
                callback(null, false, "MSG_REJECT_BAD_STRUCTURE");
                return;
            }
            if (!_.isString(msg.msgData.setRoomApiField.roomName) || !obj.getOption("roomNameRegExp").test(msg.msgData.setRoomApiField.roomName)) {
                callback(null, false, "MSG_REJECT_BAD_ROOM");
                return;
            }
            if (msg.msgData.setRoomApiField.field !== undefined) {
                if (!_.isObject(msg.msgData.setRoomApiField.field)) {
                    callback(null, false, "MSG_REJECT_BAD_STRUCTURE");
                    return;
                }
                try {
                    if (JSON.stringify(msg.msgData.setRoomApiField.field).length >= 4096) {
                        callback(null, false, "MSG_REJECT_BAD_SIZE");
                        return;
                    }
                } catch (e) {
                    if (!_.isObject(msg.msgData.setRoomApiField.field)) {
                        callback(null, false, "MSG_REJECT_BAD_STRUCTURE");
                        return;
                    }
                }
            }
            break;

        case "setUserCfg" :
            if (!_.isObject(msg.msgData)) {
                callback(null, false, "MSG_REJECT_BAD_DATA");
                return;
            }
            if (!_.isObject(msg.msgData.setUserCfg) || _.isEmpty(msg.msgData.setUserCfg)) {
                callback(null, false, "MSG_REJECT_BAD_STRUCTURE");
                return;
            }

            // setUserCfg.p2pList
            if (msg.msgData.setUserCfg.p2pList !== undefined && (!_.isObject(msg.msgData.setUserCfg.p2pList) || _.isEmpty(msg.msgData.setUserCfg.p2pList))) {
                callback(null, false, "MSG_REJECT_BAD_STRUCTURE");
                return;
            }
            // TODO: Go through p2pList to confirm each key is an easyrtcid

            // setUserCfg.userSettings
            if (msg.msgData.setUserCfg.userSettings !== undefined && (!_.isObject(msg.msgData.setUserCfg.userSettings) || _.isEmpty(msg.msgData.setUserCfg.userSettings))) {
                callback(null, false, "MSG_REJECT_BAD_STRUCTURE");
                return;
            }

            break;

        default:
            // Reject all unknown msgType's
            callback(null, false, "MSG_REJECT_BAD_TYPE");
            return;
    }


    // Incoming message syntactically valid
    callback(null, true, null);
};

easyrtc_utils.isValidIncomingMsg = (type, msg, obj, callback) => {

    // targetEasyrtcid
    if (msg.targetEasyrtcid !== undefined && (!_.isString(msg.targetEasyrtcid) || !obj.getOption("easyrtcidRegExp").test(msg.targetEasyrtcid))) {
        callback(null, false, "MSG_REJECT_TARGET_EASYRTCID");
        return;
    }
    // targetGroup
    if (msg.targetGroup !== undefined && (!_.isString(msg.targetGroup) || !obj.getOption("groupNameRegExp").test(msg.targetGroup))) {
        callback(null, false, "MSG_REJECT_TARGET_GROUP");
        return;
    }
    // targetRoom
    if (msg.targetRoom !== undefined && (!_.isString(msg.targetRoom) || !obj.getOption("roomNameRegExp").test(msg.targetRoom))) {
        callback(null, false, "MSG_REJECT_TARGET_ROOM");
        return;
    }

    // Incoming message syntactically valid
    callback(null, true, null);
};

/**
 * Checks an incoming EasyRTC message to determine if it is syntactically valid.
 *
 * @param       {string} type           The Socket.IO message type. Expected values are (easyrtcAuth|easyrtcCmd|easyrtcMsg)
 * @param       {Object} msg            Message object which contains the full message from a client; this can include the standard msgType and msgData fields.
 * @param       {function} getOption        EasyRTC application object. Contains methods used for identifying and managing an application.
 * @param       {function(?Error, boolean, string)} callback Callback with error, a boolean of whether message if valid, and a string indicating the error code if the message is invalid.
 */
easyrtc_utils.isValidIncomingMessage = function(type, msg, obj, callback) {

    // TODO use isValidIncomingMessageType
    // All messages follow the basic structure
    if (!_.isString(type)) {
        callback(null, false, "MSG_REJECT_BAD_TYPE");
        return;
    }
    if (!_.isObject(msg)) {
        callback(null, false, "MSG_REJECT_BAD_STRUCTURE");
        return;
    }
    if (!_.isString(msg.msgType)) {
        callback(null, false, "MSG_REJECT_BAD_TYPE");
        return;
    }

    if (!_.isObject(obj)) {
        callback(null, false, "MSG_REJECT_BAD_ARGUMENT");
        return;
    }

    switch (type) {
        case "easyrtcAuth":
            easyrtc_utils.isValidIncomingAuth(type, msg, obj, callback);
            return;

        case "easyrtcCmd":
            easyrtc_utils.isValidIncomingCmd(type, msg, obj, callback);
            return;

        case "easyrtcMsg":
            easyrtc_utils.isValidIncomingMsg(type, msg, obj, callback);
            return;

        default:
            callback(null, false, "MSG_REJECT_BAD_TYPE");
            return;
    }
};

/**
 * Performs a deep copy of an object, returning the duplicate.
 * Do not use on objects with circular references.
 *
 * @param       {Object} input          Input variable (or object) to be copied.
 * @returns     {Object}                New copy of variable.
 */
easyrtc_utils.deepCopy = function(input) {

    if (
        input === null || input === undefined ||
            typeof input !== "object" ||
                (input.constructor !== Object && input.constructor !== Array)
    ) {
        return input;
    }

    if (
        input.constructor === Boolean ||
            input.constructor === Date ||
                input.constructor === Function ||
                    input.constructor === Number ||
                        input.constructor === RegExp ||
                            input.constructor === String
    ) {
        return new input.constructor(input);
    }

    var copy;
    if (input instanceof Array) {
        copy = [];
        for (var i = 0, len = input.length; i < len; i++) {
            copy[i] = easyrtc_utils.deepCopy(input[i]);
        }
        return copy;
    }

    if (input instanceof Object) {
        copy = {};
        for (var key in input) {
            if (input.hasOwnProperty(key)) {
                copy[key] = easyrtc_utils.deepCopy(input[key]);
            }
        }
        return copy;
    }
    return null;
};
