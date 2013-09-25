/** 
 * @file        Default options used within EasyRTC. Overriding of default options should be done using the public listen() or setOption() functions.  
 * @module      easyrtc_default_options
 * @author      Priologic Software, info@easyrtc.com
 * @copyright   Copyright 2013 Priologic Software. All rights reserved.
 * @license     BSD v2, see LICENSE file in module root folder. 
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


// Application Options
option.appDefaultName       = "default";                    // The default application a connection belongs to if it is not initially specified.
option.appAutoCreateEnable  = true;                         // Enables the creation of rooms from the API. Occurs when client joins a nonexistent room.


// Room Options
option.roomDefaultEnable    = true;                         // Enables connections joining a default room if it is not initially specified. If false, than a connection initially may be in no room.
option.roomDefaultName      = "default";                    // The default room a connection joins if it is not initially specified.
option.roomAutoCreateEnable = true;                         // Enables the creation of rooms from the API. Occurs when client joins a nonexistent room.


// Connection Options
option.connectionDefaultField = {                           // Default connection fields.
    browserFamily:  {share:true, regex:null, data:null},
    browserMajor:   {share:true, regex:null, data:null},
    osFamily:       {share:true, regex:null, data:null},
    deviceFamily:   {share:true, regex:null, data:null}
};


// API Hosting Options
option.apiEnable            = true;                         // Enables hosting of the EasyRTC API files.
option.apiPublicFolder      = "/easyrtc";                   // Api public folder without trailing slash. Note that the demos expect this to be '/easyrtc'
option.apiMinifyJsEnable    = true;                         // Minify's the API Javascript for faster transfer.
option.apiOldLocationEnable = false;                        // [Depreciated] Listens for requests to core API files in old locations (in addition to the new standard locations) 


// Demo Options
option.demosEnable          = true;
option.demosPublicFolder    = "/demos";                     // Demos public folder without trailing slash.


// Log options - Only apply if internal 'log' event is used
option.logLevel             = "info";                       // The minimum log level to show. (debug|info|warning|error|none)
option.logDateEnable        = false;                        // Display timestamp in each entry
option.logErrorStackEnable  = true;                         // print the stack trace in logged errors when available
option.logWarningStackEnable= true;                         // print the stack trace in logged warnings when available
option.logColorEnable       = true;                         // include console colors. Disable if forwarding logs to files or databases
option.logObjectDepth       = 7;                            // When objects are included in the log, this is the max depth the log will display


// Miscellaneous Server Options
option.updateCheckEnable    = true;                         // Checks for updates


// Regular expressions for validating names and other input
option.apiVersionRegExp     = /^[a-z0-9_.-]{1,32}$/i;       // API Version
option.appNameRegExp        = /^[a-z0-9_.-]{1,32}$/i;       // Application name 
option.easyrtcidRegExp      = /^[a-z0-9_.-]{1,32}$/i;       // EasyRTC socket id (easyrtcid)
option.easyrtcsidRegExp     = /^[a-z0-9_.-]{1,64}$/i;       // EasyRTC session id (easyrtcsid)
option.groupNameRegExp      = /^[a-z0-9_.-]{1,32}$/i;       // Group name
option.fieldNameRegExp      = /^[a-z0-9_. -]{1,32}$/i;      // Field names (for defining app and room custom fields)
option.optionNameRegExp     = /^[a-z0-9_. -]{1,32}$/i;      // Option names (for defining server options)
option.presenceShowRegExp   = /^(away|chat|dnd|xa)$/;       // Allowed presence "show" values (for setPresence command)
option.presenceStatusRegExp = /^(.){0,255}$/;               // Allowed presence "status" value
option.roomNameRegExp       = /^[a-z0-9_.-]{1,32}$/i;       // Room name
option.sessionKeyRegExp     = /^[a-z0-9_.-]{1,32}$/i;       // Session key (easyrtcsid)
option.usernameRegExp       = /^(.){1,64}$/i;               // Username



// Allows the option object to be seen by the caller.
module.exports = option;