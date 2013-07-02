/** 
 * @file        Maintains public object returned by easyRTC listen() function.
 * @module      easyrtc_public_obj
 * @author      Priologic Software, info@easyrtc.com
 * @copyright   Copyright 2013 Priologic Software. All rights reserved.
 */

var _               = require("underscore");                // General utility functions external module
var g               = require("./general_util");            // General utility functions local module
var e               = require("./easyrtc_private_obj");     // easyRTC private object
var eu              = require("./easyrtc_util");            // easyRTC utility functions

// New public object 
var p = {};
p.getVersion        = function() {return e.version;};
p.getOption         = function(optionName) {return e.option[optionName]};
p.setOption         = eu.setOption;

// Expose utility functions and classes
p.util = {};
p.util.deepCopy             = g.deepCopy;
p.util.logDebug             = eu.logDebug;
p.util.logInfo              = eu.logInfo;
p.util.logWarning           = eu.logWarning;
p.util.logError             = eu.logError;
p.util.ServerError          = eu.ServerError;
p.util.ServerWarning        = eu.ServerWarning;
p.util.ApplicationError     = eu.ApplicationError;
p.util.ApplicationWarning   = eu.ApplicationWarning;
p.util.ConnectionError      = eu.ConnectionError;
p.util.ConnectionWarning    = eu.ConnectionWarning;


/* Sends an array of all application names to a callback.
 *
 * @param {function(Error, Array.<string>)} callback Callback with error and array containing all application names.
 */
p.getAppNames = function (callback) {
    var appNames = new Array();
    for (var key in e.app) {
        appNames.push(key);
    };
    callback(null, appNames);    
};


/* Creates a new easyRTC application with default values. If a callback is provided, it will receive the new application object.
 * 
 * The callback may receive an Error object if unsuccessful. Depending on the severity, known errors have an 'instanceof' ApplicationWarning or ApplicationError.
 *
 * @param       {String} appName Application name.
 * @param       {function(Error, Object)} callback Callback with error and application object
 */
p.createApp = function(appName, callback) {
    if (!_.isFunction(callback)) {
        callback = function(err, appObj) {};
    }
    if (!appName || !p.getOption('appNameRegExp').test(appName)) {
        p.util.logWarning("Can not create application with improper name: '" + appName +"'");
        callback(new p.util.ApplicationWarning("Can not create application with improper name: '" + appName +"'"));
        return null;
    }
    if (e.app[appName]) {
        p.util.logWarning("Can not create application which already exists: '" + appName +"'");
        callback(new p.util.ApplicationWarning("Can not create application which already exists: '" + appName +"'"));
        return null;
    }

    e.app[appName] = {
        field:      {},
        room:       {},
        group:      {},
        session:    {},
        connection: {}
    };

    p.app(appName, callback);
};


/* Primary method for interfacing with an easyRTC application.
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
p.app = function(appName, callback) {
    var appObj = {};
    if (!appName) {
        appName = p.getOption('defaultAppName');
    }
    if (!_.isFunction(callback)) {
        callback = function(err, appObj) {};
    }
    if (!e.app[appName]) {
        p.util.logWarning("Attempt to request non-existant application name: '" + appName +"'");
        callback(new p.util.ApplicationWarning("Attempt to request non-existant application name: '" + appName +"'"));
        return null;
    }
    
    /* Returns an array of all field names within the application.
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


    /* Returns application field value for a given field name.
     *  
     * @param       {String} Field name
     * @param       {function(Error, Object)} callback Callback with error and field value (any type)
     */
    appObj.getField = function(fieldName, callback) {
        if (!e.app[appName].field[fieldName]) {
            p.util.logDebug("Can not find app field: '" + fieldName +"'");
            callback(new p.util.ApplicationWarning("Can not find app field: '" + fieldName +"'"));
            return;
        }
        callback(null, e.app[appName].field[fieldName].data);    
    };


    /* Sets application field value for a given field name.
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

        if (!p.getOption('fieldNameRegExp').test(fieldName)) {
            p.util.logWarning("Can not create application field with improper name: '" + fieldName +"'");
            next(new p.util.ApplicationWarning("Can not create application field with improper name: '" + fieldName +"'"));
            return;
        }
        e.app[appName].field[fieldName] = {data:fieldValue};
        next(null);
    };


    /* Returns an array of all room names within the application.
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


    /* Creates a new easyRTC application with default values.
     *
     * @param       {function(Error, Object)} callback Callback with error and object containing easyRTC application object (same as calling app(appName))
     */
    appObj.createRoom = function(roomName, callback) {
        if (!roomName || !p.getOption('roomNameRegExp').test(roomName)) {
            p.util.logWarning("Can not create room with improper name: '" + roomName +"'");
            callback(new p.util.ApplicationWarning("Can not create room with improper name: '" + roomName +"'"));
            return;
        }
        if (e.app[appName].room[roomName]) {
            p.util.logWarning("Can not create room which already exists: '" + roomName +"'");
            callback(new p.util.ApplicationWarning("Can not create room which already exists: '" + roomName +"'"));
            return;
        }

        e.app[appName].room[roomName] = {field:{}};

        appObj.room(roomName, callback);
    };


    /* Gets room object for a given room name. Returns null if room not found.
     * The returned room object includes functions for managing room fields. 
     *
     * @param       {String} Room name
     * @param       {function(Error, Object)} callback Callback with error and object containing easyRTC room object.
     */
    appObj.room = function(roomName, callback) {
        if (!e.app[appName].room[roomName]) {
            p.util.logWarning("Attempt to request non-existant room name: '" + roomName +"'");
            callback(new p.util.ApplicationWarning("Attempt to request non-existant room name: '" + roomName +"'"));
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
                p.util.logDebug("Can not find room field: '" + fieldName +"'");
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
            if (!p.getOption('fieldNameRegExp').test(fieldName)) {
                p.util.logWarning("Can not create field with improper name: '" + fieldName +"'");
                next(new p.util.ApplicationWarning("Can not create field with improper name: '" + fieldName +"'"));
                return;
            }
            e.app[appName].room[roomName].field[fieldName] = {data:fieldValue};
            next(null);
        };
        callback(null, roomObj);
    };


    /* Returns an array of all group names within the application
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


    /* Creates a new security group with a name and rank. If rank is not provided, it will default to 0.
     * 
     * @param       {String} Group name. Must be formatted according to 'groupNameRegExp' option.
     * @param       {Integer} Rank. Must be 0 or positive integer. Fields set in higher ranked groups overrule those set in lower ranked groups.  
     * @param       {function(Error, Object)} callback Callback with error and object containing easyRTC group object (same as calling group(groupName))
     */
    appObj.createGroup = function(groupName, rank, callback) {
        if (!groupName || !p.getOption('groupNameRegExp').test(groupName)) {
            p.util.logWarning("Can not create group with improper name: '" + groupName +"'");
            callback(new p.util.ApplicationWarning("Can not create group with improper name: '" + groupName +"'"));
            return;
        }
        if (e.app[appName].group[groupName]) {
            p.util.logWarning("Can not create group which already exists: '" + groupName +"'");
            callback(new p.util.ApplicationWarning("Can not create group which already exists: '" + groupName +"'"));
            return;
        }
        
        if (!rank) {
            rank=0;
        }
        if (!(/^\d+$/.test(rank))) {
            p.util.logWarning("Can not create group with improper rank: '" + groupName +"', rank '" + rank +"'");
            callback(new p.util.ApplicationWarning("Can not create group with improper rank: '" + groupName +"', rank '" + rank +"'"));
            return;
        }

        e.app[appName].group[groupName] = {rank:rank, field:{}};
        appObj.group(groupName, callback);
    };


    /* Gets group object for a given group name. Returns null if group not found.
     * The returned group object includes functions for managing group fields. 
     *
     * @param       {String} Group name
     * @param       {function(Error, Object)} callback Callback with error and object containing easyRTC group object.
     */
    appObj.group = function(groupName, callback) {
        if (!e.app[appName].group[groupName]) {
            p.util.logWarning("Attempt to request non-existant group name: '" + groupName +"'");
            callback(new p.util.ApplicationWarning("Attempt to request non-existant group name: '" + groupName +"'"));
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
                p.util.logDebug("Can not find group field: '" + fieldName +"'");
                callback(new p.util.ApplicationWarning("Can not find app field: '" + fieldName +"'"));
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
            if (!p.getOption('fieldNameRegExp').test(fieldName)) {
                p.util.logWarning("Can not create field with improper name: '" + fieldName +"'");
                next(new p.util.ApplicationWarning("Can not create field with improper name: '" + fieldName +"'"));
                return;
            }
            e.app[appName].group[groupName].field[fieldName] = {data:fieldValue};
            next(null);
        };

        
        callback(null, groupObj);
    };


    /* Returns an array of all session keys within the application
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


    /* Creates a new session with a provided session key
     * 
     * @param       {String} Session key. Must be formatted according to 'sessionKeyRegExp' option.
     * @param       {function(Error, Object)} callback Callback with error and object containing easyRTC session object (same as calling session(sessionKey))
     */
    appObj.createSession = function(sessionKey, callback) {
        if (!sessionKey || !p.getOption('sessionKeyRegExp').test(sessionKey)) {
            p.util.logWarning("Can not create session with improper name: '" + sessionKey +"'");
            callback(new p.util.ConnectionWarning("Can not create session with improper name: '" + sessionKey +"'"));
            return;
        }
        if (e.app[appName].session[sessionKey]) {
            p.util.logWarning("Can not create session which already exists: '" + sessionKey +"'");
            callback(new p.util.ConnectionWarning("Can not create session which already exists: '" + sessionKey +"'"));
            return;
        }

        e.app[appName].session[sessionKey] = {startOn: Date.now(), field:{}};
        appObj.session(sessionKey, callback);
    };


    /* Gets session object for a given session key. Returns null if session not found.
     * The returned session object includes functions for managing session fields. 
     *
     * @param       {String} Session key
     * @param       {function(Error, Object)} callback Callback with error and object containing easyRTC session object
     */
    appObj.session = function(sessionKey, callback) {
        if (!e.app[appName].session[sessionKey]) {
            p.util.logWarning("Attempt to request non-existant session key: '" + sessionKey +"'");
            callback(new p.util.ApplicationWarning("Attempt to request non-existant session key: '" + sessionKey +"'"));
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
                p.util.logDebug("Can not find session field: '" + fieldName +"'");
                callback(new p.util.ConnectionWarning("Can not find session field: '" + fieldName +"'"));
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
            if (!p.getOption('fieldNameRegExp').test(fieldName)) {
                p.util.logWarning("Can not create session field with improper name: '" + fieldName +"'");
                next(new p.util.ConnectionWarning("Can not create session field with improper name: '" + fieldName +"'"));
                return;
            }
            e.app[appName].session[sessionKey].field[fieldName] = {data:fieldValue};
            next(null);
        };

        callback(null, sessionObj);
    };


    /* Returns an array of all easyrtcid's connected to the application
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


    /* Creates a new connection with a provided connection key
     * 
     * @param       {String} easyrtcid  Connection key. Must be formatted according to 'easyrtcidRegExp' option.
     * @param       {function(Error, Object)} callback Callback with error and object containing easyRTC connection object (same as calling connection(easyrtcid))
     */
    appObj.createConnection = function(easyrtcid, callback) {
        if (!easyrtcid || !p.getOption('easyrtcidRegExp').test(easyrtcid)) {
            p.util.logWarning("Can not create connection with improper name: '" + easyrtcid +"'");
            return null;
        }
        if (e.app[appName].connection[easyrtcid]) {
            p.util.logWarning("Can not create connection which already exists: '" + easyrtcid +"'");
            return null;
        }

        e.app[appName].connection[easyrtcid] = {
            startOn: Date.now(),
            field:{},
            room:{},
            presence:{
                show: 'chat',
                status: null
            }
        };
        return p.app(appName).connection(easyrtcid);
    };


    /* Gets connection object for a given connection key. Returns null if connection not found.
     * The returned connection object includes functions for managing connection fields. 
     *
     * @param       {String} easyrtcid  Connection key.
     * @param       {function(Error, Object)} callback Callback with error and object containing easyRTC connection object.
     */
    appObj.connection = function(easyrtcid, callback) {
        if (!e.app[appName].connection[easyrtcid]) {
            p.util.logWarning("Attempt to request non-existant connection key: '" + easyrtcid +"'");
            callback(new p.util.ConnectionWarning("Attempt to request non-existant connection key: '" + easyrtcid +"'"));
            return;
        }

        var connectionObj = {};


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
                p.util.logDebug("Can not find connection field: '" + fieldName +"'");
                callback(new p.util.ConnectionWarning("Can not find connection field: '" + fieldName +"'"));
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
            
            if (!p.getOption('fieldNameRegExp').test(fieldName)) {
                p.util.logWarning("Can not create connection field with improper name: '" + fieldName +"'");
                next(new p.util.ConnectionWarning("Can not create connection field with improper name: '" + fieldName +"'"));
                return;
            }
            e.app[appName].connection[easyrtcid].field[fieldName] = {data:fieldValue};

            next(null);
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
            if (!roomName || !p.getOption('roomNameRegExp').test(roomName)) {
                p.util.logWarning("Can not enter room with improper name: '" + roomName +"'");
                callback(new p.util.ConnectionWarning("Can not enter room with improper name: '" + roomName +"'"));
                return;
            }

            if (e.app[appName].connection[easyrtcid].room[roomName]) {
                p.util.logWarning("Can not create room which already exists: '" + roomName +"'");
                callback(new p.util.ConnectionWarning("Can not create room which already exists: '" + roomName +"'"));
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
                p.util.logWarning("Attempt to request non-existant room name: '" + roomName +"'");
                callback(new p.util.ConnectionWarning("Attempt to request non-existant room name: '" + roomName +"'"));
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
                    p.util.logDebug("Can not find room field: '" + fieldName +"'");
                    callback(new p.util.ConnectionWarning("Can not find room field: '" + fieldName +"'"));
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
                if (!p.getOption('fieldNameRegExp').test(fieldName)) {
                    p.util.logWarning("Can not create connection room field with improper name: '" + fieldName +"'");
                    callback(new p.util.ConnectionWarning("Can not create connection room field with improper name: '" + fieldName +"'"));
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


module.exports = p;


/**
 * The next callback is generally used to indicate simple success or failure of an asynchronous method. If the err parameter is null, this indicates success. If the err parameter is not null, than there is a failure and the Error object should be investigated.
 * @callback nextCallback
 * @param {Object} err  Null if successful. An Error object which is an instanceof (ServerWarning|ServerError|ApplicationWarning|ApplicationError|ConnectionWarning|ConnectionError)
 */












console.log("\n -------------------------- \n");


p.createApp('Super', function(err, appObj) {
    appObj.setField('sweet');
    appObj.createSession('mysession', function(err, sessionObj){
        sessionObj.setField('MySessinField','MySessionValue');
        sessionObj.setField('MySessinField2','MySessionValue2');
    });
    
});

// p.util.logInfo("Connection", p.app('Super').createConnection('rod').joinRoom('jessicool2'));
// p.util.logInfo("Connection Room", p.app('Super').connection('rod').room('jessicool'));
// p.util.logInfo("LEAVE Connection Room", p.app('Super').connection('rod').room('jessicool').leaveRoom());
// p.util.logInfo("Connection Room", p.app('Super').connection('rod').room('jessicool'));

// p.util.logInfo("Session",p.app('Super').getSessionKeys());

p.util.logInfo("E", e);

console.log("\n -------------------------- \n");



try {
    throw new Error("Yikes");
} catch (e) {
    p.util.logError("error", e);
    p.util.logError("error.name", e.name);
    p.util.logError("error.stack", e.stack);
    p.util.logError("error.instance", e instanceof RangeError);
}
