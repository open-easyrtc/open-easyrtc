/* global module, require */

/**
 * @file        Maintains private object used within EasyRTC for holding in-memory state information
 * @module      easyrtc_private_obj
 * @author      Open-EasyRTC
 * @copyright   Copyright 2022 Open-EasyRTC. All rights reserved.
 * @license     BSD v2, see LICENSE file in module root folder.
 */

// Internals dependencies
var easyrtc_utils = require("./../easyrtc_utils"); // General utility functions local module

// TODO migreate to ES6 or TypeScript
module.exports = function Session(appName, easyrtcsid, server) {

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
    // TODO namespace filter;
    //sessionObj.events = pub.events;


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
        if (!server.app[appName].session[easyrtcsid].field[fieldName]) {
            easyrtc_utils.logDebug("Can not find session field: '" + fieldName + "'");
            callback(new easyrtc_utils.ApplicationWarning("Can not find session field: '" + fieldName + "'"));
            return;
        }
        callback(null, easyrtc_utils.deepCopy(server.app[appName].session[easyrtcsid].field[fieldName]));
    };

    /**
     * Returns session level field object for a given field name. If the field is not set, it will return a field object will a null field value.  This is a synchronous function, thus may not be available in custom cases where state is not kept in memory.
     *
     * @memberof    pub.appObj.sessionObj
     * @param       {string}    fieldName   Field name
     * @returns     {Object}    Field object
     */
    sessionObj.getFieldSync = function(fieldName) {
        if (!server.app[appName].session[easyrtcsid].field[fieldName]) {
            return {"fieldName": fieldName, "fieldOption": {}, "fieldValue": null};
        }
        return easyrtc_utils.deepCopy(server.app[appName].session[easyrtcsid].field[fieldName]);
    };

    /**
     * Returns session level field value for a given field name. If the field is not set, it will return a null field value.  This is a synchronous function, thus may not be available in custom cases where state is not kept in memory.
     *
     * @memberof    pub.appObj.sessionObj
     * @param       {string}    fieldName   Field name
     * @returns     {?*}        Field value
     */
    sessionObj.getFieldValueSync = function(fieldName) {
        if (!server.app[appName].session[easyrtcsid].field[fieldName]) {
            return null;
        }
        return easyrtc_utils.deepCopy(server.app[appName].session[easyrtcsid].field[fieldName].fieldValue);
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
        for (var fieldName in server.app[appName].session[easyrtcsid].field) {
            if (!limitToIsShared || server.app[appName].session[easyrtcsid].field[fieldName].fieldOption.isShared) {
                fieldObj[fieldName] = {
                    fieldName: fieldName,
                    fieldValue: easyrtc_utils.deepCopy(server.app[appName].session[easyrtcsid].field[fieldName].fieldValue)
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
        easyrtc_utils.logDebug("[" + appName + "] Session [" + easyrtcsid + "] - Setting field [" + fieldName + "]", fieldValue);
        if (!_.isFunction(next)) {
            next = easyrtc_utils.nextToNowhere;
        }

        if (!pub.getOption("fieldNameRegExp").test(fieldName)) {
            easyrtc_utils.logWarning("Can not create session field with improper name: '" + fieldName + "'");
            next(new easyrtc_utils.ApplicationWarning("Can not create session field with improper name: '" + fieldName + "'"));
            return;
        }

        server.app[appName].session[easyrtcsid].field[fieldName] = {
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
                Object.keys(server.app[appName].session[easyrtcsid].toConnection),
                function(currentEasyrtcid, asyncCallback) {

                    // Retrieve a connection object, then send the sessionData message.
                    appObj.connection(currentEasyrtcid, function(err, targetConnectionObj) {
                        if (err || !_.isObject(targetConnectionObj)) {
                            easyrtc_utils.logDebug("[" + currentEasyrtcid + "] Could not get connection object to send session data field update. Client may have disconnected.");
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

    return sessionObj;
};