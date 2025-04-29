/* global module, require */

/**
 * @file        Maintains private object used within EasyRTC for holding in-memory state information
 * @module      OpenEasyRTC
 * @author      Open-EasyRTC
 * @copyright   Copyright 2022 Open-EasyRTC. All rights reserved.
 * @license     BSD v2, see LICENSE file in module root folder.
 */

// Internals dependencies
const easyrtc_utils = require("./../utils"); // General utility functions local module

// TODO migreate to ES6 or TypeScript
module.exports = function Room(appName, roomName, appObj, server) {

    // TODO appObj = server.getApp

    /**
     * EasyRTC Room Object. Contains methods for handling a specific room including determining which connections have joined.
     *
     * @class       roomObj
     */
    const roomObj = {};

    /**
     * Expose all event functions
     */
    // TODO namespace filter;
    //roomObj.events = server.events;

    /**
     * Returns the application name for the application to which the room belongs. Note that unlike most EasyRTC functions, this returns a value and does not use a callback.
     *
     * @memberof    roomObj
     * @return      {string}    The application name
     */
    roomObj.getAppName = function() {
        return appName;
    };

    /**
     * Returns the room name for the current room. Note that unlike most EasyRTC functions, this returns a value and does not use a callback.
     *
     * @memberof    roomObj
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
                easyrtc_utils.logWarning("Attempt to request non-existent room name: '" + roomName + "'");
                next(new easyrtc_utils.ApplicationWarning("Attempt to request non-existent room name: '" + roomName + "'"));
                return;
            }

            var outgoingMsg = {"msgData": {"roomData": {}}};
            outgoingMsg.msgData.roomData[roomName] = {
                "roomName": roomName,
                "roomStatus": "update"
            };
            outgoingMsg.msgData.roomData[roomName].field = fieldObj;

            async.each(
                    Object.keys(server.app[appName].room[roomName].clientList),
                    function(currentEasyrtcid, asyncCallback) {

                        // Skip a given easyrtcid?
                        if (skipEasyrtcid && (skipEasyrtcid === currentEasyrtcid)) {
                            asyncCallback(null);
                            return;
                        }

                        // Retrieve a connection object, then send the roomData message.
                        appObj.connection(currentEasyrtcid, function(err, targetConnectionObj) {

                            if (err || !_.isObject(targetConnectionObj)) {
                                easyrtc_utils.logDebug("[" + currentEasyrtcid + "] Could not get connection object to send room data field update. Client may have disconnected.");
                                asyncCallback(null);
                                return;
                            }

                            server.events.emit("emitEasyrtcCmd", targetConnectionObj, "roomData", outgoingMsg, function(msg) {
                                // TODO add ?
                                // syncCallback(null);
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
     * @memberof    roomObj
     * @param       {string}    fieldName   Field name
     * @param       {function(?Error, Object=)} callback Callback with error and field object (any type)
     */
    roomObj.getField = function(fieldName, callback) {
        if (!appObj.isRoomSync(roomName)) {
            easyrtc_utils.logWarning("Attempt to request non-existent room name: '" + roomName + "'");
            callback(new easyrtc_utils.ApplicationWarning("Attempt to request non-existent room name: '" + roomName + "'"));
            return;
        }
        if (!server.app[appName].room[roomName].field[fieldName]) {
            easyrtc_utils.logDebug("Can not find room field: '" + fieldName + "'");
            callback(new easyrtc_utils.ApplicationWarning("Can not find room field: '" + fieldName + "'"));
            return;
        }
        callback(null, easyrtc_utils.deepCopy(server.app[appName].room[roomName].field[fieldName]));
    };

    /**
     * Returns room level field object for a given field name. If the field is not set, it will return a field value will a null field value.  This is a synchronous function, thus may not be available in custom cases where state is not kept in memory.
     *
     * @memberof    roomObj
     * @param       {string}    fieldName   Field name
     * @returns     {Object}        Field object
     */
    roomObj.getFieldSync = function(fieldName) {
        if (!appObj.isRoomSync(roomName)) {
            return {"fieldName": fieldName, "fieldOption": {}, "fieldValue": null};
        }
        if (!server.app[appName].room[roomName].field[fieldName]) {
            return {"fieldName": fieldName, "fieldOption": {}, "fieldValue": null};
        }
        return easyrtc_utils.deepCopy(server.app[appName].room[roomName].field[fieldName]);
    };

    /**
     * Returns room level field value for a given field name. If the field is not set, it will return a null field value.  This is a synchronous function, thus may not be available in custom cases where state is not kept in memory.
     *
     * @memberof    roomObj
     * @param       {string}    fieldName   Field name
     * @returns     {?*}        Field value
     */
    roomObj.getFieldValueSync = function(fieldName) {
        if (!appObj.isRoomSync(roomName)) {
            return null;
        }
        if (!server.app[appName].room[roomName].field[fieldName]) {
            return null;
        }
        return easyrtc_utils.deepCopy(server.app[appName].room[roomName].field[fieldName].fieldValue);
    };

    /**
     * Returns an object containing all field names and values within the room. Can be limited to fields with isShared option set to true.
     *
     * @memberof    roomObj
     * @param       {boolean}   limitToIsShared Limits returned fields to those which have the isShared option set to true.
     * @param       {function(?Error, Object=)} callback Callback with error and object containing field names and values.
     */
    roomObj.getFields = function(limitToIsShared, callback) {
        if (!appObj.isRoomSync(roomName)) {
            easyrtc_utils.logWarning("Attempt to request non-existent room name: '" + roomName + "'");
            callback(new easyrtc_utils.ApplicationWarning("Attempt to request non-existent room name: '" + roomName + "'"));
            return;
        }
        var fieldObj = {};
        for (var fieldName in server.app[appName].room[roomName].field) {
            if (!limitToIsShared || server.app[appName].room[roomName].field[fieldName].fieldOption.isShared) {
                fieldObj[fieldName] = {
                    fieldName: fieldName,
                    fieldValue: easyrtc_utils.deepCopy(server.app[appName].room[roomName].field[fieldName].fieldValue)
                };
            }
        }
        callback(null, fieldObj);
    };

    /**
     * Gets individual option value. Will first check if option is defined for the room, else it will revert to the application level option (which will in turn fall back to the global level).
     *
     * @memberof    roomObj
     * @param       {String}    optionName  Option name
     * @return      {*}         Option value (can be any type)
     */
    roomObj.getOption = function(optionName) {
        return ((!appObj.isRoomSync(roomName) || server.app[appName].room[roomName].option[optionName] === undefined) ? appObj.getOption(optionName) : (server.app[appName].room[roomName].option[optionName]));
    };

    /**
     * Sets individual option which applies only to this room. Set value to NULL to delete the option (thus reverting to global option)
     *
     * @memberof    roomObj
     * @param       {Object}    optionName  Option name
     * @param       {Object}    optionValue Option value
     * @return      {Boolean}               true on success, false on failure
     */
    roomObj.setOption = function(optionName, optionValue) {
        if (!appObj.isRoomSync(roomName)) {
            easyrtc_utils.logWarning("Attempt to request non-existent room name: '" + roomName + "'");
            return false;
        }
        // Can only set options which currently exist
        if (server.option.hasOwnProperty(optionName)) {

            // If value is null, delete option from application (reverts to global option)
            if (optionValue === null || optionValue === undefined) {
                if (server.app[appName].option.hasOwnProperty(optionName)) {
                    delete server.app[appName].room[roomName].option[optionName];
                }
            } else {
                // Set the option value to be a full deep copy, thus preserving private nature of the private EasyRTC object.
                server.app[appName].room[roomName].option[optionName] = easyrtc_utils.deepCopy(optionValue);
            }
            return true;
        } else {

            easyrtc_utils.logError("Error setting option. Unrecognised option name '" + optionName + "'.");
            return false;
        }
    };

    /**
     * Incomplete function for setting an easyrtcid as being a client in a room.
     *
     * @memberof    roomObj
     * @param       {string}    easyrtcid   EasyRTC unique identifier for a socket connection.
     * @param       {nextCallback} next     A success callback of form next(err).
     * @ignore
     */
    roomObj.setConnection = function(easyrtcid, next) {
        if (!appObj.isRoomSync(roomName)) {
            easyrtc_utils.logWarning("Attempt to request non-existent room name: '" + roomName + "'");
            next(new easyrtc_utils.ApplicationWarning("Attempt to request non-existent room name: '" + roomName + "'"));
            return;
        }
        easyrtc_utils.logWarning("Using deprecated roomObj.setConnection() function");
        server.app[appName].room[roomName].clientList[easyrtcid] = {enteredOn: Date.now()};
        next(null);
    };

    /**
     * Sets room field value for a given field name.
     *
     * @memberof    roomObj
     * @param       {string}    fieldName       Must be formatted according to "fieldNameRegExp" option.
     * @param       {Object}    fieldValue
     * @param       {?Object}   fieldOption     Field options (such as isShared which defaults to false)
     * @param       {nextCallback} [next]       A success callback of form next(err). Possible err will be instanceof (ApplicationWarning).
     */
    roomObj.setField = function(fieldName, fieldValue, fieldOption, next) {
        if (!appObj.isRoomSync(roomName)) {
            easyrtc_utils.logWarning("Attempt to request non-existent room name: '" + roomName + "'");
            next(new easyrtc_utils.ApplicationWarning("Attempt to request non-existent room name: '" + roomName + "'"));
            return;
        }
        easyrtc_utils.logDebug("[" + appName + "] Room [" + roomName + "] - Setting field [" + fieldName + "]", fieldValue);
        if (!_.isFunction(next)) {
            next = easyrtc_utils.nextToNowhere;
        }

        if (!server.getOption("fieldNameRegExp").test(fieldName)) {
            easyrtc_utils.logWarning("Can not create room field with improper name: '" + fieldName + "'");
            next(new easyrtc_utils.ApplicationWarning("Can not create room field with improper name: '" + fieldName + "'"));
            return;
        }

        server.app[appName].room[roomName].field[fieldName] = {
            fieldName: fieldName,
            fieldValue: fieldValue,
            fieldOption: {isShared: ((_.isObject(fieldOption) && fieldOption.isShared) ? true : false)}
        };

        next(null);
    };

    /**
     * Sends the count of the number of connections in a room to a provided callback.
     *
     * @memberof    roomObj
     * @param       {function(?Error, Number)} callback Callback with error and array containing all easyrtcids.
     */
    roomObj.getConnectionCount = function(callback) {
        if (!appObj.isRoomSync(roomName)) {
            easyrtc_utils.logWarning("Attempt to request non-existent room name: '" + roomName + "'");
            callback(new easyrtc_utils.ApplicationWarning("Attempt to request non-existent room name: '" + roomName + "'"));
            return;
        }
        callback(null, roomObj.getConnectionCountSync());
    };

    /**
     * Sends the count of the number of connections in a room to a provided callback. Returns 0 if room doesn't exist.
     *
     * @memberof    roomObj
     * @returns     {Number} The current number of connections in a room.
     */
    roomObj.getConnectionCountSync = function() {
        if (!appObj.isRoomSync(roomName)) {
            easyrtc_utils.logWarning("Attempt to request non-existent room name: '" + roomName + "'");
            return 0;
        }
        return _.size(server.app[appName].room[roomName].clientList);
    };

    /**
     * Returns an array containing the easyrtcids of all connected clients within the room.
     *
     * @memberof    roomObj
     * @param {function(?Error, Array.<string>=)} callback Callback with error and array containing all easyrtcids.
     */
    roomObj.getConnections = function(callback) {
        if (!appObj.isRoomSync(roomName)) {
            easyrtc_utils.logWarning("Attempt to request non-existent room name: '" + roomName + "'");
            callback(new easyrtc_utils.ApplicationWarning("Attempt to request non-existent room name: '" + roomName + "'"));
            return;
        }
        var connectedEasyrtcidArray = Object.keys(server.app[appName].room[roomName].clientList);
        callback(null, connectedEasyrtcidArray);
    };

    /**
     * Returns the connectionObj for a given easyrtcid, but only if it is currently a client in the room
     *
     * @memberof    roomObj
     * @param       {string}    easyrtcid   EasyRTC unique identifier for a socket connection.
     * @param {function(?Error, Object=)} callback Callback with error and connectionObj.
     */
    roomObj.getConnectionWithEasyrtcid = function(easyrtcid, callback) {
        if (!appObj.isRoomSync(roomName)) {
            easyrtc_utils.logWarning("Attempt to request non-existent room name: '" + roomName + "'");
            callback(new easyrtc_utils.ApplicationWarning("Attempt to request non-existent room name: '" + roomName + "'"));
            return;
        }
        if (server.app[appName].room[roomName].clientList[easyrtcid]) {
            appObj.connection(easyrtcid, function(err, connectionObj) {
                if (err) {
                    callback(new easyrtc_utils.ConnectionWarning("Can not find connection [" + easyrtcid + "] in room."));
                    return;
                }
                // If there is no error, than run callback with the connection object.
                callback(null, connectionObj);
            });
        }
        else {
            callback(new easyrtc_utils.ConnectionWarning("Can not find connection [" + easyrtcid + "] in room."));
        }
    };

    /**
     * Returns an array containing the connectionObjs of all connected clients within the room.
     *
     * @memberof    roomObj
     * @param {function(?Error, Array.<Object>=)} callback Callback with error and array containing connectionObjs.
     */
    roomObj.getConnectionObjects = function(callback) {
        if (!appObj.isRoomSync(roomName)) {
            easyrtc_utils.logWarning("Attempt to request non-existent room name: '" + roomName + "'");
            callback(new easyrtc_utils.ApplicationWarning("Attempt to request non-existent room name: '" + roomName + "'"));
            return;
        }
        var connectedObjArray = [];
        async.each(Object.keys(server.app[appName].room[roomName].clientList),
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

    return roomObj;
}