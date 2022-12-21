
// Externals dependencies
var async = require("async");
var _ = require("underscore"); // General utility functions external module

// Internals dependencies
var easyrtc = require("./../easyrtc_private_obj"); // EasyRTC private object
var pub = require("./../easyrtc_public_obj"); // EasyRTC public object


// Internals Models
const Connection = require('./connection');
const Room = require('./room');
const Session = require('./session');

// TODO migreate to ES6 or TypeScript
module.exports = function Application(appName) {

    /**
     * The primary method for interfacing with an EasyRTC application.
     *
     * @class       appObj
     * @memberof    pub
     */
    const appObj = {};

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
        return _.size(easyrtc.app[appName].connection);
    };


    /**
     * Returns an array of all easyrtcids connected to the application
     *
     * @memberof    pub.appObj
     * @param       {function(?Error, Array.<string>)} callback Callback with error and array of easyrtcids.
     */
    appObj.getConnectionEasyrtcids = function(callback) {
        var easyrtcids = Object.keys(easyrtc.app[appName].connection);
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

        for (var currentEasyrtcid in easyrtc.app[appName].connection) {
            if (!easyrtc.app[appName].connection.hasOwnProperty(currentEasyrtcid)) {
                continue;
            }
            if (easyrtc.app[appName].connection[currentEasyrtcid].username === username){
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

        for (var currentEasyrtcid in easyrtc.app[appName].connection) {
            if (!easyrtc.app[appName].connection.hasOwnProperty(currentEasyrtcid)) {
                continue;
            }
            if (easyrtc.app[appName].connection[currentEasyrtcid].username === username){
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
        if (!easyrtc.app[appName].field[fieldName]) {
            pub.util.logDebug("Can not find app field: '" + fieldName + "'");
            callback(new pub.util.ApplicationWarning("Can not find app field: '" + fieldName + "'"));
            return;
        }
        callback(null, pub.util.deepCopy(easyrtc.app[appName].field[fieldName]));
    };


    /**
     * Returns application level field object for a given field name. If the field is not set, it will return a field object will a null field value.  This is a synchronous function, thus may not be available in custom cases where state is not kept in memory.
     *
     * @memberof    pub.appObj
     * @param       {string}        fieldName   Field name
     * @returns     {Object}        Field object
     */
    appObj.getFieldSync = function(fieldName) {
        if (!easyrtc.app[appName].field[fieldName]) {
            return {"fieldName": fieldName, "fieldOption": {}, "fieldValue": null};
        }
        return pub.util.deepCopy(easyrtc.app[appName].field[fieldName]);
    };


    /**
     * Returns application level field value for a given field name. If the field is not set, it will return a null field value.  This is a synchronous function, thus may not be available in custom cases where state is not kept in memory.
     *
     * @memberof    pub.appObj
     * @param       {string}        fieldName   Field name
     * @returns     {?*}            Field value. Can be any JSON object.
     */
    appObj.getFieldValueSync = function(fieldName) {
        if (!easyrtc.app[appName].field[fieldName]) {
            return null;
        }
        return pub.util.deepCopy(easyrtc.app[appName].field[fieldName].fieldValue);
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
        for (var fieldName in easyrtc.app[appName].field) {
            if (!limitToIsShared || easyrtc.app[appName].field[fieldName].fieldOption.isShared) {
                fieldObj[fieldName] = {
                    fieldName: fieldName,
                    fieldValue: pub.util.deepCopy(easyrtc.app[appName].field[fieldName].fieldValue)
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
        var groupNames = Object.keys(easyrtc.app[appName].group);
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
        if (easyrtc.app[appName].option.hasOwnProperty(optionName)) {
            return easyrtc.app[appName].option[optionName];
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
        var roomNames = Object.keys(easyrtc.app[appName].room);
        callback(null, roomNames);
    };


    /**
     * Returns an array of all easyrtcsids within the application
     *
     * @memberof    pub.appObj
     * @param       {function(?Error, Array.<string>)} callback Callback with error and array containing easyrtcsids.
     */
    appObj.getEasyrtcsids = function(callback) {
        var easyrtcsids = Object.keys(easyrtc.app[appName].session);
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
        var isConnected = easyrtc.app.hasOwnProperty(appName) &&
                easyrtc.app[appName].hasOwnProperty('connection') &&
                    easyrtc.app[appName].connection.hasOwnProperty(easyrtcid);

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
        if (easyrtc.app[appName] && easyrtc.app[appName].connection && easyrtc.app[appName].connection[easyrtcid]) {
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
        if (easyrtc.option.hasOwnProperty(optionName)) {

            // If value is null, delete option from application (reverts to global option)
            if (optionValue === null || optionValue === undefined) {
                if (easyrtc.app[appName].option.hasOwnProperty(optionName)) {
                    delete easyrtc.app[appName].option[optionName];
                }
            } else {
                // Set the option value to be a full deep copy, thus preserving private nature of the private EasyRTC object.
                easyrtc.app[appName].option[optionName] = pub.util.deepCopy(optionValue);
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
        easyrtc.app[appName].field[fieldName] = {
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
        if (!easyrtc.app[appName].connection[easyrtcid]) {
            pub.util.logWarning("Attempt to request non-existent connection key: '" + easyrtcid + "'");
            callback(new pub.util.ConnectionWarning("Attempt to request non-existent connection key: '" + easyrtcid + "'"));
            return;
        }

        if (!pub.socketServer) {
            pub.util.logError("Socket server undefined.");
            callback(new pub.util.ConnectionWarning("Attempt to request non-existent socket: '" + easyrtcid + "'"));
            return;
        }

        var socketId = easyrtc.app[appName].connection[easyrtcid].socketId;

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

        var connectionObj = new Connection(appName, socketId, easyrtcid, appObj);

        // Before returning connectionObj, join the connection to a session (if available).
        if (easyrtc.app[appName].connection[easyrtcid].toSession) {
            appObj.session(easyrtc.app[appName].connection[easyrtcid].toSession.easyrtcsid, function(err, sessionObj) {
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

        if (easyrtc.app[appName].connection[easyrtcid]) {
            pub.util.logWarning("Can not create connection which already exists: '" + easyrtcid + "'");
            callback(new pub.util.ConnectionWarning("Can not create connection which already exists: '" + easyrtcid + "'"));
            return;
        }

        // Set the connection structure with some default values
        easyrtc.app[appName].connection[easyrtcid] = {
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
            toApp: easyrtc.app[appName]
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

        callback(null, _.size(easyrtc.app[appName].room[roomName].clientList));
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

        if (!_.isEmpty(easyrtc.app[appName].room[roomName].clientList)) {
            errorMsg = "Can't delete room " + roomName + " because it isn't empty";
            pub.util.logWarning(errorMsg);
            callback(new pub.util.ApplicationWarning(errorMsg), false);
            return;
        }

        easyrtc.app[appName].room[roomName].deleted = true;

        delete easyrtc.app[appName].room[roomName];
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

        easyrtc.app[appName].room[roomName] = {
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

        if (easyrtc.app[appName].session[easyrtcsid]) {
            pub.util.logWarning("Can not create session which already exists [" + easyrtcsid + "]");
            callback(new pub.util.ConnectionWarning("Can not create session which already exists [" + easyrtcsid + "]"));
            return;
        }

        // Set the session structure with some default values
        easyrtc.app[appName].session[easyrtcsid] = {
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
        callback(null,((easyrtc.app[appName] && easyrtc.app[appName].room[roomName] && !easyrtc.app[appName].room[roomName].deleted) ? true : false));
    };


    /**
     * Checks if a provided room is defined. This is a synchronous function, thus may not be available in custom cases where room state is not kept in memory.
     *
     * @memberof    pub.appObj
     * @param       {string} roomName       Room name which uniquely identifies a room within an EasyRTC application.
     * @return      {Boolean}               Returns boolean. True if room is defined.
     */
    appObj.isRoomSync = function(roomName) {
        return ((easyrtc.app[appName] && easyrtc.app[appName].room[roomName] && !easyrtc.app[appName].room[roomName].deleted) ? true : false);
    };


    /**
     * Checks if a provided session is defined. The callback returns a boolean if session is defined
     *
     * @memberof    pub.appObj
     * @param       {string}    easyrtcsid      EasyRTC session identifier
     * @param       {function(?Error, boolean)} callback Callback with error and boolean of whether session is defined.
     */
    appObj.isSession = function(easyrtcsid, callback) {
        callback(null, (easyrtc.app[appName].session[easyrtcsid] ? true : false));
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
        if (!easyrtc.app[appName].group[groupName]) {
            pub.util.logWarning("Attempt to request non-existent group name: '" + groupName + "'");
            callback(new pub.util.ApplicationWarning("Attempt to request non-existent group name: '" + groupName + "'"));
            return;
        }

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

        const roomObj = new Room(appName, roomName, appObj);

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

        if (!easyrtc.app[appName].session[easyrtcsid]) {
            pub.util.logWarning("Attempt to request non-existent easyrtcsid: '" + easyrtcsid + "'");
            callback(new pub.util.ApplicationWarning("Attempt to request non-existent easyrtcsid: '" + easyrtcsid + "'"));
            return;
        }

        const sessionObj = new Session(appName, easyrtcsid);

        callback(null, sessionObj);
    };

    return appObj;
};