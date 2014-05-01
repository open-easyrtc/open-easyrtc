/**
 * @file        Entry library for EasyRTC server. Houses the primary listen function.
 * @author      Priologic Software, info@easyrtc.com
 * @copyright   Copyright 2014 Priologic Software. All rights reserved.
 * @license     BSD v2, see LICENSE file in module root folder.
 */

var g           = require("./general_util");        // General utility functions local module
g.checkModules(); // Check to ensure all required modules are available

var _           = require("underscore");            // General utility functions external module
var pub         = require("./easyrtc_public_obj");  // EasyRTC public object


/**
 * Listener for starting the EasyRTC server. The successCallback can be used to determine when EasyRTC is fully running.
 *
 * @param       {Object} httpApp        express http object. Allows EasyRTC to interact with the http server.
 * @param       {Object} socketServer   socket.io server object. Allows EasyRTC to interact with the socket server.
 * @param       {Object} options        EasyRTC options object. Sets configurable options. If null, than defaults will be used.
 * @param       {function(Error, Object)} listenCallback Called when the start up routines are complete. In form of successCallback(err, pub). The parameter 'err' will null unless an error occurs and 'pub' is the EasyRTC public object for interacting with the server.
 */
exports.listen = function(httpApp, socketServer, options, listenCallback) {
    pub.util.logInfo("Starting EasyRTC Server (v" + pub.getVersion() +") on Node (" + process.version + ")");

    // Set server object references in public object
    pub.httpApp         = httpApp;
    pub.socketServer    = socketServer;

    if (options){
        pub.util.logDebug("Overriding options", options);

        for (var optionName in options) {
            pub.setOption(optionName, options[optionName]);
        }
    }

    pub.util.logDebug("Emitting event 'startup'");
    pub.events.emit("startup", function(err) {
        if (err) {
            pub.util.logError("Error occurred upon startup", err);
            if(_.isFunction(listenCallback)) {
                listenCallback(err, null);
            }
        }
        else {
            pub.util.logInfo("EasyRTC Server Ready For Connections (v"+ pub.getVersion() + ")");
            if(_.isFunction(listenCallback)) {
                listenCallback(err, pub);
            }
        }
    });
};


/**
 * Returns an EasyRTC options object with a copy of the default options.
 *
 * @returns     {Object}                EasyRTC options object
 */
exports.getDefaultOptions = function() {
    var defaultOptions = require("./easyrtc_default_options");
    return g.deepCopy(defaultOptions);
};


/**
 * Sets listener for a given EasyRTC event. Only one listener is allowed per event. Any other listeners for an event are removed before adding the new one.
 *
 * @private
 * @param       {String} event          Listener name.
 * @param       {Function} listener       Function
 */
exports.on = function(event, listener) {
    if (event && _.isFunction(listener)) {
        pub.events.removeAllListeners(event);
        pub.events.on(event, listener);
    }
    else {
        pub.util.logError("Unable to add listener to event '" + event + "'");
    }
};


/**
 * Removes all listeners for an event. If there is a default EasyRTC listener, it will be added.
 *
 * @private
 * @param       {String} event          Listener name.
 */
exports.removeAllListeners = function(event) {
    if (event) {
        pub.events.removeAllListeners(event);
        pub.events.setDefaultListener(event);
    }
};


/**
 * Returns the listeners for an event.
 *
 * @private
 * @param       {String} event          Listener name.
 */
exports.listeners = pub.events.listeners;


/**
 * Expose all event functions
 */
exports.events = pub.events;


/**
 * Expose public utility functions
 */
exports.util = pub.util;


/**
 * Sets individual option.
 *
 * @param       {Object} option Option name
 * @param       {Object} value  Option value
 * @returns     {Boolean} true on success, false on failure
 */
exports.setOption = pub.setOption;
