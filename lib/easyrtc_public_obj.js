/* global module, require, console, process */

/**
 * Public interface for interacting with EasyRTC. Contains the public object returned by the EasyRTC listen() function.
 *
 * @module      easyrtc_public_obj
 * @author      Priologic Software, info@easyrtc.com
 * @copyright   Copyright 2016 Priologic Software. All rights reserved.
 * @license     BSD v2, see LICENSE file in module root folder.
 */

var events = require("events");
var async = require("async");
var _ = require("underscore");                // General utility functions external module
var g = require("./general_util");            // General utility functions local module

var e = require("./easyrtc_private_obj");     // EasyRTC private object
var eventListener = require("./easyrtc_default_event_listeners"); // EasyRTC default event listeners
var eu = require("./easyrtc_util");            // EasyRTC utility functions

/**
 * The public object which is returned by the EasyRTC listen() function. Contains all public methods for interacting with EasyRTC server.
 *
 * @class
 */
var pub = module.exports;

/**
 * Alias for Socket.io server object. Set during Listen().
 *
 * @member  {Object}    pub.socketServer
 * @example             <caption>Dump of all Socket.IO clients to server console</caption>
 * console.log(pub.socketServer.connected);
 */
pub.socketServer = null;


/**
 * Alias for Express app object. Set during Listen()
 *
 * @member  {Object}    pub.httpApp
 */
pub.httpApp = null;


/**
 * Sends an array of all application names to a callback.
 *
 * @param   {function(Error, Array.<string>)} callback Callback with error and array containing all application names.
 */
pub.getAppNames = function(callback) {
    var appNames = Object.keys(e.app);
    callback(null, appNames);
};


/**
 * Gets app object for application which has an authenticated client with a given easyrtcid
 *
 * @param       {String} easyrtcid      Unique identifier for an EasyRTC connection.
 * @param       {function(?Error, Object=)} callback Callback with error and application object
 */
pub.getAppWithEasyrtcid = function(easyrtcid, callback) {
    for (var appName in e.app) {
        if (e.app.hasOwnProperty(appName)) {
            if (
                e.app[appName].connection.hasOwnProperty(easyrtcid) && 
                    e.app[appName].connection[easyrtcid].isAuthenticated
            ) {
                pub.app(appName, callback);
                return;
            }
        }
    }
    pub.util.logWarning("Can not find connection [" + easyrtcid + "]");
    callback(new pub.util.ConnectionWarning("Can not find connection [" + easyrtcid + "]"));
};


/**
 * Sends the count of the number of connections to the server to a provided callback.
 *
 * @param       {function(?Error, Number)} callback Callback with error and array containing all easyrtcids.
 */
pub.getConnectionCount = function(callback) {
    callback(null, pub.getConnectionCountSync());
};


/**
 * Sends the count of the number of connections to the server to a provided callback.
 *
 * @returns     {Number} The current number of connections in a room.
 */
pub.getConnectionCountSync = function() {
    var connectionCount = 0;
    for (var appName in e.app) {
        if (e.app.hasOwnProperty(appName)) {
            connectionCount = connectionCount + _.size(e.app[appName].connection);
        }
    }
    return connectionCount;
};


/**
 * Gets connection object for connection which has an authenticated client with a given easyrtcid
 *
 * @param       {string} easyrtcid      EasyRTC unique identifier for a socket connection.
 * @param       {function(?Error, Object=)} callback Callback with error and connection object
 */
pub.getConnectionWithEasyrtcid = function(easyrtcid, callback) {
    for (var appName in e.app) {
        if (e.app.hasOwnProperty(appName)) {
            if (
                e.app[appName].connection.hasOwnProperty(easyrtcid) && 
                    e.app[appName].connection[easyrtcid].isAuthenticated
            ) {
                
                pub.app(appName, function(err, appObj) {
                    if (err) {
                        callback(err);
                        return;
                    }
                    appObj.connection(easyrtcid, callback);
                });
                return;
            }
        }
    }
    pub.util.logWarning("Can not find connection [" + easyrtcid + "]");
    callback(new pub.util.ConnectionWarning("Can not find connection [" + easyrtcid + "]"));
};


/**
 * Gets individual option value. The option value returned is for the server level.
 * 
 * Note that some options can be set at the application or room level. If an option has not been set at the room level, it will check to see if it has been set at the application level, if not it will revert to the server level.
 *
 * @param       {String}    optionName  Option name
 * @return      {*}                     Option value (can be any JSON type)
 */
pub.getOption = function(optionName) {
    if(typeof e.option[optionName] === "undefined") {
        pub.util.logError("Unknown option requested. Unrecognised option name '" + optionName + "'.");
        return null;
    }
    return e.option[optionName];
};


/**
 * Gets EasyRTC Version. The format is in a major.minor.patch format with an optional letter following denoting alpha or beta status. The version is retrieved from the package.json file located in the EasyRTC project root folder.
 *
 * @return      {string}                EasyRTC Version
 */
pub.getVersion = function() {
    return e.version;
};


/**
 * Returns the EasyRTC private object containing the current state. This should only be used for debugging purposes.
 *
 * @private
 * @return      {Object}                EasyRTC private object
 */
pub._getPrivateObj = function() {
    return e;
};


/**
 * Sets individual option. The option value set is for the server level.
 * 
 * Note that some options can be set at the application or room level. If an option has not been set at the room level, it will check to see if it has been set at the application level, if not it will revert to the server level.
 *
 * @param       {Object} optionName     Option name
 * @param       {Object} optionValue    Option value
 * @return      {Boolean}               true on success, false on failure
 */
pub.setOption = function(optionName, optionValue) {
    // Can only set options which currently exist
    if (e.option.hasOwnProperty(optionName)) {
        e.option[optionName] = pub.util.deepCopy(optionValue);
        return true;
    } else {
        pub.util.logError("Error setting option. Unrecognised option name '" + optionName + "'.");
        return false;
    }
};


/**
 * EasyRTC Event handling object which contain most methods for interacting with EasyRTC events. For convenience, this class has also been attached to the application, connection, session, and room classes.
 * @class
 */
pub.events = {};


/**
 * EasyRTC EventEmitter.
 * 
 * @private
 */
pub.events._eventListener = new events.EventEmitter();


/**
 * Expose event listener's emit function.
 * 
 * @param       {string} eventName      EasyRTC event name.
 * @param       {...*} eventParam       The event parameters
 */
pub.events.emit = pub.events._eventListener.emit.bind(pub.events._eventListener);


/**
 * Runs the default EasyRTC listener for a given event.
 * 
 * @param       {string} eventName      EasyRTC event name.
 * @param       {...*} eventParam       The event parameters
 */
pub.events.emitDefault = function() {
    if (!pub.events.defaultListeners[arguments['0']]) {
        console.error("Error emitting listener. No default for event '" + arguments['0'] + "' exists.");
        return;
    }
    pub.events.defaultListeners[Array.prototype.shift.call(arguments)].apply(this, arguments);
};


/**
 * Resets the listener for a given event to the default listener. Removes other listeners.
 *
 * @param       {string} eventName      EasyRTC event name.
 */
pub.events.setDefaultListener = function(eventName) {
    if (!_.isFunction(pub.events.defaultListeners[eventName])) {
        console.error("Error setting default listener. No default for event '" + eventName + "' exists.");
    }
    pub.events._eventListener.removeAllListeners(eventName);
    pub.events._eventListener.on(eventName, pub.events.defaultListeners[eventName]);
};


/**
 * Resets the listener for all EasyRTC events to the default listeners. Removes all other listeners.
 */
pub.events.setDefaultListeners = function() {
    pub.events._eventListener.removeAllListeners();
    for (var currentEventName in pub.events.defaultListeners) {
        if (_.isFunction(pub.events.defaultListeners[currentEventName])) {
            pub.events._eventListener.on(currentEventName, pub.events.defaultListeners[currentEventName]);
        } else {
            throw new pub.util.ServerError("Error setting default listener. No default for event '" + currentEventName + "' exists.");
        }
    }
};


/**
 * Map of EasyRTC event listener names to their default functions. This map can be used to run a default function manually.
 */
pub.events.defaultListeners = {
    "authenticate": eventListener.onAuthenticate,
    "authenticated": eventListener.onAuthenticated,
    "connection": eventListener.onConnection,
    "disconnect": eventListener.onDisconnect,
    "getIceConfig": eventListener.onGetIceConfig,
    "roomCreate": eventListener.onRoomCreate,
    "roomJoin": eventListener.onRoomJoin,
    "roomLeave": eventListener.onRoomLeave,
    "log": eventListener.onLog,
    "shutdown": eventListener.onShutdown,
    "startup": eventListener.onStartup,
    "easyrtcAuth": eventListener.onEasyrtcAuth,
    "easyrtcCmd": eventListener.onEasyrtcCmd,
    "easyrtcMsg": eventListener.onEasyrtcMsg,
    "emitEasyrtcCmd": eventListener.onEmitEasyrtcCmd,
    "emitEasyrtcMsg": eventListener.onEmitEasyrtcMsg,
    "emitError": eventListener.onEmitError,
    "emitReturnAck": eventListener.onEmitReturnAck,
    "emitReturnError": eventListener.onEmitReturnError,
    "emitReturnToken": eventListener.onEmitReturnToken,
    "msgTypeGetIceConfig": eventListener.onMsgTypeGetIceConfig,
    "msgTypeGetRoomList": eventListener.onMsgTypeGetRoomList,
    "msgTypeRoomJoin": eventListener.onMsgTypeRoomJoin,
    "msgTypeRoomLeave": eventListener.onMsgTypeRoomLeave,
    "msgTypeSetPresence": eventListener.onMsgTypeSetPresence,
    "msgTypeSetRoomApiField": eventListener.onMsgTypeSetRoomApiField
};


/**
 * Sets listener for a given EasyRTC event. Only one listener is allowed per event. Any other listeners for an event are removed before adding the new one. See the events documentation for expected listener parameters.
 *
 * @param       {string} eventName      Listener name.
 * @param       {function} listener     Function to be called when listener is fired
 */
pub.events.on = function(eventName, listener) {
    if (eventName && _.isFunction(listener)) {
        pub.events._eventListener.removeAllListeners(eventName);
        pub.events._eventListener.on(eventName, listener);
    }
    else {
        pub.util.logError("Unable to add listener to event '" + eventName + "'");
    }
};


/**
 * Removes all listeners for an event. If there is a default EasyRTC listener, it will be added. If eventName is `null`, all events will be removed than the defaults will be restored.
 *
 * @param       {?string} eventName     Listener name. If `null`, then all events will be removed.
 */
pub.events.removeAllListeners = function(eventName) {
    if (eventName) {
        pub.events.setDefaultListener(eventName);
    } else {
        pub.events.setDefaultListeners();
    }
};


/**
 * General utility functions are grouped in this util object.  For convenience, this class has also been attached to the application, connection, session, and room classes.
 * @class
 */
pub.util = {};


/**
 * Performs a deep copy of an object, returning the duplicate.
 * Do not use on objects with circular references.
 *
 * @function
 * @param       {Object} input          Input variable (or object) to be copied.
 * @returns     {Object}                New copy of variable.
 */
pub.util.deepCopy = g.deepCopy;


/**
 * An empty dummy function, which is designed to be used as a default callback in functions when none has been provided.
 *
 * @param       {Error} err             Error object
 */
pub.util.nextToNowhere = function(err) {
};

/**
 * Determines if an Error object is an instance of ApplicationError, ConnectionError, or ServerError. If it is, it will return true.
 *
 * @function
 * @param       {*|Error}               Will accept any value, but will only return true for appropriate error objects.
 * @return      {Boolean}
 */
pub.util.isError = eu.isError;


/**
 * Determines if an Error object is an instance of ApplicationWarning, ConnectionWarning, or ServerWarning. If it is, it will return true.
 *
 * @function
 * @param       {*|Error}               Will accept any value, but will only return true for appropriate error objects.
 * @return      {Boolean}
 */
pub.util.isWarning = eu.isWarning;


/**
 * Custom Error Object for EasyRTC Application Errors.
 *
 * @extends     Error
 * @param       {string} msg            Text message describing the error.
 * @returns     {Error}
 */
pub.util.ApplicationError = eu.ApplicationError;


/**
 * Custom Error Object for EasyRTC Application Warnings.
 *
 * @extends     Error
 * @param       {string} msg            Text message describing the error.
 * @returns     {Error}
 */
pub.util.ApplicationWarning = eu.ApplicationWarning;


/**
 * Custom Error Object for EasyRTC C Errors.
 *
 * @function
 * @extends     Error
 * @param       {string} msg            Text message describing the error.
 * @returns     {Error}
 */
pub.util.ConnectionError = eu.ConnectionError;

/**
 * Custom Error Object for EasyRTC Connection Warnings.
 *
 * @function
 * @extends     Error
 * @param       {string} msg            Text message describing the error.
 * @returns     {Error}
 */
pub.util.ConnectionWarning = eu.ConnectionWarning;


/**
 * Custom Error Object for EasyRTC Server Errors.
 *
 * @function
 * @extends     Error
 * @param       {string} msg            Text message describing the error.
 * @returns     {Error}
 */
pub.util.ServerError = eu.ServerError;


/**
 * Custom Error Object for EasyRTC Server Warnings.
 *
 * @function
 * @extends     Error
 * @param       {string} msg            Text message describing the error.
 * @returns     {Error}
 */
pub.util.ServerWarning = eu.ServerWarning;


/**
 * Returns a random available easyrtcid.
 *
 * @function
 * @return  {String} Available easyrtcid. A unique identifier for an EasyRTC connection.
 */
pub.util.getAvailableEasyrtcid = eu.getAvailableEasyrtcid;


/**
 * Returns an EasyRTC message error object for a specific error code. This is meant to be emitted or returned to a websocket client.
 *
 * @param       {String} errorCode      EasyRTC error code associated with an error.
 * @return      {Object}                EasyRTC message error object for the specific error code.
 */
pub.util.getErrorMsg = function(errorCode) {
    var msg = {
        msgType: "error",
        serverTime: Date.now(),
        msgData: {
            errorCode: errorCode,
            errorText: pub.util.getErrorText(errorCode)
        }
    };

    if (!msg.msgData.errorText) {
        msg.msgData.errorText = "Error occurred with error code: " + errorCode;
        pub.util.logWarning("Emitted unknown error with error code [" + errorCode + "]");
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
pub.util.getErrorText = function(errorCode) {
    if (errorCodesToMessages.hasOwnProperty(errorCode)) {
        return errorCodesToMessages[errorCode];
    } else {
        pub.util.logWarning("Unknown message errorCode requested [" + errorCode + "]");
        return null;
    }
};

/**
 * General logging function which emits a log event so long as the log level has a severity equal or greater than e.option.logLevel
 *
 * @param       {string} level          Log severity level. Can be ("debug"|"info"|"warning"|"error")
 * @param       {string} logText        Text for log.
 * @param       {?*} [logFields]        Simple JSON object which contains extra fields to be logged.
 */
pub.util.log = function(level, logText, logFields) {
    switch (e.option.logLevel) {
        case "error":
            if (level !== "error") {
                break;
            }
        case "warning":
            if (level === "info") {
                break;
            }
        case "info":
            if (level === "debug") {
                break;
            }
        case "debug":
            pub.events.emit("log", level, logText, logFields);
            break;
    }
};


/**
 * Convenience function for logging "debug" level items.
 *
 * @param       {string} logText        Text for log.
 * @param       {?*} [logFields]        Simple JSON object which contains extra fields to be logged.
 */
pub.util.logDebug = function(logText, logFields) {
    pub.util.log("debug", logText, logFields);
};


/**
 * Convenience function for logging "info" level items.
 *
 * @param       {string} logText        Text for log.
 * @param       {?*} [logFields]        Simple JSON object which contains extra fields to be logged.
 */
pub.util.logInfo = function(logText, logFields) {
    pub.util.log("info", logText, logFields);
};


/**
 * Convenience function for logging "warning" level items.
 *
 * @param       {string} logText        Text for log.
 * @param       {?*} [logFields]        Simple JSON object which contains extra fields to be logged.
 */
pub.util.logWarning = function(logText, logFields) {
    pub.util.log("warning", logText, logFields);
};


/**
 * Convenience function for logging "error" level items.
 *
 * @param       {string} logText        Text for log.
 * @param       {?*} [logFields]        Simple JSON object which contains extra fields to be logged.
 */
pub.util.logError = function(logText, logFields) {
    pub.util.log("error", logText, logFields);
};


/**
 * Sends an 'ack' socket message to a given socketCallback. Provides additional checking and logging.
 *
 * @param       {string}    easyrtcid   EasyRTC unique identifier for a socket connection.
 * @param       {Function}  socketCallback Socket.io callback function
 * @param       {?Object}   appObj      EasyRTC application object. Contains methods used for identifying and managing an application.
 */
pub.util.sendSocketCallbackAck = function(easyrtcid, socketCallback, appObj) {
    return pub.util.sendSocketCallbackMsg(easyrtcid, socketCallback, {"msgType":"ack"}, appObj);
};


/**
 * Sends a complete socket message to a given socketCallback. Provides additional checking and logging.
 *
 * @param       {string}    easyrtcid   EasyRTC unique identifier for a socket connection.
 * @param       {Function}  socketCallback Socket.io callback function
 * @param       {Object}    msg         Message object which contains the full message for a client; this can include the standard msgType and msgData fields.
 * @param       {?Object}   appObj      EasyRTC application object. Contains methods used for identifying and managing an application.
 */
pub.util.sendSocketCallbackMsg = function(easyrtcid, socketCallback, msg, appObj) {
    var appName;

    if (appObj) {
        appName = appObj.getAppName();
        if (!appObj.isConnectedSync(easyrtcid)) {
            pub.util.logDebug("["+appName+"]["+easyrtcid+"] Unable to return socket message. Peer no longer connected.");
            return false;
        }
    }

    if (!_.isFunction(socketCallback)) {
        pub.util.logWarning("["+appName+"]["+easyrtcid+"] Unable to return socket message. Provided socketCallback was not a function.");
        return false;
    }

    try {
        socketCallback(msg);
    } catch(err) {
        pub.util.logWarning("["+appName+"]["+easyrtcid+"] Unable to return socket message. Call to socketCallback failed.");
    }

    if (e.option.logMessagesEnable) {
        try {
            pub.util.logDebug("["+appName+"]["+easyrtcid+"] Returning socket.io message: ["+JSON.stringify(msg)+"]");
        }
        catch(err) {
            pub.util.logDebug("["+appName+"]["+easyrtcid+"] Returning socket.io message");
        }
    }
    return true;
};

/**
 *  Checks with EasyRTC site for latest version. Writes to the log if a version can be found. If connection cannot be established than no error will be shown.
 */
pub.util.updateCheck = function() {
    var easyrtcVersion = pub.getVersion();

    require("http").get("http://easyrtc.com/version/?app=easyrtc&ver=" + easyrtcVersion + "&platform=" + process.platform + "&nodever=" + process.version, function(res) {
        if (res.statusCode === 200) {
            res.on('data', function(latestVersion) {
                latestVersion = (latestVersion + "").replace(/[^0-9a-z.]/g, "");
                if (latestVersion !== easyrtcVersion) {
                    var l = latestVersion.replace(/[^0-9.]/g, "").split(".", 3);
                    l[0] = parseInt(l[0]);
                    l[1] = parseInt(l[1]);
                    l[2] = parseInt(l[2]);
                    var v = easyrtcVersion.replace(/[^0-9.]/g, "").split(".", 3);
                    v[0] = parseInt(v[0]);
                    v[1] = parseInt(v[1]);
                    v[2] = parseInt(v[2]);
                    if (v[0] < l[0] || (v[0] === l[0] && v[1] < l[1]) || (v[0] === l[0] && v[1] === l[1] && v[2] < l[2])) {
                        pub.util.logWarning("Update Check: New version of EasyRTC is available (" + latestVersion + "). Visit http://easyrtc.com/ for details or run 'npm update' to upgrade.");
                    }
                    else if (v[0] === l[0] && v[1] === l[1] && v[2] === l[2] && easyrtcVersion.replace(/[^a-z]/gi, "") !== "") {
                        pub.util.logWarning("Update Check: New non-beta version of EasyRTC is available (" + latestVersion + "). Visit http://easyrtc.com/ for details.");
                    }
                }
            });
        }
    }).on('error', function(e) {
        //
    });
};


/**
 * Checks an incoming EasyRTC message to determine if it is syntactically valid.
 *
 * @param       {string} type           The Socket.IO message type. Expected values are (easyrtcAuth|easyrtcCmd|easyrtcMsg)
 * @param       {Object} msg            Message object which contains the full message from a client; this can include the standard msgType and msgData fields.
 * @param       {?Object} appObj        EasyRTC application object. Contains methods used for identifying and managing an application.
 * @param       {function(?Error, boolean, string)} callback Callback with error, a boolean of whether message if valid, and a string indicating the error code if the message is invalid.
 */
pub.util.isValidIncomingMessage = function(type, msg, appObj, callback) {
    // A generic getOption variable which points to the getOption function at either the top or application level
    var getOption = (_.isObject(appObj) ? appObj.getOption : pub.getOption);

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

    switch (type) {
        case "easyrtcAuth":
            if (msg.msgType !== "authenticate") {
                callback(null, false, "MSG_REJECT_BAD_TYPE");
                return;
            }
            if (!_.isObject(msg.msgData)) {
                callback(null, false, "MSG_REJECT_BAD_DATA");
                return;
            }

            // msgData.apiVersion (required)
            if (msg.msgData.apiVersion === undefined || !_.isString(msg.msgData.apiVersion) || !getOption("apiVersionRegExp").test(msg.msgData.apiVersion)) {
                callback(null, false, "MSG_REJECT_BAD_STRUCTURE");
                return;
            }

            // msgData.appName
            if (msg.msgData.applicationName !== undefined && (!_.isString(msg.msgData.applicationName) || !getOption("appNameRegExp").test(msg.msgData.applicationName))) {
                callback(null, false, "MSG_REJECT_BAD_STRUCTURE");
                return;
            }

            // msgData.easyrtcsid
            if (msg.msgData.easyrtcsid !== undefined && (!_.isString(msg.msgData.easyrtcsid) || !getOption("easyrtcsidRegExp").test(msg.msgData.easyrtcsid))) {
                callback(null, false, "MSG_REJECT_BAD_STRUCTURE");
                return;
            }

            var isCallbackRun = false;
            async.waterfall([
                function(asyncCallback) {
                    if (!appObj) {
                        pub.app((msg.msgData.applicationName !== undefined ? msg.msgData.applicationName : getOption("appDefaultName")), function(err, newAppObj) {
                            if (!err) {
                                appObj = newAppObj;
                                getOption = appObj.getOption;
                            }
                            asyncCallback(null);
                        });
                    }
                    else {
                        asyncCallback(null);
                    }
                },
                function(asyncCallback) {
                    // msgData.username
                    if (msg.msgData.username !== undefined && (!_.isString(msg.msgData.username) || !getOption("usernameRegExp").test(msg.msgData.username))) {
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
                                    !getOption("roomNameRegExp").test(currentRoomName) || 
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
                        if (msg.msgData.setPresence.show !== undefined && (!_.isString(msg.msgData.setPresence.show) || !getOption("presenceShowRegExp").test(msg.msgData.setPresence.show))) {
                            callback(null, false, "MSG_REJECT_BAD_STRUCTURE");
                            isCallbackRun = true;
                            return;
                        }
                        if (msg.msgData.setPresence.status !== undefined && (!_.isString(msg.msgData.setPresence.status) || !getOption("presenceStatusRegExp").test(msg.msgData.setPresence.status))) {
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

            return;
        break;

        case "easyrtcCmd":
            switch (msg.msgType) {
                case "candidate" :
                case "offer" :
                case "answer" :
                    // candidate, offer, and answer each require a non-empty msgData object and a proper targetEasyrtcid
                    if (!_.isObject(msg.msgData) || _.isEmpty(msg.msgData)) {
                        callback(null, false, "MSG_REJECT_BAD_DATA");
                        return;
                    }
                    if (!_.isString(msg.targetEasyrtcid) || !getOption("easyrtcidRegExp").test(msg.targetEasyrtcid)) {
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
                    if (!_.isString(msg.targetEasyrtcid) || !getOption("easyrtcidRegExp").test(msg.targetEasyrtcid)) {
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
                                !getOption("roomNameRegExp").test(joinRoomName) || 
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
                                !getOption("roomNameRegExp").test(leaveRoomName) ||   
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
                    if (msg.msgData.setPresence.show !== undefined && (!_.isString(msg.msgData.setPresence.show) || !getOption("presenceShowRegExp").test(msg.msgData.setPresence.show))) {
                        callback(null, false, "MSG_REJECT_BAD_STRUCTURE");
                        return;
                    }
                    if (msg.msgData.setPresence.status !== undefined && (!_.isString(msg.msgData.setPresence.status) || !getOption("presenceStatusRegExp").test(msg.msgData.setPresence.status))) {
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
                    if (!_.isString(msg.msgData.setRoomApiField.roomName) || !getOption("roomNameRegExp").test(msg.msgData.setRoomApiField.roomName)) {
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

            break;

        case "easyrtcMsg":
            // targetEasyrtcid
            if (msg.targetEasyrtcid !== undefined && (!_.isString(msg.targetEasyrtcid) || !getOption("easyrtcidRegExp").test(msg.targetEasyrtcid))) {
                callback(null, false, "MSG_REJECT_TARGET_EASYRTCID");
                return;
            }
            // targetGroup
            if (msg.targetGroup !== undefined && (!_.isString(msg.targetGroup) || !getOption("groupNameRegExp").test(msg.targetGroup))) {
                callback(null, false, "MSG_REJECT_TARGET_GROUP");
                return;
            }
            // targetRoom
            if (msg.targetRoom !== undefined && (!_.isString(msg.targetRoom) || !getOption("roomNameRegExp").test(msg.targetRoom))) {
                callback(null, false, "MSG_REJECT_TARGET_ROOM");
                return;
            }
            break;

        default:
            callback(null, false, "MSG_REJECT_BAD_TYPE");
            return;
    }

    // Incoming message syntactically valid
    callback(null, true, null);
};


/**
 * Will attempt to deliver an EasyRTC session id via a cookie. Requires that session management be enabled from within Express.
 *
 * @param       {Object} req            Http request object
 * @param       {Object} res            Http result object
 */
pub.util.sendSessionCookie = function(req, res) {
    // If sessions or session cookies are disabled, return without an error.
    if (!pub.getOption("sessionEnable") || !pub.getOption("sessionCookieEnable")) {
        return;
    }
    if (req.sessionID && (!req.cookies || !req.cookies["easyrtcsid"] || req.cookies["easyrtcsid"] !== req.sessionID)) {
        try {
            pub.util.logDebug("Sending easyrtcsid cookie [" + req.sessionID + "] to [" + req.ip + "] for request [" + req.url + "]");
            res.cookie("easyrtcsid", req.sessionID, {maxAge: 2592000000, httpOnly: false});
        } catch (e) {
            pub.util.logWarning("Problem setting easyrtcsid cookie [" + req.sessionID + "] to [" + req.ip + "] for request [" + req.url + "]");
        }
    }
};


/**
 * Determine if a given application name has been defined.
 *
 * @param       {string} appName        Application name which uniquely identifies it on the server.
 * @param       {function(?Error, boolean)} callback Callback with error and boolean of whether application is defined.
 */
pub.isApp = function(appName, callback) {
    callback(null, (e.app[appName] ? true : false));
};


/**
 * Creates a new EasyRTC application with default values. If a callback is provided, it will receive the new application object.
 *
 * The callback may receive an Error object if unsuccessful. Depending on the severity, known errors have an "instanceof" ApplicationWarning or ApplicationError.
 *
 * @param       {string} appName        Application name which uniquely identifies it on the server.
 * @param       {?object} options       Options object with options to apply to the application. May be null.
 * @param       {appCallback} [callback] Callback with error and application object
 */
pub.createApp = function(appName, options, callback) {
    if (!_.isFunction(callback)) {
        callback = function(err, appObj) {
        };
    }
    if (!appName || !pub.getOption("appNameRegExp").test(appName)) {
        pub.util.logWarning("Can not create application with improper name: '" + appName + "'");
        callback(new pub.util.ApplicationWarning("Can not create application with improper name: '" + appName + "'"));
        return;
    }
    if (e.app[appName]) {
        pub.util.logWarning("Can not create application which already exists: '" + appName + "'");
        callback(new pub.util.ApplicationWarning("Can not create application which already exists: '" + appName + "'"));
        return;
    }
    if (!_.isObject(options)) {
        options = {};
    }

    pub.util.logDebug("Creating application: '" + appName + "'");

    e.app[appName] = {
        appName: appName,
        connection: {},
        field: {},
        group: {},
        option: {},
        room: {},
        session: {}
    };

    // Get the new app object
    pub.app(appName, function(err, appObj) {
        if (err) {
            callback(err);
            return;
        }

        // Set all options in options object. If any fail, an error will be sent to the callback.
        async.each(Object.keys(options), function(currentOptionName, asyncCallback) {
            appObj.setOption(currentOptionName, options[currentOptionName]);
            asyncCallback(null);
        },
                function(err) {
                    if (err) {
                        callback(new pub.util.ApplicationError("Could not set options when creating application: '" + appName + "'", err));
                        return;
                    }
                    // Set default application fields
                    var appDefaultFieldObj = appObj.getOption("appDefaultFieldObj");
                    if (_.isObject(appDefaultFieldObj)) {
                        for (var currentFieldName in appDefaultFieldObj) {
                            if (appDefaultFieldObj.hasOwnProperty(currentFieldName)) {
                                appObj.setField(
                                        currentFieldName,
                                        appDefaultFieldObj[currentFieldName].fieldValue,
                                        appDefaultFieldObj[currentFieldName].fieldOption,
                                        null
                                        );   
                            }
                        }
                    }

                    if (appObj.getOption("roomDefaultEnable")) {
                        pub.events.emit("roomCreate", appObj, null, appObj.getOption("roomDefaultName"), null, function(err, roomObj) {
                            if (err) {
                                callback(err);
                                return;
                            }
                            // Return app object to callback
                            callback(null, appObj);
                        });
                    }
                    else {
                        // Return app object to callback
                        callback(null, appObj);
                    }
                });
    });
};


/**
 * Contains the methods for interfacing with an EasyRTC application.
 *
 * The callback will receive an application object upon successful retrieval of application.
 *
 * The callback may receive an Error object if unsuccessful. Depending on the severity, known errors have an "instanceof" ApplicationWarning or ApplicationError.
 *
 * The function does return an application object which is useful for chaining, however the callback approach is safer and provides additional information in the event of an error.
 *
 * @param       {?string} appName        Application name which uniquely identifies it on the server. Uses default application if null.
 * @param       {appCallback} [callback] Callback with error and application object
 */
pub.app = function(appName, callback) {

    /**
     * The primary method for interfacing with an EasyRTC application.
     *
     * @class       appObj
     * @memberof    pub
     */
    var appObj = {};
    if (!appName) {
        appName = pub.getOption("appDefaultName");
    }
    if (!_.isFunction(callback)) {
        callback = function(err, appObj) {
        };
    }
    if (!e.app[appName]) {
        pub.util.logDebug("Attempt to request non-existent application name: '" + appName + "'");
        callback(new pub.util.ApplicationWarning("Attempt to request non-existent application name: '" + appName + "'"));
        return;
    }


    /**
     * Expose all event functions
     * 
     * @memberof    pub.appObj
     */
    appObj.events = pub.events;


    /**
     * Expose all utility functions
     * 
     * @memberof    pub.appObj
     */
    appObj.util = pub.util;


    /**
     * Returns the application name for the application. Note that unlike most EasyRTC functions, this returns a value and does not use a callback.
     *
     * @memberof    pub.appObj
     * @return      {string}    The application name.
     */
    appObj.getAppName = function() {
        return appName;
    };


    /**
     * Sends the count of the number of connections in the app to a provided callback.
     *
     * @memberof    pub.appObj
     * @param       {function(?Error, Number)} callback Callback with error and array containing all easyrtcids.
     */
    appObj.getConnectionCount = function(callback) {
        callback(null, appObj.getConnectionCountSync());
    };


    /**
     * Sends the count of the number of connections in the app to a provided callback.
     *
     * @memberof    pub.appObj
     * @returns     {Number} The current number of connections in a room.
     */
    appObj.getConnectionCountSync = function() {
        return _.size(e.app[appName].connection);
    };


    /**
     * Returns an array of all easyrtcids connected to the application
     *
     * @memberof    pub.appObj
     * @param       {function(?Error, Array.<string>)} callback Callback with error and array of easyrtcids.
     */
    appObj.getConnectionEasyrtcids = function(callback) {
        var easyrtcids = Object.keys(e.app[appName].connection);
        callback(null, easyrtcids);
    };


    /**
     * Returns an array of all easyrtcids connected to the application associated with a given username
     *
     * @memberof    pub.appObj
     * @param       {string}   username Username to search for.
     * @param       {function(?Error, Array.<string>)} callback Callback with error and array of easyrtcids.
     */
    appObj.getConnectedEasyrtcidsWithUsername = function(username, callback) {
        var easyrtcids = [];

        for (var currentEasyrtcid in e.app[appName].connection) {
            if (!e.app[appName].connection.hasOwnProperty(currentEasyrtcid)) {
                continue;
            }
            if (e.app[appName].connection[currentEasyrtcid].username === username){
                easyrtcids.push(currentEasyrtcid);
            }
        }

        callback(null, easyrtcids);
    };

    /**
     * Returns an array of all easyrtcids connected to the application associated with a given username
     *
     * @memberof    pub.appObj
     * @param       {string}   username Username to search for.
     * @returns     {Array.<string>} array of easyrtcids.
     */
    appObj.getConnectedEasyrtcidsWithUsernameSync = function(username) {
        var easyrtcids = [];

        for (var currentEasyrtcid in e.app[appName].connection) {
            if (!e.app[appName].connection.hasOwnProperty(currentEasyrtcid)) {
                continue;
            }
            if (e.app[appName].connection[currentEasyrtcid].username === username){
                easyrtcids.push(currentEasyrtcid);
            }
        }

        return easyrtcids;
    };


    /**
     * Returns application level field object for a given field name to a provided callback.
     *
     * @memberof    pub.appObj
     * @param       {string}        fieldName   Field name
     * @param       {function(?Error, Object=)} callback Callback with error and field object (any type)
     */
    appObj.getField = function(fieldName, callback) {
        if (!e.app[appName].field[fieldName]) {
            pub.util.logDebug("Can not find app field: '" + fieldName + "'");
            callback(new pub.util.ApplicationWarning("Can not find app field: '" + fieldName + "'"));
            return;
        }
        callback(null, pub.util.deepCopy(e.app[appName].field[fieldName]));
    };


    /**
     * Returns application level field object for a given field name. If the field is not set, it will return a field object will a null field value.  This is a synchronous function, thus may not be available in custom cases where state is not kept in memory.
     *
     * @memberof    pub.appObj
     * @param       {string}        fieldName   Field name
     * @returns     {Object}        Field object
     */
    appObj.getFieldSync = function(fieldName) {
        if (!e.app[appName].field[fieldName]) {
            return {"fieldName": fieldName, "fieldOption": {}, "fieldValue": null};
        }
        return pub.util.deepCopy(e.app[appName].field[fieldName]);
    };


    /**
     * Returns application level field value for a given field name. If the field is not set, it will return a null field value.  This is a synchronous function, thus may not be available in custom cases where state is not kept in memory.
     *
     * @memberof    pub.appObj
     * @param       {string}        fieldName   Field name
     * @returns     {?*}            Field value. Can be any JSON object.
     */
    appObj.getFieldValueSync = function(fieldName) {
        if (!e.app[appName].field[fieldName]) {
            return null;
        }
        return pub.util.deepCopy(e.app[appName].field[fieldName].fieldValue);
    };


    /**
     * Returns an object containing all field names and values within the application. Can be limited to fields with isShared option set to true.
     *
     * @memberof    pub.appObj
     * @param       {boolean}   limitToIsShared Limits returned fields to those which have the isShared option set to true.
     * @param       {function(?Error, Object=)} callback Callback with error and object containing field names and values.
     */
    appObj.getFields = function(limitToIsShared, callback) {
        var fieldObj = {};
        for (var fieldName in e.app[appName].field) {
            if (!limitToIsShared || e.app[appName].field[fieldName].fieldOption.isShared) {
                fieldObj[fieldName] = {
                    fieldName: fieldName,
                    fieldValue: pub.util.deepCopy(e.app[appName].field[fieldName].fieldValue)
                };
            }
        }
        callback(null, fieldObj);
    };


    /**
     * Returns an array of all group names within the application
     *
     * @memberof    pub.appObj
     * @param       {function(?Error, Array.<string>)} callback Callback with error and array of group names.
     */
    appObj.getGroupNames = function(callback) {
        var groupNames = Object.keys(e.app[appName].group);
        callback(null, groupNames);
    };


    /**
     * Gets individual option value. Will first check if option is defined for the application, else it will revert to the global level option.
     *
     * @memberof    pub.appObj
     * @param       {String}    optionName  Option name
     * @return      {*}                     Option value (can be any JSON type)
     */
    appObj.getOption = function(optionName) {
        if (e.app[appName].option.hasOwnProperty(optionName)) {
            return e.app[appName].option[optionName];
        } else {
            return pub.getOption(optionName);
        }
    };


    /**
     * Returns an array of all room names within the application.
     *
     * @memberof    pub.appObj
     * @param       {function(?Error, Array.<string>)} callback Callback with error and array of room names.
     */
    appObj.getRoomNames = function(callback) {
        var roomNames = Object.keys(e.app[appName].room);
        callback(null, roomNames);
    };


    /**
     * Returns an array of all easyrtcsids within the application
     *
     * @memberof    pub.appObj
     * @param       {function(?Error, Array.<string>)} callback Callback with error and array containing easyrtcsids.
     */
    appObj.getEasyrtcsids = function(callback) {
        var easyrtcsids = Object.keys(e.app[appName].session);
        callback(null, easyrtcsids);
    };

    /**
     * Returns an array of all easyrtcsids within the application. Old SessionKey name kept for transition purposes. Use getEasyrtcsid();
     *
     * @memberof    pub.appObj
     * @ignore
     */
    appObj.getSessionKeys = appObj.getEasyrtcsids;


    /**
     * Gets connection status for a connection. It is possible for a connection to be considered connected without being authenticated.
     *
     * @memberof    pub.appObj
     * @param       {string}    easyrtcid   EasyRTC unique identifier for a socket connection.
     * @param       {function(?Error, Boolean)} callback Callback with error and a boolean indicating if easyrtcid is connected.
     */
    appObj.isConnected = function(easyrtcid, callback) {
        var isConnected = e.app.hasOwnProperty(appName) && 
                e.app[appName].hasOwnProperty('connection') && 
                    e.app[appName].connection.hasOwnProperty(easyrtcid);

        callback(null, isConnected);
    };


    /**
     * Gets connection status for a connection. It is possible for a connection to be considered connected without being authenticated. Synchronous function.
     *
     * @memberof    pub.appObj
     * @param       {string}    easyrtcid   EasyRTC unique identifier for a socket connection.
     * @returns     {boolean}
     */
    appObj.isConnectedSync = function(easyrtcid) {
        if (e.app[appName] && e.app[appName].connection && e.app[appName].connection[easyrtcid]) {
            return true;
        } else {
            return false;
        }
    };


    /**
     * Sets individual option. Set value to NULL to delete the option (thus reverting to global option).
     *
     * @memberof    pub.appObj
     * @param       {String}    optionName  Option name
     * @param       {?*}        optionValue Option value
     * @return      {Boolean}               true on success, false on failure
     */
    appObj.setOption = function(optionName, optionValue) {

        // Can only set options which currently exist
        if (e.option.hasOwnProperty(optionName)) {

            // If value is null, delete option from application (reverts to global option)
            if (optionValue === null || optionValue === undefined) {
                if (e.app[appName].option.hasOwnProperty(optionName)) {
                    delete e.app[appName].option[optionName];
                }
            } else {
                // Set the option value to be a full deep copy, thus preserving private nature of the private EasyRTC object.
                e.app[appName].option[optionName] = pub.util.deepCopy(optionValue);
            }

            return true;
        } else {
            pub.util.logError("Error setting option. Unrecognised option name '" + optionName + "'.");
            return false;
        }
        return true;
    };


    /**
     * Sets application field value for a given field name.
     *
     * @memberof    pub.appObj
     * @param       {string}    fieldName       Must be formatted according to "fieldNameRegExp" option.
     * @param       {Object}    fieldValue
     * @param       {?Object}   fieldOption     Field options (such as isShared which defaults to false)
     * @param       {nextCallback} [next]       A success callback of form next(err).
     */
    appObj.setField = function(fieldName, fieldValue, fieldOption, next) {
        pub.util.logDebug("[" + appName + "] Setting field [" + fieldName + "]", fieldValue);
        if (!_.isFunction(next)) {
            next = pub.util.nextToNowhere;
        }

        if (!pub.getOption("fieldNameRegExp").test(fieldName)) {
            pub.util.logWarning("Can not create application field with improper name: '" + fieldName + "'");
            next(new pub.util.ApplicationWarning("Can not create application field with improper name: '" + fieldName + "'"));
            return;
        }
        e.app[appName].field[fieldName] = {
            fieldName: fieldName,
            fieldValue: fieldValue,
            fieldOption: {isShared: ((_.isObject(fieldOption) && fieldOption.isShared) ? true : false)}
        };

        next(null);
    };


    /**
     * Gets connection object for a given connection key. Returns null if connection not found.
     * The returned connection object includes functions for managing connection fields.
     *
     * @memberof    pub.appObj
     * @param       {string}    easyrtcid   EasyRTC unique identifier for a socket connection.
     * @param       {connectionCallback} callback Callback with error and object containing EasyRTC connection object.
     */
    appObj.connection = function(easyrtcid, callback) {
        if (!e.app[appName].connection[easyrtcid]) {
            pub.util.logWarning("Attempt to request non-existent connection key: '" + easyrtcid + "'");
            callback(new pub.util.ConnectionWarning("Attempt to request non-existent connection key: '" + easyrtcid + "'"));
            return;
        }

        if (!pub.socketServer) {
            pub.util.logError("Socket server undefined.");
            callback(new pub.util.ConnectionWarning("Attempt to request non-existent socket: '" + easyrtcid + "'"));
            return;
        }

        var socketId = e.app[appName].connection[easyrtcid].socketId;

        if (pub.socketServer.sockets.connected) {
            if (!pub.socketServer.sockets.connected[socketId] || pub.socketServer.sockets.connected[socketId].disconnected) {
                pub.util.logWarning("["+easyrtcid+"] Attempt to request non-existent socket: '" + socketId + "'");
                callback(new pub.util.ConnectionWarning("Attempt to request non-existent socket: '" + socketId + "'"));
                return;
            }

            if (pub.socketServer.sockets.connected[socketId].disconnected) {
                pub.util.logWarning("["+easyrtcid+"] Attempt to request disconnected socket: '" + socketId + "'");
                callback(new pub.util.ConnectionWarning("Attempt to request disconnected socket: '" + socketId + "'"));
                return;
            }
        }
        else {
            if (!pub.socketServer.sockets.sockets[socketId] || pub.socketServer.sockets.sockets[socketId].disconnected) {
                pub.util.logWarning("["+easyrtcid+"] Attempt to request non-existent socket: '" + socketId + "'");
                callback(new pub.util.ConnectionWarning("Attempt to request non-existent socket: '" + socketId + "'"));
                return;
            }

            if (pub.socketServer.sockets.sockets[socketId].disconnected) {
                pub.util.logWarning("["+easyrtcid+"] Attempt to request disconnected socket: '" + socketId + "'");
                callback(new pub.util.ConnectionWarning("Attempt to request disconnected socket: '" + socketId + "'"));
                return;
            }
        }


        /**
         * @class       connectionObj
         * @memberof    pub.appObj
         */
        var connectionObj = {};

        // House the local session object
        var _sessionObj;

        /**
         * Expose all event functions
         * 
         * @memberof    pub.appObj.connectionObj
         */
        connectionObj.events = pub.events;


        /**
         * Expose all utility functions
         * 
         * @memberof    pub.appObj.connectionObj
         */
        connectionObj.util = pub.util;


        /**
         * Reference to connection's socket.io object. See http://socket.io/ for more information.
         *
         * @memberof    pub.appObj.connectionObj
         */
        if (pub.socketServer.sockets.connected) {
            connectionObj.socket = pub.socketServer.sockets.connected[socketId];
        }
        else {
            connectionObj.socket = pub.socketServer.sockets.sockets[socketId];
        }

        /**
         * Disconnects and removes a connection gracefully, by first informing them to leave any rooms they are in and hangup any
         * WebRTC peer connections.
         *
         * @param       {nextCallback} next     A success callback of form next(err).
         */
        connectionObj.disconnect = function(next) {
            eventListener.stopStillAliveTimer(connectionObj);
            async.waterfall([
                function(asyncCallback) {
                    // Get array of rooms
                    connectionObj.getRoomNames(asyncCallback);
                },
                function(roomNames, asyncCallback) {
                    // leave all rooms
                    async.each(roomNames,
                        function(currentRoomName, asyncEachCallback) {
                            pub.events.emit("roomLeave", connectionObj, currentRoomName, function(err) {asyncEachCallback(null);});
                        },
                        function(err) {
                            asyncCallback(null);
                        }
                    );
                },
                function(asyncCallback) {
                    // log all connections as ended
                    pub.util.logDebug("["+connectionObj.getAppName()+"]["+connectionObj.getEasyrtcid()+"] Disconnected");
                    connectionObj.removeConnection(asyncCallback);
                }
            ], function(err) {
                next(null);
            });
        };

        /**
         * Returns the application object to which the connection belongs. Note that unlike most EasyRTC functions, this returns a value and does not use a callback.
         *
         * @memberof    pub.appObj.connectionObj
         * @return      {Object}    The application object
         */
        connectionObj.getApp = function() {
            return appObj;
        };


        /**
         * Returns the application name for the application to which the connection belongs. Note that unlike most EasyRTC functions, this returns a value and does not use a callback.
         *
         * @memberof    pub.appObj.connectionObj
         * @return      {string}    The application name
         */
        connectionObj.getAppName = function() {
            return appName;
        };


        /**
         * Returns the easyrtcid for the connection.  Note that unlike most EasyRTC functions, this returns a value and does not use a callback.
         *
         * @memberof    pub.appObj.connectionObj
         * @return      {string}    Returns the connection's easyrtcid, which is the EasyRTC unique identifier for a socket connection.
         */
        connectionObj.getEasyrtcid = function() {
            return easyrtcid;
        };

        /**
         * Check if field has value.
         *
         * @memberof    pub.appObj.connectionObj
         * @param       {string}    fieldName       Field name
         * @return      {Boolean}    Returns the true if connection has field value.
         */
        connectionObj.hasFieldValueSync = function(fieldName) {
            var hasField = e.app.hasOwnProperty(appName) && 
                e.app[appName].hasOwnProperty('connection') && 
                    e.app[appName].connection.hasOwnProperty(easyrtcid) &&
                        e.app[appName].connection[easyrtcid].hasOwnProperty('field') &&
                            e.app[appName].connection[easyrtcid].field.hasOwnProperty(fieldName);

            return hasField;
        };

        /**
         * Returns connection level field object for a given field name to a provided callback.
         *
         * @memberof    pub.appObj.connectionObj
         * @param       {string}    fieldName       Field name
         * @param       {function(?Error, Object=)} callback Callback with error and field object (any type)
         */
        connectionObj.getField = function(fieldName, callback) {
            if (connectionObj.hasFieldValueSync(fieldName) &&
                e.app[appName].connection[easyrtcid] ) {
                callback(null, pub.util.deepCopy(e.app[appName].connection[easyrtcid].field[fieldName]));
            } else {
                pub.util.logDebug("Can not find connection field: '" + fieldName + "'");
                callback(new pub.util.ApplicationWarning("Can not find connection field: '" + fieldName + "'"));
                return;
            }
        };


        /**
         * Returns connection level field object for a given field name. If the field is not set, it will return a field object will a null field value.  This is a synchronous function, thus may not be available in custom cases where state is not kept in memory.
         *
         * @memberof    pub.appObj.connectionObj
         * @param       {string}    fieldName       Field name
         * @returns     {Object}    Field object
         */
        connectionObj.getFieldSync = function(fieldName) {
            if (
                connectionObj.hasFieldValueSync(fieldName) &&
                    e.app[appName].connection[easyrtcid]
            ) {
                return pub.util.deepCopy(e.app[appName].connection[easyrtcid].field[fieldName]);
            } else {
                return {
                    "fieldName": fieldName, 
                    "fieldOption": {}, 
                    "fieldValue": null
                };                
            }
        };


        /**
 * Returns connection level field value for a given field name. If the field is not set, it will return a null field value.  This is a synchronous function, thus may not be available in custom cases where state is not kept in memory.
         *
         * @memberof    pub.appObj.connectionObj
         * @param       {string}    fieldName       Field name
         * @returns     {?*}        Field value
         */
        connectionObj.getFieldValueSync = function(fieldName) {
            if (connectionObj.hasFieldValueSync(fieldName) &&
                e.app[appName].connection[easyrtcid] ) {
                return pub.util.deepCopy(e.app[appName].connection[easyrtcid].field[fieldName].fieldValue);
            } else {
               return null;
            }
        };


        /**
         * Returns an object containing all field names and values within the connection to a provided callback. Can be limited to fields with isShared option set to true.
         *
         * @memberof    pub.appObj.connectionObj
         * @param       {boolean}   limitToIsShared Limits returned fields to those which have the isShared option set to true.
         * @param       {function(?Error, Object=)} callback Callback with error and object containing field names and values.
         */
        connectionObj.getFields = function(limitToIsShared, callback) {
            var fieldObj = {};
            if( e.app[appName].connection[easyrtcid] ) {
               for (var fieldName in e.app[appName].connection[easyrtcid].field) {
                    if (!e.app[appName].connection.hasOwnProperty(easyrtcid)) {
                        continue;
                    }
                    if (!limitToIsShared || e.app[appName].connection[easyrtcid].field[fieldName].fieldOption.isShared) {
                       fieldObj[fieldName] = {
                           fieldName: fieldName,
                           fieldValue: pub.util.deepCopy(e.app[appName].connection[easyrtcid].field[fieldName].fieldValue)
                       };
                   }
               }
            }
            callback(null, fieldObj);
        };


        /**
         * Returns an array of all room names which connection has entered.
         *
         * @memberof    pub.appObj.connectionObj
         * @param       {function(?Error, Array.<string>)} callback Callback with error and array of room names.
         */
        connectionObj.getRoomNames = function(callback) {
            var roomNames = [];
            if( e.app[appName].connection[easyrtcid] ) {
               roomNames = Object.keys(e.app[appName].connection[easyrtcid].room);
            }
            callback(null, roomNames);
        };


        /**
         * Returns the session object to which the connection belongs (if one exists). Returns a null if connection is not attached to a session (such as when sessions are disabled). Note that unlike most EasyRTC functions, this returns a value and does not use a callback.
         *
         * @memberof    pub.appObj.connectionObj
         * @return      {Object}    The session object. May be null if connection has not been joined to a session.
         */
        connectionObj.getSession = function() {
            return _sessionObj;
        };


        /**
         * TO BE REMOVED - Use getSession() instead.
         * Returns the session object which the connection belongs to. Will return null if connection is not in a session (such as if session handling is disabled).
         * 
         * @ignore
         * @memberof    pub.appObj.connectionObj
         * @param       {function(?Error, Object=)} callback Callback with error and Session object
         */
        connectionObj.getSessionObj = function(callback) {
            if (
                e.app[appName].connection[easyrtcid] && 
                    e.app[appName].connection[easyrtcid].toSession && 
                        e.app[appName].connection[easyrtcid].toSession.easyrtcsid
            ) {
                appObj.session(e.app[appName].connection[easyrtcid].toSession.easyrtcsid, callback);
            }
            else {
                callback(null, null);
            }
        };


        /**
         * Returns the username associated with the connection. Returns NULL if no username has been set.
         * Note that unlike most EasyRTC functions, this returns a value and does not use a callback.
         *
         * @memberof    pub.appObj.connectionObj
         * @return      {String}    The username associated with the connection.
         */
        connectionObj.getUsername = function() {
            if( e.app[appName].connection[easyrtcid] ) {
                 return e.app[appName].connection[easyrtcid].username;
            }
            else {
               return null;
            }
        };

        /**
         * Returns the credential associated with the connection. Returns NULL if no credential has been set.
         * Note that unlike most EasyRTC functions, this returns a value and does not use a callback.
         *
         * @memberof    pub.appObj.connectionObj
         * @return      {String}    The username associated with the connection.
         */
        connectionObj.getCredential = function() {
            return e.app[appName].connection[easyrtcid].credential;
        };

        /**
         * Joins the connection to a specified session. A connection can only be assigned to one session.
         *
         * @memberof    pub.appObj.connectionObj
         * @param       {string}    easyrtcsid      EasyRTC session identifier
         * @param       {nextCallback} next         A success callback of form next(err).
         */
        connectionObj.joinSession = function(easyrtcsid, next) {
            if (!e.app[appName].session[easyrtcsid]) {
                next(new pub.util.ConnectionWarning("[" + appName + "][" + easyrtcid + "] Session [" + easyrtcsid + "] does not exist. Could not join session"));
                return;
            }

            appObj.session(easyrtcsid, function(err, sessionObj) {
                if (err) {
                    next(err);
                    return;
                }

                if(!e.app[appName] || !e.app[appName].connection[easyrtcid] || !e.app[appName].session[easyrtcsid]) {
                    next(new pub.util.ConnectionWarning("[" + appName + "][" + easyrtcid + "] Session [" + easyrtcsid + "] does not exist. Could not join session"));
                    return;
                }

                e.app[appName].connection[easyrtcid].toSession = e.app[appName].session[easyrtcsid];
                e.app[appName].connection[easyrtcid].toSession.toConnection[easyrtcid] = e.app[appName].connection[easyrtcid];

                // Set local session object
                _sessionObj = sessionObj;

                next(null);
            });
        };


        /**
         * Sets connection authentication status for the connection.
         *
         * @memberof    pub.appObj.connectionObj
         * @param       {Boolean}   isAuthenticated True/false as to if the connection should be considered authenticated.
         * @param       {nextCallback} next         A success callback of form next(err).
         */
        connectionObj.setAuthenticated = function(isAuthenticated, next) {
            if( !e.app[appName].connection[easyrtcid]) {
                next(new pub.util.ConnectionWarning("[" + appName + "][" + easyrtcid + "] Connection [" + easyrtcid + "] does not exist. Could not authenticate"));    
                return;
            }
            
            if (isAuthenticated) {
                e.app[appName].connection[easyrtcid].isAuthenticated = true;
            } else {
                e.app[appName].connection[easyrtcid].isAuthenticated = false;
            }
            next(null);
        };


        /**
         * Sets the credential for the connection.
         *
         * @memberof    pub.appObj.connectionObj
         * @param       {?*}        credential      Credential for the connection. Can be any JSON object.
         * @param       {nextCallback} next         A success callback of form next(err).
         */
        connectionObj.setCredential = function(credential, next) {
            if( e.app[appName].connection[easyrtcid]) {
               e.app[appName].connection[easyrtcid].credential = credential;
            }
            next(null);
        };


        /**
         * Sets connection field value for a given field name.
         *
         * @memberof    pub.appObj.connectionObj
         * @param       {string}    fieldName       Must be formatted according to "fieldNameRegExp" option.
         * @param       {Object}    fieldValue
         * @param       {?Object}   fieldOption     Field options (such as isShared which defaults to false)
         * @param       {nextCallback} [next]       A success callback of form next(err). Possible err will be instanceof (ApplicationWarning).
         */
        connectionObj.setField = function(fieldName, fieldValue, fieldOption, next) {
            pub.util.logDebug("[" + appName + "][" + easyrtcid + "] - Setting field [" + fieldName + "]", fieldValue);
            if (!_.isFunction(next)) {
                next = pub.util.nextToNowhere;
            }

            if (!pub.getOption("fieldNameRegExp").test(fieldName)) {
                pub.util.logWarning("Can not create connection field with improper name: '" + fieldName + "'");
                next(new pub.util.ApplicationWarning("Can not create connection field with improper name: '" + fieldName + "'"));
                return;
            }

            if( e.app[appName].connection[easyrtcid] ) {
               e.app[appName].connection[easyrtcid].field[fieldName] = {
                   fieldName: fieldName,
                   fieldValue: fieldValue,
                   fieldOption: {isShared: ((_.isObject(fieldOption) && fieldOption.isShared) ? true : false)}
               };

            }
            next(null);
        };


        /**
         * Sets the presence object for the connection.
         *
         * @memberof    pub.appObj.connectionObj
         * @param       {Object}    presenceObj     A presence object.
         * @param       {nextCallback} next         A success callback of form next(err).
         */
        connectionObj.setPresence = function(presenceObj, next) {
            if( e.app[appName].connection[easyrtcid]) {
                if (presenceObj.show !== undefined) {
                e.app[appName].connection[easyrtcid].presence.show = presenceObj.show;
                }
                if (presenceObj.status !== undefined) {
                    e.app[appName].connection[easyrtcid].presence.status = presenceObj.status;
                }
                if (presenceObj.type !== undefined) {
                    e.app[appName].connection[easyrtcid].presence.type = presenceObj.type;
                }
            }
            next(null);
        };


        /**
         * Sets the username string for the connection.
         *
         * @memberof    pub.appObj.connectionObj
         * @param       {?string}   username        Username to assign to the connection.
         * @param       {nextCallback} next         A success callback of form next(err).
         */
        connectionObj.setUsername = function(username, next) {
            if( e.app[appName].connection[easyrtcid]) {
                e.app[appName].connection[easyrtcid].username = username;
            }
            next(null);
        };


        /**
         * Emits the roomData message with a clientListDelta for the current connection to other connections in rooms this connection is in.
         * Note: To send listDeltas for individual rooms, use connectionRoomObj.emitRoomDataDelta
         *
         * @memberof    pub.appObj.connectionObj
         * @param       {Boolean}   isLeavingAllRooms   Indicator if connection is leaving all rooms. Meant to be used upon disconnection / logoff.
         * @param       {function(?Error, Object=)} callback Callback of form (err, roomDataObj) which will contain the roomDataObj including all updated rooms of the connection and is designed to be returnable to the connection.
         */
        connectionObj.emitRoomDataDelta = function(isLeavingAllRooms, callback) {
            pub.util.logDebug("[" + appName + "][" + easyrtcid + "] Running func 'connectionObj.emitRoomDataDelta'");
            if (!_.isFunction(callback)) {
                callback = function(err, roomDataObj) {
                };
            }

            var fullRoomDataDelta = {};

            var otherClients = {};

            // Generate a complete roomDelta for the current client
            connectionObj.generateRoomDataDelta(isLeavingAllRooms, function(err, newFullRoomDataDelta) {
                fullRoomDataDelta = newFullRoomDataDelta;

                // Running callback right away so client doesn't have to wait to continue
                callback(null, fullRoomDataDelta);

                // Populate otherClients object with other clients who share room(s)
                for (var currentRoomName in fullRoomDataDelta) {
                    if (fullRoomDataDelta.hasOwnProperty(currentRoomName)) {
                        var clientList = e.app[appName].room[currentRoomName].clientList;
                        for (var currentEasyrtcid in clientList) {
                            if (clientList.hasOwnProperty(currentEasyrtcid)) {
                                otherClients[currentEasyrtcid] = otherClients[currentEasyrtcid] || {};
                                otherClients[currentEasyrtcid][currentRoomName] = true;   
                            }
                        }   
                    }
                }

                // Emit custom roomData object to each client who shares a room with the current client
                for (var otherClient in otherClients) {
                    if (otherClients.hasOwnProperty(otherClient)) {
                        var msg = {
                            "msgData": {
                                "roomData": {}
                            }
                        };

                        for (var otherRoomName in otherClients[otherClient]) {
                            if (otherClients[otherClient].hasOwnProperty(otherRoomName)) {
                                if (fullRoomDataDelta[otherRoomName]) {
                                    msg.msgData.roomData[otherRoomName] = fullRoomDataDelta[otherRoomName];
                                }   
                            }
                        }

                        // Anonymous wrapper to deliver arguments
                        // TODO use bind
                        (function(innerCurrentEasyrtcid, innerMsg) {
                            connectionObj.getApp().connection(innerCurrentEasyrtcid, function(err, emitToConnectionObj) {
                                if (!err && innerCurrentEasyrtcid !== easyrtcid && emitToConnectionObj) {
                                    pub.events.emit("emitEasyrtcCmd", emitToConnectionObj, "roomData", innerMsg, null, function() {});
                                }
                            });
                        })(otherClient, msg);   
                    }
                }
            });
        };


        /**
         * Generates a full room clientList object for the given connection
         *
         * @memberof    pub.appObj.connectionObj
         * @param       {?string}   [roomStatus="join"] Room status which allow for values of "join"|"update"|"leave".
         * @param       {?Object}   roomMap     Map of rooms to generate connection clientList for. If null, then all rooms will be used.
         * @param       {function(?Error, Object=)} callback    Callback which includes a formed roomData object .
         */
        connectionObj.generateRoomClientList = function(roomStatus, roomMap, callback) {
            if (!_.isString(roomStatus)) {
                roomStatus = "join";
            }

            if (!_.isObject(roomMap)) {
                roomMap = e.app[appName].connection[easyrtcid].room;
            }

            var roomData = {};
            if( !e.app[appName].connection[easyrtcid] ) {
               callback(null, roomData);
               return;
            }
            for (var currentRoomName in e.app[appName].connection[easyrtcid].room) {
                if (e.app[appName].connection[easyrtcid].room.hasOwnProperty(currentRoomName)) {

                    // If room is not in the provided roomMap, then skip it.
                    if (!roomMap[currentRoomName]) {
                        continue;
                    }

                    var connectionRoom = e.app[appName].connection[easyrtcid].room[currentRoomName];
                    roomData[currentRoomName] = {
                        "roomName": currentRoomName,
                        "roomStatus": roomStatus,
                        "clientList": {}
                    };

                    // Empty current clientList
                    connectionRoom.clientList = {};

                    // Fill connection clientList, and roomData clientList for current room
                    for (var currentEasyrtcid in connectionRoom.toRoom.clientList) {
                        if (connectionRoom.toRoom.clientList.hasOwnProperty(currentEasyrtcid)) {

                            var currentToConnection = connectionRoom.toRoom.clientList[currentEasyrtcid].toConnection;

                            connectionRoom.clientList[currentEasyrtcid] = {
                                "toConnection": currentToConnection
                            };

                            roomData[currentRoomName].clientList[currentEasyrtcid] = {
                                "easyrtcid": currentEasyrtcid,
                                "roomJoinTime": currentToConnection.room[currentRoomName].enteredOn,
                                "presence": currentToConnection.presence
                            };

                            if (
                                currentToConnection.room[currentRoomName] && 
                                    (!_.isEmpty(currentToConnection.room[currentRoomName].apiField))
                            ) {
                                roomData[currentRoomName].clientList[currentEasyrtcid].apiField = currentToConnection.room[currentRoomName].apiField;
                            }

                            if (currentToConnection.username) {
                                roomData[currentRoomName].clientList[currentEasyrtcid].username = currentToConnection.username;
                            }   
                        }
                    }

                    // Include room fields (with isShared set to true)
                    for (var fieldName in connectionRoom.toRoom.field) {
                        if (connectionRoom.toRoom.field.hasOwnProperty(fieldName)) {
                            if (
                                _.isObject(connectionRoom.toRoom.field[fieldName].fieldOption) && 
                                    connectionRoom.toRoom.field[fieldName].fieldOption.isShared
                            ) {
                                if (!_.isObject(roomData[currentRoomName].field)) {
                                    roomData[currentRoomName].field = {};
                                }
                                roomData[currentRoomName].field[fieldName] = {
                                    "fieldName": fieldName,
                                    "fieldValue": pub.util.deepCopy(connectionRoom.toRoom.field[fieldName].fieldValue)
                                };
                            }   
                        }
                    }

                    // Updating timestamp of when clientList was retrieved. Useful for sending delta's later on.
                    connectionRoom.gotListOn = Date.now();
                }
            }
            callback(null, roomData);
        };


        /**
         * Generates a delta roomData object for the current user including all rooms the user is in. The result can be selectively parsed to deliver delta roomData objects to other clients.
         *
         * @memberof    pub.appObj.connectionObj
         * @param       {Boolean}   isLeavingRoom   Indicates if connection is in the process of leaving the room.
         * @param       {function(?Error, Object=)} callback Callback of form (err, roomDataDelta).
         */
        connectionObj.generateRoomDataDelta = function(isLeavingRoom, callback) {

            if (!e.app[appName].connection[easyrtcid]) {
                pub.util.logWarning("Attempt to request non-existent connection key: '" + easyrtcid + "'");
                callback(new pub.util.ConnectionWarning("Attempt to request non-existent connection key: '" + easyrtcid + "'"));
                return;
            }
            
            pub.util.logDebug("[" + appName + "][" + easyrtcid + "] Running func 'connectionObj.generateRoomDataDelta'");

            var roomDataDelta = {};

            if( !e.app[appName].connection[easyrtcid] ) {
                callback(null, roomDataDelta);
                return;
            }
            // set the roomData's clientListDelta for each room the client is in
            for (var currentRoomName in e.app[appName].connection[easyrtcid].room) {
                if (e.app[appName].connection[easyrtcid].room.hasOwnProperty(currentRoomName)) {
                    roomDataDelta[currentRoomName] = {
                        "roomName": currentRoomName,
                        "roomStatus": "update",
                        "clientListDelta": {}
                    };

                    if (isLeavingRoom) {
                        roomDataDelta[currentRoomName].clientListDelta.removeClient = {};
                        roomDataDelta[currentRoomName].clientListDelta.removeClient[easyrtcid] = {"easyrtcid": easyrtcid};
                    } else {
                        roomDataDelta[currentRoomName].clientListDelta.updateClient = {};
                        roomDataDelta[currentRoomName].clientListDelta.updateClient[easyrtcid] = {
                            "easyrtcid": easyrtcid,
                            "roomJoinTime": e.app[appName].connection[easyrtcid].room[currentRoomName].enteredOn,
                            "presence": e.app[appName].connection[easyrtcid].presence
                        };

                        if (!_.isEmpty(e.app[appName].connection[easyrtcid].apiField)) {
                            roomDataDelta[currentRoomName].clientListDelta.updateClient[easyrtcid].apiField = e.app[appName].connection[easyrtcid].apiField;
                        }
                        if (e.app[appName].connection[easyrtcid].username) {
                            roomDataDelta[currentRoomName].clientListDelta.updateClient[easyrtcid].username = e.app[appName].connection[easyrtcid].username;
                        }
                    }
                }
            }

            callback(null, roomDataDelta);
        };


        /**
         * Generates the roomList message object
         *
         * @memberof    pub.appObj.connectionObj
         * @param       {function(?Error, Object=)} callback Callback with error and roomList object.
         */
        connectionObj.generateRoomList = function(callback) {
            pub.util.logDebug("[" + appName + "][" + easyrtcid + "] Running func 'connectionObj.generateRoomList'");
            var roomList = {};

            for (var currentRoomName in e.app[appName].room) {
                if (e.app[appName].room.hasOwnProperty(currentRoomName)) {
                    roomList[currentRoomName] = {
                        "roomName": currentRoomName,
                        "numberClients": _.size(e.app[appName].room[currentRoomName].clientList)
                    };   
                }
            }
            callback(null, roomList);
        };


        /**
         * Gets connection authentication status for the connection. It is possible for a connection to become disconnected and keep the authenticated flag. Note that unlike most EasyRTC functions, this returns a value and does not use a callback.
         *
         * @memberof    pub.appObj.connectionObj
         * @returns     {Boolean}   Authentication status
         */
        connectionObj.isAuthenticated = function() {
            if (
                e.app[appName].connection.hasOwnProperty(easyrtcid) && 
                    e.app[appName].connection[easyrtcid].isAuthenticated
            ) {
                return true;
            } else {
                return false;
            }
        };


        /**
         * Gets connection status for the connection. It is possible for a connection to be considered connected without being authenticated. Note that unlike most EasyRTC functions, this returns a value and does not use a callback.
         *
         * @memberof    pub.appObj.connectionObj
         * @returns     {Boolean}   Connection status
         */
        connectionObj.isConnected = function() {
            if (connectionObj.socket && connectionObj.socket.socket) {
                return connectionObj.socket.socket.connected;
            }
            else {
                return false;
            }
        };


        /**
         * Returns a boolean to the callback indicating if connection is in a given group. NOT YET IMPLEMENTED
         * @ignore
         * @memberof    pub.appObj.connectionObj
         * @param       {string}    groupName Group name to check.
         * @param       {function(?Error, Boolean)} callback Callback with error and a boolean indicating if connection is in a room..
         */
        connectionObj.isInGroup = function(groupName, callback) {
            if (
                _.isString(groupName) && 
                    e.app[appName].connection.hasOwnProperty(easyrtcid) && 
                        e.app[appName].connection[easyrtcid].group.hasOwnProperty(groupName)
            ) {
                callback(null, true);
            }
            else {
                callback(null, false);
            }
        };


        /**
         * Returns a boolean to the callback indicating if connection is in a given room
         *
         * @memberof    pub.appObj.connectionObj
         * @param       {string} roomName       Room name which uniquely identifies a room within an EasyRTC application.
         * @param       {function(?Error, Boolean)} callback Callback with error and a boolean indicating if connection is in a room..
         */
        connectionObj.isInRoom = function(roomName, callback) {
            if (
                _.isString(roomName) && 
                    e.app[appName].connection.hasOwnProperty(easyrtcid) && 
                        e.app[appName].connection[easyrtcid].room.hasOwnProperty(roomName)
            ) {
                callback(null, true);
            }
            else {
                callback(null, false);
            }
        };


        /**
         * Joins an existing room, returning a connectionRoom object.
         *
         * @memberof    pub.appObj.connectionObj
         * @param       {string} roomName       Room name which uniquely identifies a room within an EasyRTC application.
         * @param       {function(?Error, Object=)} callback Callback with error and object containing EasyRTC connection room object (same as calling room(roomName))
         */
        connectionObj.joinRoom = function(roomName, callback) {
            if( !e.app[appName].connection[easyrtcid]) {
                pub.util.logWarning("[" + appName + "][zombie=" + easyrtcid + 
                  "] Can not enter room: '" + roomName + "'");
                callback(new pub.util.ConnectionWarning("Can not enter room as zombie: '" + roomName + "'"));
                return;
            }
            if (!roomName || !appObj.getOption("roomNameRegExp").test(roomName)) {
                pub.util.logWarning("[" + appName + "][" + easyrtcid + "] Can not enter room with improper name: '" + roomName + "'");
                callback(new pub.util.ConnectionWarning("Can not enter room with improper name: '" + roomName + "'"));
                return;
            }
            // Check if room doesn't exist
            if (!appObj.isRoomSync(roomName)) {
                pub.util.logWarning("[" + appName + "][" + easyrtcid + "] Can not enter room which doesn't exist: '" + roomName + "'");
                callback(new pub.util.ConnectionWarning("Can not enter room which doesn't exist: '" + roomName + "'"));
                return;
            }

            if (!e.app[appName].connection[easyrtcid]) {
                pub.util.logWarning("Attempt to request non-existent connection key: '" + easyrtcid + "'");
                callback(new pub.util.ConnectionWarning("Attempt to request non-existent connection key: '" + easyrtcid + "'"));
                return;
            }

            // Check if client already in room
            if (e.app[appName].connection[easyrtcid].room[roomName]) {
                connectionObj.room(roomName, callback);
                return;
            }

            // Local private function to create the default connection-room object in the private variable
            var createConnectionRoom = function(roomName, appRoomObj, callback) {
                // Join room. Creates a default connection room object
                e.app[appName].connection[easyrtcid].room[roomName] = {
                    apiField: {},
                    enteredOn: Date.now(),
                    gotListOn: Date.now(),
                    clientList: {},
                    toRoom: e.app[appName].room[roomName]
                };

                // Add easyrtcid to room clientList
                e.app[appName].room[roomName].clientList[easyrtcid] = {
                    enteredOn: Date.now(),
                    modifiedOn: Date.now(),
                    toConnection: e.app[appName].connection[easyrtcid]
                };

                // Returns connection room object to callback.
                connectionObj.room(roomName, callback);
            };

            appObj.room(roomName, function(err, appRoomObj) {
                if (err) {
                    callback(err);
                    return;
                }
                createConnectionRoom(roomName, appRoomObj, callback);
            });
        };


        /**
         * Gets room object for a given room name. Returns null if room not found.
         * The returned room object includes functions for managing room fields.
         *
         * @memberof    pub.appObj.connectionObj
         * @param       {string} roomName       Room name which uniquely identifies a room within an EasyRTC application.
         * @param       {function(?Error, Object=)} callback Callback with error and object containing EasyRTC connection room object.
         */
        connectionObj.room = function(roomName, callback) {
            if( !e.app[appName].connection[easyrtcid] ) {
                pub.util.logWarning("Zombie attempt to request room name: '" + roomName + "'");
                callback(new pub.util.ConnectionWarning("Attempt to request non-existent room name: '" + roomName + "'"));
                return;
            }
            
            if (_.isUndefined(e.app[appName].connection[easyrtcid].room[roomName])) {
                pub.util.logWarning("Attempt to request non-existent room name: '" + roomName + "'");
                callback(new pub.util.ConnectionWarning("Attempt to request non-existent room name: '" + roomName + "'"));
                return;
            }

            /**
             * This is a gateway object connecting connections to the rooms they are in.
             *
             * @class       connectionRoomObj
             * @memberof    pub.appObj.connectionObj
             */
            var connectionRoomObj = {};

            // House the local room object
            var _roomObj;


            /**
             * Expose all event functions
             * 
             * @memberof    pub.appObj.connectionObj.connectionRoomObj
             */
            connectionRoomObj.events = pub.events;


            /**
             * Expose all utility functions
             * 
             * @memberof    pub.appObj.connectionObj.connectionRoomObj
             */
            connectionRoomObj.util = pub.util;


            /**
             * Returns the application object to which the connection belongs. Note that unlike most EasyRTC functions, this returns a value and does not use a callback.
             *
             * @memberof    pub.appObj.connectionObj.connectionRoomObj
             * @return      {Object}    The application object
             */
            connectionRoomObj.getApp = function() {
                return appObj;
            };


            /**
             * Returns the application name for the application to which the connection belongs. Note that unlike most EasyRTC functions, this returns a value and does not use a callback.
             *
             * @memberof    pub.appObj.connectionObj.connectionRoomObj
             * @return      {string}    The application name
             */
            connectionRoomObj.getAppName = function() {
                return appName;
            };


            /**
             * Returns the connection object to which the connection belongs. Note that unlike most EasyRTC functions, this returns a value and does not use a callback.
             *
             * @memberof    pub.appObj.connectionObj.connectionRoomObj
             * @return      {Object}    The application object
             */
            connectionRoomObj.getConnection = function() {
                return connectionObj;
            };


            /**
             * Returns the room object to which the connection belongs. Note that unlike most EasyRTC functions, this returns a value and does not use a callback.
             *
             * @memberof    pub.appObj.connectionObj.connectionRoomObj
             * @return      {Object}    The room object
             */
            connectionRoomObj.getRoom = function() {
                return _roomObj;
            };


            /**
             * Returns the room name to which the connection belongs. Note that unlike most EasyRTC functions, this returns a value and does not use a callback.
             *
             * @memberof    pub.appObj.connectionObj.connectionRoomObj
             * @return      {string}    The room name
             */
            connectionRoomObj.getRoomName = function() {
                return roomName;
            };


            /**
             * Leaves the current room. Any room variables will be lost.
             *
             * @memberof    pub.appObj.connectionObj.connectionRoomObj
             * @param       {nextCallback} [next]   A success callback of form next(err).
             */
            connectionRoomObj.leaveRoom = function(next) {
                if (!_.isFunction(next)) {
                    next = pub.util.nextToNowhere;
                }

                if (appObj.isRoomSync(roomName)) {
                    e.app[appName].room[roomName].modifiedOn = Date.now();
                    delete e.app[appName].room[roomName].clientList[easyrtcid];
                }

                if (e.app[appName].connection[easyrtcid]) {
                    delete e.app[appName].connection[easyrtcid].room[roomName];
                }

                connectionRoomObj.emitRoomDataDelta(true, function(err, roomDataObj) {
                    next(err);
                });
            };


            /**
             * Emits the roomData message with a clientListDelta for the current connection to other connections in the same room.
             *
             * @memberof    pub.appObj.connectionObj.connectionRoomObj
             * @param       {boolean}   isLeavingRoom   Is connection leaving the room?
             * @param       {function(?Error, Object=)} callback Callback with error and room data delta object.
             */
            connectionRoomObj.emitRoomDataDelta = function(isLeavingRoom, callback) {
                pub.util.logDebug("[" + appName + "][" + easyrtcid + "] Room [" + roomName + "] Running func 'connectionRoomObj.emitRoomDataDelta'");
                if (!_.isFunction(callback)) {
                    callback = function(err, roomDataObj) {
                    };
                }

                connectionRoomObj.generateRoomDataDelta(isLeavingRoom, function(err, roomDataDelta) {
                    if (err) {
                        callback(err);
                        return;
                    }
                    if (!appObj.isRoomSync(roomName)) {
                        pub.util.logWarning("Attempt to request non-existent room name: '" + roomName + "'");
                        callback(new pub.util.ApplicationWarning("Attempt to request non-existent room name: '" + roomName + "'"));
                        return;
                    }

                    var msg = {"msgData": {"roomData": {}}};
                    msg.msgData.roomData[roomName] = roomDataDelta;

                    for (var currentEasyrtcid in e.app[appName].room[roomName].clientList) {
                        if (e.app[appName].room[roomName].clientList.hasOwnProperty(currentEasyrtcid)) { 
                            // Anonymous wrapper to deliver arguments
                            // TODO use bind
                            (function(innerCurrentEasyrtcid, innerMsg) {
                                connectionObj.getApp().connection(innerCurrentEasyrtcid, function(err, emitToConnectionObj) {
                                    if (!err && innerCurrentEasyrtcid !== easyrtcid && emitToConnectionObj) {
                                        pub.events.emit("emitEasyrtcCmd", emitToConnectionObj, "roomData", innerMsg, null, function() {
                                            // TODO callback ?
                                        });
                                    }
                                });
                            })(currentEasyrtcid, msg);   
                        }

                    }
                    callback(null, roomDataDelta);
                });
            };


            /**
             * Generated the roomData[room] message with a clientListDelta for the current connection to other connections in the same room.
             *
             * @memberof    pub.appObj.connectionObj.connectionRoomObj
             * @param       {boolean}   isLeavingRoom   Is connection leaving the room?
             * @param       {function(?Error, Object=)} callback Callback with error and room data delta object.
             */
            connectionRoomObj.generateRoomDataDelta = function(isLeavingRoom, callback) {
                pub.util.logDebug("[" + appName + "][" + easyrtcid + "] Room [" + roomName + "] Running func 'connectionRoomObj.generateRoomDataDelta'");
                if (!_.isFunction(callback)) {
                    callback = pub.util.nextToNowhere;
                }
                if( !e.app[appName].connection[easyrtcid]) {
                    pub.util.logWarning("Zombie attempt to request room name: '" + roomName + "'");
                    callback(new pub.util.ApplicationWarning("Zombie attempt to request room name: '" + roomName + "'"));
                    return;
                }
                if (!appObj.isRoomSync(roomName)) {
                    pub.util.logWarning("Attempt to request non-existent room name: '" + roomName + "'");
                    callback(new pub.util.ApplicationWarning("Attempt to request non-existent room name: '" + roomName + "'"));
                    return;
                }
                var roomDataDelta = {"roomName": roomName, "roomStatus": "update", "clientListDelta": {}};

                if (isLeavingRoom) {
                    roomDataDelta.clientListDelta.removeClient = {};
                    roomDataDelta.clientListDelta.removeClient[easyrtcid] = {"easyrtcid": easyrtcid};
                } else {
                    var connectionRoom = e.app[appName].connection[easyrtcid].room[roomName];
                    roomDataDelta.clientListDelta.updateClient = {};
                    roomDataDelta.clientListDelta.updateClient[easyrtcid] = {
                        "easyrtcid": easyrtcid,
                        "roomJoinTime": e.app[appName].connection[easyrtcid].room[roomName].enteredOn,
                        "presence": e.app[appName].connection[easyrtcid].presence
                    };

                    if (!_.isEmpty(e.app[appName].connection[easyrtcid].room[roomName].apiField)) {
                        roomDataDelta.clientListDelta.updateClient[easyrtcid].apiField = e.app[appName].connection[easyrtcid].room[roomName].apiField;
                    }
                    if (e.app[appName].connection[easyrtcid].username) {
                        roomDataDelta.clientListDelta.updateClient[easyrtcid].username = e.app[appName].connection[easyrtcid].username;
                    }
                }

                callback(null, roomDataDelta);
            };

            /**
             * Sets the API field for the current connection in a room.
             *
             * @memberof    pub.appObj.connectionObj.connectionRoomObj
             * @param       {object}    apiFieldObj     A API field object, including the field name and field value.
             * @param       {nextCallback} next         A success callback of form next(err).
             */
            connectionRoomObj.setApiField = function(apiFieldObj, next) {
                if (!_.isFunction(next)) {
                    next = pub.util.nextToNowhere;
                }
                if( e.app[appName].connection[easyrtcid]) {

                    e.app[appName].connection[easyrtcid].room[roomName].apiField = pub.util.deepCopy(apiFieldObj);
                }
                next(null);
            };

            // Set the roomObj before returning the connectionRoomObj
            appObj.room(roomName,
                    function(err, roomObj) {
                        _roomObj = roomObj;
                        callback(null, connectionRoomObj);
                    }
            );
        };


        /**
         * Removes a connection object. Does not (currently) remove connection from rooms or groups.
         *
         * @memberof    pub.appObj.connectionObj
         * @param       {nextCallback} next         A success callback of form next(err).
         */
        connectionObj.removeConnection = function(next) {
            if (e.app[appName] && _.isObject(e.app[appName].connection) && e.app[appName].connection[easyrtcid]) {
                e.app[appName].connection[easyrtcid].isAuthenticated = false;
                // Remove link to connection from session in local storage
                if (e.app[appName].connection[easyrtcid].toSession) {
                    delete e.app[appName].connection[easyrtcid].toSession.toConnection[easyrtcid];
                }

                // Remove connection from local storage
                delete e.app[appName].connection[easyrtcid];
            }
            next(null);
        };

        // Before returning connectionObj, join the connection to a session (if available).
        if (e.app[appName].connection[easyrtcid].toSession) {
            appObj.session(e.app[appName].connection[easyrtcid].toSession.easyrtcsid, function(err, sessionObj) {
                if (err) {
                    callback(err);
                    return;
                }
                _sessionObj = sessionObj;
                callback(null, connectionObj);
            });
        } else {
            callback(null, connectionObj);
        }
    };


    /**
     * Creates a new connection with a provided connection key
     *
     * @memberof    pub.appObj
     * @param       {string}    easyrtcid   EasyRTC unique identifier for a socket connection.
     * @param       {string}    socketId    Socket.io socket identifier for a socket connection.
     * @param       {function(?Error, Object=)} callback Callback with error and object containing EasyRTC connection object (same as calling connection(easyrtcid))
     */
    appObj.createConnection = function(easyrtcid, socketId, callback) {
        if (!easyrtcid || !appObj.getOption("easyrtcidRegExp").test(easyrtcid)) {
            pub.util.logWarning("Can not create connection with improper name: '" + easyrtcid + "'");
            callback(new pub.util.ConnectionWarning("Can not create connection with improper name: '" + easyrtcid + "'"));
            return;
        }

        if (e.app[appName].connection[easyrtcid]) {
            pub.util.logWarning("Can not create connection which already exists: '" + easyrtcid + "'");
            callback(new pub.util.ConnectionWarning("Can not create connection which already exists: '" + easyrtcid + "'"));
            return;
        }

        // Set the connection structure with some default values
        e.app[appName].connection[easyrtcid] = {
            easyrtcid: easyrtcid,
            socketId: socketId,
            connectOn: Date.now(),
            isAuthenticated: false,
            userName: null,
            credential: null,
            field: {},
            group: {},
            presence: {
                show: "chat",
                status: null
            },
            room: {},
            toApp: e.app[appName]
        };

        // Initialize a new connection object
        appObj.connection(easyrtcid, function(err, connectionObj) {
            if (err) {
                callback(err);
                return;
            }

            // Set default connection fields
            var connectionDefaultFieldObj = appObj.getOption("connectionDefaultFieldObj");
            if (_.isObject(connectionDefaultFieldObj)) {
                for (var currentFieldName in connectionDefaultFieldObj) {
                    if (connectionDefaultFieldObj.hasOwnProperty(currentFieldName)) {
                        connectionObj.setField(
                                currentFieldName,
                                connectionDefaultFieldObj[currentFieldName].fieldValue,
                                connectionDefaultFieldObj[currentFieldName].fieldOption,
                                null
                                );   
                    }
                }
            }

            callback(null, connectionObj);
        });
    };


    /**
     * Counts how many occupants are in a room.
     *
     * @memberof    pub.appObj
     * @param       {string} roomName       Room name which uniquely identifies a room within an EasyRTC application.
     * @param       {function(?Error, number=)} callback Callback with error and client count
     */
    appObj.getRoomOccupantCount = function(roomName, callback) {
        if (!appObj.isRoomSync(roomName)) {
            callback(new pub.util.ApplicationWarning("Attempt to request non-existent room name: '" + roomName + "'"));
            return;
        }

        callback(null, _.size(e.app[appName].room[roomName].clientList));
    };

    /**
     * Delete an existing room, providing the room is empty.
     *
     * @memberof    pub.appObj
     * @param       {string} roomName       Room name which uniquely identifies a room within an EasyRTC application.
     * @param       {function(?Error, Object=)} callback Callback with error and true if a room was deleted.
     */
    appObj.deleteRoom = function(roomName, callback) {
        var errorMsg;
        if (!roomName) {
            errorMsg = "Can't delete room with a null room name";
            pub.util.logWarning(errorMsg);
            callback(new pub.util.ApplicationWarning(errorMsg), false);
            return;
        }

        // If room is already deleted or if it doesn't exist, report error
        if (!appObj.isRoomSync(roomName)) {
            errorMsg = "Can't delete non-existing room: " + roomName;
            pub.util.logWarning(errorMsg);
            callback(new pub.util.ApplicationWarning(errorMsg), false);
            return;
        }

        if (!_.isEmpty(e.app[appName].room[roomName].clientList)) {
            errorMsg = "Can't delete room " + roomName + " because it isn't empty";
            pub.util.logWarning(errorMsg);
            callback(new pub.util.ApplicationWarning(errorMsg), false);
            return;
        }

        e.app[appName].room[roomName].deleted = true;

        delete e.app[appName].room[roomName];
        callback(null, true);
    };


    /**
     * Creates a new room, sending the resulting room object to a provided callback.
     *
     * @memberof    pub.appObj
     * @param       {string} roomName       Room name which uniquely identifies a room within an EasyRTC application.
     * @param       {?object}   options     Options object with options to apply to the room. May be null.
     * @param       {function(?Error, Object=)} callback Callback with error and object containing EasyRTC room object (same as calling appObj.room(roomName))
     */
    appObj.createRoom = function(roomName, options, callback) {
        if (!roomName || !appObj.getOption("roomNameRegExp").test(roomName)) {
            pub.util.logWarning("Can not create room with improper name: '" + roomName + "'");
            callback(new pub.util.ApplicationWarning("Can not create room with improper name: '" + roomName + "'"));
            return;
        }
        if (appObj.isRoomSync(roomName)) {
            pub.util.logWarning("Can not create room which already exists: '" + roomName + "'");
            callback(new pub.util.ApplicationWarning("Can not create room which already exists: '" + roomName + "'"));
            return;
        }
        if (!_.isObject(options)) {
            options = {};
        }
        pub.util.logDebug("Creating room: '" + roomName + "' with options:", options);

        e.app[appName].room[roomName] = {
            roomName: roomName,
            deleted: false,
            clientList: {},
            field: {},
            option: {},
            modifiedOn: Date.now()
        };

        // Initialize a new room object
        appObj.room(roomName, function(err, roomObj) {
            if (err) {
                callback(err);
                return;
            }

            // Set all options in options object. If any fail, an error will be sent to the callback.
            async.each(Object.keys(options), function(currentOptionName, asyncCallback) {
                roomObj.setOption(currentOptionName, options[currentOptionName]);
                asyncCallback(null);
            },
                    function(err) {
                        if (err) {
                            callback(new pub.util.ApplicationError("Could not set options when creating room: '" + roomName + "'", err));
                            return;
                        }

                        // Set default room fields
                        var roomDefaultFieldObj = roomObj.getOption("roomDefaultFieldObj");

                        if (_.isObject(roomDefaultFieldObj)) {
                            for (var currentFieldName in roomDefaultFieldObj) {
                                if (roomDefaultFieldObj.hasOwnProperty(currentFieldName)) {
                                    roomObj.setField(
                                            currentFieldName,
                                            roomDefaultFieldObj[currentFieldName].fieldValue,
                                            roomDefaultFieldObj[currentFieldName].fieldOption,
                                            null
                                            );   
                                }
                            }
                        }

                        // Return room object to callback
                        callback(null, roomObj);
                    });
        });
    };


    /**
     * Creates a new session with a provided easyrtcsid
     *
     * @memberof    pub.appObj
     * @param       {string}    easyrtcsid  EasyRTC Session Identifier. Must be formatted according to "easyrtcsidRegExp" option.
     * @param       {function(?Error, Object=)} callback Callback with error and object containing EasyRTC session object (same as calling session(easyrtcsid))
     */
    appObj.createSession = function(easyrtcsid, callback) {
        pub.util.logDebug("[" + appObj.getAppName() + "] Creating session [" + easyrtcsid + "]");

        if (!easyrtcsid || !appObj.getOption("easyrtcsidRegExp").test(easyrtcsid)) {
            pub.util.logWarning("Can not create session with improper name [" + easyrtcsid + "]");
            callback(new pub.util.ConnectionWarning("Can not create session with improper name [" + easyrtcsid + "]"));
            return;
        }

        if (e.app[appName].session[easyrtcsid]) {
            pub.util.logWarning("Can not create session which already exists [" + easyrtcsid + "]");
            callback(new pub.util.ConnectionWarning("Can not create session which already exists [" + easyrtcsid + "]"));
            return;
        }

        // Set the session structure with some default values
        e.app[appName].session[easyrtcsid] = {
            "easyrtcsid": easyrtcsid,
            "startOn": Date.now(),
            "toConnection":{},
            "field": {}
        };

        appObj.session(easyrtcsid, callback);
    };


    /**
     * Checks if a provided room is defined. The callback returns a boolean if room is defined.
     *
     * @memberof    pub.appObj
     * @param       {string} roomName       Room name which uniquely identifies a room within an EasyRTC application.
     * @param       {function(?Error, boolean)} callback Callback with error and boolean of whether room is defined.
     */
    appObj.isRoom = function(roomName, callback) {
        callback(null,((e.app[appName] && e.app[appName].room[roomName] && !e.app[appName].room[roomName].deleted) ? true : false));
    };


    /**
     * Checks if a provided room is defined. This is a synchronous function, thus may not be available in custom cases where room state is not kept in memory.
     *
     * @memberof    pub.appObj
     * @param       {string} roomName       Room name which uniquely identifies a room within an EasyRTC application.
     * @return      {Boolean}               Returns boolean. True if room is defined.
     */
    appObj.isRoomSync = function(roomName) {
        return ((e.app[appName] && e.app[appName].room[roomName] && !e.app[appName].room[roomName].deleted) ? true : false);
    };


    /**
     * Checks if a provided session is defined. The callback returns a boolean if session is defined
     *
     * @memberof    pub.appObj
     * @param       {string}    easyrtcsid      EasyRTC session identifier
     * @param       {function(?Error, boolean)} callback Callback with error and boolean of whether session is defined.
     */
    appObj.isSession = function(easyrtcsid, callback) {
        callback(null, (e.app[appName].session[easyrtcsid] ? true : false));
    };


    /**
     * NOT YET IMPLEMENTED - Gets group object for a given group name. Returns null if group not found.
     * The returned group object includes functions for managing group fields.
     *
     * @memberof    pub.appObj
     * @param       {string}    groupName   Group name
     * @param       {function(?Error, Object=)} callback Callback with error and object containing EasyRTC group object.
     */
    appObj.group = function(groupName, callback) {
        if (!e.app[appName].group[groupName]) {
            pub.util.logWarning("Attempt to request non-existent group name: '" + groupName + "'");
            callback(new pub.util.ApplicationWarning("Attempt to request non-existent group name: '" + groupName + "'"));
            return;
        }

        var groupObj = {};

        /**
         * Expose all event functions
         */
        groupObj.events = pub.events;

        /**
         * Expose all utility functions
         */
        groupObj.util = pub.util;

        /**
         * NOT YET IMPLEMENTED - Returns an array of all connected clients within the room.
         *
         * @ignore
         * @param {function(?Error, Array.<string>)} callback Callback with error and array containing all easyrtcids.
         */
        groupObj.getConnections = function(callback) {
            var connectedEasyrtcidArray = Object.keys(e.app[appName].group[groupName].clientList);
            callback(null, connectedEasyrtcidArray);
        };

        callback(null, groupObj);
    };


    /**
     * Gets room object for a given room name. Returns null if room not found.
     * The returned room object includes functions for managing room fields.
     *
     * @memberof    pub.appObj
     * @param       {string} roomName       Room name which uniquely identifies a room within an EasyRTC application.
     * @param       {function(?Error, Object=)} callback Callback with error and object containing EasyRTC room object.
     */
    appObj.room = function(roomName, callback) {
        if (!appObj.isRoomSync(roomName)) {
            pub.util.logWarning("Attempt to request non-existent room name: '" + roomName + "'");
            callback(new pub.util.ApplicationWarning("Attempt to request non-existent room name: '" + roomName + "'"));
            return;
        }

        /**
         * EasyRTC Room Object. Contains methods for handling a specific room including determining which connections have joined.
         *
         * @class       roomObj
         * @memberof    pub.appObj
         */
        var roomObj = {};


        /**
         * Expose all event functions
         *
         * @memberof    pub.appObj.roomObj
         */
        roomObj.events = pub.events;


        /**
         * Expose all utility functions
         *
         * @memberof    pub.appObj.roomObj
         */
        roomObj.util = pub.util;


        /**
         * Returns the application object to which the room belongs. Note that unlike most EasyRTC functions, this returns a value and does not use a callback.
         *
         * @memberof    pub.appObj.roomObj
         * @return      {Object}    The application object
         */
        roomObj.getApp = function() {
            return appObj;
        };


        /**
         * Returns the application name for the application to which the room belongs. Note that unlike most EasyRTC functions, this returns a value and does not use a callback.
         *
         * @memberof    pub.appObj.roomObj
         * @return      {string}    The application name
         */
        roomObj.getAppName = function() {
            return appName;
        };


        /**
         * Returns the room name for the current room. Note that unlike most EasyRTC functions, this returns a value and does not use a callback.
         *
         * @memberof    pub.appObj.roomObj
         * @return      {string}    The room name
         */
        roomObj.getRoomName = function() {
            return roomName;
        };


        /**
         * INCOMPLETE: Emits a roomData message containing fields to all connections in the current room. This is meant to be called after a room field has been set or updated. 
         * @ignore 
         */
        roomObj.emitRoomDataFieldUpdate = function(skipEasyrtcid, next) {
            roomObj.getFields(true, function(err, fieldObj) {
                if (err) {
                    next(err);
                    return;
                }
                if (!appObj.isRoomSync(roomName)) {
                    pub.util.logWarning("Attempt to request non-existent room name: '" + roomName + "'");
                    next(new pub.util.ApplicationWarning("Attempt to request non-existent room name: '" + roomName + "'"));
                    return;
                }

                var outgoingMsg = {"msgData": {"roomData": {}}};
                outgoingMsg.msgData.roomData[roomName] = {
                    "roomName": roomName,
                    "roomStatus": "update"
                };
                outgoingMsg.msgData.roomData[roomName].field = fieldObj;

                async.each(
                        Object.keys(e.app[appName].room[roomName].clientList),
                        function(currentEasyrtcid, asyncCallback) {

                            // Skip a given easyrtcid?
                            if (skipEasyrtcid && (skipEasyrtcid === currentEasyrtcid)) {
                                asyncCallback(null);
                                return;
                            }

                            // Retrieve a connection object, then send the roomData message.
                            appObj.connection(currentEasyrtcid, function(err, targetConnectionObj) {
                                if (err || !_.isObject(targetConnectionObj)) {
                                    pub.util.logDebug("[" + currentEasyrtcid + "] Could not get connection object to send room data field update. Client may have disconnected.");
                                    asyncCallback(null);
                                    return;
                                }
                                pub.events.emit("emitEasyrtcCmd", targetConnectionObj, "roomData", outgoingMsg, function(msg) {
                                }, function(err) {
                                    // Ignore errors if unable to send to a socket. 
                                    asyncCallback(null);
                                });
                            });
                        },
                        function(err) {
                            next(null);
                        }
                );
            });
        };


        /**
         * Returns room level field object for a given field name to a provided callback.
         *
         * @memberof    pub.appObj.roomObj
         * @param       {string}    fieldName   Field name
         * @param       {function(?Error, Object=)} callback Callback with error and field object (any type)
         */
        roomObj.getField = function(fieldName, callback) {
            if (!appObj.isRoomSync(roomName)) {
                pub.util.logWarning("Attempt to request non-existent room name: '" + roomName + "'");
                callback(new pub.util.ApplicationWarning("Attempt to request non-existent room name: '" + roomName + "'"));
                return;
            }
            if (!e.app[appName].room[roomName].field[fieldName]) {
                pub.util.logDebug("Can not find room field: '" + fieldName + "'");
                callback(new pub.util.ApplicationWarning("Can not find room field: '" + fieldName + "'"));
                return;
            }
            callback(null, pub.util.deepCopy(e.app[appName].room[roomName].field[fieldName]));
        };


        /**
         * Returns room level field object for a given field name. If the field is not set, it will return a field value will a null field value.  This is a synchronous function, thus may not be available in custom cases where state is not kept in memory.
         *
         * @memberof    pub.appObj.roomObj
         * @param       {string}    fieldName   Field name
         * @returns     {Object}        Field object
         */
        roomObj.getFieldSync = function(fieldName) {
            if (!appObj.isRoomSync(roomName)) {
                return {"fieldName": fieldName, "fieldOption": {}, "fieldValue": null};
            }
            if (!e.app[appName].room[roomName].field[fieldName]) {
                return {"fieldName": fieldName, "fieldOption": {}, "fieldValue": null};
            }
            return pub.util.deepCopy(e.app[appName].room[roomName].field[fieldName]);
        };


        /**
         * Returns room level field value for a given field name. If the field is not set, it will return a null field value.  This is a synchronous function, thus may not be available in custom cases where state is not kept in memory.
         *
         * @memberof    pub.appObj.roomObj
         * @param       {string}    fieldName   Field name
         * @returns     {?*}        Field value
         */
        roomObj.getFieldValueSync = function(fieldName) {
            if (!appObj.isRoomSync(roomName)) {
                return null;
            }
            if (!e.app[appName].room[roomName].field[fieldName]) {
                return null;
            }
            return pub.util.deepCopy(e.app[appName].room[roomName].field[fieldName].fieldValue);
        };


        /**
         * Returns an object containing all field names and values within the room. Can be limited to fields with isShared option set to true.
         *
         * @memberof    pub.appObj.roomObj
         * @param       {boolean}   limitToIsShared Limits returned fields to those which have the isShared option set to true.
         * @param       {function(?Error, Object=)} callback Callback with error and object containing field names and values.
         */
        roomObj.getFields = function(limitToIsShared, callback) {
            if (!appObj.isRoomSync(roomName)) {
                pub.util.logWarning("Attempt to request non-existent room name: '" + roomName + "'");
                callback(new pub.util.ApplicationWarning("Attempt to request non-existent room name: '" + roomName + "'"));
                return;
            }
            var fieldObj = {};
            for (var fieldName in e.app[appName].room[roomName].field) {
                if (!limitToIsShared || e.app[appName].room[roomName].field[fieldName].fieldOption.isShared) {
                    fieldObj[fieldName] = {
                        fieldName: fieldName,
                        fieldValue: pub.util.deepCopy(e.app[appName].room[roomName].field[fieldName].fieldValue)
                    };
                }
            }
            callback(null, fieldObj);
        };


        /**
         * Gets individual option value. Will first check if option is defined for the room, else it will revert to the application level option (which will in turn fall back to the global level).
         *
         * @memberof    pub.appObj.roomObj
         * @param       {String}    optionName  Option name
         * @return      {*}         Option value (can be any type)
         */
        roomObj.getOption = function(optionName) {
            return ((!appObj.isRoomSync(roomName) || e.app[appName].room[roomName].option[optionName] === undefined) ? appObj.getOption(optionName) : (e.app[appName].room[roomName].option[optionName]));
        };


        /**
         * Sets individual option which applies only to this room. Set value to NULL to delete the option (thus reverting to global option)
         *
         * @memberof    pub.appObj.roomObj
         * @param       {Object}    optionName  Option name
         * @param       {Object}    optionValue Option value
         * @return      {Boolean}               true on success, false on failure
         */
        roomObj.setOption = function(optionName, optionValue) {
            if (!appObj.isRoomSync(roomName)) {
                pub.util.logWarning("Attempt to request non-existent room name: '" + roomName + "'");
                return false;
            }
            // Can only set options which currently exist
            if (e.option.hasOwnProperty(optionName)) {                

                // If value is null, delete option from application (reverts to global option)
                if (optionValue === null || optionValue === undefined) {
                    if (e.app[appName].option.hasOwnProperty(optionName)) {
                        delete e.app[appName].room[roomName].option[optionName];
                    }
                } else {
                    // Set the option value to be a full deep copy, thus preserving private nature of the private EasyRTC object.
                    e.app[appName].room[roomName].option[optionName] = pub.util.deepCopy(optionValue);
                }
                return true;
            } else {

                pub.util.logError("Error setting option. Unrecognised option name '" + optionName + "'.");
                return false;
            }
        };


        /**
         * Incomplete function for setting an easyrtcid as being a client in a room.
         *
         * @memberof    pub.appObj.roomObj
         * @param       {string}    easyrtcid   EasyRTC unique identifier for a socket connection.
         * @param       {nextCallback} next     A success callback of form next(err).
         * @ignore
         */
        roomObj.setConnection = function(easyrtcid, next) {
            if (!appObj.isRoomSync(roomName)) {
                pub.util.logWarning("Attempt to request non-existent room name: '" + roomName + "'");
                next(new pub.util.ApplicationWarning("Attempt to request non-existent room name: '" + roomName + "'"));
                return;
            }
            pub.util.logWarning("Using deprecated roomObj.setConnection() function");
            e.app[appName].room[roomName].clientList[easyrtcid] = {enteredOn: Date.now()};
            next(null);
        };


        /**
         * Sets room field value for a given field name.
         *
         * @memberof    pub.appObj.roomObj
         * @param       {string}    fieldName       Must be formatted according to "fieldNameRegExp" option.
         * @param       {Object}    fieldValue
         * @param       {?Object}   fieldOption     Field options (such as isShared which defaults to false)
         * @param       {nextCallback} [next]       A success callback of form next(err). Possible err will be instanceof (ApplicationWarning).
         */
        roomObj.setField = function(fieldName, fieldValue, fieldOption, next) {
            if (!appObj.isRoomSync(roomName)) {
                pub.util.logWarning("Attempt to request non-existent room name: '" + roomName + "'");
                next(new pub.util.ApplicationWarning("Attempt to request non-existent room name: '" + roomName + "'"));
                return;
            }
            pub.util.logDebug("[" + appName + "] Room [" + roomName + "] - Setting field [" + fieldName + "]", fieldValue);
            if (!_.isFunction(next)) {
                next = pub.util.nextToNowhere;
            }

            if (!pub.getOption("fieldNameRegExp").test(fieldName)) {
                pub.util.logWarning("Can not create room field with improper name: '" + fieldName + "'");
                next(new pub.util.ApplicationWarning("Can not create room field with improper name: '" + fieldName + "'"));
                return;
            }

            e.app[appName].room[roomName].field[fieldName] = {
                fieldName: fieldName,
                fieldValue: fieldValue,
                fieldOption: {isShared: ((_.isObject(fieldOption) && fieldOption.isShared) ? true : false)}
            };

            next(null);
        };


        /**
         * Sends the count of the number of connections in a room to a provided callback.
         *
         * @memberof    pub.appObj.roomObj
         * @param       {function(?Error, Number)} callback Callback with error and array containing all easyrtcids.
         */
        roomObj.getConnectionCount = function(callback) {
            if (!appObj.isRoomSync(roomName)) {
                pub.util.logWarning("Attempt to request non-existent room name: '" + roomName + "'");
                callback(new pub.util.ApplicationWarning("Attempt to request non-existent room name: '" + roomName + "'"));
                return;
            }
            callback(null, roomObj.getConnectionCountSync());
        };


        /**
         * Sends the count of the number of connections in a room to a provided callback. Returns 0 if room doesn't exist.
         *
         * @memberof    pub.appObj.roomObj
         * @returns     {Number} The current number of connections in a room.
         */
        roomObj.getConnectionCountSync = function() {
            if (!appObj.isRoomSync(roomName)) {
                pub.util.logWarning("Attempt to request non-existent room name: '" + roomName + "'");
                return 0;
            }
            return _.size(e.app[appName].room[roomName].clientList);
        };


        /**
         * Returns an array containing the easyrtcids of all connected clients within the room.
         *
         * @memberof    pub.appObj.roomObj
         * @param {function(?Error, Array.<string>=)} callback Callback with error and array containing all easyrtcids.
         */
        roomObj.getConnections = function(callback) {
            if (!appObj.isRoomSync(roomName)) {
                pub.util.logWarning("Attempt to request non-existent room name: '" + roomName + "'");
                callback(new pub.util.ApplicationWarning("Attempt to request non-existent room name: '" + roomName + "'"));
                return;
            }
            var connectedEasyrtcidArray = Object.keys(e.app[appName].room[roomName].clientList);
            callback(null, connectedEasyrtcidArray);
        };


        /**
         * Returns the connectionObj for a given easyrtcid, but only if it is currently a client in the room
         *
         * @memberof    pub.appObj.roomObj
         * @param       {string}    easyrtcid   EasyRTC unique identifier for a socket connection.
         * @param {function(?Error, Object=)} callback Callback with error and connectionObj.
         */
        roomObj.getConnectionWithEasyrtcid = function(easyrtcid, callback) {
            if (!appObj.isRoomSync(roomName)) {
                pub.util.logWarning("Attempt to request non-existent room name: '" + roomName + "'");
                callback(new pub.util.ApplicationWarning("Attempt to request non-existent room name: '" + roomName + "'"));
                return;
            }
            if (e.app[appName].room[roomName].clientList[easyrtcid]) {
                appObj.connection(easyrtcid, function(err, connectionObj) {
                    if (err) {
                        callback(new pub.util.ConnectionWarning("Can not find connection [" + easyrtcid + "] in room."));
                        return;
                    }
                    // If there is no error, than run callback with the connection object.
                    callback(null, connectionObj);
                });
            }
            else {
                callback(new pub.util.ConnectionWarning("Can not find connection [" + easyrtcid + "] in room."));
            }
        };


        /**
         * Returns an array containing the connectionObjs of all connected clients within the room.
         *
         * @memberof    pub.appObj.roomObj
         * @param {function(?Error, Array.<Object>=)} callback Callback with error and array containing connectionObjs.
         */
        roomObj.getConnectionObjects = function(callback) {
            if (!appObj.isRoomSync(roomName)) {
                pub.util.logWarning("Attempt to request non-existent room name: '" + roomName + "'");
                callback(new pub.util.ApplicationWarning("Attempt to request non-existent room name: '" + roomName + "'"));
                return;
            }
            var connectedObjArray = [];
            async.each(Object.keys(e.app[appName].room[roomName].clientList),
                    function(currentEasyrtcid, asyncCallback) {
                        appObj.connection(currentEasyrtcid, function(err, connectionObj) {
                            if (err) {
                                // We will silently ignore errors
                                asyncCallback(null);
                                return;
                            }
                            // If there is no error, than push the connection object.
                            connectedObjArray.push(connectionObj);
                            asyncCallback(null);
                        });
                    },
                    function(err) {
                        callback(null, connectedObjArray);
                    }
            );
        };

        callback(null, roomObj);
    };


    /**
     * NOT YET IMPLEMENTED - Gets session object for a given easyrtcsid. Returns null if session not found.
     * The returned session object includes functions for managing session fields.
     *
     * @memberof    pub.appObj
     * @param       {string}    easyrtcsid      EasyRTC session identifier
     * @param       {function(?Error, Object=)} callback Callback with error and object containing EasyRTC session object.
     */
    appObj.session = function(easyrtcsid, callback) {

        if (!e.app[appName].session[easyrtcsid]) {
            pub.util.logWarning("Attempt to request non-existent easyrtcsid: '" + easyrtcsid + "'");
            callback(new pub.util.ApplicationWarning("Attempt to request non-existent easyrtcsid: '" + easyrtcsid + "'"));
            return;
        }

        /**
         * The primary method for interfacing with an EasyRTC session.
         *
         * @class       sessionObj
         * @memberof    pub.appObj
         */
        var sessionObj = {};


        /**
         * Expose all event functions
         *
         * @memberof    pub.appObj.sessionObj
         */
        sessionObj.events = pub.events;


        /**
         * Expose all utility functions
         *
         * @memberof    pub.appObj.sessionObj
         */
        sessionObj.util = pub.util;


        /**
         * Returns the application object to which the session belongs. Note that unlike most EasyRTC functions, this returns a value and does not use a callback.
         *
         * @memberof    pub.appObj.sessionObj
         * @return      {Object}    The application object
         */
        sessionObj.getApp = function() {
            return appObj;
        };


        /**
         * Returns the application name for the application to which the session belongs. Note that unlike most EasyRTC functions, this returns a value and does not use a callback.
         *
         * @memberof    pub.appObj.sessionObj
         * @return      {string}    The application name
         */
        sessionObj.getAppName = function() {
            return appName;
        };


        /**
         * Returns the easyrtcsid for the session.  Note that unlike most EasyRTC functions, this returns a value and does not use a callback.
         *
         * @memberof    pub.appObj.sessionObj
         * @return      {string}    Returns the easyrtcsid, which is the EasyRTC unique identifier for a session.
         */
        sessionObj.getEasyrtcsid = function() {
            return easyrtcsid;
        };

        /**
         * Returns the easyrtcsid for the session. Old SessionKey name kept for transition purposes. Use getEasyrtcsid();
         * 
         * @memberof    pub.appObj.sessionObj
         * @ignore
         */
        sessionObj.getSessionKey = sessionObj.getEasyrtcsid;


        /**
         * Returns session level field object for a given field name to a provided callback.
         *
         * @memberof    pub.appObj.sessionObj
         * @param       {string}    fieldName   Field name
         * @param       {function(?Error, Object=)} callback Callback with error and field value (any type)
         */
        sessionObj.getField = function(fieldName, callback) {
            if (!e.app[appName].session[easyrtcsid].field[fieldName]) {
                pub.util.logDebug("Can not find session field: '" + fieldName + "'");
                callback(new pub.util.ApplicationWarning("Can not find session field: '" + fieldName + "'"));
                return;
            }
            callback(null, pub.util.deepCopy(e.app[appName].session[easyrtcsid].field[fieldName]));
        };


        /**
         * Returns session level field object for a given field name. If the field is not set, it will return a field object will a null field value.  This is a synchronous function, thus may not be available in custom cases where state is not kept in memory.
         *
         * @memberof    pub.appObj.sessionObj
         * @param       {string}    fieldName   Field name
         * @returns     {Object}    Field object
         */
        sessionObj.getFieldSync = function(fieldName) {
            if (!e.app[appName].session[easyrtcsid].field[fieldName]) {
                return {"fieldName": fieldName, "fieldOption": {}, "fieldValue": null};
            }
            return pub.util.deepCopy(e.app[appName].session[easyrtcsid].field[fieldName]);
        };


        /**
         * Returns session level field value for a given field name. If the field is not set, it will return a null field value.  This is a synchronous function, thus may not be available in custom cases where state is not kept in memory.
         *
         * @memberof    pub.appObj.sessionObj
         * @param       {string}    fieldName   Field name
         * @returns     {?*}        Field value
         */
        sessionObj.getFieldValueSync = function(fieldName) {
            if (!e.app[appName].session[easyrtcsid].field[fieldName]) {
                return null;
            }
            return pub.util.deepCopy(e.app[appName].session[easyrtcsid].field[fieldName].fieldValue);
        };


        /**
         * Returns an object containing all field names and values within the session to a provided callback. Can be limited to fields with isShared option set to true.
         *
         * @memberof    pub.appObj.sessionObj
         * @param       {boolean}   limitToIsShared Limits returned fields to those which have the isShared option set to true.
         * @param       {function(?Error, Object=)} callback Callback with error and object containing field names and values.
         */
        sessionObj.getFields = function(limitToIsShared, callback) {
            var fieldObj = {};
            for (var fieldName in e.app[appName].session[easyrtcsid].field) {
                if (!limitToIsShared || e.app[appName].session[easyrtcsid].field[fieldName].fieldOption.isShared) {
                    fieldObj[fieldName] = {
                        fieldName: fieldName,
                        fieldValue: pub.util.deepCopy(e.app[appName].session[easyrtcsid].field[fieldName].fieldValue)
                    };
                }
            }
            callback(null, fieldObj);
        };


        /**
         * Sets session field value for a given field name.
         *
         * @memberof    pub.appObj.sessionObj
         * @param       {string}    fieldName       Must be formatted according to "fieldNameRegExp" option.
         * @param       {Object}    fieldValue
         * @param       {?Object}   fieldOption     Field options (such as isShared which defaults to false)
         * @param       {nextCallback} [next]       A success callback of form next(err). Possible err will be instanceof (ApplicationWarning).
         */
        sessionObj.setField = function(fieldName, fieldValue, fieldOption, next) {
            pub.util.logDebug("[" + appName + "] Session [" + easyrtcsid + "] - Setting field [" + fieldName + "]", fieldValue);
            if (!_.isFunction(next)) {
                next = pub.util.nextToNowhere;
            }

            if (!pub.getOption("fieldNameRegExp").test(fieldName)) {
                pub.util.logWarning("Can not create session field with improper name: '" + fieldName + "'");
                next(new pub.util.ApplicationWarning("Can not create session field with improper name: '" + fieldName + "'"));
                return;
            }

            e.app[appName].session[easyrtcsid].field[fieldName] = {
                fieldName: fieldName,
                fieldValue: fieldValue,
                fieldOption: {isShared: ((_.isObject(fieldOption) && fieldOption.isShared) ? true : false)}
            };

            next(null);
        };

        sessionObj.emitSessionDataFieldUpdate = function(next) {
            sessionObj.getFields(true, function(err, fieldObj) {
                if (err) {
                    next(err);
                    return;
                }
                var outgoingMsg = {"msgData": {"sessionData": {}}};
                outgoingMsg.msgData.sessionData = {
                    "easyrtcsid": easyrtcsid,
                    "sessionStatus": "update"
                };
                outgoingMsg.msgData.sessionData.field = fieldObj;
                // Loop through all active connection objects belonging to session
                async.each(
                    Object.keys(e.app[appName].session[easyrtcsid].toConnection),
                    function(currentEasyrtcid, asyncCallback) {

                        // Retrieve a connection object, then send the sessionData message.
                        appObj.connection(currentEasyrtcid, function(err, targetConnectionObj) {
                            if (err || !_.isObject(targetConnectionObj)) {
                                pub.util.logDebug("[" + currentEasyrtcid + "] Could not get connection object to send session data field update. Client may have disconnected.");
                                asyncCallback(null);
                                return;
                            }

                            // Emit sessionData easyrtcCmd to each connection
                            pub.events.emit("emitEasyrtcCmd", targetConnectionObj, "sessionData", outgoingMsg, function(msg) {
                            }, function(err) {
                                // Ignore errors if unable to send to a socket. 
                                asyncCallback(null);
                            });
                        });
                    },
                    function(err) {
                        next(null);
                    }
                );
            });
        };

        callback(null, sessionObj);
    };

    callback(null, appObj);
};


// Documenting global callbacks
/**
 * The next callback is called upon completion of a method. If the `err` parameter is null, than the method completed successfully.
 *
 * @callback nextCallback
 * @param {?Error}      err         Optional Error object. If it is null, than assume no error has occurred.
 */


/**
 * The application callback is called upon completion of a method which is meant to deliver an application object. If the `err` parameter is null, than the method completed successfully.
 *
 * @callback appCallback
 * @param {?Error}      err         Error object. If it is null, than assume no error has occurred.
 * @param {?Object}     appObj      Application object. Will be null if an error has occurred.
 */


/**
 * The connection callback is called upon completion of a method which is meant to deliver a connection object. If the `err` parameter is null, than the method completed successfully.
 *
 * @callback connectionCallback
 * @param {?Error}      err         Error object. If it is null, than assume no error has occurred.
 * @param {?Object}     connectionObj Connection object. Will be null if an error has occurred.
 */


/**
 * The room callback is called upon completion of a method which is meant to deliver a room object. If the `err` parameter is null, than the method completed successfully.
 *
 * @callback roomCallback
 * @param {?Error}      err         Error object. If it is null, than assume no error has occurred.
 * @param {?Object}     roomObj     Room object. Will be null if an error has occurred.
 */

// Documenting Custom Type-Definitions
/**
 * An error object
 *
 * @typedef {Object} Error
 */

// Running the default listeners to initialize the events
pub.events.setDefaultListeners();
