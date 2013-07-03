/** 
 * @file        Maintains public object returned by easyRTC listen() function.
 * @module      easyrtcPublicObj
 * @author      Priologic Software, info@easyrtc.com
 * @copyright   Copyright 2013 Priologic Software. All rights reserved.
 */

var _               = require("underscore");                // General utility functions external module
var g               = require("./general_util");            // General utility functions local module
var e               = require("./easyrtc_private_obj");     // easyRTC private object
var eu              = require("./easyrtc_util");            // easyRTC utility functions

// New public object 
var pub = module.exports;
module.exports.getVersion        = function() {return e.version;};
module.exports.getOption         = function(optionName) {return e.option[optionName]};
module.exports.setOption         = eu.setOption;

/*
 * Alias for Socket.io server object. Set during Listen()
 */
module.exports.socketServer = null;
/**
 * Alias for Express app object. Set during Listen() 
 */
module.exports.httpApp = null;



// Expose utility functions and classes
module.exports.util = {};
module.exports.util.deepCopy             = g.deepCopy;
module.exports.util.logDebug             = eu.logDebug;
module.exports.util.logInfo              = eu.logInfo;
module.exports.util.logWarning           = eu.logWarning;
module.exports.util.logError             = eu.logError;
module.exports.util.ServerError          = eu.ServerError;
module.exports.util.ServerWarning        = eu.ServerWarning;
module.exports.util.ApplicationError     = eu.ApplicationError;
module.exports.util.ApplicationWarning   = eu.ApplicationWarning;
module.exports.util.ConnectionError      = eu.ConnectionError;
module.exports.util.ConnectionWarning    = eu.ConnectionWarning;


/**
 * Sends an array of all application names to a callback.
 *
 * @function getAppNames
 *
 * @param {function(Error, Array.<string>)} callback Callback with error and array containing all application names.
 */
module.exports.getAppNames = function (callback) {
    var appNames = new Array();
    for (var key in e.app) {
        appNames.push(key);
    };
    callback(null, appNames);    
};


/**
 * Creates a new easyRTC application with default values. If a callback is provided, it will receive the new application object.
 * 
 * The callback may receive an Error object if unsuccessful. Depending on the severity, known errors have an 'instanceof' ApplicationWarning or ApplicationError.
 * @function    easyrtc_public_obj.createApp
 * 
 * @param       {String} appName Application name.
 * @param       {function(Error, Object)} callback Callback with error and application object
 */
module.exports.createApp = function(appName, callback) {
    if (!_.isFunction(callback)) {
        callback = function(err, appObj) {};
    }
    if (!appName || !pub.getOption('appNameRegExp').test(appName)) {
        pub.util.logWarning("Can not create application with improper name: '" + appName +"'");
        callback(new pub.util.ApplicationWarning("Can not create application with improper name: '" + appName +"'"));
        return null;
    }
    if (e.app[appName]) {
        pub.util.logWarning("Can not create application which already exists: '" + appName +"'");
        callback(new pub.util.ApplicationWarning("Can not create application which already exists: '" + appName +"'"));
        return null;
    }

    e.app[appName] = {
        field:      {},
        room:       {},
        group:      {},
        session:    {},
        connection: {}
    };

    pub.app(appName, callback);
};


/**
 * Primary method for interfacing with an easyRTC application.
 * 
 * The callback will receive an application object upon successful retrieval of application.
 * 
 * The callback may receive an Error object if unsuccessful. Depending on the severity, known errors have an 'instanceof' ApplicationWarning or ApplicationError.
 * 
 * The function does return an application object which is useful for chaining, however the callback approach is safer and provides additional information in the event of an error.
 * 
 * @param       {String} appName Application name. Uses default application if null.
 * @param       {function(Error, Object)} callback Callback with error and application object
 */
module.exports.app = function(appName, callback) {
    var appObj = {};
    if (!appName) {
        appName = pub.getOption('defaultAppName');
    }
    if (!_.isFunction(callback)) {
        callback = function(err, appObj) {};
    }
    if (!e.app[appName]) {
        pub.util.logWarning("Attempt to request non-existant application name: '" + appName +"'");
        callback(new pub.util.ApplicationWarning("Attempt to request non-existant application name: '" + appName +"'"));
        return null;
    }
    
    /**
     * Returns an array of all field names within the application.
     *
     * @param {function(Error, Array.<string>)} callback Callback with error and array containing all field names.
     */
    appObj.getFieldNames = function(callback) {
        var fieldNames = new Array();
        for (var key in e.app[appName].field) {
            fieldNames.push(key);
        };
        callback(null, fieldNames);    
    };


    /**
     * Returns application field value for a given field name.
     *  
     * @param       {String} Field name
     * @param       {function(Error, Object)} callback Callback with error and field value (any type)
     */
    appObj.getField = function(fieldName, callback) {
        if (!e.app[appName].field[fieldName]) {
            pub.util.logDebug("Can not find app field: '" + fieldName +"'");
            callback(new pub.util.ApplicationWarning("Can not find app field: '" + fieldName +"'"));
            return;
        }
        callback(null, e.app[appName].field[fieldName].data);    
    };


    /**
     * Sets application field value for a given field name.
     *  
     * @param       {String} fieldName      Must be formatted according to 'fieldNameRegExp' option.
     * @param       {Object} fieldValue
     * @param       {Object} fieldOptions   Field options (to be implemented in future. Options for sharing fields to the API with possible group restrictions)
     * @oaram       {nextCallback} next     A success callback of form next(err). Possible err will be instanceof (ApplicationWarning). 
     */
    appObj.setField = function(fieldName, fieldValue, fieldOptions, next) {
        if (!_.isFunction(next)) {
            next = function(err) {};
        }

        if (!pub.getOption('fieldNameRegExp').test(fieldName)) {
            pub.util.logWarning("Can not create application field with improper name: '" + fieldName +"'");
            next(new pub.util.ApplicationWarning("Can not create application field with improper name: '" + fieldName +"'"));
            return;
        }
        e.app[appName].field[fieldName] = {data:fieldValue};
        next(null);
    };


    /**
     * Returns an array of all room names within the application.
     * 
     * @param {function(Error, Array.<string>)} callback Callback with error and array of room names.
     */
    appObj.getRoomNames = function(callback) {
        var roomNames = new Array();
        for (var key in e.app[appName].room) {
            roomNames.push(key);
        };
        callback(null, roomNames);
    };


    /**
     * Creates a new easyRTC application with default values.
     *
     * @param       {function(Error, Object)} callback Callback with error and object containing easyRTC application object (same as calling app(appName))
     */
    appObj.createRoom = function(roomName, callback) {
        if (!roomName || !pub.getOption('roomNameRegExp').test(roomName)) {
            pub.util.logWarning("Can not create room with improper name: '" + roomName +"'");
            callback(new pub.util.ApplicationWarning("Can not create room with improper name: '" + roomName +"'"));
            return;
        }
        if (e.app[appName].room[roomName]) {
            pub.util.logWarning("Can not create room which already exists: '" + roomName +"'");
            callback(new pub.util.ApplicationWarning("Can not create room which already exists: '" + roomName +"'"));
            return;
        }

        e.app[appName].room[roomName] = {field:{}};

        appObj.room(roomName, callback);
    };


    /**
     * Gets room object for a given room name. Returns null if room not found.
     * The returned room object includes functions for managing room fields. 
     *
     * @param       {String} Room name
     * @param       {function(Error, Object)} callback Callback with error and object containing easyRTC room object.
     */
    appObj.room = function(roomName, callback) {
        if (!e.app[appName].room[roomName]) {
            pub.util.logWarning("Attempt to request non-existant room name: '" + roomName +"'");
            callback(new pub.util.ApplicationWarning("Attempt to request non-existant room name: '" + roomName +"'"));
            return;
        }

        var roomObj = {};


        /* Returns an array of all field names within the room.
         *
         * @param {function(Error, Array.<string>)} callback Callback with error and array containing all field names.
         */
        roomObj.getFieldNames = function(callback) {
            var fieldNames = new Array();
            for (var key in e.app[appName].room[roomName].field) {
                fieldNames.push(key);
            };
            callback(null, fieldNames);    
        };


        /* Returns application field value for a given field name. Returns null if field name is not found.
         *  
         * @param       {String} Field name
         * @param       {function(Error, Object)} callback Callback with error and field value (any type)
         */
        roomObj.getField = function(fieldName, callback) {
            if (!e.app[appName].room[roomName].field[fieldName]) {
                pub.util.logDebug("Can not find room field: '" + fieldName +"'");
                callback(null, null);
                return;
            }
            callback(null, e.app[appName].room[roomName].field[fieldName]);
        };


        /* Sets application field value for a given field name. Returns false if field could not be set.
         *  
         * @param       {String}        Field   name
         * @param       {Object}        Field   value (can be any type)
         * @param       {Object}        Field   options (to be implemented in future. Options for sharing fields to the API with possible group restrictions)
         * @param       {nextCallback}  next    A success callback of form next(err). Possible err will be instanceof (ApplicationWarning). 
         *
         * @returns     {Boolean}               True if set was successful, false if unsuccessful 
         */
        roomObj.setField = function(fieldName, fieldValue, fieldOptions, next) {
            if (!_.isFunction(next)) {
                next = function(err) {};
            }
            if (!pub.getOption('fieldNameRegExp').test(fieldName)) {
                pub.util.logWarning("Can not create field with improper name: '" + fieldName +"'");
                next(new pub.util.ApplicationWarning("Can not create field with improper name: '" + fieldName +"'"));
                return;
            }
            e.app[appName].room[roomName].field[fieldName] = {data:fieldValue};
            next(null);
        };
        callback(null, roomObj);
    };


    /**
     * Returns an array of all group names within the application
     * 
     * @param       {function(Error, Array.<string>)} callback Callback with error and array of group names.
     */
    appObj.getGroupNames = function(callback) {
        var groupNames = new Array();
        for (var key in e.app[appName].group) {
            groupNames.push(key);
        };
        callback(null, groupNames);
    };


    /**
     * Creates a new security group with a name and rank. If rank is not provided, it will default to 0.
     * 
     * @param       {String} Group name. Must be formatted according to 'groupNameRegExp' option.
     * @param       {Integer} Rank. Must be 0 or positive integer. Fields set in higher ranked groups overrule those set in lower ranked groups.  
     * @param       {function(Error, Object)} callback Callback with error and object containing easyRTC group object (same as calling group(groupName))
     */
    appObj.createGroup = function(groupName, rank, callback) {
        if (!groupName || !pub.getOption('groupNameRegExp').test(groupName)) {
            pub.util.logWarning("Can not create group with improper name: '" + groupName +"'");
            callback(new pub.util.ApplicationWarning("Can not create group with improper name: '" + groupName +"'"));
            return;
        }
        if (e.app[appName].group[groupName]) {
            pub.util.logWarning("Can not create group which already exists: '" + groupName +"'");
            callback(new pub.util.ApplicationWarning("Can not create group which already exists: '" + groupName +"'"));
            return;
        }
        
        if (!rank) {
            rank=0;
        }
        if (!(/^\d+$/.test(rank))) {
            pub.util.logWarning("Can not create group with improper rank: '" + groupName +"', rank '" + rank +"'");
            callback(new pub.util.ApplicationWarning("Can not create group with improper rank: '" + groupName +"', rank '" + rank +"'"));
            return;
        }

        e.app[appName].group[groupName] = {rank:rank, field:{}};
        appObj.group(groupName, callback);
    };


    /**
     * Gets group object for a given group name. Returns null if group not found.
     * The returned group object includes functions for managing group fields. 
     *
     * @param       {String} Group name
     * @param       {function(Error, Object)} callback Callback with error and object containing easyRTC group object.
     */
    appObj.group = function(groupName, callback) {
        if (!e.app[appName].group[groupName]) {
            pub.util.logWarning("Attempt to request non-existant group name: '" + groupName +"'");
            callback(new pub.util.ApplicationWarning("Attempt to request non-existant group name: '" + groupName +"'"));
            return;
        }

        var groupObj = {};


        /* Returns an array of all field names within the group.
         *
         * @param {function(Error, Array.<string>)} callback Callback with error and array containing all field names.
         */
        groupObj.getFieldNames = function(callback) {
            var fieldNames = new Array();
            for (var key in e.app[appName].group[groupName].field) {
                fieldNames.push(key);
            };
            callback(null, fieldNames);    
        };


        /* Returns application field value for a given field name. Returns null if field name is not found.
         *  
         * @param       {String} Field name
         * @param       {function(Error, Object)} callback Callback with error and field value (any type)
         */
        groupObj.getField = function(fieldName, callback) {
            if (!e.app[appName].group[groupName].field[fieldName]) {
                pub.util.logDebug("Can not find group field: '" + fieldName +"'");
                callback(new pub.util.ApplicationWarning("Can not find app field: '" + fieldName +"'"));
                return;
            }
            callback(null, e.app[appName].group[groupName].field[fieldName]);
        };


        /* Sets application field value for a given field name. Returns false if field could not be set.
         *  
         * @param       {String} fieldName      Field name. Must be formatted according to 'fieldNameRegExp' option.
         * @param       {Object} fieldValue     Field value (can be any type)
         * @param       {Object} fieldOptions   Field options (to be implemented in future. Options for sharing fields to the API with possible group restrictions)
         * @param       {nextCallback}  next    A success callback of form next(err). Possible err will be instanceof (ApplicationWarning). 
         */
        groupObj.setField = function(fieldName, fieldValue, fieldOptions, next) {
            if (!_.isFunction(next)) {
                next = function(err) {};
            }
            if (!pub.getOption('fieldNameRegExp').test(fieldName)) {
                pub.util.logWarning("Can not create field with improper name: '" + fieldName +"'");
                next(new pub.util.ApplicationWarning("Can not create field with improper name: '" + fieldName +"'"));
                return;
            }
            e.app[appName].group[groupName].field[fieldName] = {data:fieldValue};
            next(null);
        };

        
        callback(null, groupObj);
    };


    /**
     * Returns an array of all session keys within the application
     * 
     * @param {function(Error, Array.<string>)} callback Callback with error and array containing session keys.
     */
    appObj.getSessionKeys = function(callback) {
        var sessionKeys = new Array();
        for (var key in e.app[appName].session) {
            sessionKeys.push(key);
        };
        callback(null, sessionKeys);    
    };


    /**
     * Creates a new session with a provided session key
     * 
     * @param       {String} Session key. Must be formatted according to 'sessionKeyRegExp' option.
     * @param       {function(Error, Object)} callback Callback with error and object containing easyRTC session object (same as calling session(sessionKey))
     */
    appObj.createSession = function(sessionKey, callback) {
        if (!sessionKey || !pub.getOption('sessionKeyRegExp').test(sessionKey)) {
            pub.util.logWarning("Can not create session with improper name: '" + sessionKey +"'");
            callback(new pub.util.ConnectionWarning("Can not create session with improper name: '" + sessionKey +"'"));
            return;
        }
        if (e.app[appName].session[sessionKey]) {
            pub.util.logWarning("Can not create session which already exists: '" + sessionKey +"'");
            callback(new pub.util.ConnectionWarning("Can not create session which already exists: '" + sessionKey +"'"));
            return;
        }

        e.app[appName].session[sessionKey] = {startOn: Date.now(), field:{}};
        appObj.session(sessionKey, callback);
    };


    /**
     * Gets session object for a given session key. Returns null if session not found.
     * The returned session object includes functions for managing session fields. 
     *
     * @param       {String} Session key
     * @param       {function(Error, Object)} callback Callback with error and object containing easyRTC session object
     */
    appObj.session = function(sessionKey, callback) {
        if (!e.app[appName].session[sessionKey]) {
            pub.util.logWarning("Attempt to request non-existant session key: '" + sessionKey +"'");
            callback(new pub.util.ApplicationWarning("Attempt to request non-existant session key: '" + sessionKey +"'"));
            return;
        }

        var sessionObj = {};


        /* Returns an array of all field names within the session.
         *
         * @param {function(Error, Array.<string>)} callback Callback with error and array containing all field names.
         */
        sessionObj.getFieldNames = function(callback) {
            var fieldNames = new Array();
            for (var key in e.app[appName].session[sessionKey].field) {
                fieldNames.push(key);
            };
            callback(null, fieldNames);  
        };


        /* Returns application field value for a given field name. Returns null if field name is not found.
         *  
         * @param       {String} Field name
         * @param       {function(Error, Object)} callback Callback with error and field value (any type)
         */
        sessionObj.getField = function(fieldName, callback) {
            if (!e.app[appName].session[sessionKey].field[fieldName]) {
                pub.util.logDebug("Can not find session field: '" + fieldName +"'");
                callback(new pub.util.ConnectionWarning("Can not find session field: '" + fieldName +"'"));
                return;
            }
            callback(null, e.app[appName].session[sessionKey].field[fieldName]);
        };


        /* Sets session field value for a given field name.
         *  
         * @param       {String} fieldName      Must be formatted according to 'fieldNameRegExp' option.
         * @param       {Object} fieldValue     
         * @param       {Object} fieldOptions   Field options  (to be implemented in future. Options for sharing fields to the API with possible session restrictions)
         * @param       {nextCallback}  next    A success callback of form next(err). Possible err will be instanceof (ConnectionWarning). 
         */
        sessionObj.setField = function(fieldName, fieldValue, fieldOptions, next) {
            if (!_.isFunction(next)) {
                next = function(err) {};
            }
            if (!pub.getOption('fieldNameRegExp').test(fieldName)) {
                pub.util.logWarning("Can not create session field with improper name: '" + fieldName +"'");
                next(new pub.util.ConnectionWarning("Can not create session field with improper name: '" + fieldName +"'"));
                return;
            }
            e.app[appName].session[sessionKey].field[fieldName] = {data:fieldValue};
            next(null);
        };

        callback(null, sessionObj);
    };


    /**
     * Returns an array of all easyrtcid's connected to the application
     * 
     * @param       {function(Error, Array.<string>)} callback Callback with error and array of easyrtcid's.
     */
    appObj.getConnectionEasyrtcids = function(callback) {
        var easyrtcids = new Array();
        for (var key in e.app[appName].connection) {
            easyrtcids.push(key);
        };
        callback(null, easyrtcids);    
    };


    /**
     * Creates a new connection with a provided connection key
     * 
     * @param       {String} easyrtcid  Connection key. Must be formatted according to 'easyrtcidRegExp' option.
     * @param       {function(Error, Object)} callback Callback with error and object containing easyRTC connection object (same as calling connection(easyrtcid))
     */
    appObj.createConnection = function(easyrtcid, callback) {
        if (!easyrtcid || !pub.getOption('easyrtcidRegExp').test(easyrtcid)) {
            pub.util.logWarning("Can not create connection with improper name: '" + easyrtcid +"'");
            callback(new pub.util.ConnectionWarning("Can not create connection with improper name: '" + easyrtcid +"'"));
            return;
        }

        if (e.app[appName].connection[easyrtcid]) {
            pub.util.logWarning("Can not create connection which already exists: '" + easyrtcid +"'");
            callback(new pub.util.ConnectionWarning("Can not create connection which already exists: '" + easyrtcid +"'"));
            return;
        }

        // Set the connection structure with some default values
        e.app[appName].connection[easyrtcid] = {
            startOn:        Date.now(),
            isAuthenticated:false,
            nextMsgId:      1,
            field:          {},
            room:           {},
            presence: {
                show:       'chat',
                status:     null
            }
        };

        appObj.connection(easyrtcid, callback);
    };


    /**
     * Gets connection object for a given connection key. Returns null if connection not found.
     * The returned connection object includes functions for managing connection fields. 
     *
     * @param       {String} easyrtcid  Connection key.
     * @param       {function(Error, Object)} callback Callback with error and object containing easyRTC connection object.
     */
    appObj.connection = function(easyrtcid, callback) {
        if (!e.app[appName].connection[easyrtcid]) {
            pub.util.logWarning("Attempt to request non-existant connection key: '" + easyrtcid +"'");
            callback(new pub.util.ConnectionWarning("Attempt to request non-existant connection key: '" + easyrtcid +"'"));
            return;
        }
        if (!pub.socketServer || !pub.socketServer.sockets.sockets[easyrtcid] || pub.socketServer.sockets.sockets[easyrtcid].disconnected) {
            pub.util.logWarning("Attempt to request non-existant socket: '" + easyrtcid +"'");
            callback(new pub.util.ConnectionWarning("Attempt to request non-existant socket: '" + easyrtcid +"'"));
            return;
        }
        if (pub.socketServer.sockets.sockets[easyrtcid].disconnected) {
            pub.util.logWarning("Attempt to request disconnected socket: '" + easyrtcid +"'");
            callback(new pub.util.ConnectionWarning("Attempt to request disconnected socket: '" + easyrtcid +"'"));
            return;
        }

        var connectionObj = {};
        
        // Put reference to socket in public object
        connectionObj.socket = pub.socketServer.sockets.sockets[easyrtcid];

        /* Returns an array of all field names within the connection.
         *
         * @param {function(Error, Array.<string>)} callback Callback with error and array containing all field names.
         */
        connectionObj.getFieldNames = function(callback) {
            var fieldNames = new Array();
            for (var key in e.app[appName].connection[easyrtcid].field) {
                fieldNames.push(key);
            };
            callback(null, fieldNames);  
        };


        /* Returns connection field value for a given field name.
         *  
         * @param       {String} Field name
         * @param       {function(Error, Object)} callback Callback with error and field value (any type)
         */
        connectionObj.getField = function(fieldName, callback) {
            if (!e.app[appName].connection[easyrtcid].field[fieldName]) {
                pub.util.logDebug("Can not find connection field: '" + fieldName +"'");
                callback(new pub.util.ConnectionWarning("Can not find connection field: '" + fieldName +"'"));
                return;
            }
            callback(null, e.app[appName].connection[easyrtcid].field[fieldName].data);
        };


        /* Sets connection field value for a given field name. Returns false if field could not be set.
         *  
         * @param       {String} fieldName      Must be formatted according to 'fieldNameRegExp' option.
         * @param       {Object} fieldValue
         * @param       {Object} fieldOptions   Field options (to be implemented in future. Options for sharing fields to the API with possible group restrictions)
         * @oaram       {nextCallback} next     A success callback of form next(err). Possible err will be instanceof (ConnectionWarning). 
         */
        connectionObj.setField = function(fieldName, fieldValue, fieldOptions, next) {
            if (!_.isFunction(next)) {
                next = function(err) {};
            }
            
            if (!pub.getOption('fieldNameRegExp').test(fieldName)) {
                pub.util.logWarning("Can not create connection field with improper name: '" + fieldName +"'");
                next(new pub.util.ConnectionWarning("Can not create connection field with improper name: '" + fieldName +"'"));
                return;
            }
            e.app[appName].connection[easyrtcid].field[fieldName] = {data:fieldValue};

            next(null);
        };


        /* Gets connection authentication status for the connection.
         *  
         * @param {function(Error, Boolean)} callback Callback with error and authentication status.
         */
        connectionObj.isAuthenticated = function(isAuthenticated, callback) {
            if (e.app[appName].connection[easyrtcid].isAuthenticated == true) {
                callback(null,true);
            } else {
                callback(null,false);
            }
        };


        /* Sets connection authentication status for the connection.
         *  
         * @param       {Boolean} isAuthenticated True/false as to if the connection should be considered authenticated.
         * @oaram       {nextCallback} next     A success callback of form next(err). 
         */
        connectionObj.setAuthenticated = function(isAuthenticated, next) {
            if (isAuthenticated == true) {
                e.app[appName].connection[easyrtcid].isAuthenticated = true;
            } else {
                e.app[appName].connection[easyrtcid].isAuthenticated = false;
            }
            next(null);
        };


        /* Gets the next message id for the connection. Will automatically increment that value by one.
         *  
         * @param {function(Error, Integer)} callback Callback with error and next message ID.
         */
        connectionObj.getNextMsgId = function(isAuthenticated, callback) {
            callback(null,e.app[appName].connection[easyrtcid].nextMsgId++);
        };


        /* Returns an array of all room names which connection has entered
         *
         * @param {function(Error, Array.<string>)} callback Callback with error and array of room names.
         */
        connectionObj.getRoomNames = function(callback) {
            var roomNames = new Array();
            for (var key in e.app[appName].connection[easyrtcid].room) {
                roomNames.push(key);
            };
            callback(null, roomNames);    
        };
    
    
        /* Joins an existing room, returning a room object. Returns null if room can not be joined.
         *
         * @param       {String} Room name
         * @param       {function(Error, Object)} callback Callback with error and object containing easyRTC connection room object (same as calling room(roomName))
         */
        connectionObj.joinRoom = function(roomName, callback) {
            if (!roomName || !pub.getOption('roomNameRegExp').test(roomName)) {
                pub.util.logWarning("Can not enter room with improper name: '" + roomName +"'");
                callback(new pub.util.ConnectionWarning("Can not enter room with improper name: '" + roomName +"'"));
                return;
            }

            if (e.app[appName].connection[easyrtcid].room[roomName]) {
                pub.util.logWarning("Can not create room which already exists: '" + roomName +"'");
                callback(new pub.util.ConnectionWarning("Can not create room which already exists: '" + roomName +"'"));
                return;
            }
    
            e.app[appName].connection[easyrtcid].room[roomName] = {field:{}};
            
            connectionObj.room(roomName, callback);
        };


        /* Gets room object for a given room name. Returns null if room not found.
         * The returned room object includes functions for managing room fields. 
         *
         * @param       {String} Room name
         * @param       {function(Error, Object)} callback Callback with error and object containing easyRTC connection room object.
         */
        connectionObj.room = function(roomName, callback) {
            if (_.isUndefined(e.app[appName].connection[easyrtcid].room[roomName])) {
                pub.util.logWarning("Attempt to request non-existant room name: '" + roomName +"'");
                callback(new pub.util.ConnectionWarning("Attempt to request non-existant room name: '" + roomName +"'"));
                return;
            }

            var roomObj = {};

            /* Leaves the current room. Any room variables will be lost.
             *
             * @oaram       {nextCallback} next     A success callback of form next(err). 
             */
            roomObj.leaveRoom = function(next) {
                if (!_.isFunction(next)) {
                    next = function(err) {};
                }

                delete e.app[appName].connection[easyrtcid].room[roomName];
                next(null);
            };
    
    
            /* Returns an array of all field names within the connection room.
             *
             * @param {function(Error, Array.<string>)} callback Callback with error and array containing all field names.
             */
            roomObj.getFieldNames = function(callback) {
                var fieldNames = new Array();
                for (var key in e.app[appName].connection[easyrtcid].room[roomName].field) {
                    fieldNames.push(key);
                };
                callback(null, fieldNames);    
            };
    
    
            /* Returns application field value for a given field name. Returns null if field name is not found.
             *  
             * @param       {String} Field name
             * @param       {function(Error, Object)} callback Callback with error and field value (any type)
             */
            roomObj.getField = function(fieldName,callback) {
                if (!e.app[appName].connection[easyrtcid].room[roomName].field[fieldName]) {
                    pub.util.logDebug("Can not find room field: '" + fieldName +"'");
                    callback(new pub.util.ConnectionWarning("Can not find room field: '" + fieldName +"'"));
                    return;
                }
                callback(null, e.app[appName].connection[easyrtcid].room[roomName].field[fieldName].data);
            };
    
    
            /* Sets connection room field value for a given field name. Returns false if field could not be set.
             *  
             * @param       {String} fieldName      Must be formatted according to 'fieldNameRegExp' option.
             * @param       {Object} fieldValue
             * @param       {Object} fieldOptions   Field options (to be implemented in future. Options for sharing fields to the API with possible group restrictions)
             * @oaram       {nextCallback} next     A success callback of form next(err). Possible err will be instanceof (ConnectionWarning). 
             */
            roomObj.setField = function(fieldName, fieldValue, fieldOptions, next) {
                if (!pub.getOption('fieldNameRegExp').test(fieldName)) {
                    pub.util.logWarning("Can not create connection room field with improper name: '" + fieldName +"'");
                    callback(new pub.util.ConnectionWarning("Can not create connection room field with improper name: '" + fieldName +"'"));
                    return;
                }
                e.app[appName].connection[easyrtcid].room[roomName].field[fieldName] = {data:fieldValue};
                next(null);
            };
 
            callback(null, roomObj);
        };

        callback(null, connectionObj);
    };

    callback(null, appObj);
};


// module.exports = p;


/**
 * The next callback is generally used to indicate simple success or failure of an asynchronous method. If the err parameter is null, this indicates success. If the err parameter is not null, than there is a failure and the Error object should be investigated.
 * @callback nextCallback
 * @param {Object} err  Null if successful. An Error object which is an instanceof (ServerWarning|ServerError|ApplicationWarning|ApplicationError|ConnectionWarning|ConnectionError)
 */



/*
console.log("\n -------------------------- \n");


pub.createApp('Super', function(err, appObj) {
    appObj.setField('sweet');
    appObj.createSession('mysession', function(err, sessionObj){
        sessionObj.setField('MySessinField','MySessionValue');
        sessionObj.setField('MySessinField2','MySessionValue2');
    });
    
});

// pub.util.logInfo("Connection", pub.app('Super').createConnection('rod').joinRoom('jessicool2'));
// pub.util.logInfo("Connection Room", pub.app('Super').connection('rod').room('jessicool'));
// pub.util.logInfo("LEAVE Connection Room", pub.app('Super').connection('rod').room('jessicool').leaveRoom());
// pub.util.logInfo("Connection Room", pub.app('Super').connection('rod').room('jessicool'));

// pub.util.logInfo("Session",pub.app('Super').getSessionKeys());

pub.util.logInfo("E", e);

console.log("\n -------------------------- \n");



try {
    throw new Error("Yikes");
} catch (e) {
    pub.util.logError("error", e);
    pub.util.logError("error.name", e.name);
    pub.util.logError("error.stack", e.stack);
    pub.util.logError("error.instance", e instanceof RangeError);
}
*/