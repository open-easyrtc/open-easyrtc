/** 
 * @file        Maintains public object returned by easyRTC listen() function. 
 * @module      easyrtc_public_obj
 * @author      Priologic Software, info@easyrtc.com
 * @copyright   Copyright 2013 Priologic Software. All rights reserved.
 */

var _               = require("underscore");                // General utility functions external module
var g               = require("./general_util");            // General utility functions local module
var e               = require("./easyrtc_private_obj"); // easyRTC private object

var p = {};

p.getVersion = function() {return e.version;};

p.getOption = function(optionName) {return e.option[optionName]};


/**
 * Sets individual option.
 * 
 * @param       {Object} option Option name     
 * @param       {Object} value  Option value
 * @returns     {Boolean} true on success, false on failure
 */
p.setOption = function(optionName, optionValue) {
    // Error if option name is improper.


    // Warning if not setting existing option
    if (typeof e.option[optionName] == 'undefined') {
        log("warning", "Unrecognised option name '" + optionName + "'. Setting it anyways.");
     }

    // TODO: Use a case statement to handle specific option types to ensure they are set properly.
    
    e.option[optionName] = g.deepCopy(optionValue);
    return true;
}



module.exports = p;