/** 
 * @file        Event functions used by easyRTC. Many of these can be overridden using server options.  
 * @module      easyrtc_events
 * @author      Priologic Software, info@easyrtc.com
 * @copyright   Copyright 2013 Priologic Software. All rights reserved.
 */

var util        = require("util");                  // General utility functions core module
var _           = require("underscore");            // General utility functions external module
var g           = require("./general_util");        // General utility functions local module

var async       = require('async');                 // Asynchronous calls external module

// var e           = require("./easyrtc_private_obj"); // easyRTC private object
var pub         = require("./easyrtc_public_obj");  // easyRTC public object
var eu          = require("./easyrtc_util");        // easyRTC utility functions


/* Initializes easyRTC server so it is ready for connections. Depending on options this includes 
 * @param       {Object} next           callback to call upon completion. Delivers parameter (err).
 */
module.exports.onStartup  = function(next){
    if (!_.isFunction(next)) {
        next = function(err) {};
    }

    pub.util.logDebug("Running func 'onStartup'");
console.log("Running func 'onStartup'");
    async.waterfall([
        function(callback) {
            pub.util.logDebug("Configuring Http server");
            var easyrtcHttp = require('./easyrtc_http');
            easyrtcHttp.initHttpApp(callback);
        },

        function(callback) {
            pub.util.logDebug("Configuring Socket server");

            pub.socketServer.sockets.on('connection', function (socket) {
                var eEvents = require("./easyrtc_events");      // easyRTC event handler
                var easyrtcid = socket.id;

                pub.util.logDebug("["+easyrtcid+"] Socket connected");
                pub.util.logDebug("Emitting event 'connection'");
                eEvents.emit('connection', easyrtcid, function(err){
                    // TODO: Use easyRTC disconnect procedure
                    if(err){socket.disconnect();pub.util.logError("["+easyrtcid+"] Connect error", err);return;}
                });
            });

            callback(null);                
        },

        // Start experimental STUN server (if enabled)
        // TODO: Setup STUN server
        function(callback) {
            callback(null);                
        },

        // Checks to see if there is a newer version of easyRTC available
        // TODO: This
        function(callback) {
            callback(null);                
        },
    ],
    // This function is called upon completion of the async waterfall, or upon an error being thrown.
    function (err) {
        next(err);
    });
};



/* Sets up listeners for messages,   
 *
 * @param       {String} easyrtcid      Unique identifier for socket/easyRTC connection.
 * @param       {Object} next           Callback to call upon completion. Delivers parameter (err).
 */
module.exports.onConnection = function(easyrtcid, next){
    var eEvents = require("./easyrtc_events");      // easyRTC event handler

    var appObj = null;          // prepare variables to house the application object
    var connectionObj = null;   // prepare variables to house the connection object
    pub.util.logDebug("Running func 'onConnection'");

    async.waterfall([
        function(callback) {
            pub.app(pub.getOption("defaultApplicationName"), callback);
        },
        function(newAppObj, callback) {
            appObj = newAppObj;
            // TODO: Run isConnected to ensure easyrtcid isn't duplicated (rare)
            // TODO: Get Session Info
            appObj.createConnection(easyrtcid, callback);
        },
        function(newConnectionObj, callback) {
            // Allow method to use connectionObj
            connectionObj = newConnectionObj;

            // Set ICE Servers for connection
            connectionObj.setField("iceServers", pub.getOption("iceServers"), null, callback);
        },
        function(callback) {
            // TODO: Don't automatically set authentication.
            connectionObj.setAuthenticated(true, callback);
        },
        function(callback) {

            // Set Socket.io connection listeners

            // Incoming easyRTC commands: Used to forward webRTC negotiation details and manage server settings.
            connectionObj.socket.on('easyrtcCmd', function(msg) {
                pub.util.logDebug("["+easyrtcid+"] easyRTC command message received");
                pub.util.logDebug("Emitting event 'easyrtcCmd'");
                eEvents.emit('easyrtcCmd', easyrtcid, msg, function(err){
                    if(err){eu.socketDisconnect(connectionObj.socket);pub.util.logError("["+easyrtcid+"] Unhandled easyrtcCmd handler error. Disconnecting socket.", err);return;}
                });
            });
        
            // Backwards compatibility with old capitalization.
            // TODO: Remove this
            connectionObj.socket.on('easyRTCcmd', function(msg) {
                pub.util.logDebug("["+easyrtcid+"] easyRTC command message received");
                pub.util.logDebug("Emitting event 'easyrtcCmd'");
                eEvents.emit('easyrtcCmd', easyrtcid, msg, function(err){
                    if(err){eu.socketDisconnect(connectionObj.socket);pub.util.logError("["+easyrtcid+"] Unhandled easyrtcCmd handler error. Disconnecting socket.", err);return;}
                });
            });
        
            // Incoming messages: Custom message. Allows applications to send socket messages to other connected users.
            // TODO: Switch to 'easyrtcMessage'
            connectionObj.socket.on('message', function(msg) {
                pub.util.logDebug("["+easyrtcid+"] Message received");
                pub.util.logDebug("Emitting event 'message'");
                eEvents.emit('message', easyrtcid, msg, function(err){
                    if(err){eu.socketDisconnect(connectionObj.socket);pub.util.logError("["+easyrtcid+"] Unhandled message handler error. Disconnecting socket.", err);return;}
                });
            });
        
            // Upon a socket disconnecting (either directed or via time-out)
            connectionObj.socket.on('disconnect', function(data) {
                pub.util.logDebug("["+easyrtcid+"] Socket disconnected");
                pub.util.logDebug("Emitting event 'disconnect'");
                eEvents.emit('disconnect', easyrtcid, function(err){
                    if(err){pub.util.logError("["+easyrtcid+"] Unhandled disconnect handler error.", err);return;}
                });
            });
            
        },
        function(callback) {
            // TODO: Don't automatically send token
        }
    ],
    // This function is called upon completion of the async waterfall, or upon an error being thrown.
    function (err) {
        next(err);
    });
};


module.exports.onEasyrtcCmd = function(easyrtcid, msg, next){
    pub.util.logDebug("Running func 'onEasyrtcCmd'");
    // Messages with a targetId get forwarded on. This section should be hardened.
    if (msg.targetId) {
        pub.util.logDebug("TODO: Emitting event 'easyrtcCmd'");
        socketServer.sockets.socket(msg.targetId).json.emit('easyrtcCmd',{
            msgType:msg.msgType,
            senderId:easyrtcid,
            msgData:msg.msgData,
            serverTime: Date.now()
        });
    }
    next(null);
};


module.exports.onMessage    = function(easyrtcid, msg, next){
    pub.util.logDebug("Running func 'onMessage'");
    next(null);
};


module.exports.onDisconnect    = function(easyrtcid, next){
    pub.util.logDebug("Running func 'onDisconnect'");
    next(null);
};


/* Emits an easyRTC command to a user.
 * The easyrtcid, msgType, msgId, and serverTime fields will be added to the msg automatically.
 */
module.exports.onEmitEasyrtcCmd = function(easyrtcid, msgType, msg, next){
    pub.util.logDebug("Running func 'onEmitEasyrtcCmd'");
    
    if (!msg) {
        msg = {};
    }
    
    msg.easyrtcid   = easyrtcid;
    msg.msgType     = msgType;
    msg.msgId       = e.connections[easyrtcid].nextMsgId++;
    msg.serverTime  = Date.now();

    try {
        socket.json.emit( 'easyrtcCmd', msg);
    }
    catch(err) {
        pub.util.logDebug("["+easyrtcid+"] Error sending easyrtcCmd to socket. Socket may have diconnected.", err);
    }

    if (_.isFunction(next)) {
        next(null);
    }
};


/* Emits a list of other online users to a given easyrtcid. The API will replace its current list with the new one.
 * By default the list contains connections in the same room.
 */
module.exports.onEmitList = function(easyrtcid, next){
    var eEvents = require("./easyrtc_events");      // easyRTC event handler
    pub.util.logDebug("Running func 'onEmitList'");
    
    var msg = {};
    msg.msgData = {};
    msg.msgData.connections = {};
    
    // Form list of current connections
    for (var key in e.connections) {
        if (e.connections.hasOwnProperty(key) && e.connections[key].applicationName == e.connections[easyrtcid].applicationName) {
            msg.msgData.connections[key] = e.connections[key];
        }
    };
    eEvents.emit('emitEasyrtcCmd', easyrtcid, 'list', msg, next);
};


module.exports.onEmitError  = function(easyrtcid, errorCode, msgRefId, next){
    pub.util.logDebug("Running func 'onEmitError'");

    var msg = {};
    msg.errorCode = errorCode;
    if(msgRefId) {
        msg.msgRefId= msgRefId;
    }
    switch (errorCode) {
        case 'BANNED_IP_ADDR':
            msg.errorText="Client IP address is banned. Socket will be disconnected.";
            break;
        case 'LOGIN_APP_AUTH_FAIL':
            msg.errorText="Authentication for application failed. Socket will be disconnected.";
            break;
        case 'LOGIN_BAD_APP_NAME':
            msg.errorText="Provided application name is improper. Socket will be disconnected.";
            break;
        case 'LOGIN_BAD_AUTH':
            msg.errorText="API Key is invalid or referer address is improper. Socket will be disconnected.";
            break;
        case 'LOGIN_BAD_USER_CFG':
            msg.errorText="Provided configuration options improper or invalid. Socket will be disconnected.";
            break;
        case 'LOGIN_NO_SOCKETS':
            msg.errorText="No sockets available for account. Socket will be disconnected.";
            break;
        case 'LOGIN_TIMEOUT':
            msg.errorText="Login has timed out. Socket will be disconnected.";
            break;
        case 'MSG_REJECT_BAD_DATA':
            msg.errorText="Message rejected. The provided msgData is improper.";
            break;
        case 'MSG_REJECT_BAD_TYPE':
            msg.errorText="Message rejected. The provided msgType is unsupported.";
            break;
        case 'MSG_REJECT_NO_AUTH':
            msg.errorText="Message rejected. Not logged in or client not authorized.";
            break;
        case 'MSG_REJECT_TARGETID':
            msg.errorText="Message rejected. Targetid is invalid, not using same application, or no longer online.";
            break;
        case 'SERVER_SHUTDOWN':
            msg.errorText="Server is being shutdown. Socket will be disconnected.";
            break;
        default:
            msg.errorText="Error occured with error code: " + msg.errorCode;
    }

    eEvents.emit('emitEasyrtcCmd', easyrtcid, 'error', msg, next);
}



module.exports.onLog = function(level, logText, logFields) {
    var consoleText = "";

    if (pub.getOption("logColorEnable")) {
        colors = require("colors");
        if(pub.getOption("logDateEnable")) {
            d = new Date();
            consoleText += d.toISOString().grey + ' - ';      
        }
        switch (level) {
            case 'debug':
                consoleText += 'debug  '.bold.blue;
                break;
            case 'info':
                consoleText += 'info   '.bold.green;
                break;
            case 'warning':
                consoleText += 'warning'.bold.yellow;
                break;
            case 'error':
                consoleText += 'error  '.bold.red;
                break;
            default:
                consoleText += level.bold;
        }
        consoleText += ' - ' + 'easyRTC: '.bold + logText;
    }
    else {
        if(pub.getOption("logDateEnable")) {
            d = new Date();
            consoleText += d.toISOString() + ' - ';      
        }
        consoleText += level;
        consoleText += ' - ' + 'easyRTC: ' + logText;
    }
    
    if (logFields) {
        console.log(consoleText, util.inspect(logFields, {colors:pub.getOption("logColorEnable"), showHidden:false, depth:7}));
    } else {
        console.log(consoleText);
    }
}
