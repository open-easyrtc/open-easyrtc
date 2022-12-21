/* global module, require, process */

/**
 * @file        Entry library for EasyRTC server. Houses the primary listen function.
 * @author      Open-EasyRTC
 * @copyright   Copyright 2022 Open-EasyRTC. All rights reserved.
 * @license     BSD v2, see LICENSE file in module root folder.
 */

// Externals dependencies
var _ = require("underscore"); // General utility functions external module

// Internals dependencies
var server      = require("./easyrtc_public_obj"); // EasyRTC public object
var utils    = require("./utils"); // General utility functions local module

utils.checkModules(); // Check to ensure all required modules are available

/**
 * Gets EasyRTC Version. The format is in a major.minor.patch format with an optional letter following denoting alpha or beta status. The version is retrieved from the package.json file located in the EasyRTC project root folder.
 *
 * @return      {string}                EasyRTC Version
 */
server.getVersion = () => utils.getPackageData("version");

module.exports = server;
