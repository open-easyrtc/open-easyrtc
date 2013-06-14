/** 
 * @file        Default options used within easyRTC. Overriding of default options should be done using the public listen() or setOption() functions.  
 * @module      easyrtc_default_options
 * @author      Priologic Software, info@easyrtc.com
 * @copyright   Copyright 2013 Priologic Software. All rights reserved.
 */

var config = {}; 

// External stun server. Several public stun servers are available to be used.
config.iceServers = [
    {url: "stun:stun.l.google.com:19302"},
    {url: "stun:stun.sipgate.net"},
    {url: "stun:217.10.68.152"},
    {url: "stun:stun.sipgate.net:10000"},
    {url: "stun:217.10.68.152:10000"}
];


// The namespace for the default application.
config.defaultApplicationName = "default";


// API Hosting Options
config.apiEnable            = true;         // Enables hosting of the easyRTC API files.
config.apiPublicFolder      = '/easyrtc';   // Api public folder without trailing slash. Note that the demos expect this to be '/easyrtc'
config.apiMinifyJsEnable    = true;         // Minify's the API javascript for faster transfer.
config.apiOldLocationEnable = true;         // [Depreciated] Listens for requests to core API files in old locations (in addition to the new standard locations) 


// Demo Options
config.demosEnable          = true;
config.demosPublicFolder    = '/demos';     // Demos public folder without trailing slash.


// Log options
config.logLevel             = 'info';       // The minimum log level to show. (debug|info|warning|error|none)
config.logDateEnable        = false;
config.logColorEnable       = true;


// Check for updates
config.updateCheckEnable    = true;


// Allows the config object to be seen by the caller.
module.exports = config;