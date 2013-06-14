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

var e           = require("./easyrtc_private_obj"); // easyRTC private object
var pub         = require("./easyrtc_public_obj");  // easyRTC public object
var eu          = require("./easyrtc_util");        // easyRTC utility functions
var eEvents     = require("./easyrtc_events");      // easyRTC event handler


/* Initializes easyRTC server so it is ready for connections. Depending on options this includes 
 * @param       {Object} httpApp        express http object. Allows easyRTC to interact with the http server.
 * @param       {Object} socketServer   socket.io server object. Allows easyRTC to interact with the socket server.
 * @param       {Object} next           callback to call upon completion. Delivers parameter (err).
 */
module.exports.onStartup  = function(httpApp, socketServer, next){
    eu.logDebug("Running func 'onStartup'");

    async.waterfall([
        function(callback) {
            eu.logDebug("Configuring Http server");
            var easyrtcHttp = require('./easyrtc_http');
            easyrtcHttp.initHttpApp(httpApp, callback);
        },

        function(callback) {
            eu.logDebug("Configuring Socket server");

            socketServer.sockets.on('connection', function (socket) {
                var eEvents = require("./easyrtc_events");      // easyRTC event handler
                var easyrtcid = socket.id;

                eu.logDebug("["+easyrtcid+"] Socket connected");
                eu.logDebug("Emitting event 'connection'");
                eEvents.emit('connection', socketServer, socket, easyrtcid, function(err){
                        if(err){socket.disconnect();eu.logError("["+easyrtcid+"] Connect error", err);return;}
                        eu.logDebug("Emitting event 'afterConnection'");
                        eEvents.emit('afterConnect', socketServer, socket, easyrtcid)
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
 * @param       {Object} socketServer   Socket.io server object.
 * @param       {Object} socket         Socket.io connection object.
 * @param       {String} easyrtcid      Unique identifier for socket/easyRTC connection.
 * @param       {Object} next           Callback to call upon completion. Delivers parameter (err).
 */
module.exports.onConnection = function(socketServer, socket, easyrtcid, next){
    var eEvents = require("./easyrtc_events");      // easyRTC event handler
    eu.logDebug("Running func 'onConnection'");

    e.connections[easyrtcid]={
        easyrtcid: easyrtcid,
        applicationName: e.options.defaultApplicationName,
        isAuthenticated: true,         // TODO: Should default to false
        clientConnectTime: Date.now()
    };

    // Immediately send the easyrtcid and application
    // TODO: Wait until authenticated to send token
    socket.json.emit( 'easyRTCcmd', {
        msgType: 'token',
        easyrtcid: easyrtcid,
        applicationName: e.connections[easyrtcid].applicationName,
        isAuthenticated: e.connections[easyrtcid].isAuthenticated,
        iceConfig: {"iceServers": e.options.iceServers},
        serverTime: Date.now()
    });


    // Incoming easyRTC commands: Used to forward webRTC negotiation details and manage server settings.
    socket.on('easyrtcCmd', function(msg) {
        eu.logDebug("["+easyrtcid+"] easyRTC command message received");
        eu.logDebug("Emitting event 'easyrtcCmd'");
        eEvents.emit('easyrtcCmd', socketServer, socket, easyrtcid, msg, function(err){
            if(err){eu.socketDisconnect(socket);eu.logError("["+easyrtcid+"] Unhandled easyrtcCmd handler error. Disconnecting socket.", err);return;}
            eu.logDebug("Emitting event 'afterEasyrtcCmd'");
            eEvents.emit('afterEasyrtcCmd', socketServer, socket, easyrtcid, msg)
        });
    });

    // Backwards compatibility with old capitalization.
    // TODO: Remove this
    socket.on('easyRTCcmd', function(msg) {
        eu.logDebug("["+easyrtcid+"] easyRTC command message received");
        eu.logDebug("Emitting event 'easyrtcCmd'");
        eEvents.emit('easyrtcCmd', socketServer, socket, easyrtcid, msg, function(err){
            if(err){eu.socketDisconnect(socket);eu.logError("["+easyrtcid+"] Unhandled easyrtcCmd handler error. Disconnecting socket.", err);return;}
            eu.logDebug("Emitting event 'afterEasyrtcCmd'");
            eEvents.emit('afterEasyrtcCmd', socketServer, socket, easyrtcid, msg)
        });
    });

    // Incoming messages: Custom message. Allows applications to send socket messages to other connected users.
    // TODO: Switch to 'easyrtcMessage'
    socket.on('message', function(msg) {
        eu.logDebug("["+easyrtcid+"] Message received");
        eu.logDebug("Emitting event 'message'");
        eEvents.emit('message', socketServer, socket, easyrtcid, msg, function(err){
            if(err){eu.socketDisconnect(socket);eu.logError("["+easyrtcid+"] Unhandled message handler error. Disconnecting socket.", err);return;}
            eu.logDebug("Emitting event 'afterConnect'");
            eEvents.emit('afterConnect', socketServer, socket, easyrtcid, msg)
        });
    });

    // Upon a socket disconnecting (either directed or via time-out)
    socket.on('disconnect', function(data) {
        eu.logDebug("["+easyrtcid+"] Socket disconnected");
        eu.logDebug("Emitting event 'disconnect'");
        eEvents.emit('disconnect', socketServer, socket, easyrtcid, function(err){
            if(err){eu.logError("["+easyrtcid+"] Unhandled disconnect handler error.", err);return;}
            eu.logDebug("Emitting event 'afterDisconnect'");
            eEvents.emit('afterDisconnect', socketServer, socket, easyrtcid);
        });
    });

    next(null);
};

module.exports.onEasyrtcCmd = function(socketServer, socket, easyrtcid, msg, next){
    eu.logDebug("Running func 'onEasyrtcCmd'");






    // Messages with a targetId get forwarded on. This section should be hardened.
    if (msg.targetId) {
        socketServer.sockets.socket(msg.targetId).json.emit('easyRTCcmd',{
            msgType:msg.msgType,
            senderId:connectionEasyRtcId,
            msgData:msg.msgData,
            serverTime: Date.now()
        });
    }



    next(null);
};

module.exports.onMessage    = function(socketServer, socket, easyrtcid, msg, next){
    eu.logDebug("Running func 'onMessage'");
    next(null);
};

module.exports.onDisconnect    = function(socketServer, socket, easyrtcid, next){
    eu.logDebug("Running func 'onDisconnect'");
    next(null);
};





module.exports.OnEmitError  = function(socket, errorCode, next){
    try{
        eu.logDebug("Running func 'onEmitError'");
        switch (errorCode) {
            case 'BANNED_IP_ADDR':
                socket.emit("easyRTCcmd", {msgType:"error", msgData:{errorCode:errorCode, errorText:"Client IP address is banned. Socket will be disconnected."}});
                break;
            case 'LOGIN_APP_AUTH_FAIL':
                socket.emit("easyRTCcmd", {msgType:"error", msgData:{errorCode:errorCode, errorText:"Authentication for application failed. Socket will be disconnected."}});
                break;
            case 'LOGIN_BAD_APP_NAME':
                socket.emit("easyRTCcmd", {msgType:"error", msgData:{errorCode:errorCode, errorText:"Provided application name is improper. Socket will be disconnected."}});
                break;
            case 'LOGIN_BAD_AUTH':
                socket.emit("easyRTCcmd", {msgType:"error", msgData:{errorCode:errorCode, errorText:"API Key is invalid or referer address is improper. Socket will be disconnected."}});
                break;
            case 'LOGIN_BAD_USER_CFG':
                socket.emit("easyRTCcmd", {msgType:"error", msgData:{errorCode:errorCode, errorText:"Provided configuration options improper or invalid. Socket will be disconnected."}});
                break;
            case 'LOGIN_NO_SOCKETS':
                socket.emit("easyRTCcmd", {msgType:"error", msgData:{errorCode:errorCode, errorText:"No sockets available for account. Socket will be disconnected."}});
                break;
            case 'LOGIN_TIMEOUT':
                socket.emit("easyRTCcmd", {msgType:"error", msgData:{errorCode:errorCode, errorText:"Login has timed out. Socket will be disconnected."}});
                break;
            case 'MSG_REJECT_BAD_DATA':
                socket.emit("easyRTCcmd", {msgType:"error", msgData:{errorCode:errorCode, errorText:"Message rejected. The provided msgData is improper."}});
                break;
            case 'MSG_REJECT_BAD_TYPE':
                socket.emit("easyRTCcmd", {msgType:"error", msgData:{errorCode:errorCode, errorText:"Message rejected. The provided msgType is unsupported."}});
                break;
            case 'MSG_REJECT_NO_AUTH':
                socket.emit("easyRTCcmd", {msgType:"error", msgData:{errorCode:errorCode, errorText:"Message rejected. Not logged in or client not authorized."}});
                break;
            case 'MSG_REJECT_TARGETID':
                socket.emit("easyRTCcmd", {msgType:"error", msgData:{errorCode:errorCode, errorText:"Message rejected. Targetid is invalid, not using same application, or no longer online."}});
                break;
            case 'SERVER_SHUTDOWN':
                socket.emit("easyRTCcmd", {msgType:"error", msgData:{errorCode:errorCode, errorText:"Server is being shutdown. Socket will be disconnected."}});
                break;
            default:
                throw new Error("Unknown error code: " + errorCode);
        }
        next(null);
    } catch (err) {
        eu.logDebug("Error emitting error to socket.", err);
    }
}



module.exports.onLog = function(level, logText, logFields) {
    var consoleText = "";

    if (e.options.logColorEnable) {
        colors = require("colors");
        if(e.options.logDateEnable) {
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
        if(e.options.logDateEnable) {
            d = new Date();
            consoleText += d.toISOString() + ' - ';      
        }
        consoleText += level;
        consoleText += ' - ' + 'easyRTC: ' + logText;
    }
    
    if (logFields) {
        console.log(consoleText, util.inspect(logFields, {colors:e.options.logColorEnable, showHidden:true}));
    } else {
        console.log(consoleText);
    }
}
