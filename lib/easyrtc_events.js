/** 
 * @file        Manage events used by easyRTC. Also facilitates ability to override easyRTC events. 
 * @module      easyrtc_events
 * @author      Priologic Software, info@easyrtc.com
 * @copyright   Copyright 2013 Priologic Software. All rights reserved.
 */

var util        = require('util');                      // util core module
var events      = require('events');                    // events core module
var ef          = require('./easyrtc_event_functions');
var eu          = require("./easyrtc_util");            // easyRTC utility functions
var e           = require("./easyrtc_private_obj");     // easyRTC private object


/**
 * Blank event object which returns itself
 * 
 * @returns     {Object}                Reference to itself
 */
var easyrtcEvent = function(){
    return this;
};

// Set event object to inherit from the EventEmitter
util.inherits(easyrtcEvent, events.EventEmitter);


/*
 * Resets a specific event to use the easyRTC default listener. Any other listeners attached to the event are removed even if there is no default defined.
 * 
 * @param       {String} event   
 */ 
easyrtcEvent.prototype.setDefaultListener = function (event) {
    if (!event) {
        return;
    }

    eu.logDebug("Setting default listener for event '" + event + "'");

    this.removeAllListeners(event);
    if (this.defaultListeners[event]) {
        this.on(event, this.defaultListeners[event]);
    }
}


/*
 * Removes all event listeners, then resets all easyRTC default listeners.
 */ 
easyrtcEvent.prototype.setDefaultListeners = function () {
    this.removeAllListeners();

    // eu.logDebug("Setting default listener for all events");
    for (var key in this.defaultListeners) {
        this.on(key, this.defaultListeners[key]);
    }
}


// Sets default event listeners object.
easyrtcEvent.prototype.defaultListeners = {
    'log' :             ef.onLog,
    'startup' :         ef.onStartup,
    'connection' :      ef.onConnection,
    'easyrtcCmd':       ef.onEasyrtcCmd,
    'emitEasyrtcCmd':   ef.onEmitEasyrtcCmd,
    'emitError':        ef.onEmitError,
    'emitList':         ef.onEmitList,
    'message' :         ef.onMessage,
    'disconnect':       ef.onDisconnect
}


// Create new event instance and set it to be returned with the module
var ei = module.exports = new easyrtcEvent();

// Initialize the event with default listeners
ei.setDefaultListeners();