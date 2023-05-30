/* global module, require */

/**
 * @file        Default options used within EasyRTC. Overriding of default options should be done using the public listen() or setOption() functions.
 * @module      easyrtc_default_event_listeners
 * @author      Open-EasyRTC
 * @copyright   Copyright 2022 Open-EasyRTC. All rights reserved.
 * @license     BSD v2, see LICENSE file in module root folder.
 */

// EasyRTC global variable
const defaultEventListener = require("./classes/server/default-listeners");
console.warn("Deprecated use of '/lib/easyrtc_default_event_listeners' use '/lib/classes/server/default-listeners' instead.");

// Allows the option object to be seen by the caller.
module.exports = defaultEventListener;



