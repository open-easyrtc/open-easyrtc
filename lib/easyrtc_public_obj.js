/** 
 * @file        Maintains public object returned by easyRTC listen() function.
 * @module      easyrtcPublicObj
 * @author      Priologic Software, info@easyrtc.com
 * @copyright   Copyright 2013 Priologic Software. All rights reserved.
 */

var events          = require("events"); 
var async           = require("async");
var _               = require("underscore");                // General utility functions external module
var g               = require("./general_util");            // General utility functions local module

var e               = require("./easyrtc_private_obj");     // easyRTC private object
// var eventHandler    = require("./easyrtc_events");          // easyRTC event handler
var eventFunctions  = require("./easyrtc_event_functions"); // eastRTC default event functions
var eu              = require("./easyrtc_util");            // easyRTC utility functions

// New public object 
var pub = module.exports;


/**
 * Gets easyRTC Version
 * 
 * @returns     {String}                easyRTC Version
 */
module.exports.getVersion = function() {
    return e.version;
};


/**
 * Gets individual option value
 * 
 * @param       {Object}    option      Option name     
 * @returns     {String}                Option value (can be any type)
 */
module.exports.getOption = function(optionName) {
    return e.option[optionName]
};


/**
 * Sets individual option.
 * 
 * @param       {Object}    option      Option name     
 * @param       {Object}    value       Option value
 * @returns     {Boolean}               true on success, false on failure
 */
module.exports.setOption = function(optionName, optionValue) {
    // Can only set options which currently exist
    if (typeof e.option[optionName] == "undefined") {
        pub.util.logError("Error setting option. Unrecognised option name '" + optionName + "'.");
        return false;
     }

    // TODO: Use a case statement to handle specific option types to ensure they are set properly.
    
    e.option[optionName] = g.deepCopy(optionValue);
    return true;
};


/**
 * Alias for Socket.io server object. Set during Listen()
 */
module.exports.socketServer = null;
/**
 * Alias for Express app object. Set during Listen() 
 */
module.exports.httpApp = null;


/**
 * easyRTC Event handling object
 */
module.exports.events = {};


/**
 * easyRTC EventEmmitter
 */
module.exports.eventHandler = new events.EventEmitter();


/**
 * List of default event listeners 
 */
module.exports.events.defaultListeners = {
    "authenticate":     eventFunctions.onAuthenticate,
    "log" :             eventFunctions.onLog,
    "startup" :         eventFunctions.onStartup,
    "connection" :      eventFunctions.onConnection,
    "easyrtcCmd":       eventFunctions.onEasyrtcCmd,
    "easyrtcMsg" :      eventFunctions.onEasyrtcMsg,
    "emitEasyrtcCmd":   eventFunctions.onEmitEasyrtcCmd,
    "emitEasyrtcMsg":   eventFunctions.onEmitEasyrtcMsg,
    "emitError":        eventFunctions.onEmitError,
    "emitReturnError":  eventFunctions.onEmitReturnError,
    "emitReturnAck":    eventFunctions.onEmitReturnAck,
    "disconnect":       eventFunctions.onDisconnect,
    "shutdown":         eventFunctions.onShutdown
};


/**
 * Sets a default listener for a given event. Removes other listeners 
 */
module.exports.events.setDefaultListener = function(eventName) {
    if (!_.isFunction(module.exports.events.defaultListeners[eventName])) {
        console.log("Error setting default listener. No default for event '" + eventName + "' exists.");
        return false;
    }
    console.log("Setting default listener for event '" + eventName + "'");
    pub.eventHandler.removeAllListeners(eventName);
    pub.eventHandler.on(eventName, module.exports.events.defaultListeners[eventName]);
};


/**
 * Sets a default listeners for all events. Removes all other listeners 
 */
module.exports.events.setDefaultListeners = function() {
    console.log("Setting default listeners");
    pub.eventHandler.removeAllListeners();
    for (var key in module.exports.events.defaultListeners) {
        pub.eventHandler.on(key, module.exports.events.defaultListeners[key]);
    }
};


/**
 * Sets listener for a given easyRTC event. Only one listener is allowed per event. Any other listeners for an event are removed before adding the new one.
 * 
 * @param       {String} eventName      Listener name.
 * @param       {Object} listener       Function
 */
module.exports.events.on = function(eventName, listener) {
    if (eventName && _.isFunction(listener)) {
        pub.eventHandler.removeAllListeners(eventName);
        pub.eventHandler.on(eventName, listener);
    }
    else {
        pub.util.logError("Unable to add listener to event '" + eventName + "'");
    }
};


/**
 * Removes all listeners for an event. If there is a default easyRTC listener, it will be added. If no event is specified, all events will be removed than the defaults will be restored.
 * 
 * @param       {String} eventName      Listener name.
 * @param       {Object} listener       Function
 */
module.exports.events.removeAllListeners = function(eventName) {
    if (eventName) {
        pub.events.setDefaultListener(eventName);
    } else {
        pub.events.setDefaultListeners();
    }
};


// Expose utility functions and classes
module.exports.util = {};
module.exports.util.deepCopy             = g.deepCopy;
module.exports.util.isError              = eu.isError;
module.exports.util.isWarning            = eu.isWarning;
module.exports.util.ServerError          = eu.ServerError;
module.exports.util.ServerWarning        = eu.ServerWarning;
module.exports.util.ApplicationError     = eu.ApplicationError;
module.exports.util.ApplicationWarning   = eu.ApplicationWarning;
module.exports.util.ConnectionError      = eu.ConnectionError;
module.exports.util.ConnectionWarning    = eu.ConnectionWarning;


/**
 * General logging function which emits a log event so long as the log level has a severity equal or greater than e.option.logLevel
 * 
 * @param       {String} level      Log severity level. Can be ("debug"|"info"|"warning"|"error")     
 * @param       {String} logText    Text for log
 * @param       {Object} logFields  Simple JSON object which contains extra fields to be logged. 
 */
module.exports.util.log = function(level, logText, logFields) {
    switch(e.option.logLevel) {
        case "error":
        if (level !="error") {break;}

        case "warning":
        if (level =="info" ) {break;}

        case "info":
        if (level =="debug") {break;}

        case "debug":
        pub.eventHandler.emit("log", level, logText, logFields);
    }
};


/**
 * Convenience function for logging "debug" level items.
 * 
 * @param       {String} logText    Text for log
 * @param       {Object} logFields  Simple JSON object which contains extra fields to be logged. 
 */
module.exports.util.logDebug = function(logText, logFields) {
    pub.util.log("debug", logText, logFields);
};


/**
 * Convenience function for logging "info" level items.
 * 
 * @param       {String} logText    Text for log
 * @param       {Object} logFields  Simple JSON object which contains extra fields to be logged. 
 */
module.exports.util.logInfo = function(logText, logFields) {
    pub.util.log("info", logText, logFields);
};

/**
 * Convenience function for logging "warning" level items.
 * 
 * @param       {String} logText    Text for log
 * @param       {Object} logFields  Simple JSON object which contains extra fields to be logged. 
 */
module.exports.util.logWarning = function(logText, logFields) {
    pub.util.log("warning", logText, logFields);
};


/**
 * Convenience function for logging "error" level items.
 * 
 * @param       {String} logText    Text for log
 * @param       {Object} logFields  Simple JSON object which contains extra fields to be logged. 
 */
module.exports.util.logError = function(logText, logFields) {
    pub.util.log("error", logText, logFields);
};


/**
 * Returns human readable text for a given error code. If an unknown error code is provided, a null value will be returned.
 * 
 * @param       {String} errorCode  Error code to return error string for.
 * @returns     {String} Human readable error string
 */
module.exports.util.getErrorText = function(errorCode) {
    switch (errorCode) {
        case "BANNED_IP_ADDR":
            return "Client IP address is banned. Socket will be disconnected.";
            break;
        case "LOGIN_APP_AUTH_FAIL":
            return "Authentication for application failed. Socket will be disconnected.";
            break;
        case "LOGIN_BAD_APP_NAME":
            return "Provided application name is improper. Socket will be disconnected.";
            break;
        case "LOGIN_BAD_AUTH":
            return "API Key is invalid or referer address is improper. Socket will be disconnected.";
            break;
        case "LOGIN_BAD_USER_CFG":
            return "Provided configuration options improper or invalid. Socket will be disconnected.";
            break;
        case "LOGIN_NO_SOCKETS":
            return "No sockets available for account. Socket will be disconnected.";
            break;
        case "LOGIN_TIMEOUT":
            return "Login has timed out. Socket will be disconnected.";
            break;
        case "MSG_REJECT_BAD_DATA":
            return "Message rejected. The provided msgData is improper.";
            break;
        case "MSG_REJECT_BAD_TYPE":
            return "Message rejected. The provided msgType is unsupported.";
            break;
        case "MSG_REJECT_NO_AUTH":
            return "Message rejected. Not logged in or client not authorized.";
            break;
        case "MSG_REJECT_TARGETID":
            return "Message rejected. Targetid is invalid, not using same application, or no longer online.";
            break;
        case "SERVER_SHUTDOWN":
            return "Server is being shutdown. Socket will be disconnected.";
            break;
        default:
            return null;
    }
}


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
 * Returns a boolean if app is defined
 *
 * @function isApp
 *
 * @param {function(Error, <boolean>)} callback Callback with error and boolean of whether application is defined.
 */
module.exports.isApp = function (appName, callback) {
    callback(null, (e.app[appName]?true:false));
};


/**
 * Creates a new easyRTC application with default values. If a callback is provided, it will receive the new application object.
 * 
 * The callback may receive an Error object if unsuccessful. Depending on the severity, known errors have an "instanceof" ApplicationWarning or ApplicationError.
 * @function    easyrtc_public_obj.createApp
 * 
 * @param       {String} appName Application name.
 * @param       {function(Error, Object)} callback Callback with error and application object
 */
module.exports.createApp = function(appName, callback) {
    if (!_.isFunction(callback)) {
        callback = function(err, appObj) {};
    }
    if (!appName || !pub.getOption("appNameRegExp").test(appName)) {
        pub.util.logWarning("Can not create application with improper name: '" + appName +"'");
        callback(new pub.util.ApplicationWarning("Can not create application with improper name: '" + appName +"'"));
        return null;
    }
    if (e.app[appName]) {
        pub.util.logWarning("Can not create application which already exists: '" + appName +"'");
        callback(new pub.util.ApplicationWarning("Can not create application which already exists: '" + appName +"'"));
        return null;
    }

    pub.util.logDebug("Creating application: '" + appName +"'");

    e.app[appName] = {
        appName:    appName,
        connection: {},
        field:      {},
        group:      {},
        option:     {},
        listStack:  [], // MAY REMOVE
        room:       {},
        session:    {}
    };

    // Get the new app object
    pub.app(appName, function(err, appObj) {
        if (err){
            callback(err);
            return;
        }
        // Create default room
        appObj.createRoom( pub.getOption("roomDefaultName"),
            function(err, roomObj) {
                if (err){
                    callback(err);
                    return;
                }
                // Return app object to callback
                callback(null, appObj);
            }
        );
    });
};


/**
 * Primary method for interfacing with an easyRTC application.
 * 
 * The callback will receive an application object upon successful retrieval of application.
 * 
 * The callback may receive an Error object if unsuccessful. Depending on the severity, known errors have an "instanceof" ApplicationWarning or ApplicationError.
 * 
 * The function does return an application object which is useful for chaining, however the callback approach is safer and provides additional information in the event of an error.
 * 
 * @param       {String} appName Application name. Uses default application if null.
 * @param       {function(Error, Object)} callback Callback with error and application object
 */
module.exports.app = function(appName, callback) {
    var appObj = {};
    if (!appName) {
        appName = pub.getOption("appDefaultName");
    }
    if (!_.isFunction(callback)) {
        callback = function(err, appObj) {};
    }
    if (!e.app[appName]) {
        pub.util.logWarning("Attempt to request non-existant application name: '" + appName +"'");
        callback(new pub.util.ApplicationWarning("Attempt to request non-existant application name: '" + appName +"'"));
        return;
    }

    appObj.getAppName = function() {
        return appName;
    };



    /**
     * Gets individual option value. Will first check if option is defined for the application, else it will revert to the global level option.
     * 
     * @param       {Object}    option      Option name     
     * @returns     {String}    Option value (can be any type)
     */
    appObj.getOption = function(optionName) {
        return ((e.app[appName].option[optionName] === undefined) ? pub.getOption(optionName) : (e.app[appName].option[optionName])); 
    };



    /**
     * Sets individual option. Set value to NULL to delete the option (thus reverting to global option)
     * 
     * @param       {Object}    option      Option name     
     * @param       {Object}    value       Option value
     * @returns     {Boolean}               true on success, false on failure
     */
     appObj.setOption = function(optionName, optionValue) {
        // Can only set options which currently exist
        if (typeof e.option[optionName] == "undefined") {
            pub.util.logError("Error setting option. Unrecognised option name '" + optionName + "'.");
            return false;
         }
    
        // If value is null, delete option from application (reverts to global option)
        if (optionValue == null) {
            if (!(e.app[appName].option[optionName] === 'undefined')) {
                delete e.app[appName].option[optionName];
            }
        } else {
            // Set the option value to be a full deep copy, thus preserving private nature of the private easyRTC object.
            e.app[appName].option[optionName] = g.deepCopy(optionValue);
        }
        return true;
    };



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
     * @param       {String} fieldName      Must be formatted according to "fieldNameRegExp" option.
     * @param       {Object} fieldValue
     * @param       {Object} fieldOptions   Field options (to be implemented in future. Options for sharing fields to the API with possible group restrictions)
     * @oaram       {nextCallback} next     A success callback of form next(err). Possible err will be instanceof (ApplicationWarning). 
     */
    appObj.setField = function(fieldName, fieldValue, fieldOptions, next) {
        if (!_.isFunction(next)) {
            next = function(err) {};
        }

        if (!pub.getOption("fieldNameRegExp").test(fieldName)) {
            pub.util.logWarning("Can not create application field with improper name: '" + fieldName +"'");
            next(new pub.util.ApplicationWarning("Can not create application field with improper name: '" + fieldName +"'"));
            return;
        }
        e.app[appName].field[fieldName] = {data:fieldValue};
        next(null);
    };

    
    /**
     * MAY REMOVE 
     */
    appObj.pushListStack = function(roomName, easyrtcid, isRemove, next) {
        e.app[appName].listStack.push({
            roomName: roomName,
            easyrtcid: easyrtcid,
            isRemove: isRemove
        });
    };


    /**
     * MAY REMOVE 
     */
    appObj.popListStack = function(callback) {
        callback(null, e.app[appName].listStack.pop());
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
        if (!roomName || !pub.getOption("roomNameRegExp").test(roomName)) {
            pub.util.logWarning("Can not create room with improper name: '" + roomName +"'");
            callback(new pub.util.ApplicationWarning("Can not create room with improper name: '" + roomName +"'"));
            return;
        }
        if (e.app[appName].room[roomName]) {
            pub.util.logWarning("Can not create room which already exists: '" + roomName +"'");
            callback(new pub.util.ApplicationWarning("Can not create room which already exists: '" + roomName +"'"));
            return;
        }

        e.app[appName].room[roomName] = {
            roomName:           roomName,
            connectList:        {},
            field:              {},
            modifiedOn:         Date.now()
        };

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
         */
        roomObj.setField = function(fieldName, fieldValue, fieldOptions, next) {
            if (!_.isFunction(next)) {
                next = function(err) {};
            }
            if (!pub.getOption("fieldNameRegExp").test(fieldName)) {
                pub.util.logWarning("Can not create field with improper name: '" + fieldName +"'");
                next(new pub.util.ApplicationWarning("Can not create field with improper name: '" + fieldName +"'"));
                return;
            }
            e.app[appName].room[roomName].field[fieldName] = {data:fieldValue};
            next(null);
        };



        /* Sets application field value for a given field name. Returns false if field could not be set.
         *  
         * @param       {String}        easyrtcid   name
         * @param       {nextCallback}  next    A success callback of form next(err). 
         */
        roomObj.setConnection = function(easyrtcid, next) {
            e.app[appName].room[roomName].connectList[easyrtcid] = {enteredOn:Date.now()};
            next(null);
        };

        /* Returns an array of all connected clients within the room.
         *
         * @param {function(Error, Array.<string>)} callback Callback with error and array containing all easyrtcid's.
         */
        roomObj.getConnections = function(callback) {
            var fieldNames = new Array();
            for (var key in e.app[appName].room[roomName].connectList) {
                fieldNames.push(key);
            };
            callback(null, fieldNames);    
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
     * @param       {String} Group name. Must be formatted according to "groupNameRegExp" option.
     * @param       {Integer} Rank. Must be 0 or positive integer. Fields set in higher ranked groups overrule those set in lower ranked groups.  
     * @param       {function(Error, Object)} callback Callback with error and object containing easyRTC group object (same as calling group(groupName))
     */
    appObj.createGroup = function(groupName, rank, callback) {
        if (!groupName || !pub.getOption("groupNameRegExp").test(groupName)) {
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

        e.app[appName].group[groupName] = {
            groupName: groupName,
            rank:rank,
            field:{}
        };
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


        /**
         * Returns an array of all field names within the group.
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


        /**
         * Returns application field value for a given field name. Returns null if field name is not found.
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


        /**
         * Sets application field value for a given field name. Returns false if field could not be set.
         *  
         * @param       {String} fieldName      Field name. Must be formatted according to "fieldNameRegExp" option.
         * @param       {Object} fieldValue     Field value (can be any type)
         * @param       {Object} fieldOptions   Field options (to be implemented in future. Options for sharing fields to the API with possible group restrictions)
         * @param       {nextCallback}  next    A success callback of form next(err). Possible err will be instanceof (ApplicationWarning). 
         */
        groupObj.setField = function(fieldName, fieldValue, fieldOptions, next) {
            if (!_.isFunction(next)) {
                next = function(err) {};
            }
            if (!pub.getOption("fieldNameRegExp").test(fieldName)) {
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
     * @param       {String} Session key. Must be formatted according to "sessionKeyRegExp" option.
     * @param       {function(Error, Object)} callback Callback with error and object containing easyRTC session object (same as calling session(sessionKey))
     */
    appObj.createSession = function(sessionKey, callback) {
        if (!sessionKey || !pub.getOption("sessionKeyRegExp").test(sessionKey)) {
            pub.util.logWarning("Can not create session with improper name: '" + sessionKey +"'");
            callback(new pub.util.ConnectionWarning("Can not create session with improper name: '" + sessionKey +"'"));
            return;
        }
        if (e.app[appName].session[sessionKey]) {
            pub.util.logWarning("Can not create session which already exists: '" + sessionKey +"'");
            callback(new pub.util.ConnectionWarning("Can not create session which already exists: '" + sessionKey +"'"));
            return;
        }

        e.app[appName].session[sessionKey] = {
            easyrtcsid: sessionKey,
            startOn: Date.now(),
            field:{}
        };
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


        /**
         * Returns an array of all field names within the session.
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
         * @param       {String} fieldName      Must be formatted according to "fieldNameRegExp" option.
         * @param       {Object} fieldValue     
         * @param       {Object} fieldOptions   Field options  (to be implemented in future. Options for sharing fields to the API with possible session restrictions)
         * @param       {nextCallback}  next    A success callback of form next(err). Possible err will be instanceof (ConnectionWarning). 
         */
        sessionObj.setField = function(fieldName, fieldValue, fieldOptions, next) {
            if (!_.isFunction(next)) {
                next = function(err) {};
            }
            if (!pub.getOption("fieldNameRegExp").test(fieldName)) {
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
     * @param       {String} easyrtcid  Connection key. Must be formatted according to "easyrtcidRegExp" option.
     * @param       {function(Error, Object)} callback Callback with error and object containing easyRTC connection object (same as calling connection(easyrtcid))
     */
    appObj.createConnection = function(easyrtcid, callback) {
        if (!easyrtcid || !pub.getOption("easyrtcidRegExp").test(easyrtcid)) {
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
            easyrtcid:      easyrtcid,
            connectOn:      Date.now(),
            isAuthenticated:false,
            userName:       null,
            credential:     null,
            apiField:       {},
            field:          g.deepCopy(appObj.getOption("connectionDefaultField")),
            room:           {},
            presence: {
                show:       "chat",
                status:     null
            },
            toApp: e.app[appName]
        };


//pub.util.logWarning("\n\nACK! 1",appObj.getOption("connectionDefaultField"));
//pub.util.logWarning("\n\nACK! 2",e.app[appName].connection[easyrtcid]);

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
        // TODO: Fix this once we allow easyrtcid's to be reused across sockets
        connectionObj.socket = pub.socketServer.sockets.sockets[easyrtcid];
        
        /**
         * Returns the application object to which the connection belongs. 
         */
        connectionObj.getApp = function() {
            return appObj;
        };


        /**
         * Returns the easyrtcid for the connection. 
         */
        connectionObj.getEasyrtcid = function() {
            return easyrtcid;
        };
        

        /**
         * Returns an array of all field names within the connection.
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


        /**
         * Returns connection field value for a given field name.
         *  
         * @param       {String} Field name
         * @param       {function(Error, Object)} callback Callback with error and field value (any type)
         */
        connectionObj.getField = function(fieldName, callback) {
            
            if (!_.isUndefined(e.app[appName].connection[easyrtcid].field[fieldName])) {
                callback(null, e.app[appName].connection[easyrtcid].field[fieldName].data);
            }
            else if (!_.isUndefined(e.app[appName].field[fieldName])) {
                callback(null, e.app[appName].field[fieldName].data);
            }
            else {
                pub.util.logDebug("Can not find connection field: '" + fieldName +"'");
                callback(new pub.util.ConnectionWarning("Can not find connection field: '" + fieldName +"'"));
            }
        };


        /**
         * Sets connection field value for a given field name. Returns false if field could not be set.
         *  
         * @param       {String} fieldName      Must be formatted according to "fieldNameRegExp" option.
         * @param       {Object} fieldValue
         * @param       {Object} fieldOptions   Field options (to be implemented in future. Options for sharing fields to the API with possible group restrictions)
         * @oaram       {nextCallback} next     A success callback of form next(err). Possible err will be instanceof (ConnectionWarning). 
         */
        connectionObj.setField = function(fieldName, fieldValue, fieldOptions, next) {
            if (!_.isFunction(next)) {
                next = function(err) {};
            }
            
            if (!pub.getOption("fieldNameRegExp").test(fieldName)) {
                pub.util.logWarning("Can not create connection field with improper name: '" + fieldName +"'");
                next(new pub.util.ConnectionWarning("Can not create connection field with improper name: '" + fieldName +"'"));
                return;
            }
            e.app[appName].connection[easyrtcid].field[fieldName] = {data:fieldValue};

            next(null);
        };


        /**
         * Gets connection authentication status for the connection.
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


        /**
         * Sets connection authentication status for the connection.
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


        // TODO: REMOVE this function
        /**
         * Gets the next message id for the connection. Will automatically increment that value by one.
         *  
         * @param {function(Error, Integer)} callback Callback with error and next message ID.
         */
        connectionObj.getNextMsgId = function(callback) {
            callback(null,e.app[appName].connection[easyrtcid].nextMsgId++);
        };


        /**
         * Emits the roomData message with a listDelta for the current connection to other connections in rooms this connection is in.
         * Note: To send listDetas for individual rooms, use connectionRoomObj.emitRoomDataDelta 
         * 
         */
        connectionObj.emitRoomDataDelta = function(isLeavingAllRooms, next) {
            pub.util.logDebug("[" + easyrtcid + "] Running func 'connectionObj.emitRoomDataDelta'");
            if (!_.isFunction(next)) {
                next = function(err) {};
            }

            // Run the emitRoomDataDelta for each room the connection is currently still in
            for (var currentRoomName in e.app[appName].connection[easyrtcid].room) {
                connectionObj.room(currentRoomName, function(err, connectionRoomObj){
                    connectionRoomObj.emitRoomDataDelta(isLeavingAllRooms, function(err){});
                });
            }
            next(null);
        };


        /**
         * Returns an array of all room names which connection has entered
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
    

        /** NOT FINISHED (MAY NOT BE NEEDED)
         * Returns the roomData object for a specific client. Will automatically maintain the connection's current connection list.
         */
        connectionObj.getRoomData = function(callback) {
            var roomData = {};
            
            var deltaRoomPrep = {};
            
            for (var currentRoomName in e.app[appName].connection[easyrtcid].room) {
                // deltaRoomPrep[currentRoomName].

                // Find new / updated connections
                for (var currentEasyrtcid in e.app[appName].room[currentRoomName]) {
                    
                }

                // Find removed connections
                for (var currentEasyrtcid in e.app[appName].room[currentRoomName]) {
                    
                }
            };

            for(var i = 0; i < roomNames.length; i++) {
                tokenMsg.msgData.roomData[roomNames[i]] = {roomName:roomNames[i]}
            }
            
            var roomNames = new Array();
            callback(null, roomNames);    
        };


        /**
         * Joins an existing room, returning a room object. Returns null if room can not be joined.
         *
         * @param       {String} Room name
         * @param       {function(Error, Object)} callback Callback with error and object containing easyRTC connection room object (same as calling room(roomName))
         */
        connectionObj.joinRoom = function(roomName, callback) {
            if (!roomName || !pub.getOption("roomNameRegExp").test(roomName)) {
                pub.util.logWarning("[" + easyrtcid + "] Can not enter room with improper name: '" + roomName +"'");
                callback(new pub.util.ConnectionWarning("Can not enter room with improper name: '" + roomName +"'"));
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
                    apiDefinedFields:   {},
                    enteredOn:          Date.now(),
                    gotListOn:          Date.now(),
                    list:               {},
                    userfields:         {},
                    toRoom:             e.app[appName].room[roomName]
                };
                
                // Add easyrtcid to room list
                e.app[appName].room[roomName].connectList[easyrtcid] = {
                    enteredOn:      Date.now(),
                    modifiedOn:     Date.now(),
                    toConnection:   e.app[appName].connection[easyrtcid]
                };

                // Returns connection room object to callback. 
                connectionObj.room(roomName, callback);
            };
            
            // Check if room doesn't exist
            if (!e.app[appName].room[roomName]) {
                if (pub.getOption("roomAutoCreateEnable")) {
                        appObj.createRoom(roomName, function(err, roomObj){
                            if (err) {
                                callback(err);
                                return;
                            }
                            createConnectionRoom(roomName, appRoomObj, callback);
                        });
                } else {
                    pub.util.logWarning("[" + easyrtcid + "] Can not enter room which doesn't exist: '" + roomName +"'");
                    callback(new pub.util.ConnectionWarning("Can not enter room which doesn't exist: '" + roomName +"'"));
                    return;
                }
            }

            appObj.room(roomName, function(err, appRoomObj){
                if(err) {
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
         * @param       {String} Room name
         * @param       {function(Error, Object)} callback Callback with error and object containing easyRTC connection room object.
         */
        connectionObj.room = function(roomName, callback) {
            if (_.isUndefined(e.app[appName].connection[easyrtcid].room[roomName])) {
                pub.util.logWarning("Attempt to request non-existant room name: '" + roomName +"'");
                callback(new pub.util.ConnectionWarning("Attempt to request non-existant room name: '" + roomName +"'"));
                return;
            }

            var connectionRoomObj = {};


            /**
             * Leaves the current room. Any room variables will be lost.
             *
             * @oaram       {nextCallback} next     A success callback of form next(err). 
             */
            connectionRoomObj.leaveRoom = function(next) {
                if (!_.isFunction(next)) {
                    next = function(err) {};
                }

                e.app[appName].room[roomName].modifiedOn = Date.now();
                delete e.app[appName].room[roomName].connectList[easyrtcid];
                delete e.app[appName].connection[easyrtcid].room[roomName];

                connectionRoomObj.emitRoomDataDelta(true, next);
            };


            /**
             * Emits the roomData message with a listDelta for the current connection to other connections in the same room.
             */
            connectionRoomObj.emitRoomDataDelta = function(isLeavingRoom, next) {
                pub.util.logDebug("[" + easyrtcid + "][" + roomName + "] Running func 'connectionRoomObj.emitRoomDataDelta'");
                if (!_.isFunction(next)) {
                    next = function(err) {};
                }
                var msg = {msgData:{roomData:{}}};
                msg.msgData.roomData[roomName] = {roomName:roomName, listDelta:{}};

                // TODO: Better protection for when users have disconnected or left a room prior to sending this delta

                if (isLeavingRoom) {
                    msg.msgData.roomData[roomName].listDelta.removeConnection = {};
                    msg.msgData.roomData[roomName].listDelta.removeConnection[easyrtcid] = {easyrtcid:easyrtcid};
                } else {
                    var connectionRoom = e.app[appName].connection[easyrtcid].room[roomName];
                    msg.msgData.roomData[roomName].listDelta.updateConnection = {};
                    // TODO: Add additional fields
                    msg.msgData.roomData[roomName].listDelta.updateConnection[easyrtcid] = {
                        easyrtcid:easyrtcid,
                        presence: e.app[appName].connection[easyrtcid].presence
                    };
                }

                for (var currentEasyrtcid in e.app[appName].room[roomName].connectList) {
                    connectionObj.getApp().connection(currentEasyrtcid, function(err, emitToConnectionObj){
                        if (!err && currentEasyrtcid != easyrtcid && emitToConnectionObj) {
                            pub.eventHandler.emit("emitEasyrtcCmd", emitToConnectionObj, "roomData", msg, null, function(){});
                        }
                    })
                }
                next(null);
            }
    
    
            /**
             * Returns an array of all field names within the connection room.
             *
             * @param {function(Error, Array.<string>)} callback Callback with error and array containing all field names.
             */
            connectionRoomObj.getFieldNames = function(callback) {
                var fieldNames = new Array();
                for (var key in e.app[appName].connection[easyrtcid].room[roomName].field) {
                    fieldNames.push(key);
                };
                callback(null, fieldNames);    
            };
    
    
            /**
             * Returns application field value for a given field name. Returns null if field name is not found.
             *  
             * @param       {String} Field name
             * @param       {function(Error, Object)} callback Callback with error and field value (any type)
             */
            connectionRoomObj.getField = function(fieldName,callback) {
                if (!e.app[appName].connection[easyrtcid].room[roomName].field[fieldName]) {
                    pub.util.logDebug("Can not find room field: '" + fieldName +"'");
                    callback(new pub.util.ConnectionWarning("Can not find room field: '" + fieldName +"'"));
                    return;
                }
                callback(null, e.app[appName].connection[easyrtcid].room[roomName].field[fieldName].data);
            };


            /**
             * Sets connection room field value for a given field name. Returns false if field could not be set.
             *  
             * @param       {String} fieldName      Must be formatted according to "fieldNameRegExp" option.
             * @param       {Object} fieldValue
             * @param       {Object} fieldOptions   Field options (to be implemented in future. Options for sharing fields to the API with possible group restrictions)
             * @oaram       {nextCallback} next     A success callback of form next(err). Possible err will be instanceof (ConnectionWarning). 
             */
            connectionRoomObj.setField = function(fieldName, fieldValue, fieldOptions, next) {
                if (!pub.getOption("fieldNameRegExp").test(fieldName)) {
                    pub.util.logWarning("Can not create connection room field with improper name: '" + fieldName +"'");
                    callback(new pub.util.ConnectionWarning("Can not create connection room field with improper name: '" + fieldName +"'"));
                    return;
                }
                e.app[appName].connection[easyrtcid].room[roomName].field[fieldName] = {data:fieldValue};
                next(null);
            };
 
            callback(null, connectionRoomObj);
        };


        /**
         * Generates a full connection list for the given connection 
         * @param {Object} callback
         */
        connectionObj.generateConnectionList = function(callback) {
            var roomData = {};
            for (var currentRoomName in e.app[appName].connection[easyrtcid].room) {
                var connectionRoom = e.app[appName].connection[easyrtcid].room[currentRoomName];
                
                roomData[currentRoomName] = {
                    roomName: currentRoomName,
                    list:{}
                };

                // Empty current list
                connectionRoom.list = {};

                // Fill connection list, and roomData list for current room
                for (var currentEasyrtcid in connectionRoom.toRoom.connectList) {
                    connectionRoom.list[currentEasyrtcid] = {
                        toConnection:connectionRoom.toRoom.connectList[currentEasyrtcid].toConnection
                    };

                    roomData[currentRoomName].list[currentEasyrtcid] = {
                        easyrtcid:currentEasyrtcid,
                        presence: connectionRoom.toRoom.connectList[currentEasyrtcid].toConnection.presence
                    };
                    if(!_.isEmpty(connectionRoom.toRoom.connectList[currentEasyrtcid].toConnection.apiField)) {
                        roomData[currentRoomName].list[currentEasyrtcid].apiField= connectionRoom.toRoom.connectList[currentEasyrtcid].toConnection.apiField;
                    }
                }
                
                // Updating timestamp of when list was retrieved. Useful for sending delta's later on.
                connectionRoom.gotListOn = Date.now();
            };
            callback(null, roomData);
        }

        callback(null, connectionObj);
    };

    callback(null, appObj);
};


module.exports.getAppWithEasyrtcid = function(easyrtcid, callback) {
    for(var key in e.app) {
        if (e.app[key].connection[easyrtcid]) {
            pub.app(key, callback);
            return;
        }
    }
    pub.util.logWarning("Can not find connection ["+ easyrtcid +"]");
    callback(new pub.util.ConnectionWarning("Can not find connection ["+ easyrtcid +"]"));
};


module.exports.getConnectionWithEasyrtcid = function(easyrtcid, callback) {
    for(var key in e.app) {
        if (e.app[key].connection[easyrtcid]) {
            pub.app(key, function(err,appObj) {
                if (err) {
                    callback(err);
                    return;
                }
                appObj.connection(easyrtcid, callback);
            });
            return;
        }
    }
    pub.util.logWarning("Can not find connection ["+ easyrtcid +"]");
    callback(new pub.util.ConnectionWarning("Can not find connection ["+ easyrtcid +"]"));
};



// Running the default listeners to initialize the events
pub.events.setDefaultListeners();
