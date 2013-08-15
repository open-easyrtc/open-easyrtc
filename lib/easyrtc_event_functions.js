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
module.exports.onAuthenticate = function(socket, easyrtcid, msg, socketCallback, callback) {
    pub.util.logDebug("Running func 'onAuthenticate'");

    var tokenMsg = {
        msgType: "token",
        msgData:{}
    };
    
    var appObj = {};
    var connectionObj = {};
    var roomObj = {};
    var newAppName = ""; 
    
    async.waterfall([
        function(callback) {
            // Check to see if the requested app currently exists.
            newAppName = (_.isObject(msg.msgData) &&_.isString(msg.msgData.applicationName)) ? msg.msgData.applicationName : pub.getOption("defaultApplicationName"); 
            pub.isApp(newAppName, callback);
        },

        function(isApp, callback) {
            // If requested app exists, then call it, otherwise create it.
            if (isApp) {
                pub.app(newAppName, callback);
            } else {
                // TODO: Check if allowed to create app
                if(pub.getOption("appAutoCreateEnable")) {
                    pub.createApp(newAppName, callback);
                } else {
                    socketCallback(pub.util.getErrorMsg("LOGIN_APP_AUTH_FAIL"));
                    socket.disconnect();
                    pub.util.logWarning("[" + easyrtcid + "] Authentication failed. Requested application not found [" + newAppName + "]. Socket disconnected.");
                }
            }
        },

        function(newAppObj, callback) {
            // Now that we have an app, we can create the connection
            appObj = newAppObj;
            appObj.createConnection(easyrtcid, callback);
        },

        function(newConnectionObj, callback) {
            connectionObj = newConnectionObj;
            
            // TODO: Don't automatically set authentication.
            connectionObj.setAuthenticated(true, callback);
        },

        function(callback) {
            // TODO: Remove this dummy data
            if (!_.isObject(msg.msgData.roomJoin) || _.isEmpty(msg.msgData.roomJoin)) {
msg.msgData.roomJoin = {'fakeRoom':{roomName:'fakeRoom'},'fakeRoom222':{roomName:'fakeRoom222'},'default':{roomName:'default'}};
            }
            if (_.isObject(msg.msgData.roomJoin) && !_.isEmpty(msg.msgData.roomJoin)) {
                async.each(Object.keys(msg.msgData.roomJoin), function(currentRoomName, roomCallback) {
                    
                    appObj.isRoom(currentRoomName, function(err, isRoom){
                        if (isRoom) {
                            connectionObj.joinRoom(currentRoomName, roomCallback);
                        } 
                        else {
                            connectionObj.getApp().createRoom(currentRoomName, function(err, roomObj){
                                if (err) {
                                    roomCallback(err);
                                    return;
                                }
                                connectionObj.joinRoom(currentRoomName, roomCallback);
                            });
                        }
                    });
                    
                }, function(err, newRoomObj) {
                    callback(err, newRoomObj);
                });            
            } else {
                connectionObj.joinRoom(pub.getOption("roomDefaultName"), callback);
            }
        },

        function(newRoomObj, callback) {
            roomObj = newRoomObj;

            // Get rooms user is in along with list
            connectionObj.generateConnectionList(callback);
        },

        function(roomData, callback) {
            // Set roomData
            tokenMsg.msgData.roomData = roomData;

            // Retrieve ice servers
            connectionObj.getField("iceServers", function(err, iceServers) {
                if (err) {
                    callback(null, pub.getOption("iceServers"));
                }
                else {
                    callback(null, iceServers);
                }
            });
        },

        function(iceServers, callback) {
            tokenMsg.msgData.application        = {applicationName:connectionObj.getApp().getAppName()};
            tokenMsg.msgData.easyrtcid          = connectionObj.getEasyrtcid();
            tokenMsg.msgData.iceConfig          = {iceServers: iceServers};
            tokenMsg.msgData.serverTime         = Date.now();

            socketCallback(tokenMsg);
            callback(null);
        },

        function(callback) {
            // Emit list delta to other clients in room
            connectionObj.emitRoomDataDelta(false, callback);
        }

    ], function(err) {
        if (err) {
            callback(err);
        } else {
            callback(null, connectionObj);
        }
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
    var connectionObj = {};             // prepare variables to house the connection object

    var isConnectionComplete = false;   // Switches to true after connection completed. Used to prevent messages from being processed to quickly 
    var isConnectionAuthenticated = false; // Switches to true after authentication successful. 


    // Duplicate of on("easyrtcCmd") to aid in transition 
    socket.on("easyrtcAuth", function(msg, socketCallback) {

        // Ensure socketCallback is present
        if(!_.isFunction(socketCallback)) {
            pub.util.logWarning("["+easyrtcid+"] easyRTC Auth message received with no callback. Disconnecting socket.", msg);
            try{socket.disconnect();}catch(e){}
            return;
        }

        // Check msg structure.
        if(!msg || !msg.msgType || msg.msgType != "authenticate") {
            pub.util.logWarning("["+easyrtcid+"] easyRTC Auth message received without msgType of 'authenticate'. Disconnecting socket.", msg);
            try{socket.disconnect();}catch(e){}
            return;
        }

        async.waterfall([
            function(callback) {
                // TODO: If connection already has a connection object, than log them out of it
                
                // Remove any old listeners
                socket.removeAllListeners("easyrtcCmd");
                socket.removeAllListeners("easyrtcMsg");
                socket.removeAllListeners("disconnect"); // TODO: Come up with alternative to removing all disconnect listeners

                pub.util.logDebug("Emitting Authenticate");
                
                // Authenticate is responsible for authenticating the connection and emiting the token.
                pub.eventHandler.emit("authenticate", socket, easyrtcid, msg, socketCallback, callback);
            },

            function(newConnectionObj, callback) {
                connectionObj = newConnectionObj;
                isConnectionAuthenticated = true;
                
                // Add new listeners
                socket.on("easyrtcCmd", function(msg, socketCallback){
                    pub.eventHandler.emit("easyrtcCmd", connectionObj, msg, socketCallback, function(err){
                        if(err){pub.util.logError("["+easyrtcid+"] Unhandled easyrtcCmd handler error.", err);return;}
                    });
                    
                });
                socket.on("easyrtcMsg", function(msg, socketCallback){
                    pub.eventHandler.emit("easyrtcMsg", connectionObj, msg, socketCallback, function(err){
                        if(err){pub.util.logError("["+easyrtcid+"] Unhandled easyrtcMsg handler error.", err);return;}
                    });
                });
                socket.on("disconnect", function(){
                    pub.eventHandler.emit("disconnect", connectionObj, function(err){
                        if(err){pub.util.logError("["+easyrtcid+"] Unhandled disconnect handler error.", err);return;}
                    });
                });
                
                callback(null);
            }
        ],
        // This function is called upon completion of the async waterfall, or upon an error being thrown.
        function (err) {
            if (!err) {
                isConnectionComplete = true;
            }
            next(err);
        });
    });
/*
    // Setting socket listeners. We set this right away in case messages arrive quickly.
    // Socket.IO listener for incoming messages of type 'easyrtcMsg'
    socket.on("easyrtcMsg", function(msg, socketCallback) {
        var localCb = function() {
            // If no socket callback is provided, set an empty one.
            if(!_.isFunction(socketCallback)) {
                pub.util.logWarning("["+easyrtcid+"] easyRTC message received with no callback", msg);
                socketCallback = function(returnMsg) {};
            }

            pub.util.logDebug("["+easyrtcid+"] Message received of type [" + msg.msgType + "]", msg);

            pub.eventHandler.emit("easyrtcMsg", connectionObj, msg, socketCallback, function(err){
                if(err){
                    eu.socketDisconnect(connectionObj.socket);
                    pub.util.logError("["+easyrtcid+"] Unhandled message handler error. Disconnecting socket.", err);
                    return;
                }
            });
        };
        
        // Runs immediately if connection is complete, otherwise saves the message into the stack to be processed in order.
        if (isConnectionComplete) {
            localCb();
        } else {
            runWhenConnectionComplete.push(localCb);
        }
    });

*/
    pub.util.logDebug("Running func 'onConnection'");
    next(null);
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
    
    next(null);
};


/**
 * Default listener fired when an incoming socket message has a type of "easyrtcCmd" 
 */
module.exports.onEasyrtcCmd = function(connectionObj, msg, socketCallback, next){
    if (!_.isFunction(next)) {
        next = function(err) {};
    }

    if(!_.isFunction(socketCallback)) {
        pub.util.logWarning("[" + connectionObj.getEasyrtcid() + "] easyRTC command message received with no callback", msg);
        socketCallback = function(returnMsg) {};
    }

    // If message has no msgType, then ignore it.
    if (!msg || !_.isString(msg.msgType)) {
        pub.util.logWarning("[" + connectionObj.getEasyrtcid() + "] easyRTC command message received with no msgType. Ignoring.", msg);
        return;
    }

    pub.util.logDebug("[" + connectionObj.getEasyrtcid() + "] easyRTC command message received of type [" + msg.msgType + "]", msg);

    // The msgType controls how each message is handled
    switch(msg.msgType) {
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
            if (msg.targetEasyrtcid) {
                pub.util.logDebug("Emitting event 'easyrtcCmd'");

                socketCallback({msgType:'ack'});
                // Relay message to targetEasyrtcid
                var outgoingMsg = {senderEasyrtcid: connectionObj.getEasyrtcid(), msgData:msg.msgData};
                connectionObj.getApp().connection(msg.targetEasyrtcid, function(err,targetConnectionObj){
                    if (err){console.log("ERROR", err);return;}
                    pub.eventHandler.emit("emitEasyrtcCmd", targetConnectionObj, msg.msgType, outgoingMsg, null, next);
                });
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
module.exports.onEasyrtcMsg = function(connectionObj, msg, socketCallback, next){
    if (!_.isFunction(next)) {
        next = function(err) {};
    }

    if(!_.isFunction(socketCallback)) {
        pub.util.logWarning("[" + connectionObj.getEasyrtcid() + "] easyRTC message received with no callback", msg);
        socketCallback = function(returnMsg) {};
    }

    // If message is not an object, then return an error.
    if(!_.isObject(msg)) {
        pub.util.logWarning("[" + connectionObj.getEasyrtcid() + "] easyRTC message received was not an easyRTC message object. Ignoring.", msg);
        socketCallback(pub.util.getErrorText("MSG_REJECT_BAD_STRUCTURE"));
        return;
    }

    // If message has no msgType, then return an error.
    if (!msg || !_.isString(msg.msgType)) {
        pub.util.logWarning("[" + connectionObj.getEasyrtcid() + "] easyRTC message received with no msgType. Ignoring.", msg);
        socketCallback(pub.util.getErrorText("MSG_REJECT_BAD_TYPE"));
        return;
    }

    pub.util.logDebug("[" + connectionObj.getEasyrtcid() + "] easyRTC message received of type [" + msg.msgType + "]", msg);



    if (msg.targetEasyrtcid) {
        socketCallback({msgType:'ack'});

        // Relay message to targetEasyrtcid
        var outgoingMsg = {
            senderEasyrtcid: connectionObj.getEasyrtcid(),
            tartgetEasyrtcid: msg.targetEasyrtcid
        };

        if ('undefined' !== typeof msg.msgData) {
            outgoingMsg.msgData = msg.msgData;
        }

        connectionObj.getApp().connection(msg.targetEasyrtcid, function(err,targetConnectionObj){
            if (err){console.log("ERROR", err);return;}
            pub.eventHandler.emit("emitEasyrtcMsg", targetConnectionObj, msg.msgType, outgoingMsg, null, next);
        });

    } else {
        pub.util.logWarning("[" + connectionObj.getEasyrtcid() + "] easyRTC message received without targetEasyrtcid", msg);
        next(null);
    }
};


/**
 * Default listener for when server should emits an easyRTC command to a socket.
 * The msgId and serverTime fields will be added to the msg automatically.
 */
module.exports.onEmitEasyrtcCmd = function(connectionObj, msgType, msg, socketCallback, next){
    pub.util.logDebug("Running func 'onEmitEasyrtcCmd'");
    if (!msg) {
        msg = {};
    }
    if(!_.isFunction(socketCallback)) {
        socketCallback = function(returnMsg) {
            pub.util.logDebug("["+connectionObj.getEasyrtcid()+"] easyRTC command message: unhandled ACK return message.", returnMsg);
        };
    }

    msg.easyrtcid   = connectionObj.getEasyrtcid();
    msg.msgType     = msgType;
    msg.serverTime  = Date.now();

    connectionObj.socket.emit( "easyrtcCmd", msg);
    pub.util.logDebug("["+msg.easyrtcid+"] is sent easyrtcCmd", msg);

    next(null);
};



/**
 * Default listener for when server should emits an easyRTC command to a socket.
 * The msgId and serverTime fields will be added to the msg automatically.
 */
module.exports.onEmitEasyrtcMsg = function(connectionObj, msgType, msg, socketCallback, next){
    pub.util.logDebug("Running func 'onEmitEasyrtcMsg'");

    if (!msg) {
        msg = {};
    }
    if(!_.isFunction(socketCallback)) {
        socketCallback = function(returnMsg) {
            pub.util.logDebug("["+connectionObj.getEasyrtcid()+"] easyRTC message: unhandled ACK return message.", returnMsg);
        };
    }
    msg.msgType     = msgType;
    msg.serverTime  = Date.now();

    connectionObj.socket.emit( "easyrtcMsg", msg);
    pub.util.logDebug("[" + connectionObj.getEasyrtcid() + "] is sent easyrtcMsg", msg);

    next(null);
};



/**
 * Emits an error to a connection as a new message. 
 */
module.exports.onEmitError      = function(connectionObj, errorCode, socketCallback, next){
    pub.util.logDebug("Running func 'onEmitError'");
    if(!_.isFunction(socketCallback)) {
        socketCallback = function(returnMsg) {
            pub.util.logDebug("["+connectionObj.getEasyrtcid()+"] easyRTC info: unhandled ACK return message.", returnMsg);
        };
    }
    if(!_.isFunction(next)) {
        next = function(err) {};
    }

    pub.eventHandler.emit("emitEasyrtcCmd", connectionObj, "error", pub.util.getErrorMsg(errorCode), socketCallback, next);
};



/**
 * Emits an error to a connection as a response to an incoming message. 
 */
module.exports.onEmitReturnError    = function(socketCallback, errorCode, next){
    pub.util.logDebug("Running func 'onEmitReturnError'");
    if(!_.isFunction(socketCallback)) {
        pub.util.logWarning("easyRTC: unable to return error to socket. Error code was [" + errorCode + "]");
        // TODO: Run next() with error
        return;
    }
    if(!_.isFunction(next)) {
        next = function(err) {};
    }

    var msg = {
        msgType: "error",
        msgData:{
            errorCode: errorCode,
            errorText: pub.util.getErrorText(errorCode)
        }
    };

    if (!msg.msgData.errorText) {
        msg.msgData.errorText="Error occured with error code: " + msg.errorCode;
    }
    
    socketCallback(msg);

    next(null);
};



/**
 * Emits an ack to a connection as a response to an incoming message. 
 */
module.exports.onEmitReturnAck    = function(socketCallback, next){
    pub.util.logDebug("Running func 'onEmitReturnError'");
    if(!_.isFunction(socketCallback)) {
        pub.util.logWarning("easyRTC: unable to return ack to socket.");
        return;
    }
    if(!_.isFunction(next)) {
        next = function(err) {};
    }

    var msg = {
        msgType: "ack",
        msgData:{}
    };

    if (!msg.msgData.errorText) {
        msg.msgData.errorText="Error occured with error code: " + msg.errorCode;
    }
    
    socketCallback(msg);

    next(null);
};



/**
 * The primary log handler. 
 */
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

                // TODO: Remove this debug output (should disable itself after Sept 1, 2013)
                if (Date.now() < 1378011600000) {
                    pub.httpApp.get(pub.getOption("apiPublicFolder") + "/debug_e",  function(req, res) {
                        res.setHeader("Content-Type", "text/plain");
                        res.end(Date.now() + "\n\n" + require("util").inspect(require("./easyrtc_private_obj").app, { showHidden: true, depth: 10 }));
                    });
                }


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
            pub.createApp(pub.getOption("appDefaultName"), callback);                
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

