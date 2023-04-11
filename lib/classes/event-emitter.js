/* global module, require */

/**
 * @file        Maintains private object used within EasyRTC for holding in-memory state information
 * @module      OpenEasyRTC
 * @author      Open-EasyRTC
 * @copyright   Copyright 2022 Open-EasyRTC. All rights reserved.
 * @license     BSD v2, see LICENSE file in module root folder.
 */

// Externals dependencies
const events = require("events");
const _ = require("underscore"); // General utility functions external module

// Internals dependencies
const easyrtc_utils = require("./../utils/error"); // General utility functions local module
const eventListener = require("./server/default-listeners"); // EasyRTC default event listeners

// TODO migreate to ES6 or TypeScript
module.exports = function EventEmitter(appName, socketId, easyrtcid, appObj) {

	/**
	 * EasyRTC Event handling object which contain most methods for interacting with EasyRTC eventsObj. For convenience, this class has also been attached to the application, connection, session, and room classes.
	 * @class
	 */
	const eventsObj = {};

	/**
	 * Map of EasyRTC event listener names to their default functions. This map can be used to run a default function manually.
	 */
	eventsObj.defaultListeners = {
	    "authenticate": eventListener.onAuthenticate,
	    "authenticated": eventListener.onAuthenticated,
	    "connection": eventListener.onConnection,
	    "disconnect": eventListener.onDisconnect,
	    "getIceConfig": eventListener.onGetIceConfig,
	    "roomCreate": eventListener.onRoomCreate,
	    "roomJoin": eventListener.onRoomJoin,
	    "roomLeave": eventListener.onRoomLeave,
	    "log": eventListener.onLog,
	    "shutdown": eventListener.onShutdown,
	    "startup": eventListener.onStartup,
	    "easyrtcAuth": eventListener.onEasyrtcAuth,
	    "easyrtcCmd": eventListener.onEasyrtcCmd,
	    "easyrtcMsg": eventListener.onEasyrtcMsg,
	    "emitEasyrtcCmd": eventListener.onEmitEasyrtcCmd,
	    "emitEasyrtcMsg": eventListener.onEmitEasyrtcMsg,
	    "emitError": eventListener.onEmitError,
	    "emitReturnAck": eventListener.onEmitReturnAck,
	    "emitReturnError": eventListener.onEmitReturnError,
	    "emitReturnToken": eventListener.onEmitReturnToken,
	    "msgTypeGetIceConfig": eventListener.onMsgTypeGetIceConfig,
	    "msgTypeGetRoomList": eventListener.onMsgTypeGetRoomList,
	    "msgTypeRoomJoin": eventListener.onMsgTypeRoomJoin,
	    "msgTypeRoomLeave": eventListener.onMsgTypeRoomLeave,
	    "msgTypeSetPresence": eventListener.onMsgTypeSetPresence,
	    "msgTypeSetRoomApiField": eventListener.onMsgTypeSetRoomApiField
	};

	/**
	 * EasyRTC EventEmitter.
	 *
	 * @private
	 */
	eventsObj._eventListener = new events.EventEmitter();

	/**
	 * Expose event listener's emit function.
	 *
	 * @param       {string} eventName      EasyRTC event name.
	 * @param       {...*} eventParam       The event parameters
	 */
	eventsObj.emit = eventsObj._eventListener.emit.bind(eventsObj._eventListener);


	/**
	 * Runs the default EasyRTC listener for a given event.
	 *
	 * @param       {string} eventName      EasyRTC event name.
	 * @param       {...*} eventParam       The event parameters
	 */
	eventsObj.emitDefault = function() {
	    if (!eventsObj.defaultListeners[arguments['0']]) {
	        console.error("Error emitting listener. No default for event '" + arguments['0'] + "' exists.");
	        return;
	    }
	    eventsObj.defaultListeners[Array.prototype.shift.call(arguments)].apply(this, arguments);
	};

	/**
	 * Resets the listener for a given event to the default listener. Removes other listeners.
	 *
	 * @param       {string} eventName      EasyRTC event name.
	 */
	eventsObj.setDefaultListener = function(eventName) {
	    if (!_.isFunction(eventsObj.defaultListeners[eventName])) {
	        console.error("Error setting default listener. No default for event '" + eventName + "' exists.");
	    }
	    eventsObj._eventListener.removeAllListeners(eventName);
	    eventsObj._eventListener.on(eventName, eventsObj.defaultListeners[eventName]);
	};


	/**
	 * Resets the listener for all EasyRTC events to the default listeners. Removes all other listeners.
	 */
	eventsObj.setDefaultListeners = function() {
	    eventsObj._eventListener.removeAllListeners();
	    for (var currentEventName in eventsObj.defaultListeners) {
	        if (_.isFunction(eventsObj.defaultListeners[currentEventName])) {
	            eventsObj._eventListener.on(currentEventName, eventsObj.defaultListeners[currentEventName]);
	        } else {
	            throw new easyrtc_utils.ServerError("Error setting default listener. No default for event '" + currentEventName + "' exists.");
	        }
	    }
	};

	/**
	 * Sets listener for a given EasyRTC event. Only one listener is allowed per event. Any other listeners for an event are removed before adding the new one. See the events documentation for expected listener parameters.
	 *
	 * @param       {string} eventName      Listener name.
	 * @param       {function} listener     Function to be called when listener is fired
	 */
	eventsObj.on = function(eventName, listener) {
	    if (eventName && _.isFunction(listener)) {
	        eventsObj._eventListener.removeAllListeners(eventName);
	        eventsObj._eventListener.on(eventName, listener);
	    }
	    else {
	        throw new easyrtc_utils.ServerError("Unable to add listener to event '" + eventName + "'");
	    }
	};

	/**
	 * Removes all listeners for an event. If there is a default EasyRTC listener, it will be added. If eventName is `null`, all events will be removed than the defaults will be restored.
	 *
	 * @param       {?string} eventName     Listener name. If `null`, then all events will be removed.
	 */
	eventsObj.removeAllListeners = function(eventName) {
	    if (eventName) {
	        eventsObj.setDefaultListener(eventName);
	    } else {
	        eventsObj.setDefaultListeners();
	    }
	};

	return eventsObj;
};