/* global module, require, console, process */

/**
 * Public interface for interacting with server. Contains the public object returned by the EasyRTC listen() function.
 *
 * @module      easyrtc_public_obj
 * @author      Open-EasyRTC
 * @copyright   Copyright 2022 Open-EasyRTC. All rights reserved.
 * @license     BSD v2, see LICENSE file in module root folder.
 */

// Externals dependencies
var events = require("events");
var async = require("async");
var _ = require("underscore"); // General utility functions external module

// Internals dependencies
var utils = require("./utils");
var server = require("./easyrtc_private_obj"); // EasyRTC private object
var easyrtc_utils = require("./easyrtc_utils"); // General utility functions local module

var Application = require('./classes/application');

/**
 * The public object which is returned by the EasyRTC listen() function. Contains all public methods for interacting with EasyRTC server.
 *
 * @class
 */
var pub = module.exports;

/**
 * Gets EasyRTC Version. The format is in a major.minor.patch format with an optional letter following denoting alpha or beta status. The version is retrieved from the package.json file located in the EasyRTC project root folder.
 *
 * @return      {string}                EasyRTC Version
 */
pub.getVersion = () => utils.getPackageData("version");

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
 * Alias for Express app object. Set during Listen()
 *
 * @member  {Object}    pub.httpApp
 */
// TODO
//server = new Server();
pub.server = server;


/**
 * EasyRTC Event handling object which contain most methods for interacting with EasyRTC events.
 * For convenience, this class has also been attached to the application, connection, session, and room classes.
 * @class
 */
pub.events = server.events;

/**
 * Alias for easyrtc_utils object. Set during Listen()
 *
 * @member  {Object}    pub.util
 */
pub.util = easyrtc_utils;

// TODO use server instance to configure logs
const log = easyrtc_utils.log;
pub.util.log = (level, logText, logFields) => {
    return log(level, logText, logFields, () => {
        server.events.emit("log", level, logText, logFields);
    });
};


/*

pub.util = {
    ...easyrtc_utils,
    ...easyrtc_error,
    log: function (level, logText, logFields) {
        easyrtc_utils.log(level, logText, logFields, () => {
            server.events.emit("log", level, logText, logFields);
        });
    },
    set logLevel(logLevel) {
        easyrtc_utils.logLevel = logLevel;
    }
};*/

/// TODO migrate to server

/**
 * Returns a random available easyrtcid.
 *
 * @function
 * @return  {String} Available easyrtcid. A unique identifier for an EasyRTC connection.
 */
pub.getAvailableEasyrtcid = function() {
    var newEasyrtcid = "";
    var easyrtcidExists = false;

    do {
        newEasyrtcid = utils.randomString();
        easyrtcidExists = false;

        for (var key in server.app) {
            if (server.app[key].connection[newEasyrtcid]) {
                easyrtcidExists = true;
                break;
            }
        }
    } while (easyrtcidExists);

    return newEasyrtcid;
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
    for (var appName in server.app) {
        if (server.app.hasOwnProperty(appName)) {
            connectionCount = connectionCount + _.size(server.app[appName].connection);
        }
    }
    return connectionCount;
};

/**
 * Gets app object for application which has an authenticated client with a given easyrtcid
 *
 * @param       {String} easyrtcid      Unique identifier for an EasyRTC connection.
 * @param       {function(?Error, Object=)} callback Callback with error and application object
 */
pub.getAppWithEasyrtcid = function(easyrtcid, callback) {
    for (var appName in server.app) {
        if (server.app.hasOwnProperty(appName)) {
            if (
                server.app[appName].connection.hasOwnProperty(easyrtcid) &&
                    server.app[appName].connection[easyrtcid].isAuthenticated
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
 * Gets connection object for connection which has an authenticated client with a given easyrtcid
 *
 * @param       {string} easyrtcid      EasyRTC unique identifier for a socket connection.
 * @param       {function(?Error, Object=)} callback Callback with error and connection object
 */
pub.getConnectionWithEasyrtcid = function(easyrtcid, callback) {
    for (var appName in server.app) {
        if (server.app.hasOwnProperty(appName)) {
            if (
                server.app[appName].connection.hasOwnProperty(easyrtcid) &&
                    server.app[appName].connection[easyrtcid].isAuthenticated
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
        callback = function(err, appObj) { };
    }
    if (!appName || !pub.getOption("appNameRegExp").test(appName)) {
        pub.util.logWarning("Can not create application with improper name: '" + appName + "'");
        callback(new pub.util.ApplicationWarning("Can not create application with improper name: '" + appName + "'"));
        return;
    }
    if (server.app[appName]) {
        pub.util.logWarning("Can not create application which already exists: '" + appName + "'");
        callback(new pub.util.ApplicationWarning("Can not create application which already exists: '" + appName + "'"));
        return;
    }
    if (!_.isObject(options)) {
        options = {};
    }

    pub.util.logDebug("Creating application: '" + appName + "'");

    // TODO versus
    //server.app[appName] = new Application(appName, server);

    server.app[appName] = {
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
        async.each(
            Object.keys(options),
            function(currentOptionName, asyncCallback) {
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
            }
        );
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

    if (!appName) {
        appName = pub.getOption("appDefaultName");
    }

    if (!_.isFunction(callback)) {
        callback = function(err, appObj) { };
    }

    if (!server.app[appName]) {
        pub.util.logDebug("Attempt to request non-existent application name: '" + appName + "'");
        callback(new pub.util.ApplicationWarning("Attempt to request non-existent application name: '" + appName + "'"));
        return;
    }

    const appObj = new Application(appName, server);

    callback(null, appObj);
};

// LEGACY Alias

/**
 * Sends an array of all application names to a callback.
 *
 * @param   {function(Error, Array.<string>)} callback Callback with error and array containing all application names.
 */
pub.getAppNames = (callback) => server.getAppNames(callback);

/**
 * Sets individual option. The option value set is for the server level.
 *
 * Note that some options can be set at the application or room level. If an option has not been set at the room level, it will check to see if it has been set at the application level, if not it will revert to the server level.
 *
 * @param       {Object} optionName     Option name
 * @param       {Object} optionValue    Option value
 * @return      {Boolean}               true on success, false on failure
 */
pub.setOption = (optionName, optionValue) => server.setOption(optionName, optionValue);


/**
 * Gets individual option value. The option value returned is for the server level.
 *
 * Note that some options can be set at the application or room level. If an option has not been set at the room level, it will check to see if it has been set at the application level, if not it will revert to the server level.
 *
 * @param       {String}    optionName  Option name
 * @return      {*}                     Option value (can be any JSON type)
 */
pub.getOption = (optionName) => server.getOption(optionName);

/**
 * Determine if a given application name has been defined.
 *
 * @param       {string} appName        Application name which uniquely identifies it on the server.
 * @param       {function(?Error, boolean)} callback Callback with error and boolean of whether application is defined.
 */
pub.isApp = (appName, callback) => server.isApp(appName, callback);

/// TODO Need to be in server

/**
 * Will attempt to deliver an EasyRTC session id via a cookie. Requires that session management be enabled from within Express.
 *
 * @param       {Object} req            Http request object
 * @param       {Object} res            Http result object
 */
pub.util.sendSessionCookie = function(req, res) {
    // If sessions or session cookies are disabled, return without an error.
    if (!server.getOption("sessionEnable") || !server.getOption("sessionCookieEnable")) {
        return;
    }

    // TODO allow easyrtcsid value for cookie name options
    if (req.sessionID && (!req.cookies || !req.cookies.easyrtcsid || req.cookieseasyrtcsid !== req.sessionID)) {
        try {
            easyrtc_utils.logDebug("Sending easyrtcsid cookie [" + req.sessionID + "] to [" + req.ip + "] for request [" + req.url + "]");
            res.cookie("easyrtcsid", req.sessionID, {
                maxAge: 2592000000,
                httpOnly: false
            });
        } catch (e) {
            easyrtc_utils.logWarning("Problem setting easyrtcsid cookie [" + req.sessionID + "] to [" + req.ip + "] for request [" + req.url + "]");
        }
    }
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
    var getOption = (_.isObject(appObj) ? appObj.getOption.bind(appObj) : server.getOption.bind(server));

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

            return; /* jshint ignore:line */
        break; /* jshint ignore:line */

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
