
// Externals dependencies
var async = require("async");
var _ = require("underscore"); // General utility functions external module

// Internals dependencies
var easyrtc = require("./../easyrtc_private_obj"); // EasyRTC private object
var pub = require("./../easyrtc_public_obj"); // EasyRTC public object

// TODO migreate to ES6 or TypeScript
module.exports = function Connection(appName, socketId, easyrtcid, appObj) {

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
    // TODO namespace filter;
    connectionObj.events = pub.events;


    /**
     * Expose all utility functions
     *
     * @memberof    pub.appObj.connectionObj
     */
    // WHY ?
    //connectionObj.util = pub.util;


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
        async.waterfall([
            function(asyncCallback) {
                // Get array of rooms
                connectionObj.getRoomNames(asyncCallback);
            },
            function(roomNames, asyncCallback) {
                // leave all rooms
                async.each(roomNames,
                    function(currentRoomName, asyncEachCallback) {
                        pub.events.emit("roomLeave", connectionObj, currentRoomName, function(err) {
                            asyncEachCallback(null);
                        });
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
        var hasField = easyrtc.app.hasOwnProperty(appName) &&
            easyrtc.app[appName].hasOwnProperty('connection') &&
                easyrtc.app[appName].connection.hasOwnProperty(easyrtcid) &&
                    easyrtc.app[appName].connection[easyrtcid].hasOwnProperty('field') &&
                        easyrtc.app[appName].connection[easyrtcid].field.hasOwnProperty(fieldName);

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
        if (
            connectionObj.hasFieldValueSync(fieldName) &&
                easyrtc.app[appName].connection[easyrtcid]
        ) {
            callback(null, pub.util.deepCopy(easyrtc.app[appName].connection[easyrtcid].field[fieldName]));
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
                easyrtc.app[appName].connection[easyrtcid]
        ) {
            return pub.util.deepCopy(easyrtc.app[appName].connection[easyrtcid].field[fieldName]);
        } else {
            return {
                "fieldName": fieldName,
                "fieldOption": {},
                "fieldValue": null
            };
        }
    };


    /**
     * Returns connection level field value for a given field name. If the field is not set, it will return a null field value.
     * This is a synchronous function, thus may not be available in custom cases where state is not kept in memory.
     *
     * @memberof    pub.appObj.connectionObj
     * @param       {string}    fieldName       Field name
     * @returns     {?*}        Field value
     */
    connectionObj.getFieldValueSync = function(fieldName) {
        if (connectionObj.hasFieldValueSync(fieldName) &&
            easyrtc.app[appName].connection[easyrtcid]) {
            return pub.util.deepCopy(easyrtc.app[appName].connection[easyrtcid].field[fieldName].fieldValue);
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
        if (easyrtc.app[appName].connection[easyrtcid]) {
           for (var fieldName in easyrtc.app[appName].connection[easyrtcid].field) {
                if (!easyrtc.app[appName].connection.hasOwnProperty(easyrtcid)) {
                    continue;
                }
                if (!limitToIsShared || easyrtc.app[appName].connection[easyrtcid].field[fieldName].fieldOption.isShared) {
                   fieldObj[fieldName] = {
                       fieldName: fieldName,
                       fieldValue: pub.util.deepCopy(easyrtc.app[appName].connection[easyrtcid].field[fieldName].fieldValue)
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
        if (easyrtc.app[appName].connection[easyrtcid]) {
           roomNames = Object.keys(easyrtc.app[appName].connection[easyrtcid].room);
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
            easyrtc.app[appName].connection[easyrtcid] &&
                easyrtc.app[appName].connection[easyrtcid].toSession &&
                    easyrtc.app[appName].connection[easyrtcid].toSession.easyrtcsid
        ) {
            appObj.session(easyrtc.app[appName].connection[easyrtcid].toSession.easyrtcsid, callback);
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
        if (easyrtc.app[appName].connection[easyrtcid]) {
             return easyrtc.app[appName].connection[easyrtcid].username;
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
        return easyrtc.app[appName].connection[easyrtcid].credential;
    };

    /**
     * Joins the connection to a specified session. A connection can only be assigned to one session.
     *
     * @memberof    pub.appObj.connectionObj
     * @param       {string}    easyrtcsid      EasyRTC session identifier
     * @param       {nextCallback} next         A success callback of form next(err).
     */
    connectionObj.joinSession = function(easyrtcsid, next) {
        if (!easyrtc.app[appName].session[easyrtcsid]) {
            next(new pub.util.ConnectionWarning("[" + appName + "][" + easyrtcid + "] Session [" + easyrtcsid + "] does not exist. Could not join session"));
            return;
        }

        appObj.session(easyrtcsid, function(err, sessionObj) {
            if (err) {
                next(err);
                return;
            }

            if(!easyrtc.app[appName] || !easyrtc.app[appName].connection[easyrtcid] || !easyrtc.app[appName].session[easyrtcsid]) {
                next(new pub.util.ConnectionWarning("[" + appName + "][" + easyrtcid + "] Session [" + easyrtcsid + "] does not exist. Could not join session"));
                return;
            }

            easyrtc.app[appName].connection[easyrtcid].toSession = easyrtc.app[appName].session[easyrtcsid];
            easyrtc.app[appName].connection[easyrtcid].toSession.toConnection[easyrtcid] = easyrtc.app[appName].connection[easyrtcid];

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
        if( !easyrtc.app[appName].connection[easyrtcid]) {
            next(new pub.util.ConnectionWarning("[" + appName + "][" + easyrtcid + "] Connection [" + easyrtcid + "] does not exist. Could not authenticate"));
            return;
        }

        if (isAuthenticated) {
            easyrtc.app[appName].connection[easyrtcid].isAuthenticated = true;
        } else {
            easyrtc.app[appName].connection[easyrtcid].isAuthenticated = false;
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
        if (easyrtc.app[appName].connection[easyrtcid]) {
           easyrtc.app[appName].connection[easyrtcid].credential = credential;
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

        if (easyrtc.app[appName].connection[easyrtcid]) {
           easyrtc.app[appName].connection[easyrtcid].field[fieldName] = {
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
        if (easyrtc.app[appName].connection[easyrtcid]) {
            if (presenceObj.show !== undefined) {
                easyrtc.app[appName].connection[easyrtcid].presence.show = presenceObj.show;
            }
            if (presenceObj.status !== undefined) {
                easyrtc.app[appName].connection[easyrtcid].presence.status = presenceObj.status;
            }
            if (presenceObj.type !== undefined) {
                easyrtc.app[appName].connection[easyrtcid].presence.type = presenceObj.type;
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
        if (easyrtc.app[appName].connection[easyrtcid]) {
            easyrtc.app[appName].connection[easyrtcid].username = username;
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
                    var clientList = easyrtc.app[appName].room[currentRoomName].clientList;
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
            roomMap = easyrtc.app[appName].connection[easyrtcid].room;
        }

        var roomData = {};
        if( !easyrtc.app[appName].connection[easyrtcid]) {
           callback(null, roomData);
           return;
        }
        for (var currentRoomName in easyrtc.app[appName].connection[easyrtcid].room) {
            if (easyrtc.app[appName].connection[easyrtcid].room.hasOwnProperty(currentRoomName)) {

                // If room is not in the provided roomMap, then skip it.
                if (!roomMap[currentRoomName]) {
                    continue;
                }

                var connectionRoom = easyrtc.app[appName].connection[easyrtcid].room[currentRoomName];
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

        if (!easyrtc.app[appName].connection[easyrtcid]) {
            pub.util.logWarning("Attempt to request non-existent connection key: '" + easyrtcid + "'");
            callback(new pub.util.ConnectionWarning("Attempt to request non-existent connection key: '" + easyrtcid + "'"));
            return;
        }

        pub.util.logDebug("[" + appName + "][" + easyrtcid + "] Running func 'connectionObj.generateRoomDataDelta'");

        var roomDataDelta = {};

        if( !easyrtc.app[appName].connection[easyrtcid]) {
            callback(null, roomDataDelta);
            return;
        }
        // set the roomData's clientListDelta for each room the client is in
        for (var currentRoomName in easyrtc.app[appName].connection[easyrtcid].room) {
            if (easyrtc.app[appName].connection[easyrtcid].room.hasOwnProperty(currentRoomName)) {
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
                        "roomJoinTime": easyrtc.app[appName].connection[easyrtcid].room[currentRoomName].enteredOn,
                        "presence": easyrtc.app[appName].connection[easyrtcid].presence
                    };

                    if (!_.isEmpty(easyrtc.app[appName].connection[easyrtcid].apiField)) {
                        roomDataDelta[currentRoomName].clientListDelta.updateClient[easyrtcid].apiField = easyrtc.app[appName].connection[easyrtcid].apiField;
                    }
                    if (easyrtc.app[appName].connection[easyrtcid].username) {
                        roomDataDelta[currentRoomName].clientListDelta.updateClient[easyrtcid].username = easyrtc.app[appName].connection[easyrtcid].username;
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

        for (var currentRoomName in easyrtc.app[appName].room) {
            if (easyrtc.app[appName].room.hasOwnProperty(currentRoomName)) {
                roomList[currentRoomName] = {
                    "roomName": currentRoomName,
                    "numberClients": _.size(easyrtc.app[appName].room[currentRoomName].clientList)
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
            easyrtc.app[appName].connection.hasOwnProperty(easyrtcid) &&
                easyrtc.app[appName].connection[easyrtcid].isAuthenticated
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
                easyrtc.app[appName].connection.hasOwnProperty(easyrtcid) &&
                    easyrtc.app[appName].connection[easyrtcid].group.hasOwnProperty(groupName)
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
                easyrtc.app[appName].connection.hasOwnProperty(easyrtcid) &&
                    easyrtc.app[appName].connection[easyrtcid].room.hasOwnProperty(roomName)
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
        if( !easyrtc.app[appName].connection[easyrtcid]) {
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

        if (!easyrtc.app[appName].connection[easyrtcid]) {
            pub.util.logWarning("Attempt to request non-existent connection key: '" + easyrtcid + "'");
            callback(new pub.util.ConnectionWarning("Attempt to request non-existent connection key: '" + easyrtcid + "'"));
            return;
        }

        // Check if client already in room
        if (easyrtc.app[appName].connection[easyrtcid].room[roomName]) {
            connectionObj.room(roomName, callback);
            return;
        }

        // Local private function to create the default connection-room object in the private variable
        var createConnectionRoom = function(roomName, appRoomObj, callback) {
            // Join room. Creates a default connection room object
            easyrtc.app[appName].connection[easyrtcid].room[roomName] = {
                apiField: {},
                enteredOn: Date.now(),
                gotListOn: Date.now(),
                clientList: {},
                toRoom: easyrtc.app[appName].room[roomName]
            };

            // Add easyrtcid to room clientList
            easyrtc.app[appName].room[roomName].clientList[easyrtcid] = {
                enteredOn: Date.now(),
                modifiedOn: Date.now(),
                toConnection: easyrtc.app[appName].connection[easyrtcid]
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
        if( !easyrtc.app[appName].connection[easyrtcid]) {
            pub.util.logWarning("Zombie attempt to request room name: '" + roomName + "'");
            callback(new pub.util.ConnectionWarning("Attempt to request non-existent room name: '" + roomName + "'"));
            return;
        }

        if (_.isUndefined(easyrtc.app[appName].connection[easyrtcid].room[roomName])) {
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
                easyrtc.app[appName].room[roomName].modifiedOn = Date.now();
                delete easyrtc.app[appName].room[roomName].clientList[easyrtcid];
            }

            if (easyrtc.app[appName].connection[easyrtcid]) {
                delete easyrtc.app[appName].connection[easyrtcid].room[roomName];
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

                for (var currentEasyrtcid in easyrtc.app[appName].room[roomName].clientList) {
                    if (easyrtc.app[appName].room[roomName].clientList.hasOwnProperty(currentEasyrtcid)) {
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
            if( !easyrtc.app[appName].connection[easyrtcid]) {
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
                var connectionRoom = easyrtc.app[appName].connection[easyrtcid].room[roomName];
                roomDataDelta.clientListDelta.updateClient = {};
                roomDataDelta.clientListDelta.updateClient[easyrtcid] = {
                    "easyrtcid": easyrtcid,
                    "roomJoinTime": easyrtc.app[appName].connection[easyrtcid].room[roomName].enteredOn,
                    "presence": easyrtc.app[appName].connection[easyrtcid].presence
                };

                if (!_.isEmpty(easyrtc.app[appName].connection[easyrtcid].room[roomName].apiField)) {
                    roomDataDelta.clientListDelta.updateClient[easyrtcid].apiField = easyrtc.app[appName].connection[easyrtcid].room[roomName].apiField;
                }
                if (easyrtc.app[appName].connection[easyrtcid].username) {
                    roomDataDelta.clientListDelta.updateClient[easyrtcid].username = easyrtc.app[appName].connection[easyrtcid].username;
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
            if (easyrtc.app[appName].connection[easyrtcid]) {

                easyrtc.app[appName].connection[easyrtcid].room[roomName].apiField = pub.util.deepCopy(apiFieldObj);
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
        if (easyrtc.app[appName] && _.isObject(easyrtc.app[appName].connection) && easyrtc.app[appName].connection[easyrtcid]) {
            easyrtc.app[appName].connection[easyrtcid].isAuthenticated = false;
            // Remove link to connection from session in local storage
            if (easyrtc.app[appName].connection[easyrtcid].toSession) {
                delete easyrtc.app[appName].connection[easyrtcid].toSession.toConnection[easyrtcid];
            }

            // Remove connection from local storage
            delete easyrtc.app[appName].connection[easyrtcid];
        }
        next(null);
    };

    return connectionObj;
}