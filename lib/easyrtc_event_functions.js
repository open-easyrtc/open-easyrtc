/** 
 * @file        Event functions used by easyRTC. Many of these can be overridden using server options.  
 * @module      easyrtc_events
 * @author      Priologic Software, info@easyrtc.com
 * @copyright   Copyright 2013 Priologic Software. All rights reserved.
 */

var util        = require("util");                  // General utility functions core module
var _           = require("underscore");            // General utility functions external module
var g           = require("./general_util");        // General utility functions local module

var async       = require("async");                 // Asynchronous calls external module

var pub         = require("./easyrtc_public_obj");  // easyRTC public object
var eu          = require("./easyrtc_util");        // easyRTC utility functions


/**
 * Default listener fired when incoming easyrtcCmd message has a msgType of 'authenticate'. 
 */
module.exports.onAuthenticate = function(connectionObj, msg, socketCallback, next){
    pub.util.logDebug("Running func 'onAuthenticate'");

    var tokenMsg = {
        msgType: "token",
        msgData:{easyrtcid: connectionObj.getEasyrtcid()}
    };
    async.waterfall([
        function(callback) {
            // TODO: Don't automatically join the default room
            // connectionObj.joinRoom(pub.getOption("roomDefaultName"), callback);
            connectionObj.joinRoom(pub.getOption("roomDefaultName"), callback);
        },
        function(roomObj, callback) {
            // TODO: Don't automatically set authentication.
            connectionObj.setAuthenticated(true, callback);
        },
        function(callback) {
            // Get rooms user is in along with list
            connectionObj.generateConnectionList(callback);
        },
        function(roomData, callback) {
            // Set roomData
            tokenMsg.msgData.roomData = roomData;

            // Retrieve ice servers
            connectionObj.getField("iceServers", callback);
        },
        function(iceServers, callback) {
            tokenMsg.msgData.application        = {applicationName:connectionObj.getApp().getAppName()};
            tokenMsg.msgData.iceConfig          = {iceServers: iceServers};
            tokenMsg.msgData.serverTime         = Date.now();

            socketCallback(tokenMsg);
            callback(null);
        },
        function(callback) {

console.log("\n\n\n["+ connectionObj.getEasyrtcid()+"]got to emit phase..");
            // Emit list delta to other clients in room
            for (var currentRoom in tokenMsg.msgData.roomData) {
console.log("["+ currentRoom+"]Current Room..");
                var msg = {msgData:{roomData:{}}};
                msg.msgData.roomData[currentRoom] = {roomName:currentRoom, listDelta:{updateConnection:{}}};
                msg.msgData.roomData[currentRoom].listDelta.updateConnection[connectionObj.getEasyrtcid()] =  tokenMsg.msgData.roomData[currentRoom].list[connectionObj.getEasyrtcid()];
                for (var currentEasyrtcid in tokenMsg.msgData.roomData[currentRoom].list) {
console.log("["+ currentEasyrtcid+"]Current easyrtcid..");
                    connectionObj.getApp().connection(currentEasyrtcid, function(err, emitToConnectionObj){
console.log("Emmitting ");
                        pub.eventHandler.emit("emitEasyrtcCmd", emitToConnectionObj, "roomData", msg, function(){});
                    })
                }
            }
            callback(null);            
        }
    ], function(err) {
pub.util.logWarning("PRIVATE OBJECT", require("./easyrtc_private_obj"));
        next(null);
    });

};



/**
 * Sets up listeners for messages,   
 *
 * @param       {String} easyrtcid      Unique identifier for socket/easyRTC connection.
 * @param       {Object} next           Callback to call upon completion. Delivers parameter (err).
 */
module.exports.onConnection     = function(socket, easyrtcid, next){
    var appObj = {};                    // prepare variables to house the application object
    var isConnectionComplete = false;   // Switches to true after connection completed. Used to prevent messages from being processed to quickly 
    var connectionObj = {};             // prepare variables to house the connection object
    var runWhenConnectionComplete = []; // Array to hold functions to be run upon completion. Useful for trapping first 'authenticate' message which may be received before connection process complete. 


    // Setting socket listeners. We set this right away in case messages arrive quickly.
    // Socket.IO listener for incoming messages of type 'easyrtcCmd'
    socket.on("easyrtcCmd", function(msg, socketCallback) {
        var localCb = function() {
            // If no socket callback is provided, set an empty one.
            if(!_.isFunction(socketCallback)) {
                pub.util.logWarning("["+easyrtcid+"] easyRTC command message received with no callback", msg);
                socketCallback = function(returnMsg) {};
            }
    
            // If message has no msgType, then ignore it.
            if (!msg || !_.isString(msg.msgType)) {
                pub.util.logWarning("["+easyrtcid+"] easyRTC command message received with no msgType. Ignoring.", msg);
                return;
            }
    
            pub.util.logDebug("["+easyrtcid+"] easyRTC command message received of type [" + msg.msgType + "]", msg);

            pub.eventHandler.emit("easyrtcCmd", connectionObj, msg, socketCallback, function(err){
                if(err){eu.socketDisconnect(connectionObj.socket);pub.util.logError("["+easyrtcid+"] Unhandled easyrtcCmd handler error. Disconnecting socket.", err);return;}
            });
        };
        
        // Runs immediately if connection is complete, otherwise saves the message into the stack to be processed in order.
        if (isConnectionComplete) {
            localCb();
        } else {
            runWhenConnectionComplete.push(localCb);
        }
    });


    // Socket.IO listener for incoming messages of type 'easyrtcMsg'
    socket.on("easyrtcMsg", function(msg, socketCallback) {
        var localCb = function() {
            // If no socket callback is provided, set an empty one.
            if(!_.isFunction(socketCallback)) {
                pub.util.logWarning("["+easyrtcid+"] easyRTC command message received with no callback", msg);
                socketCallback = function(returnMsg) {};
            }

            pub.util.logDebug("["+easyrtcid+"] Message received");

            pub.eventHandler.emit("message", connectionObj, msg, function(err){
                if(err){eu.socketDisconnect(connectionObj.socket);pub.util.logError("["+easyrtcid+"] Unhandled message handler error. Disconnecting socket.", err);return;}
            });
        };
        
        // Runs immediately if connection is complete, otherwise saves the message into the stack to be processed in order.
        if (isConnectionComplete) {
            localCb();
        } else {
            runWhenConnectionComplete.push(localCb);
        }
    });


    // Socuekt.IO listener which is run upon a socket disconnecting (either directed or via time-out)
    socket.on("disconnect", function(data) {
        var localCb = function() {
            pub.util.logDebug("["+easyrtcid+"] Socket disconnected");

            pub.eventHandler.emit("disconnect", connectionObj, function(err){
                if(err){pub.util.logError("["+easyrtcid+"] Unhandled disconnect handler error.", err);return;}
            });
        };

        // Runs immediately if connection is complete, otherwise saves the message into the stack to be processed in order.
        if (isConnectionComplete) {
            localCb();
        } else {
            runWhenConnectionComplete.push(localCb);
        }
    });


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
            isConnectionComplete = true;
            
            // runs the callbacks for messages which have been received before connection procedure has completed.
            for(var i = 0; i < runWhenConnectionComplete.length; i++) {
                runWhenConnectionComplete[i]();
            }
            runWhenConnectionComplete = [];

        }
    ],
    // This function is called upon completion of the async waterfall, or upon an error being thrown.
    function (err) {
        next(err);
    });
};


/**
 * Default listener fired when socket.io reports a socket has disconnected. 
 */
module.exports.onDisconnect     = function(connectionObj, next){
    pub.util.logDebug("Running func 'onDisconnect'");
    
    async.waterfall([
        function(callback) {
            // Get array of rooms
            connectionObj.getRoomNames(callback);
        },
        function(roomNames, callback) {
            // leave all rooms
            for(var i = 0; i < roomNames.length; i++) {
                connectionObj.room(roomNames[i], function(err, roomObj){
                    if (err) {return;}
                    roomObj.leaveRoom();
                })
            }
        },
        function(callback) {
            // log all connections as ended
        }
    ], function(err) {
        next(null);
    });
    
    
    // emit roomData->ListDelta messages to other users still in room
    
    
    next(null);
};


/**
 * Default listener fired when an incoming socket message has a type of "easyrtcCmd" 
 */
module.exports.onEasyrtcCmd     = function(connectionObj, msg, socketCallback, next){
    pub.util.logDebug("Running func 'onEasyrtcCmd'");

    if (!_.isFunction(next)) {
        next = function(err) {};
    }

    switch(msg.msgType) {
        case "authenticate":
    pub.util.logDebug("Emitting Authenticate");
            pub.eventHandler.emit("authenticate", connectionObj, msg, socketCallback, next);

            break;
        case "setUserCfg":

            async.waterfall([
                function(callback) {
                    // Error handling 
                    if (!_.isObject(msg.msgData)) {
                        pub.util.logWarning("[" + connectionObj.getEasyrtcid() + "] setUserCfg command received with missing msgData field.");
                        next(new pub.util.ConnectionWarning("setUserCfg command received with missing msgData field."))
                        return;
                    }
                    
                    
                },
                function(callback) {
                },
                function(iceServers, callback) {
                }
            ], function(err) {
                next(null);
            });

            pub.util.logWarning("[" + connectionObj.getEasyrtcid() + "] WebRTC setUserCfg command received. This feature is not yet complete.");
            socketCallback({msgType:'ack'});
            next(null);
            break;
        case "setPresence":
            socketCallback({msgType:'ack'});
            pub.util.logWarning("[" + connectionObj.getEasyrtcid() + "] WebRTC setPresence command received. This feature is not yet complete.");
            next(null);
            break;
        case "enterRoom":
            socketCallback({msgType:'ack'});
            pub.util.logWarning("[" + connectionObj.getEasyrtcid() + "] WebRTC enterRoom command received. This feature is not yet complete.");
            next(null);
            break;
        case "leaveRoom":
            socketCallback({msgType:'ack'});
            pub.util.logWarning("[" + connectionObj.getEasyrtcid() + "] WebRTC leaveRoom command received. This feature is not yet complete.");
            next(null);
            break;
        case "candidate":
        case "offer":
        case "answer":
        case "reject":
        case "hangup":
            if (msg.targetId) {
                pub.util.logDebug("Emitting event 'easyrtcCmd'");
                socketCallback({msgType:'ack'});

                pub.eventHandler.emit(
                    "emitEasyrtcCmd",
                    msg.targetId,
                    msg.msgType,
                    {senderId:easyrtcid, msgData:msg.msgData},
                    next
                );
            } else {
                pub.util.logWarning("[" + connectionObj.getEasyrtcid() + "] WebRTC command received without targetId.", msg);
                next(null);
            }
            break;
  
        default:      
            pub.util.logWarning("[" + connectionObj.getEasyrtcid() + "] Received easyrtcCmd message with unhandled msgType.", msg);
            next(null);
    }
};


/**
 * Default listener fired when an incoming socket message has a Socket.IO type of "easyrtcMsg" 
 */
module.exports.onEasyrtcMsg     = function(connectionObj, msg, next){
    pub.util.logDebug("Running func 'onMessage'");
    next(null);
};


/**
 * Default listener for when server should emits an easyRTC command to a socket.
 * The msgId and serverTime fields will be added to the msg automatically.
 */
module.exports.onEmitEasyrtcCmd = function(connectionObj, msgType, msg, next){
    pub.util.logDebug("Running func 'onEmitEasyrtcCmd'");
    
    if (!msg) {
        msg = {};
    }
    msg.easyrtcid   = connectionObj.getEasyrtcid();
    msg.msgType     = msgType;
    msg.serverTime  = Date.now();

    connectionObj.socket.emit( "easyrtcCmd", msg);
    pub.util.logDebug("["+msg.easyrtcid+"] is sent easyrtcCmd", msg);

    next(null);
};


module.exports.onEmitError      = function(easyrtcid, errorCode, msgRefId, next){
    pub.util.logDebug("Running func 'onEmitError'");

    var msg = {};
    msg.errorCode = errorCode;
    if(msgRefId) {
        msg.msgRefId= msgRefId;
    }
    switch (errorCode) {
        case "BANNED_IP_ADDR":
            msg.errorText="Client IP address is banned. Socket will be disconnected.";
            break;
        case "LOGIN_APP_AUTH_FAIL":
            msg.errorText="Authentication for application failed. Socket will be disconnected.";
            break;
        case "LOGIN_BAD_APP_NAME":
            msg.errorText="Provided application name is improper. Socket will be disconnected.";
            break;
        case "LOGIN_BAD_AUTH":
            msg.errorText="API Key is invalid or referer address is improper. Socket will be disconnected.";
            break;
        case "LOGIN_BAD_USER_CFG":
            msg.errorText="Provided configuration options improper or invalid. Socket will be disconnected.";
            break;
        case "LOGIN_NO_SOCKETS":
            msg.errorText="No sockets available for account. Socket will be disconnected.";
            break;
        case "LOGIN_TIMEOUT":
            msg.errorText="Login has timed out. Socket will be disconnected.";
            break;
        case "MSG_REJECT_BAD_DATA":
            msg.errorText="Message rejected. The provided msgData is improper.";
            break;
        case "MSG_REJECT_BAD_TYPE":
            msg.errorText="Message rejected. The provided msgType is unsupported.";
            break;
        case "MSG_REJECT_NO_AUTH":
            msg.errorText="Message rejected. Not logged in or client not authorized.";
            break;
        case "MSG_REJECT_TARGETID":
            msg.errorText="Message rejected. Targetid is invalid, not using same application, or no longer online.";
            break;
        case "SERVER_SHUTDOWN":
            msg.errorText="Server is being shutdown. Socket will be disconnected.";
            break;
        default:
            msg.errorText="Error occured with error code: " + msg.errorCode;
    }

    pub.eventHandler.emit("emitEasyrtcCmd", easyrtcid, "error", msg, next);
};



module.exports.onLog            = function(level, logText, logFields) {
    var consoleText = "";

    if (pub.getOption("logColorEnable")) {
        colors = require("colors");
        if(pub.getOption("logDateEnable")) {
            d = new Date();
            consoleText += d.toISOString().grey + " - ";      
        }
        switch (level) {
            case "debug":
                consoleText += "debug  ".bold.blue;
                break;
            case "info":
                consoleText += "info   ".bold.green;
                break;
            case "warning":
                consoleText += "warning".bold.yellow;
                break;
            case "error":
                consoleText += "error  ".bold.red;
                break;
            default:
                consoleText += level.bold;
        }
        consoleText += " - " + "easyRTC: ".bold + logText;
    }
    else {
        if(pub.getOption("logDateEnable")) {
            d = new Date();
            consoleText += d.toISOString() + " - ";      
        }
        consoleText += level;
        consoleText += " - " + "easyRTC: " + logText;
    }
    
    if (logFields != undefined && logFields != null) {
        if (pub.getOption("logErrorStackEnable") && pub.util.isError(logFields)) {
            console.log(consoleText, ((pub.getOption("logColorEnable"))? "\nStack Trace:\n------------\n".bold + logFields.stack.magenta + "\n------------".bold : "\nStack Trace:\n------------\n" + logFields.stack + "\n------------"));
        }
        else if (pub.getOption("logWarningStackEnable") && pub.util.isWarning(logFields)) {
            console.log(consoleText, ((pub.getOption("logColorEnable"))? "\nStack Trace:\n------------\n".bold + logFields.stack.cyan + "\n------------".bold : "\nStack Trace:\n------------\n" + logFields.stack + "\n------------"));
        }
        else {
            console.log(consoleText, util.inspect(logFields, {colors:pub.getOption("logColorEnable"), showHidden:false, depth:pub.getOption("logObjectDepth")}));
        }
    } else {
        console.log(consoleText);
    }
};


/**
 * Default listener fired when the server is being shutdown. 
 */
module.exports.onShutdown       = function(next){
    pub.util.logDebug("Running func 'onShutdown'");
    next(null);
};


/**
 * Initializes easyRTC server so it is ready for connections. Depending on options this includes
 *  
 * @param       {Object} next           callback to call upon completion. Delivers parameter (err).
 */
module.exports.onStartup        = function(next){
    if (!_.isFunction(next)) {
        next = function(err) {};
    }

    pub.util.logDebug("Running func 'onStartup'");
    async.waterfall([
        function(callback) {
            pub.util.logDebug("Configuring Http server");

            pub.httpApp.configure( function() {
                // Set the easyRTC demos
                if (pub.getOption("demosEnable")) {
                    pub.util.logDebug("Setting up demos to be accessed from '" + pub.getOption("demosPublicFolder") + "/'");
                    pub.httpApp.get(pub.getOption("demosPublicFolder") + "/*", function(req, res) {
                        res.sendfile(
                            "./demos/" + (req.params[0] ? req.params[0] : "index.html"),
                            {root:__dirname + "/../"},
                            function(err) {
                                try{if (err && err.status && res && !res._headerSent) {
                                    res.status(404);
                                    var body =    "<html><head><title>File Not Found</title></head><body><h1>File Not Found</h1></body></html>";
                                    res.setHeader("Content-Type", "text/html");
                                    res.setHeader("Content-Length", body.length);
                                    res.end(body);
                                }}catch(e){}
                            }
                        );
                    });
                    // Forward people who forget the trailing slash to the folder.
                    pub.httpApp.get(pub.getOption("demosPublicFolder"), function(req, res) {res.redirect(pub.getOption("demosPublicFolder") + "/");});
                }
        
                if (pub.getOption("apiEnable")) {
                    // Set the easyRTC API files
                    // TODO: Minified version
                    pub.util.logDebug("Setting up API files to be accessed from '" + pub.getOption("apiPublicFolder") + "/'");
                    pub.httpApp.get(pub.getOption("apiPublicFolder") + "/easyrtc.js",                  function(req, res) {res.sendfile("api/easyrtc.js",                  {root:__dirname + "/../"});});
                    pub.httpApp.get(pub.getOption("apiPublicFolder") + "/easyrtc.css",                 function(req, res) {res.sendfile("api/easyrtc.css",                 {root:__dirname + "/../"});});
                    pub.httpApp.get(pub.getOption("apiPublicFolder") + "/img/powered_by_easyrtc.png",  function(req, res) {res.sendfile("api/img/powered_by_easyrtc.png",  {root:__dirname + "/../"});});
                }
        
                if (pub.getOption("apiEnable") && pub.getOption("apiOldLocationEnable")) {
                    pub.util.logWarning("Enabling listening for API files in older depreciated location.");
                    // Transition - Old locations of easyRTC API files
                    pub.httpApp.get("/js/easyrtc.js",                   function(req, res) {res.sendfile("api/easyrtc.js",              {root:__dirname + "/../"});});
                    pub.httpApp.get("/css/easyrtc.css",                 function(req, res) {res.sendfile("api/easyrtc.css",             {root:__dirname + "/../"});});
                }
            });
            callback(null);
        },

        function(callback) {
            pub.util.logDebug("Configuring Socket server");

            pub.socketServer.sockets.on("connection", function (socket) {
                var easyrtcid = socket.id;

                pub.util.logDebug("["+easyrtcid+"] Socket connected");
                pub.util.logDebug("Emitting event 'connection'");
                pub.eventHandler.emit("connection", socket, easyrtcid, function(err){
                    // TODO: Use easyRTC disconnect procedure
                    if(err){
                        socket.disconnect();
                        pub.util.logError("["+easyrtcid+"] Connect error", err);
                        return;}
                });
            });
            callback(null);                
        },

        // Setup default application
        function(callback) {
            pub.createApp(pub.getOption("defaultAppName"), callback);                
        },

        // Start experimental STUN server (if enabled)
        // TODO: Setup STUN server
        function(appObj, callback) {
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

