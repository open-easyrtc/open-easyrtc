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
 * Default listener for handling authentication. By default everyone gets in!
 */
module.exports.onAuthenticate = function(socket, easyrtcid, appName, username, credential, easyrtcAuthMessage, next) {
    next(null);
};


/**
 * Listener to be run upon a new socket connection   
 *
 * @param       {Object} socket         Socket.io socket object
 * @param       {String} easyrtcid      Unique identifier for socket/easyRTC connection.
 * @param       {Object} next           Callback to call upon completion. Delivers parameter (err).
 */
module.exports.onConnection     = function(socket, easyrtcid, next){
    var connectionObj = {};             // prepare variables to house the connection object

    // Initially upon a connection, we are only concerned with receiving an easyrtcAuth message 
    socket.on("easyrtcAuth", function(msg, socketCallback) {
        pub.eventHandler.emit("easyrtcAuth", socket, easyrtcid, msg, socketCallback, function(err, newConnectionObj){
            if(err){
                pub.util.logError("["+easyrtcid+"] Unhandled easyrtcCmd handler error.", err);
                return;
            }

            connectionObj = newConnectionObj;
        });
    });

    pub.util.logDebug("Running func 'onConnection'");
    next(null);
};


/**
 * Default listener fired when socket.io reports a socket has disconnected. 
 */
module.exports.onDisconnect     = function(connectionObj, next){
    pub.util.logDebug("Running func 'onDisconnect'");
    
    async.waterfall([
        function(asyncCallback) {
            // Get array of rooms
            connectionObj.getRoomNames(asyncCallback);
        },
        function(roomNames, asyncCallback) {
            // leave all rooms
            for(var i = 0; i < roomNames.length; i++) {
                connectionObj.room(roomNames[i], function(err, roomObj){
                    if (err) {return;}
                    roomObj.leaveRoom();
                });
            }
            asyncCallback(null);
        },
        function(asyncCallback) {
            // log all connections as ended
            pub.util.logDebug("[" + connectionObj.getEasyrtcid() + "] Disconnected");
            connectionObj.removeConnection(asyncCallback);
        }
    ], function(err) {
        next(null);
    });
    
    next(null);
};


/**
 * Listener to be run upon receiving an easyrtcAuth socket.io message 
 *
 * @param       {Object} socket         Socket.io socket object
 * @param       {String} easyrtcid      Unique identifier for socket/easyRTC connection.
 * @param       {Object} msg            Socket.io message from client
 * @param       {Object} socketCallback Callback to call upon completion. Delivers parameter (err, connectionObj).
 * @param       {Object} callback       Callback to call upon completion. Delivers parameter (err, connectionObj).
 */
module.exports.onEasyrtcAuth    = function(socket, easyrtcid, msg, socketCallback, callback){
    pub.util.logDebug("Running func 'onEasyrtcAuth'");

    var appObj = {};                    // prepare variables to house the application object
    var connectionObj = {};             // prepare variables to house the connection object
    var tokenMsg = {
        msgType: "token",
        msgData:{}
    };
    var newAppName;

    // Ensure socketCallback is present
    if(!_.isFunction(socketCallback)) {
        pub.util.logWarning("["+easyrtcid+"] easyRTC Auth message received with no callback. Disconnecting socket.", msg);
        try{socket.disconnect();}catch(e){}
        return;
    }

    // Only accept authenticate message
    if(!_.isObject(msg) || !_.isString(msg.msgType) || msg.msgType != "authenticate") {
        pub.util.logWarning("["+easyrtcid+"] easyRTC Auth message received without msgType of 'authenticate'. Disconnecting socket.", msg);
        // TODO: socketCallback...
        try{socket.disconnect();}catch(e){}
        return;
    }

    // Check msg structure.
    if(!_.isObject(msg.msgData) 
        || !_.isString(msg.msgData.apiVersion)
        || (msg.msgData.roomJoin !== undefined && !_.isObject(msg.msgData.roomJoin))
    ) {
        pub.util.logWarning("["+easyrtcid+"] easyRTC Auth message received with improper msgData. Disconnecting socket.", msg);
        // TODO: socketCallback...
        try{socket.disconnect();}catch(e){}
        return;
    }
    async.waterfall([
        function(asyncCallback) {
            // TODO: If connection already has a connection object, than log them out of it

            // Remove any old listeners
            socket.removeAllListeners("easyrtcCmd");
            socket.removeAllListeners("easyrtcMsg");
            socket.removeAllListeners("disconnect"); // TODO: Come up with alternative to removing all disconnect listeners

            pub.util.logDebug("Emitting Authenticate");

            var appName     = (_.isString(msg.msgData.applicationName)) ? msg.msgData.applicationName : pub.getOption("defaultApplicationName");
            var username    = (msg.msgData.username     ? msg.msgData.username  : null);
            var credential  = (msg.msgData.credential   ? msg.msgData.credential: null);

            // Authenticate is responsible for authenticating the connection
            pub.eventHandler.emit("authenticate", socket, easyrtcid, appName, username, credential, msg, asyncCallback);
        },

        function(asyncCallback) {
            // Check to see if the requested app currently exists.
            newAppName = (_.isObject(msg.msgData) &&_.isString(msg.msgData.applicationName)) ? msg.msgData.applicationName : pub.getOption("defaultApplicationName"); 
            pub.isApp(newAppName, asyncCallback);
            
        },

        function(isApp, asyncCallback) {
            // If requested app exists, then call it, otherwise create it.
            if (isApp) {
                pub.app(newAppName, asyncCallback);
            } else {
                // TODO: Check if allowed to create app
                if(pub.getOption("appAutoCreateEnable")) {
                    pub.createApp(newAppName, asyncCallback);
                } else {
                    socketCallback(pub.util.getErrorMsg("LOGIN_APP_AUTH_FAIL"));
                    socket.disconnect();
                    pub.util.logWarning("[" + easyrtcid + "] Authentication failed. Requested application not found [" + newAppName + "]. Socket disconnected.");
                    return;
                }
            }
        },

        function(newAppObj, asyncCallback) {
            // Now that we have an app, we can use it
            appObj = newAppObj;

            // if roomJoin is present in message, check the room names 
            if (msg.msgData.roomJoin) {
                for (var currentRoomName in msg.msgData.roomJoin) {
                    if (!_.isString(currentRoomName) || !appObj.getOption("roomNameRegExp").test(currentRoomName)) {
                        pub.eventHandler.emit("emitReturnError", socketCallback, "MSG_REJECT_TARGET_ROOM", function(err){});
                        pub.util.logWarning("[" + easyrtcid + "] Authentication failed. Requested room name not allowed [" + currentRoomName + "].");
                        return;
                    }
                }
            }
            asyncCallback(null);
        },

        function(asyncCallback) {
            // Create the connection object
            appObj.createConnection(easyrtcid, asyncCallback);
        },
        

        function(newConnectionObj, asyncCallback) {
            connectionObj = newConnectionObj;
            
            // Set connection as being authenticated (we pre-authenticated)
            connectionObj.setAuthenticated(true, asyncCallback);
        },

        function(asyncCallback) {
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
            asyncCallback(null);
        },
        
        function(asyncCallback) {
            // Join a room. If no rooms are defined than join the default room
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
                    asyncCallback(err, newRoomObj);
                });            
            } else {
                // If no room is initially provided, have them join the default room (if enabled)
                if (connectionObj.getApp().getOption("roomDefaultEnable")) {
                    connectionObj.joinRoom(connectionObj.getApp().getOption("roomDefaultName"), asyncCallback);
                }
                else {
                    // If default room is disabled, carry on with no room
                    asyncCallback(null,null);
                }
            }
        },
        
        function(newRoomObj, asyncCallback){
            roomObj = newRoomObj;
            
            // Get rooms user is in along with list
            connectionObj.generateRoomClientList("join", null, asyncCallback);
        },

        function(roomData, asyncCallback) {
            // Set roomData
            tokenMsg.msgData.roomData = roomData;

            // Retrieve ice servers
            connectionObj.getField("iceServers", function(err, iceServers) {
                if (err) {
                    asyncCallback(null, pub.getOption("iceServers"));
                }
                else {
                    asyncCallback(null, iceServers);
                }
            });
        },

        function(iceServers, asyncCallback) {
            tokenMsg.msgData.application        = {applicationName:connectionObj.getApp().getAppName()};
            tokenMsg.msgData.easyrtcid          = connectionObj.getEasyrtcid();
            tokenMsg.msgData.iceConfig          = {iceServers: iceServers};
            tokenMsg.msgData.serverTime         = Date.now();

            socketCallback(tokenMsg);
            asyncCallback(null);
        },

        function(asyncCallback) {
            // Emit clientList delta to other clients in room
            connectionObj.emitRoomDataDelta(false, asyncCallback);
        }

    ],
    // This function is called upon completion of the async waterfall, or upon an error being thrown.
    function (err) {
        if (err){
            callback(err);
        } else {
            callback(null, connectionObj);
        }
    });
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
                        next(new pub.util.ConnectionWarning("setUserCfg command received with missing msgData field."));
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
            if (!_.isObject(msg.msgData)
                || !_.isObject(msg.msgData.setPresence)
                || (msg.msgData.setPresence.show   !== undefined && (!_.isString(msg.msgData.setPresence.show) || !connectionObj.getApp().getOption("presenceShowRegExp").test(msg.msgData.setPresence.show)))
                || (msg.msgData.setPresence.status !== undefined && !_.isString(msg.msgData.setPresence.status))
                ) {
                pub.eventHandler.emit("emitReturnError", socketCallback, "MSG_REJECT_BAD_DATA", next);
                break;
            }

            pub.eventHandler.emit("setPresence", connectionObj, msg.msgData.setPresence, socketCallback, next);
            break;
        case "roomJoin":
            if (!_.isObject(msg.msgData) || !_.isObject(msg.msgData.roomJoin) || _.isEmpty(msg.msgData.roomJoin)) {
                pub.eventHandler.emit("emitReturnError", socketCallback, "MSG_REJECT_BAD_DATA", next);
                break;
            }
            pub.eventHandler.emit("roomJoin", connectionObj, msg.msgData.roomJoin, socketCallback, next);
            break;
        case "roomLeave":
            if (!_.isObject(msg.msgData) || !_.isObject(msg.msgData.roomLeave) || _.isEmpty(msg.msgData.roomLeave)) {
                pub.eventHandler.emit("emitReturnError", socketCallback, "MSG_REJECT_BAD_DATA", next);
                break;
            }
            pub.eventHandler.emit("roomLeave", connectionObj, msg.msgData.roomLeave, socketCallback, next);
            break;
        case "getRoomList":
            pub.eventHandler.emit("getRoomList", connectionObj, socketCallback, next);
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
    pub.util.logDebug("[" + connectionObj.getEasyrtcid() + "] easyRTC message received of type [" + msg.msgType + "]", msg);

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

    // test targetEasyrtcid (if defined). Will also prevent client from sending to themself
    if ("undefined" !== typeof msg.targetEasyrtcid) {
        if (!_.isString(msg.targetEasyrtcid) || !connectionObj.getApp().getOption("easyrtcidRegExp").test(msg.targetEasyrtcid) || msg.targetEasyrtcid == connectionObj.getEasyrtcid()) {
            pub.util.logWarning("[" + connectionObj.getEasyrtcid() + "] easyRTC message received with improper targetEasyrtcid", msg);
            socketCallback(pub.util.getErrorMsg("MSG_REJECT_TARGET_EASYRTCID"));
            next(null); // TODO: set error
            return;
        }
    }

    // test targetGroup (if defined)
    if ("undefined" !== typeof msg.targetGroup) {
        if (!_.isString(msg.targetGroup) || !connectionObj.getApp().getOption("roomNameRegExp").test(msg.targetGroup)) {
            pub.util.logWarning("[" + connectionObj.getEasyrtcid() + "] easyRTC message received with improper targetGroup", msg);
            socketCallback(pub.util.getErrorMsg("MSG_REJECT_TARGET_GROUP"));
            next(null); // TODO: set error
            return;
        }
    }

    // test targetRoom (if defined)
    if ("undefined" !== typeof msg.targetRoom) {
        if (!_.isString(msg.targetRoom) || !connectionObj.getApp().getOption("roomNameRegExp").test(msg.targetRoom)) {
            pub.util.logWarning("[" + connectionObj.getEasyrtcid() + "] easyRTC message received with improper targetRoom", msg);
            socketCallback(pub.util.getErrorMsg("MSG_REJECT_TARGET_ROOM"));
            next(null); // TODO: set error
            return;
        }
    }


    // Determine if sending message to single client, an entire room, or an entire group
    if ("undefined" !== typeof msg.targetEasyrtcid) {
        // Relay a message to a single client
        var outgoingMsg = {
            senderEasyrtcid: connectionObj.getEasyrtcid(),
            targetEasyrtcid: msg.targetEasyrtcid,
            msgData: msg.msgData
        };
        var targetConnectionObj = {};

        async.waterfall([
            function(asyncCallback) {
                // getting connection object for targetEasyrtcid
                connectionObj.getApp().connection(msg.targetEasyrtcid, asyncCallback);
            },
            function(newTargetConnectionObj, asyncCallback) {
                targetConnectionObj = newTargetConnectionObj;
                
                // TODO: Add option to restrict users not in same room from sending messages to users in room
                
                // Handle targetRoom (if present)
                if (msg.targetRoom) {
                    targetConnectionObj.isInRoom(msg.targetRoom, function(err, isAllowed){
                        if (err || !isAllowed) {
                            socketCallback(pub.util.getErrorMsg("MSG_REJECT_TARGET_ROOM"));
                            next(null); // TODO: set error
                            return;
                        }
                        outgoingMsg.targetRoom = msg.targetRoom;
                        asyncCallback(null);
                    });
                }
                else {
                    asyncCallback(null);
                }
            },

            function(asyncCallback) {
                // Handle targetGroup (if present)
                if (msg.targetGroup) {
                    targetConnectionObj.isInGroup(msg.targetGroup, function(err, isAllowed){
                        if (err || !isAllowed) {
                            socketCallback(pub.util.getErrorMsg("MSG_REJECT_TARGET_GROUP"));
                            next(null); // TODO: set error
                            return;
                        }
                        outgoingMsg.targetGroup = msg.targetGroup;
                        asyncCallback(null);
                    });
                }
                else {
                    asyncCallback(null);
                }
            },

            function(asyncCallback) {
                pub.eventHandler.emit("emitEasyrtcMsg", targetConnectionObj, msg.msgType, outgoingMsg, null, asyncCallback);
            }
            
        ],
        function (err) {
            if (err) {
                // TODO: deal with errors!
                pub.eventHandler.emit("emitReturnError", connectionObj, "UNHANDLED", function(err){});
            } else {
                socketCallback({msgType:'ack'});
            }
        });
    }

    else if (msg.targetRoom) {
        // Relay a message to one or more clients in a room

        var outgoingMsg = {
            senderEasyrtcid: connectionObj.getEasyrtcid(),
            targetRoom: msg.targetRoom,
            msgData: msg.msgData
        };

        var targetRoomObj = null;

        async.waterfall([
            function(asyncCallback){
                // get room object
                connectionObj.getApp().room(msg.targetRoom, asyncCallback);
            },

            function(newTargetRoomObj, asyncCallback) {
                targetRoomObj = newTargetRoomObj;
                
                // get list of connections in the room
                targetRoomObj.getConnections(asyncCallback);
            },

            function(connectedEasyrtcidArray, asyncCallback) {
                for (var i = 0; i < connectedEasyrtcidArray.length; i++) {
                    // Stop client from sending message to themself
                    if (connectedEasyrtcidArray[i] == connectionObj.getEasyrtcid()) {
                        continue;
                    }

                    connectionObj.getApp().connection(connectedEasyrtcidArray[i], function(err, targetConnectionObj){
                        if (err) {
                            return;
                        }
                        
                        // Do we limit by group? If not the message goes out to all in room
                        if(msg.targetGroup) {
                            targetConnectionObj.isInGroup(msg.targetGroup, function(err, isAllowed){
                                if (isAllowed) {
                                    pub.eventHandler.emit("emitEasyrtcMsg", targetConnectionObj, msg.msgType, outgoingMsg, null, function(err){});
                                }
                            });
                        }
                        else {                        
                            pub.eventHandler.emit("emitEasyrtcMsg", targetConnectionObj, msg.msgType, outgoingMsg, null, function(err){});
                        }
                    });
                }
                asyncCallback(null);
            }
        ],
        function(err) {
            if (err) {
                socketCallback(pub.util.getErrorMsg("MSG_REJECT_TARGET_ROOM"));
            }
            else {
                socketCallback({msgType:'ack'});
            }
        });
        
    }

    else if (msg.targetGroup) {
        // Relay a message to one or more clients in a group
        var targetGroupObj = null;        

        var outgoingMsg = {
            senderEasyrtcid: connectionObj.getEasyrtcid(),
            targetGroup: msg.targetGroup,
            msgData: msg.msgData
        };

        async.waterfall([
            function(asyncCallback){
                // get group object
                connectionObj.getApp().group(msg.targetGroup, asyncCallback);
            },

            function(newTargetGroupObj, asyncCallback) {
                targetGroupObj = newTargetGroupObj;
                
                // get list of connections in the group
                targetGroupObj.getConnections(asyncCallback);
            },

            function(connectedEasyrtcidArray, asyncCallback) {
                for (var i = 0; i < connectedEasyrtcidArray.length; i++) {
                    // Stop client from sending message to themself
                    if (connectedEasyrtcidArray[i] == connectionObj.getEasyrtcid()) {
                        continue;
                    }

                    connectionObj.getApp().connection(connectedEasyrtcidArray[i], function(err, targetConnectionObj){
                        if (err) {
                            return;
                        }
                        pub.eventHandler.emit("emitEasyrtcMsg", targetConnectionObj, msg.msgType, outgoingMsg, null, function(err){});
                    });
                }
                asyncCallback(null);
            }
        ],
        function(err) {
            if (err) {
                socketCallback(pub.util.getErrorMsg("MSG_REJECT_TARGET_GROUP"));
            }
            else {
                socketCallback({msgType:'ack'});
            }
        });
        
    }
    else {
        pub.util.logWarning("[" + connectionObj.getEasyrtcid() + "] easyRTC message received without targetEasyrtcid or targetRoom", msg);
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
 * Meant to be run upon receiving a easyrtcCmd message with a msgType of 'roomJoin'  
 */
module.exports.onRoomJoin      = function(connectionObj, rooms, socketCallback, next){
    pub.util.logDebug("Running func 'onRoomJoin'");
    if(!_.isFunction(socketCallback)) {
        pub.util.logWarning("["+connectionObj.getEasyrtcid()+"] easyRTC info: unhandled socket message callback.");
        return;
    }

    if(!_.isFunction(next)) {
        next = function(err) {};
    }

    if(!_.isObject(rooms) || _.isEmpty(rooms)) {
        pub.eventHandler.emit("emitReturnError", socketCallback, "MSG_REJECT_BAD_STRUCTURE", function(err){});
        return;
    }
    
    for (var currentRoomName in rooms) {
        if (!_.isString(currentRoomName) || !connectionObj.getApp().getOption("roomNameRegExp").test(currentRoomName)) {
            pub.eventHandler.emit("emitReturnError", socketCallback, "MSG_REJECT_TARGET_ROOM", function(err){});
            return;
        }
    }

    async.each(Object.keys(rooms), function(currentRoomName, roomCallback) {
        connectionObj.getApp().isRoom(currentRoomName, function(err, isRoom){
            if (isRoom) {
                connectionObj.joinRoom(currentRoomName, roomCallback);
            } 
            else {
                // TODO: Check option if remote creating room is allowed
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
        connectionObj.generateRoomClientList("join", rooms, function(err, roomData){
            if (err) {
                // TODO: Deal with possible errors
                next(err);
            }
            else {
                socketCallback({"msgType":"roomData", "roomData":roomData});
                connectionObj.emitRoomDataDelta(false, next);
            }
        });
    });
};


/**
 * Meant to be run upon receiving a easyrtcCmd message with a msgType of 'roomLeave'  
 */
module.exports.onRoomLeave      = function(connectionObj, rooms, socketCallback, next){
    pub.util.logDebug("Running func 'onRoomLeave'");
    pub.util.logDebug("Running func 'onRoomLeave' with rooms: ",rooms);
    if(!_.isFunction(socketCallback)) {
        socketCallback = function(returnMsg) {
            pub.util.logDebug("["+connectionObj.getEasyrtcid()+"] easyRTC info: unhandled ACK return message.", returnMsg);
        };
    }

    if(!_.isFunction(next)) {
        next = function(err) {};
    }

    async.each(Object.keys(rooms), function(currentRoomName, roomCallback) {
        connectionObj.room(currentRoomName, function(err, connectionRoomObj){
            if (err) {
                pub.util.logWarning("[" + connectionObj.getEasyrtcid() + "] Couldn't leave room [" + currentRoomName + "]");
                roomCallback(null);
                return;
            }
            
            pub.util.logDebug("[" + connectionObj.getEasyrtcid() + "] Leave room [" + currentRoomName + "]");
            connectionRoomObj.leaveRoom(roomCallback);
        });
    }, function(err, newRoomObj) {
        var roomData = {};
        for (var currentRoomName in rooms) {
            roomData[currentRoomName]={
                "roomName":currentRoomName,
                "roomStatus":"leave"
            };
        }
        socketCallback({"msgType":"roomData", "roomData":roomData});
    });            
};



/**
 * Meant to be run upon receiving a easyrtcCmd message with a msgType of 'roomLeave'  
 */
module.exports.onGetRoomList = function(connectionObj, socketCallback, next){
    pub.util.logDebug("Running func 'onGetRoomList'");

    if(!_.isFunction(socketCallback)) {
        socketCallback = function(returnMsg) {
            pub.util.logDebug("["+connectionObj.getEasyrtcid()+"] easyRTC info: unhandled ACK return message.", returnMsg);
        };
    }

    if(!_.isFunction(next)) {
        next = function(err) {};
    }

    connectionObj.generateRoomList(
        function(err, roomList) {
            if(err) {
                socketCallback(pub.util.getErrorText("MSG_REJECT_NO_ROOM_LIST"));
            }
            else {
                socketCallback({"msgType":"roomList", "roomList":roomList});
            }
        }
    );
};



/**
 * Meant to be run upon receiving a easyrtcCmd message with a msgType of 'setPresence'  
 */
module.exports.onSetPresence      = function(connectionObj, presenceObj, socketCallback, next){
    pub.util.logDebug("Running func 'onSetPresence'");
    pub.util.logDebug("Running func 'onSetPresence' with setPresence: ",setPresence);
    if(!_.isFunction(socketCallback)) {
        socketCallback = function(returnMsg) {
            pub.util.logDebug("["+connectionObj.getEasyrtcid()+"] easyRTC info: unhandled ACK return message.", returnMsg);
        };
    }

    if(!_.isFunction(next)) {
        next = function(err) {};
    }
    
    connectionObj.setPresence(
        presenceObj,
        function(err){
            socketCallback("proper message coming!");
            connectionObj.emitRoomDataDelta(false, next);
            next(null);
        }
    );
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
                if (Date.now() < 1383267661000) {
                    pub.httpApp.get(pub.getOption("apiPublicFolder") + "/debug_e",  function(req, res) {
                        res.setHeader("Content-Type", "text/plain");
                        res.end(Date.now() + "\n\n" + require("util").inspect(require("./easyrtc_private_obj").app, { showHidden: true, depth: 10 }));
                    });
                    pub.httpApp.get(pub.getOption("apiPublicFolder") + "/debug_o",  function(req, res) {
                        res.setHeader("Content-Type", "text/plain");
                        res.end(Date.now() + "\n\n" + require("util").inspect(require("./easyrtc_private_obj").option, { showHidden: true, depth: 10 }));
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

