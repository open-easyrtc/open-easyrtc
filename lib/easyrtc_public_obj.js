/* global module, require */

/**
 * @file        Default options used within EasyRTC. Overriding of default options should be done using the public listen() or setOption() functions.
 * @module      easyrtc_public_obj
 * @author      Open-EasyRTC
 * @copyright   Copyright 2022 Open-EasyRTC. All rights reserved.
 * @license     BSD v2, see LICENSE file in module root folder.
 */

// EasyRTC global variable
const index = require("./index");
console.warn("Deprecated use of '/lib/easyrtc_public_obj' use '/lib' instead.");

// Allows the option object to be seen by the caller.
module.exports = index;
