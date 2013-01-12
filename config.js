// easyRTC Configuration File
var config = {}; 

// User Configurable Options
// *************************
config.httpPort = 8080; // The port which the http and socket server is on.

// External stun server (will be used if experimentalStunServerEnable is false)
// Several public stun servers are available to be used.
config.externalIceServers = [
    {"url": "stun:stun.l.google.com:19302"}
];

// EXPERIMENTAL STUN SERVER
// It isn't good for production, but is nice for closed development.
// You "should" include two addresses which are reachable by all clients.
// Ports would need to be unblocked by firewalls.
config.experimentalStunServerEnable = false;  
config.experimentalStunServerAddr0 = "192.168.1.100";
config.experimentalStunServerAddr1 = "192.168.1.101";   // "should" be a seperate from Addr0
config.experimentalStunServerPort0 = "3478";
config.experimentalStunServerPort1 = "3479";

// The namespace for the default application.
config.defaultApplicationName = "default";

// Enable easyRTC demos. Viewable in /demos/
config.enableDemos = true;

// Check for updates
config.updateCheckEnable = true;

// **********************************
// End of user configurable settings.
// **********************************

// The following settings work alongside the easyRTC client API.
// DO NOT ALTER!
// *************************************************************
config.easyRtcVersion = "0.6.0";
config.cmdPacketType = "easyRTCcmd";
config.cmdMsgType = {
    list: "list",
    token: "token"
};

// Programatically Setting Some Settings
// *************************************
if (config.experimentalStunServerEnable)
    config.iceServers = [
        {"url": "stun:" + config.experimentalStunServerAddr0 + ":" + config.experimentalStunServerPort0},
        {"url": "stun:" + config.experimentalStunServerAddr0 + ":" + config.experimentalStunServerPort1},
        {"url": "stun:" + config.experimentalStunServerAddr1 + ":" + config.experimentalStunServerPort0},
        {"url": "stun:" + config.experimentalStunServerAddr1 + ":" + config.experimentalStunServerPort1}
    ];
else
    config.iceServers = config.externalIceServers;

// Allows the config file to be seen by a caller
module.exports = config;
