/* global module, require */

/**
 * @file        Default options used within EasyRTC. Overriding of default options should be done using the public listen() or setOption() functions.
 * @module      easyrtc_default_options
 * @author      Open-EasyRTC
 * @copyright   Copyright 2022 Open-EasyRTC. All rights reserved.
 * @license     BSD v2, see LICENSE file in module root folder.
 */

// EasyRTC global variable
const defaultOptions = require("./classes/server/default-options");
console.warn("Deprecated use '/classes/server/default-options' instead");

// Allows the option object to be seen by the caller.
module.exports = defaultOptions;
