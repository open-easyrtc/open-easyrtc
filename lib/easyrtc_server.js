/* global module, require */

/**
 * @file        Default options used within EasyRTC. Overriding of default options should be done using the public listen() or setOption() functions.
 * @module      easyrtc_server
 * @author      Open-EasyRTC
 * @copyright   Copyright 2022 Open-EasyRTC. All rights reserved.
 * @license     BSD v2, see LICENSE file in module root folder.
 */

// EasyRTC global variable
const defaultOptions = require("./easyrtc_public_obj");
console.warn("Deprecated use '/lib/easyrtc_server'.");

// Allows the option object to be seen by the caller.
module.exports = defaultOptions;
