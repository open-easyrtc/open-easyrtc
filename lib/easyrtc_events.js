/** 
 * @file        Manage events used by easyRTC. Also facilitates ability to override easyRTC events. 
 * @module      easyrtc_events
 * @author      Priologic Software, info@easyrtc.com
 * @copyright   Copyright 2013 Priologic Software. All rights reserved.
 */

var util        = require('util');                      // util core module
var events      = require('events');                    // events core module

var EasyrtcEvent = function(){
    events.EventEmitter.call(this);

    return this;
};
EasyrtcEvent.prototype.__proto__ = events.EventEmitter.prototype;

var eventHandler = new EasyrtcEvent();

module.exports = eventHandler;
