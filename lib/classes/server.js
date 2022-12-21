/* global module, require */

/**
 * @file        Maintains private object used within EasyRTC for holding in-memory state information
 * @module      easyrtc_private_obj
 * @author      Open-EasyRTC
 * @copyright   Copyright 2022 Open-EasyRTC. All rights reserved.
 * @license     BSD v2, see LICENSE file in module root folder.
 */

// Internals dependencies
var defaultOptions = require("./../easyrtc_default_options");    // EasyRTC global variable
var utils = require("./../utils");                      // General utility functions local module

// TODO migreate to ES6 or TypeScript
const Server = function Server(defaultOptions) {
    var serverObj = {};

    // TODO getters/readonly
    serverObj.version           = Server.version;
    serverObj.serverStartOn     = Date.now();

    // TODO ?
    serverObj.option            = utils.deepCopy(Server.defaultOptions);

    // TODO use Map
    serverObj.app               = {};

    return serverObj;
}

Server.version = utils.getPackageData("version");

Server.defaultOptions = defaultOptions;

module.exports = Server;