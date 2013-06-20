/** 
 * @file        Default options used within easyRTC. Overriding of default options should be done using the public listen() or setOption() functions.  
 * @module      easyrtc_default_options
 * @author      Priologic Software, info@easyrtc.com
 * @copyright   Copyright 2013 Priologic Software. All rights reserved.
 */

var option = {}; 

// External stun server. Several public stun servers are available to be used.
option.iceServers = [
    {url: "stun:stun.l.google.com:19302"},
    {url: "stun:stun.sipgate.net"},
    {url: "stun:217.10.68.152"},
    {url: "stun:stun.sipgate.net:10000"},
    {url: "stun:217.10.68.152:10000"}
];


// The namespace for the default application.
option.defaultAppName       = "default";


// API Hosting Options
option.apiEnable            = true;         // Enables hosting of the easyRTC API files.
option.apiPublicFolder      = '/easyrtc';   // Api public folder without trailing slash. Note that the demos expect this to be '/easyrtc'
option.apiMinifyJsEnable    = true;         // Minify's the API javascript for faster transfer.
option.apiOldLocationEnable = true;         // [Depreciated] Listens for requests to core API files in old locations (in addition to the new standard locations) 


// Demo Options
option.demosEnable          = true;
option.demosPublicFolder    = '/demos';     // Demos public folder without trailing slash.


// Log options
option.logLevel             = 'info';       // The minimum log level to show. (debug|info|warning|error|none)
option.logDateEnable        = false;
option.logColorEnable       = true;


// Check for updates
option.updateCheckEnable    = true;


// Regular expressions for validating names and other input
option.appNameRegExp        = /^[a-z0-9_.-]{1,32}$/i;       // Application name 
option.roomNameRegExp       = /^[a-z0-9_.-]{1,32}$/i;       // Room name
option.groupNameRegExp      = /^[a-z0-9_.-]{1,32}$/i;       // Group name
option.fieldNameRegExp      = /^[a-z0-9_. -]{1,32}$/i;      // Field names (for defining app and room custom fields)
option.optionNameRegExp     = /^[a-z0-9_. -]{1,32}$/i;      // Option names (for defining server options)
option.sessionKeyRegExp     = /^[a-z0-9_.-]{1,32}$/i;       // Session key (easyrtcsid)


// Allows the option object to be seen by the caller.
module.exports = option;