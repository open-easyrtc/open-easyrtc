/**
 * @file        Maintains private object used within EasyRTC for holding in-memory state information
 * @module      easyrtc_private_obj
 * @author      Priologic Software, info@easyrtc.com
 * @copyright   Copyright 2014 Priologic Software. All rights reserved.
 * @license     BSD v2, see LICENSE file in module root folder.
 */

// var _               = require("underscore");                // General utility functions external module
var defaultOptions  = require("./easyrtc_default_options"); // EasyRTC global variable
var g               = require("./general_util");            // General utility functions local module

var e = {};

e.version           = g.getPackageData("version");
e.serverStartOn     = Date.now();
e.option            = g.deepCopy(defaultOptions);
e.app               = {};

module.exports = e;
