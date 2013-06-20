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

// Expose utility functions
p.util = {};
p.util.deepCopy     = g.deepCopy;
p.util.logDebug     = eu.logDebug;
p.util.logInfo      = eu.logInfo;
p.util.logWarning   = eu.logWarning;
p.util.logError     = eu.logError;


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
}


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
}


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
    }


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
    }


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
    }


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
    }


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
    }


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
    }








    /* Returns an array of all group names within the application.
     *
     * @returns     {Array} Array of all group names. 
     */
    appObj.getGroupNames = function() {
        var groupNames = new Array();
        for (var key in e.app[appName].group) {
            groupNames.push(key);
        };
        return groupNames;    
    }


    /* Creates a new security group.
     * 
     * @param       {String} Group name. Must be formatted according to 'groupNameRegExp' option.
     *
     * @returns     {Object} easyRTC application object (same as calling app(appName)). Returns null if application could not be created. 
     */
    appObj.createGroup = function(groupName) {
        if (!groupName || !p.getOption('groupNameRegExp').test(groupName)) {
            p.util.logWarning("Can not create group with improper name: '" + groupName +"'");
            return null;
        }
        if (e.app[appName].group[groupName]) {
            p.util.logWarning("Can not create group which already exists: '" + groupName +"'");
            return null;
        }

        e.app[appName].group[groupName] = {field:{}};
        return p.app(appName).group(groupName);
    }


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
    }






  
    return appObj;
}

module.exports = p;

console.log("\n -------------------------- \n");


p.createApp('Super').setField('myname', 'Rod!');








p.util.logInfo("E", e);

console.log("\n -------------------------- \n");
