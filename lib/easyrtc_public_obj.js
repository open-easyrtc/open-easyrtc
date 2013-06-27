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
p.util.deepCopy         = g.deepCopy;
p.util.logDebug         = eu.logDebug;
p.util.logInfo          = eu.logInfo;
p.util.logWarning       = eu.logWarning;
p.util.logError         = eu.logError;
p.util.ServerError      = eu.ServerError;
p.util.ApplicationError = eu.ApplicationError;
p.util.ConnectionError  = eu.ConnectionError;


/* Returns an array of all application names.
 *
 * @returns     {Array} Array of all application names. 
 */
p.getAppNames       = function () {
    var appNames = new Array();
    for (var key in e.app) {
        appNames.push(key);
    };
    return appNames;    
};


/* Creates a new easyRTC application with default values.
 *
 * @returns     {Object} easyRTC application object (same as calling app(appName)). Returns null if application could not be created. 
 */
p.createApp = function(appName) {
    if (!appName || !p.getOption('appNameRegExp').test(appName)) {
        p.util.logWarning("Can not create application with improper name: '" + appName +"'");
        return null;
    }
    if (e.app[appName]) {
        p.util.logWarning("Can not create application which already exists: '" + appName +"'");
        return null;
    }
    
    e.app[appName] = {
        field:      {},
        room:       {},
        group:      {},
        session:    {},
        connection: {}
    };
    return p.app(appName);
};

/* Primary method for interfacing with an easyRTC application.
 * 
 * @param       {String} Application name. Uses default application if null.
 * 
 * @returns     {Object} Object containing methods for interfacing with the easyRTC application. Returns null if application not found. 
 */
p.app = function(appName) {
    if (!appName) {
        appName = p.getOption('defaultAppName');
    }

    if (!e.app[appName]) {
        p.util.logWarning("Attempt to request non-existant application name: '" + appName +"'");
        return null;
    }

    var appObj = {};


    /* Returns an array of all field names within the application.
     *
     * @returns     {Array} Array of all field names. 
     */
    appObj.getFieldNames = function() {
        var fieldNames = new Array();
        for (var key in e.app[appName].field) {
            fieldNames.push(key);
        };
        return fieldNames;    
    };


    /* Returns application field value for a given field name. Returns null if field name is not found.
     *  
     * @param       {String} Field name
     *
     * @returns     {Object} Field value (retains type) 
     */
    appObj.getField = function(fieldName) {
        if (!e.app[appName].field[fieldName]) {
            p.util.logDebug("Can not find app field: '" + fieldName +"'");
            return null;
        }
        return e.app[appName].field[fieldName].data;
    };


    /* Sets application field value for a given field name. Returns false if field could not be set.
     *  
     * @param       {String} Field name
     * @param       {Object} Field value (can be any type)
     * @param       {Object} Field options (to be implemented in future. Options for sharing fields to the API with possible group restrictions)
     *
     * @returns     {Boolean} True if set was successful, false if unsuccessful 
     */
    appObj.setField = function(fieldName, fieldValue, fieldOptions) {
        if (!p.getOption('fieldNameRegExp').test(fieldName)) {
            p.util.logWarning("Can not create field with improper name: '" + fieldName +"'");
            return false;
        }
        e.app[appName].field[fieldName] = {data:fieldValue};
        return true;
    };


    /* Returns an array of all room names within the application.
     *
     * @returns     {Array} Array of all room names. 
     */
    appObj.getRoomNames = function() {
        var roomNames = new Array();
        for (var key in e.app[appName].room) {
            roomNames.push(key);
        };
        return roomNames;    
    };


    /* Creates a new easyRTC application with default values.
     *
     * @returns     {Object} easyRTC application object (same as calling app(appName)). Returns null if application could not be created. 
     */
    appObj.createRoom = function(roomName) {
        if (!roomName || !p.getOption('roomNameRegExp').test(roomName)) {
            p.util.logWarning("Can not create room with improper name: '" + roomName +"'");
            return null;
        }
        if (e.app[appName].room[roomName]) {
            p.util.logWarning("Can not create room which already exists: '" + roomName +"'");
            return null;
        }

        e.app[appName].room[roomName] = {field:{}};
        return p.app(appName).room(roomName);
    };


    /* Gets room object for a given room name. Returns null if room not found.
     * The returned room object includes functions for managing room fields. 
     *
     * @param       {String} Room name
     *
     * @returns     {Object} Room object if room found. Null if room not found. 
     */
    appObj.room = function(roomName) {
        if (!e.app[appName].room[roomName]) {
            p.util.logWarning("Attempt to request non-existant room name: '" + roomName +"'");
            return null;
        }

        var roomObj = {};


        /* Returns an array of all field names within the application.
         *
         * @returns     {Array} Array of all field names. 
         */
        roomObj.getFieldNames = function() {
            var fieldNames = new Array();
            for (var key in e.app[appName].room[roomName].field) {
                fieldNames.push(key);
            };
            return fieldNames;    
        };


        /* Returns application field value for a given field name. Returns null if field name is not found.
         *  
         * @param       {String} Field name
         *
         * @returns     {Object} Field value (retains type) 
         */
        roomObj.getField = function(fieldName) {
            if (!e.app[appName].room[roomName].field[fieldName]) {
                p.util.logDebug("Can not find room field: '" + fieldName +"'");
                return null;
            }
            return e.app[appName].room[roomName].field[fieldName];
        };


        /* Sets application field value for a given field name. Returns false if field could not be set.
         *  
         * @param       {String} Field name
         * @param       {Object} Field value (can be any type)
         * @param       {Object} Field options (to be implemented in future. Options for sharing fields to the API with possible group restrictions)
         *
         * @returns     {Boolean} True if set was successful, false if unsuccessful 
         */
        roomObj.setField = function(fieldName, fieldValue, fieldOptions) {
            if (!p.getOption('fieldNameRegExp').test(fieldName)) {
                p.util.logWarning("Can not create field with improper name: '" + fieldName +"'");
                return false;
            }
            e.app[appName].room[roomName].field[fieldName] = {data:fieldValue};
            return true;
        };

        
        return roomObj;
    };


    /* Returns an array of all group names within the application
     * 
     * @returns     {Array} Array of all group names. 
     */
    appObj.getGroupNames = function() {
        var groupNames = new Array();
        for (var key in e.app[appName].group) {
            groupNames.push(key);
        };
        return groupNames;    
    };


    /* Creates a new security group with a name and rank. If rank is not provided, it will default to 0.
     * 
     * @param       {String} Group name. Must be formatted according to 'groupNameRegExp' option.
     * @param       {Integer} Rank. Must be 0 or positive integer. Fields set in higher ranked groups overrule those set in lower ranked groups.  
     *
     * @returns     {Object} easyRTC application object (same as calling app(appName)). Returns null if application could not be created. 
     */
    appObj.createGroup = function(groupName, rank) {
        if (!groupName || !p.getOption('groupNameRegExp').test(groupName)) {
            p.util.logWarning("Can not create group with improper name: '" + groupName +"'");
            return null;
        }
        if (e.app[appName].group[groupName]) {
            p.util.logWarning("Can not create group which already exists: '" + groupName +"'");
            return null;
        }
        
        if (!rank) {
            rank=0;
        }
        if (!(/^\d+$/.test(rank))) {
            p.util.logWarning("Can not create group with improper rank: '" + groupName +"', rank '" + rank +"'");
            return null;
        }

        e.app[appName].group[groupName] = {rank:rank, field:{}};
        return p.app(appName).group(groupName);
    };


    /* Gets group object for a given group name. Returns null if group not found.
     * The returned group object includes functions for managing group fields. 
     *
     * @param       {String} Group name
     *
     * @returns     {Object} Group object if group found. Null if group not found. 
     */
    appObj.group = function(groupName) {
        if (!e.app[appName].group[groupName]) {
            p.util.logWarning("Attempt to request non-existant group name: '" + groupName +"'");
            return null;
        }

        var groupObj = {};


        /* Returns an array of all field names within the application.
         *
         * @returns     {Array} Array of all field names. 
         */
        groupObj.getFieldNames = function() {
            var fieldNames = new Array();
            for (var key in e.app[appName].group[groupName].field) {
                fieldNames.push(key);
            };
            return fieldNames;    
        };


        /* Returns application field value for a given field name. Returns null if field name is not found.
         *  
         * @param       {String} Field name
         *
         * @returns     {Object} Field value (retains type) 
         */
        groupObj.getField = function(fieldName) {
            if (!e.app[appName].group[groupName].field[fieldName]) {
                p.util.logDebug("Can not find group field: '" + fieldName +"'");
                return null;
            }
            return e.app[appName].group[groupName].field[fieldName];
        };


        /* Sets application field value for a given field name. Returns false if field could not be set.
         *  
         * @param       {String} Field name. Must be formatted according to 'fieldNameRegExp' option.
         * @param       {Object} Field value (can be any type)
         * @param       {Object} Field options (to be implemented in future. Options for sharing fields to the API with possible group restrictions)
         *
         * @returns     {Boolean} True if set was successful, false if unsuccessful 
         */
        groupObj.setField = function(fieldName, fieldValue, fieldOptions) {
            if (!p.getOption('fieldNameRegExp').test(fieldName)) {
                p.util.logWarning("Can not create field with improper name: '" + fieldName +"'");
                return false;
            }
            e.app[appName].group[groupName].field[fieldName] = {data:fieldValue};
            return true;
        };

        
        return groupObj;
    };


    /* Returns an array of all session keys within the application
     * 
     * @returns     {Array} Array of all session keys. 
     */
    appObj.getSessionKeys = function() {
        var sessionKeys = new Array();
        for (var key in e.app[appName].session) {
            sessionKeys.push(key);
        };
        return sessionKeys;    
    };


    /* Creates a new session with a provided session key
     * 
     * @param       {String} Session key. Must be formatted according to 'sessionKeyRegExp' option.
     *
     * @returns     {Object} easyRTC session object (same as calling session(sessionKey)). Returns null if session could not be created. 
     */
    appObj.createSession = function(sessionKey) {
        if (!sessionKey || !p.getOption('sessionKeyRegExp').test(sessionKey)) {
            p.util.logWarning("Can not create session with improper name: '" + sessionKey +"'");
            return null;
        }
        if (e.app[appName].session[sessionKey]) {
            p.util.logWarning("Can not create session which already exists: '" + sessionKey +"'");
            return null;
        }

        e.app[appName].session[sessionKey] = {startOn: Date.now(), field:{}};
        return p.app(appName).session(sessionKey);
    };


    /* Gets session object for a given session key. Returns null if session not found.
     * The returned session object includes functions for managing session fields. 
     *
     * @param       {String} Session key
     *
     * @returns     {Object} Session object if session found. Null if session not found. 
     */
    appObj.session = function(sessionKey) {
        if (!e.app[appName].session[sessionKey]) {
            p.util.logWarning("Attempt to request non-existant session key: '" + sessionKey +"'");
            return null;
        }

        var sessionObj = {};


        /* Returns an array of all field names within the application.
         *
         * @returns     {Array} Array of all field names. 
         */
        sessionObj.getFieldNames = function() {
            var fieldNames = new Array();
            for (var key in e.app[appName].session[sessionKey].field) {
                fieldNames.push(key);
            };
            return fieldNames;    
        };


        /* Returns application field value for a given field name. Returns null if field name is not found.
         *  
         * @param       {String} Field name
         *
         * @returns     {Object} Field value (retains type) 
         */
        sessionObj.getField = function(fieldName) {
            if (!e.app[appName].session[sessionKey].field[fieldName]) {
                p.util.logDebug("Can not find session field: '" + fieldName +"'");
                return null;
            }
            return e.app[appName].session[sessionKey].field[fieldName];
        };


        /* Sets application field value for a given field name. Returns false if field could not be set.
         *  
         * @param       {String} Field name. Must be formatted according to 'fieldNameRegExp' option.
         * @param       {Object} Field value (can be any type)
         * @param       {Object} Field options (to be implemented in future. Options for sharing fields to the API with possible session restrictions)
         *
         * @returns     {Boolean} True if set was successful, false if unsuccessful 
         */
        sessionObj.setField = function(fieldName, fieldValue, fieldOptions) {
            if (!p.getOption('fieldNameRegExp').test(fieldName)) {
                p.util.logWarning("Can not create field with improper name: '" + fieldName +"'");
                return false;
            }
            e.app[appName].session[sessionKey].field[fieldName] = {data:fieldValue};
            return true;
        };

        
        return sessionObj;
    };


    /* Returns an array of all easyrtcid's connected to the application
     * 
     * @returns     {Array} Array of all connection keys. 
     */
    appObj.getConnectionEasyrtcids = function() {
        var easyrtcids = new Array();
        for (var key in e.app[appName].connection) {
            easyrtcids.push(key);
        };
        return easyrtcids;    
    };


    /* Creates a new connection with a provided connection key
     * 
     * @param       {String} Connection key. Must be formatted according to 'easyrtcidRegExp' option.
     *
     * @returns     {Object} easyRTC connection object (same as calling connection(easyrtcid)). Returns null if connection could not be created. 
     */
    appObj.createConnection = function(easyrtcid) {
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
     * @param       {String} Connection key
     *
     * @returns     {Object} Connection object if connection found. Null if connection not found. 
     */
    appObj.connection = function(easyrtcid) {
        if (!e.app[appName].connection[easyrtcid]) {
            p.util.logWarning("Attempt to request non-existant connection key: '" + easyrtcid +"'");
            return null;
        }

        var connectionObj = {};


        /* Returns an array of all field names within the application.
         *
         * @returns     {Array} Array of all field names. 
         */
        connectionObj.getFieldNames = function() {
            var fieldNames = new Array();
            for (var key in e.app[appName].connection[easyrtcid].field) {
                fieldNames.push(key);
            };
            return fieldNames;    
        };


        /* Returns application field value for a given field name. Returns null if field name is not found.
         *  
         * @param       {String} Field name
         *
         * @returns     {Object} Field value (retains type) 
         */
        connectionObj.getField = function(fieldName) {
            if (!e.app[appName].connection[easyrtcid].field[fieldName]) {
                p.util.logDebug("Can not find connection field: '" + fieldName +"'");
                return null;
            }
            return e.app[appName].connection[easyrtcid].field[fieldName];
        };


        /* Sets application field value for a given field name. Returns false if field could not be set.
         *  
         * @param       {String} Field name. Must be formatted according to 'fieldNameRegExp' option.
         * @param       {Object} Field value (can be any type)
         * @param       {Object} Field options (to be implemented in future. Options for sharing fields to the API with possible connection restrictions)
         *
         * @returns     {Boolean} True if set was successful, false if unsuccessful 
         */
        connectionObj.setField = function(fieldName, fieldValue, fieldOptions) {
            if (!p.getOption('fieldNameRegExp').test(fieldName)) {
                p.util.logWarning("Can not create field with improper name: '" + fieldName +"'");
                return false;
            }
            e.app[appName].connection[easyrtcid].field[fieldName] = {data:fieldValue};
            return true;
        };


        /* Returns an array of all room names which connection has entered
         *
         * @returns     {Array} Array of all room names. 
         */
        connectionObj.getRoomNames = function() {
            var roomNames = new Array();
            for (var key in e.app[appName].connection[easyrtcid].room) {
                roomNames.push(key);
            };
            return roomNames;    
        };
    
    
        /* Joins an existing room, returning a room object. Returns null if room can not be joined.
         *
         * @param       {String} Room name
         *
         * @returns     {Object} easyRTC application object (same as calling app(appName)). Returns null if room could not be joined. 
         */
        connectionObj.joinRoom = function(roomName) {
            if (!roomName || !p.getOption('roomNameRegExp').test(roomName)) {
                p.util.logWarning("Can not enter room with improper name: '" + roomName +"'");
                return null;
            }

            if (e.app[appName].connection[easyrtcid].room[roomName]) {
                p.util.logWarning("Can not create room which already exists: '" + roomName +"'");
                return null;
            }
    
            e.app[appName].connection[easyrtcid].room[roomName] = {field:{}};
            return p.app(appName).connection(easyrtcid).room(roomName);
        };




        /* Gets room object for a given room name. Returns null if room not found.
         * The returned room object includes functions for managing room fields. 
         *
         * @param       {String} Room name
         *
         * @returns     {Object} Room object if room found. Null if room not found. 
         */
        connectionObj.room = function(roomName) {
            if (_.isUndefined(e.app[appName].connection[easyrtcid].room[roomName])) {
                p.util.logWarning("Attempt to request non-existant room name: '" + roomName +"'");
                return null;
            }

            var roomObj = {};

            /* Leaves the current room. Any room variables will be lost.
             *
             * @returns     {Boolean} True if successfully left room 
             */
            roomObj.leaveRoom = function() {
                return delete e.app[appName].connection[easyrtcid].room[roomName];
            };
    
    
            /* Returns an array of all field names within the application.
             *
             * @returns     {Array} Array of all field names. 
             */
            roomObj.getFieldNames = function() {
                var fieldNames = new Array();
                for (var key in e.app[appName].connection[easyrtcid].room[roomName].field) {
                    fieldNames.push(key);
                };
                return fieldNames;    
            };
    
    
            /* Returns application field value for a given field name. Returns null if field name is not found.
             *  
             * @param       {String} Field name
             *
             * @returns     {Object} Field value (retains type) 
             */
            roomObj.getField = function(fieldName) {
                if (!e.app[appName].connection[easyrtcid].room[roomName].field[fieldName]) {
                    p.util.logDebug("Can not find room field: '" + fieldName +"'");
                    return null;
                }
                return e.app[appName].connection[easyrtcid].room[roomName].field[fieldName];
            };
    
    
            /* Sets application field value for a given field name. Returns false if field could not be set.
             *  
             * @param       {String} Field name
             * @param       {Object} Field value (can be any type)
             * @param       {Object} Field options (to be implemented in future. Options for sharing fields to the API with possible group restrictions)
             *
             * @returns     {Boolean} True if set was successful, false if unsuccessful 
             */
            roomObj.setField = function(fieldName, fieldValue, fieldOptions) {
                if (!p.getOption('fieldNameRegExp').test(fieldName)) {
                    p.util.logWarning("Can not create field with improper name: '" + fieldName +"'");
                    return false;
                }
                e.app[appName].connection[easyrtcid].room[roomName].field[fieldName] = {data:fieldValue};
                return true;
            };
 

            return roomObj;
        };














        return connectionObj;
    };










  
    return appObj;
};


module.exports = p;

console.log("\n -------------------------- \n");


p.createApp('Super').setField('myname', 'Rod!');

p.app('Super').createSession('mysession').setField('MySessinField','MySessionValue');
p.app('Super').createSession('mysession2').setField('MySessinField2','MySessionValue2');

p.util.logInfo("Connection", p.app('Super').createConnection('rod').joinRoom('jessicool2'));
p.util.logInfo("Connection Room", p.app('Super').connection('rod').room('jessicool'));
// p.util.logInfo("LEAVE Connection Room", p.app('Super').connection('rod').room('jessicool').leaveRoom());
p.util.logInfo("Connection Room", p.app('Super').connection('rod').room('jessicool'));

p.util.logInfo("Session",p.app('Super').getSessionKeys());

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
