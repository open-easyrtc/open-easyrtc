/** 
 * @file        Maintains private object used within easyRTC for holding in-memory state information
 * @module      easyrtc_private_var
 * @author      Priologic Software, info@easyrtc.com
 * @copyright   Copyright 2013 Priologic Software. All rights reserved.
 */

// var _               = require("underscore");                // General utility functions external module
var defaultOptions  = require("./easyrtc_default_options"); // easyRTC global variable
var g               = require("./general_util");            // General utility functions local module

var e = {};

e.version           = g.getPackageData('version');
e.serverStartOn     = Date.now();
e.option            = g.deepCopy(defaultOptions);
e.app               = {};

// Initialize default app
e.app[e.option.defaultAppName] = {
    field:{},
    room:{},
    group:{},
    session:{},
    connection:{}
};



// Old variable names - should be removable soon.
e.connections       = {};
e.serverStartTime   = Date.now();

module.exports = e;
