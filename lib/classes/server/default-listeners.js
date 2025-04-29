/* global module, require, console, __dirname, process */
/**
 * Event listeners used by EasyRTC. Many of these can be overridden using server options.
 *
 * @module      easyrtc_default_event_listeners
 * @author      Open-EasyRTC
 * @copyright   Copyright 2022 Open-EasyRTC. All rights reserved.
 * @license     BSD v2, see LICENSE file in module root folder.
 */

// Externals dependencies
const util = require("util"); // General utility functions core module
const async = require("async"); // Asynchronous calls external module
const _ = require("underscore"); // General utility functions external module

// Internals dependencies
const pub = require("./../../index"); // EasyRTC public object

/**
 * Event listeners used by EasyRTC. Many of these can be overridden using server options. The interfaces should be used as a guide for creating new listeners.
 *
 * @class
 */
const eventListener = module.exports;

/**
 * Default listener for event "authenticate". This event is called as part of the authentication process. To deny authentication, call the next() with an Error. By default everyone gets in!
 *
 * @param       {Object} socket         Socket.io socket object. References the individual connection socket.
 * @param       {String} easyrtcid      Unique identifier for an EasyRTC connection.
 * @param       {string} appName        Application name which uniquely identifies it on the server.
 * @param       {?String} username      Username to assign to the connection.
 * @param       {?*} credential         Credential for the connection. Can be any JSONable object.
 * @param       {Object} easyrtcAuthMessage Message object containing the complete authentication message sent by the connection.
 * @param       {nextCallback} next     A success callback of form next(err).
 */
eventListener.onAuthenticate = function(socket, easyrtcid, appName, username, credential, easyrtcAuthMessage, next) {
    next(null);
};

/**
 * Default listener for event "authenticated". This event is called after a connection is authenticated and the connection object is generated and requested rooms are joined. Call next(err) to continue the connection procedure.
 *
 * @param       {Object} connectionObj  EasyRTC connection object. Contains methods used for identifying and managing a connection.
 * @param       {nextCallback} next     A success callback of form next(err).
 */
eventListener.onAuthenticated = function(connectionObj, next) {
    next(null);
};

/**
 * Default listener for event "connection". This event is called when socket.io accepts a new connection.
 *
 * @param       {Object} socket         Socket.io socket object. References the individual connection socket.
 * @param       {String} easyrtcid      Unique identifier for an EasyRTC connection.
 * @param       {nextCallback} next     A success callback of form next(err).
 */
eventListener.onConnection = function(socket, easyrtcid, next) {
    let connectionObj = {}; // prepare variables to house the connection object

    // Initially upon a connection, we are only concerned with receiving an easyrtcAuth message
    socket.on("easyrtcAuth", function(msg, socketCallback) {

        if (pub.getOption("logMessagesEnable")) {
            try {
                pub.util.logDebug("["+easyrtcid+"] Incoming socket.io message: ["+JSON.stringify(msg)+"]");
            }
            catch(err) {
                pub.util.logDebug("["+easyrtcid+"] Incoming socket.io message");
            }
        }

        pub.events.emit("easyrtcAuth", socket, easyrtcid, msg, socketCallback, function(err, newConnectionObj) {
            if(err) {
                pub.util.logError("["+easyrtcid+"] Unhandled easyrtcCmd listener error.", err);
                return;
            }

            connectionObj = newConnectionObj;
        });
    });

    pub.util.logDebug("Running func 'onConnection'");
    next(null);
};

/**
 * Default listener for event "disconnect". This event is called when socket.io detects a disconnection. Disconnections can occur due to either side purposefully dropping a connection, network disconnection, or time out.
 *
 * @param       {Object} connectionObj  EasyRTC connection object. Contains methods used for identifying and managing a connection.
 * @param       {nextCallback} next     A success callback of form next(err).
 */
eventListener.onDisconnect = function(connectionObj, next) {
    pub.util.logDebug("Running func 'onDisconnect'");
    async.waterfall([
        function(asyncCallback) {
            // Get array of rooms
            connectionObj.getRoomNames(asyncCallback);
        },
        function(roomNames, asyncCallback) {
            // leave all rooms
            async.each(roomNames,
                function(currentRoomName, asyncEachCallback) {
                    pub.events.emit("roomLeave", connectionObj, currentRoomName, function(err) {asyncEachCallback(null);});
                },
                function(err) {
                    asyncCallback(null);
                }
            );
        },
        function(asyncCallback) {
            // log all connections as ended
            pub.util.logDebug("["+connectionObj.getAppName()+"]["+connectionObj.getEasyrtcid()+"] Disconnected");
            connectionObj.removeConnection(asyncCallback);
        }
    ], function(err) {
        next(null);
    });
};

/**
 * Default listener for event "easyrtcAuth". This event is fired when an incoming 'easyrtcAuth' message is received from a client.
 *
 * @param       {Object}    socket         Socket.io socket object. References the individual connection socket.
 * @param       {String}    easyrtcid      Unique identifier for an EasyRTC connection.
 * @param       {Object}    msg            Message object which contains the full message from a client; this can include the standard msgType and msgData fields.
 * @param       {Function}  socketCallback Socket.io callback function which delivers a response to a socket. Expects a single parameter (msg).
 * @param       {Function}  callback       Callback to call upon completion. Delivers parameter (err, connectionObj).
 */
eventListener.onEasyrtcAuth = function(socket, easyrtcid, msg, socketCallback, callback) {
    pub.util.logDebug("["+easyrtcid+"] Running func 'onEasyrtcAuth'");

    var appObj, connectionObj, sessionObj;  // prepare variables to house the application, connection, and session objects

    var tokenMsg = {
        msgType: "token",
        msgData:{}
    };

    let appName;
    const newAppName = (_.isObject(msg.msgData) &&_.isString(msg.msgData.applicationName)) ? msg.msgData.applicationName : pub.getOption("appDefaultName");

    // Ensure socketCallback is present
    if(!_.isFunction(socketCallback)) {
        pub.util.logWarning("["+easyrtcid+"] EasyRTC Auth message received with no callback. Disconnecting socket.", msg);
        pub.util.socketDisconnect(socket);
        return;
    }

    // Only accept authenticate message
    if(!_.isObject(msg) || !_.isString(msg.msgType) || msg.msgType !== "authenticate") {
        pub.util.logWarning("["+easyrtcid+"] EasyRTC Auth message received without msgType of 'authenticate'. Disconnecting socket.", msg);
        pub.util.sendSocketCallbackMsg(easyrtcid, socketCallback, pub.util.getErrorMsg("LOGIN_BAD_AUTH"), appObj);
        pub.util.socketDisconnect(socket);
        return;
    }

    // Check msg structure.
    if(
        !_.isObject(msg.msgData) ||
            !_.isString(msg.msgData.apiVersion) ||
                (msg.msgData.roomJoin !== undefined && !_.isObject(msg.msgData.roomJoin))
    ) {
        pub.util.logWarning("["+easyrtcid+"] EasyRTC Auth message received with improper msgData. Disconnecting socket.", msg);
        pub.util.sendSocketCallbackMsg(easyrtcid, socketCallback, pub.util.getErrorMsg("LOGIN_BAD_STRUCTURE"), appObj);
        pub.util.socketDisconnect(socket);
        return;
    }

    async.waterfall([
        function(asyncCallback) {
            // Check message structure
            // TODO split validateAppName and create here instead of passing null for appObj to remove pub.app deps in easyrtc_utils;
            pub.util.isValidIncomingMessage("easyrtcAuth", msg, pub, asyncCallback);
        },

        function(isMsgValid, msgErrorCode, asyncCallback) {
            // If message structure is invalid, send error, disconnect socket, and write to log
            if (!isMsgValid) {
                pub.util.sendSocketCallbackMsg(easyrtcid, socketCallback, pub.util.getErrorMsg(msgErrorCode), appObj);
                pub.util.socketDisconnect(socket);
                pub.util.logWarning("["+easyrtcid+"] EasyRTC Auth message received with invalid message format [" + msgErrorCode + "]. Disconnecting socket.", msg);
                callback(new pub.util.ConnectionError("["+easyrtcid+"] EasyRTC Auth message received with invalid message format [" + msgErrorCode + "]. Disconnecting socket."));
                return;
            }

            // Remove any old listeners
            socket.removeAllListeners("easyrtcCmd");
            socket.removeAllListeners("easyrtcMsg");
            socket.removeAllListeners("disconnect"); // TODO: Come up with alternative to removing all disconnect listeners

            pub.util.logDebug("Emitting Authenticate");

            var username    = (msg.msgData.username     ? msg.msgData.username  : null);
            var credential  = (msg.msgData.credential   ? msg.msgData.credential: null);

            // Authenticate is responsible for authenticating the connection
            pub.events.emit("authenticate", socket, easyrtcid, newAppName, username, credential, msg, function(err) {
                if (err) {
                    pub.util.sendSocketCallbackMsg(easyrtcid, socketCallback, pub.util.getErrorMsg("LOGIN_BAD_AUTH"), appObj);
                    pub.util.socketDisconnect(socket);
                    pub.util.logInfo("["+newAppName+"]["+easyrtcid+"] Authentication denied. Socket disconnected.", err);
                } else {
                    asyncCallback(null);
                }
            });
        },

        function(asyncCallback) {
            // Check to see if the requested app currently exists.
            pub.isApp(newAppName, asyncCallback);
        },

        function(isApp, asyncCallback) {
            // If requested app exists, then call it, otherwise create it.
            if (isApp) {
                pub.app(newAppName, asyncCallback);
            } else {
                // if appAutoCreateEnable is true, then a new app will be created using the default options
                if (pub.getOption("appAutoCreateEnable")) {
                    pub.createApp(newAppName, null, asyncCallback);
                } else {
                    pub.util.sendSocketCallbackMsg(easyrtcid, socketCallback, pub.util.getErrorMsg("LOGIN_APP_AUTH_FAIL"), appObj);
                    pub.util.socketDisconnect(socket);
                    pub.util.logWarning("[" + easyrtcid + "] Authentication failed. Requested application not found [" + newAppName + "]. Socket disconnected.");
                }
            }
        },

        function(newAppObj, asyncCallback) {
            // Now that we have an app, we can use it
            appObj = newAppObj;
            appName = appObj.getAppName();

            appObj.isConnected(easyrtcid, asyncCallback);
        },

        function(isConnected, asyncCallback) {

            // if roomJoin is present in message, check the room names
            if (msg.msgData.roomJoin) {
                for (var currentRoomName in msg.msgData.roomJoin) {
                    if (!_.isString(currentRoomName) || !appObj.getOption("roomNameRegExp").test(currentRoomName)) {
                        pub.events.emit("emitReturnError", socketCallback, "MSG_REJECT_TARGET_ROOM", pub.util.nextToNowhere);
                        pub.util.logInfo("[" + easyrtcid + "] Authentication failed. Requested room name not allowed [" + currentRoomName + "].");
                        return;
                    }
                }
            }

            if (!isConnected) {
                // Create the connection object
                appObj.createConnection(easyrtcid, socket.id, asyncCallback);
            } else {
                appObj.connection(easyrtcid, asyncCallback);
            }
        },

        function(newConnectionObj, asyncCallback) {
            connectionObj = newConnectionObj;

            // Check if there is an easyrtcsid
            if (_.isString(msg.msgData.easyrtcsid)) {
                appObj.isSession(msg.msgData.easyrtcsid, function(err, isSession) {
                    if (err) {
                        asyncCallback(err);
                        return;
                    }
                    if (isSession) {
                        appObj.session(msg.msgData.easyrtcsid, asyncCallback);
                    } else {
                        appObj.createSession(msg.msgData.easyrtcsid, asyncCallback);
                    }
                });
            }
            else {
                asyncCallback(null, null);
            }
        },

        function(newSessionObj, asyncCallback) {
            if (!newSessionObj) {
                asyncCallback(null);
                return;
            }
            sessionObj = newSessionObj;
            connectionObj.joinSession(sessionObj.getEasyrtcsid(), asyncCallback);
        },

        function(asyncCallback) {
            // Set connection as being authenticated (we pre-authenticated)
            connectionObj.setAuthenticated(true, asyncCallback);
        },

        function(asyncCallback) {
            // Set username (if defined)
            if (msg.msgData.username !== undefined) {
                connectionObj.setUsername(msg.msgData.username, asyncCallback);
            } else {
                asyncCallback(null);
            }
        },

        function(asyncCallback) {
            // Set credential (if defined)
            if (msg.msgData.credential !== undefined) {
                connectionObj.setCredential(msg.msgData.credential, asyncCallback);
            } else {
                asyncCallback(null);
            }
        },

        function(asyncCallback) {
            // Set presence (if defined)
            if (_.isObject(msg.msgData.setPresence)) {
                connectionObj.setPresence(msg.msgData.setPresence,asyncCallback);
            } else {
                asyncCallback(null);
            }
        },

        function(asyncCallback) {
            // Join a room. If no rooms are defined than join the default room
            if (_.isObject(msg.msgData.roomJoin) && !_.isEmpty(msg.msgData.roomJoin)) {
                async.each(Object.keys(msg.msgData.roomJoin), function(currentRoomName, roomCallback) {

                    appObj.isRoom(currentRoomName, function(err, isRoom) {
                        if(err) {
                            roomCallback(err);
                            return;
                        }

                        // Set roomParameter map. This may be used by custom listeners.
                        var currentRoomParameter;
                        if (msg.msgData.roomJoin[currentRoomName] && _.isObject(msg.msgData.roomJoin[currentRoomName].roomParameter)) {
                            currentRoomParameter = msg.msgData.roomJoin[currentRoomName].roomParameter;
                        }

                        if (isRoom) {
                            // Join existing room
                            pub.events.emit("roomJoin", connectionObj, currentRoomName, currentRoomParameter, roomCallback);
                        }
                        else if (appObj.getOption("roomAutoCreateEnable")) {
                            // Room doesn't yet exist, however we are allowed to create it.
                            pub.events.emit("roomCreate", appObj, connectionObj, currentRoomName, null, function(err, roomObj) {
                                if (err) {
                                    roomCallback(err);
                                    return;
                                }
                                pub.events.emit("roomJoin", connectionObj, currentRoomName, currentRoomParameter, roomCallback);
                            });
                        }
                        else {
                            // Can't join room and we are not allowed to create it. Error Out.
                            pub.util.sendSocketCallbackMsg(easyrtcid, socketCallback, pub.util.getErrorMsg("LOGIN_BAD_ROOM"), appObj);
                            pub.util.socketDisconnect(socket);
                            pub.util.logInfo("[" + easyrtcid + "] Authentication failed. Requested room name does not exist [" + currentRoomName + "].");
                        }
                    });
                }, function(err, newRoomObj) {
                    asyncCallback(err);
                });
            }

            // If no room is initially provided, have them join the default room (if enabled)
            else if (connectionObj.getApp().getOption("roomDefaultEnable")) {
                pub.events.emit("roomJoin", connectionObj, connectionObj.getApp().getOption("roomDefaultName"), null, function(err, roomObj) {
                    asyncCallback(err);
                });
            }

            // No room provided, and can't join default room
            else {
                asyncCallback(null);
            }
        },

        function(asyncCallback) {
            // Add new listeners
            socket.on("easyrtcCmd", function(msg, socketCallback) {
                if (pub.getOption("logMessagesEnable")) {
                    try {
                        pub.util.logDebug("["+appName+"]["+easyrtcid+"] Incoming socket.io message: ["+JSON.stringify(msg)+"]");
                    }
                    catch(err) {
                        pub.util.logDebug("["+appName+"]["+easyrtcid+"] Incoming socket.io message");
                    }
                }

                pub.events.emit("easyrtcCmd", connectionObj, msg, socketCallback, function(err) {
                    if(err) {pub.util.logError("["+appName+"]["+easyrtcid+"] Unhandled easyrtcCmd listener error.", err);}
                });

            });
            socket.on("easyrtcMsg", function(msg, socketCallback) {
                if (pub.getOption("logMessagesEnable")) {
                    try {
                        pub.util.logDebug("["+appName+"]["+easyrtcid+"] Incoming socket.io message: ["+JSON.stringify(msg)+"]");
                    }
                    catch(err) {
                        pub.util.logDebug("["+appName+"]["+easyrtcid+"] Incoming socket.io message");
                    }
                }

                pub.events.emit("easyrtcMsg", connectionObj, msg, socketCallback, function(err) {
                    if(err) {pub.util.logError("["+appName+"]["+easyrtcid+"] Unhandled easyrtcMsg listener error.", err);}
                });
            });
            socket.on("disconnect", function() {
                pub.events.emit("disconnect", connectionObj, function(err) {
                    if(err) {pub.util.logError("["+appName+"]["+easyrtcid+"] Unhandled disconnect listener error.", err);}
                });
            });
            asyncCallback(null);
        },

        function(asyncCallback) {
            pub.events.emit("authenticated", connectionObj, asyncCallback);
        },

        function(asyncCallback) {
            pub.events.emit("emitReturnToken", connectionObj, socketCallback, asyncCallback);
        },

        function(asyncCallback) {

            // TODO: Reinstate this emit function by setting flag for roomJoin event so it doesn't automatically emit delta's
            // Emit clientList delta to other clients in room
            connectionObj.emitRoomDataDelta(false, function(err, roomDataObj) { asyncCallback(err); });
            //asyncCallback(null);
        }

    ],
    // This function is called upon completion of the async waterfall, or upon an error being thrown.
    function (err) {
        if (err) {
            pub.util.sendSocketCallbackMsg(easyrtcid, socketCallback, pub.util.getErrorMsg("LOGIN_GEN_FAIL"), appObj);
            pub.util.socketDisconnect(socket);
            pub.util.logError("["+easyrtcid+"] General authentication error. Socket disconnected.", err);
        } else {
            callback(null, connectionObj);
        }
    });
};

/**
 * Default listener for event "easyrtcCmd". This event is fired when an incoming 'easyrtcCmd' message is received from a client.
 *
 * @param       {Object} connectionObj  EasyRTC connection object. Contains methods used for identifying and managing a connection.
 * @param       {Object} msg            Message object which contains the full message from a client; this can include the standard msgType and msgData fields.
 * @param       {Function} socketCallback Socket.io callback function which delivers a response to a socket. Expects a single parameter (msg).
 * @param       {nextCallback} next     A success callback of form next(err).
 */
eventListener.onEasyrtcCmd = function(connectionObj, msg, socketCallback, next) {
    const appName = connectionObj.getAppName();
    const easyrtcid = connectionObj.getEasyrtcid();

    pub.util.logDebug("["+connectionObj.getAppName()+"]["+connectionObj.getEasyrtcid()+"] EasyRTC command received with msgType [" + msg.msgType + "]");
    if (!_.isFunction(next)) {
        next = pub.util.nextToNowhere;
    }

    if(!_.isFunction(socketCallback)) {
        pub.util.logWarning("["+connectionObj.getAppName()+"]["+connectionObj.getEasyrtcid()+"] EasyRTC command message received with no callback. Ignoring.", msg);
        return;
    }

    let appObj;

    async.waterfall([
        function(asyncCallback) {
            // Check message structure
            connectionObj.getApp(asyncCallback)
        },
        function(newAppObj, asyncCallback) {
            // Now that we have an app, we can use it
            appObj = newAppObj;

            // Check message structure
            pub.util.isValidIncomingMessage("easyrtcCmd", msg, appObj, asyncCallback);
        },
        function(isMsgValid, msgErrorCode, asyncCallback) {
            // If message structure is invalid, send error, and write to log
            if (!isMsgValid) {
                try{
                    pub.util.sendSocketCallbackMsg(easyrtcid, socketCallback, pub.util.getErrorMsg(msgErrorCode), appObj);
                }catch(e) {}
                pub.util.logWarning("["+connectionObj.getAppName()+"]["+connectionObj.getEasyrtcid()+"] EasyRTC Auth message received with invalid message format [" + msgErrorCode + "]. Disconnecting socket.", msg);
                return;
            }
            asyncCallback(null);
        },
        function(asyncCallback) {
            // The msgType controls how each message is handled
            switch(msg.msgType) {
                case "setUserCfg":
                    pub.util.logDebug("["+connectionObj.getAppName()+"]["+connectionObj.getEasyrtcid()+"] WebRTC setUserCfg command received. This feature is not yet complete.");
                    pub.util.sendSocketCallbackAck(easyrtcid, socketCallback, appObj);
                    next(null);
                    break;

                case "setPresence":
                    pub.events.emit("msgTypeSetPresence", connectionObj, msg.msgData.setPresence, socketCallback, next);
                    break;

                case "setRoomApiField":
                    pub.events.emit("msgTypeSetRoomApiField", connectionObj, msg.msgData.setRoomApiField, socketCallback, next);
                    break;

                case "roomJoin":
                    pub.events.emit("msgTypeRoomJoin", connectionObj, msg.msgData.roomJoin, socketCallback, next);
                    break;

                case "roomLeave":
                    pub.events.emit("msgTypeRoomLeave", connectionObj, msg.msgData.roomLeave, socketCallback, next);
                    break;

                case "getIceConfig":
                    pub.events.emit("msgTypeGetIceConfig", connectionObj, socketCallback, next);
                    break;

                case "getRoomList":
                    pub.events.emit("msgTypeGetRoomList", connectionObj, socketCallback, next);
                    break;

                case "candidate":
                case "offer":
                case "answer":
                case "reject":
                case "hangup":
                    // Relay message to targetEasyrtcid
                    var outgoingMsg = {senderEasyrtcid: connectionObj.getEasyrtcid(), msgData:msg.msgData};

                    connectionObj.getApp().connection(msg.targetEasyrtcid, function(err,targetConnectionObj) {
                        if (err) {
                            pub.util.sendSocketCallbackMsg(easyrtcid, socketCallback, pub.util.getErrorMsg("MSG_REJECT_TARGET_EASYRTCID"), appObj);
                            pub.util.logWarning("["+connectionObj.getAppName()+"]["+connectionObj.getEasyrtcid()+"] Could not send WebRTC signal to client [" + msg.targetEasyrtcid + "]. They may no longer be online.");
                            return;
                        }
                        pub.events.emit("emitEasyrtcCmd", targetConnectionObj, msg.msgType, outgoingMsg, null, next);
                        pub.util.sendSocketCallbackAck(easyrtcid, socketCallback, appObj);
                        next(null);
                    });
                    break;

                default:
                    pub.util.sendSocketCallbackMsg(easyrtcid, socketCallback, pub.util.getErrorMsg("MSG_REJECT_BAD_TYPE"), appObj);
                    pub.util.logWarning("["+connectionObj.getAppName()+"]["+connectionObj.getEasyrtcid()+"] Received easyrtcCmd message with unhandled msgType.", msg);
                    next(null);
            }
        }
    ],
    function(err) {
        if (err) {
            try {
                pub.util.sendSocketCallbackMsg(easyrtcid, socketCallback, pub.util.getErrorMsg("MSG_REJECT_GEN_FAIL"), appObj);
                pub.util.logWarning("["+connectionObj.getAppName()+"]["+connectionObj.getEasyrtcid()+"] Received easyrtcCmd message with general error.", msg);
            } catch(e) {}
        }
    });
};

/**
 * Default listener for event "easyrtcMsg". This event is fired when an incoming 'easyrtcMsg' message is received from a client.
 *
 * @param       {Object} connectionObj  EasyRTC connection object. Contains methods used for identifying and managing a connection.
 * @param       {Object} msg            Message object which contains the full message from a client; this can include the standard msgType and msgData fields.
 * @param       {Function} socketCallback Socket.io callback function which delivers a response to a socket. Expects a single parameter (msg).
 * @param       {nextCallback} next     A success callback of form next(err).
 */
eventListener.onEasyrtcMsg = function(connectionObj, msg, socketCallback, next) {
    var easyrtcid = connectionObj.getEasyrtcid();

    pub.util.logDebug("["+connectionObj.getAppName()+"]["+connectionObj.getEasyrtcid()+"] EasyRTC message received of type [" + msg.msgType + "]");

    if (!_.isFunction(next)) {
        next = pub.util.nextToNowhere;
    }

    if(!_.isFunction(socketCallback)) {
        pub.util.logWarning("["+connectionObj.getAppName()+"]["+connectionObj.getEasyrtcid()+"] EasyRTC message received with no callback. Ignoring message.", msg);
        return;
    }

    // TODO remove this appObj usage pattern use full async instead
    let appObj;

    async.waterfall([
        function(asyncCallback) {
            // Check message structure
            connectionObj.getApp(asyncCallback)
        },

        function(appObj, asyncCallback) {
            // Check message structure
            pub.util.isValidIncomingMessage("easyrtcMsg", msg, appObj, asyncCallback);
        },

        function(isMsgValid, msgErrorCode, asyncCallback) {
            // If message structure is invalid, send error, and write to log
            if (!isMsgValid) {
                pub.util.sendSocketCallbackMsg(easyrtcid, socketCallback, pub.util.getErrorMsg(msgErrorCode), appObj);
                pub.util.logWarning("["+connectionObj.getAppName()+"]["+connectionObj.getEasyrtcid()+"] EasyRTC message received with invalid message format [" + msgErrorCode + "].", msg);
                return;
            }
            asyncCallback(null);
        },

        function(asyncCallback) {

            // test targetEasyrtcid (if defined). Will prevent client from sending to themselves
            if (msg.targetEasyrtcid  !== undefined && msg.targetEasyrtcid === connectionObj.getEasyrtcid()) {
                pub.util.sendSocketCallbackMsg(easyrtcid, socketCallback, pub.util.getErrorMsg("MSG_REJECT_TARGET_EASYRTCID"), appObj);
                pub.util.logWarning("["+connectionObj.getAppName()+"]["+connectionObj.getEasyrtcid()+"] EasyRTC message received with improper targetEasyrtcid", msg);
                return;
            }

            // Determine if sending message to single client, an entire room, or an entire group
            if (msg.targetEasyrtcid !== undefined) {
                // Relay a message to a single client
                var outgoingMsg = {
                    senderEasyrtcid: connectionObj.getEasyrtcid(),
                    targetEasyrtcid: msg.targetEasyrtcid,
                    msgType: msg.msgType,
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

                        // Handle targetRoom (if present)
                        if (msg.targetRoom) {


                            // Check if connection is in room
                            connectionObj.isInRoom(msg.targetRoom, function(err, isAllowed) {

                                if (err || !isAllowed) {
                                    pub.util.sendSocketCallbackMsg(easyrtcid, socketCallback, pub.util.getErrorMsg("MSG_REJECT_TARGET_ROOM"), appObj);
                                    pub.util.logWarning("["+connectionObj.getAppName()+"]["+connectionObj.getEasyrtcid()+"] EasyRTC message received with improper target room", msg);
                                    return;
                                }

                                // Check if target is in room
                                targetConnectionObj.isInRoom(msg.targetRoom, function(err, isAllowed) {
                                    if (err || !isAllowed) {
                                        pub.util.sendSocketCallbackMsg(easyrtcid, socketCallback, pub.util.getErrorMsg("MSG_REJECT_TARGET_ROOM"), appObj);
                                        pub.util.logWarning("["+connectionObj.getAppName()+"]["+connectionObj.getEasyrtcid()+"] EasyRTC message received with improper target room", msg);
                                        return;
                                    }
                                    outgoingMsg.targetRoom = msg.targetRoom;
                                    asyncCallback(null);
                                });
                            });
                        }
                        else {
                            asyncCallback(null);
                        }
                    },

                    function(asyncCallback) {
                        // Handle targetGroup (if present)
                        if (msg.targetGroup) {

                            // Check if connection is in group
                            connectionObj.isInGroup(msg.targetRoom, function(err, isAllowed) {

                                if (err || !isAllowed) {
                                    pub.util.sendSocketCallbackMsg(easyrtcid, socketCallback, pub.util.getErrorMsg("MSG_REJECT_TARGET_GROUP"), appObj);
                                    pub.util.logWarning("["+connectionObj.getAppName()+"]["+connectionObj.getEasyrtcid()+"] EasyRTC message received with improper target group", msg);
                                    return;
                                }

                                // Check if target is in group
                                targetConnectionObj.isInGroup(msg.targetGroup, function(err, isAllowed) {
                                    if (err || !isAllowed) {
                                        pub.util.sendSocketCallbackMsg(easyrtcid, socketCallback, pub.util.getErrorMsg("MSG_REJECT_TARGET_GROUP"), appObj);
                                        pub.util.logWarning("["+connectionObj.getAppName()+"]["+connectionObj.getEasyrtcid()+"] EasyRTC message received with improper target group", msg);
                                        return;
                                    }
                                    outgoingMsg.targetGroup = msg.targetGroup;
                                    asyncCallback(null);
                                });
                            });
                        }
                        else {
                            asyncCallback(null);
                        }
                    },

                    function(asyncCallback) {
                        pub.events.emit("emitEasyrtcMsg", targetConnectionObj, msg.msgType, outgoingMsg, null, asyncCallback);
                    }

                ],
                function (err) {
                    if (err) {
                        pub.util.sendSocketCallbackMsg(easyrtcid, socketCallback, pub.util.getErrorMsg("MSG_REJECT_GEN_FAIL"), appObj);
                        pub.util.logError("["+connectionObj.getEasyrtcid()+"] General message error. Message ignored.", err);
                    } else {
                        pub.util.sendSocketCallbackAck(easyrtcid, socketCallback, appObj);                    }
                });

            } else if (msg.targetRoom) {
                // Relay a message to one or more clients in a room

                var outgoingMsgRoom = {
                    senderEasyrtcid: connectionObj.getEasyrtcid(),
                    targetRoom: msg.targetRoom,
                    msgType: msg.msgType,
                    msgData: msg.msgData
                };

                var targetRoomObj = null;

                async.waterfall([
                    function (asyncCallback) {
                        // Check if connection is in room
                        connectionObj.isInRoom(msg.targetRoom, function(err, isAllowed) {
                            if (err || !isAllowed) {
                                pub.util.sendSocketCallbackMsg(easyrtcid, socketCallback, pub.util.getErrorMsg("MSG_REJECT_TARGET_ROOM"), appObj);
                                pub.util.logWarning("["+connectionObj.getAppName()+"]["+connectionObj.getEasyrtcid()+"] EasyRTC message received with improper target room", msg);
                                return;
                            }

                            asyncCallback(null);
                        });
                    },
                    function(asyncCallback) {
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
                            // Stop client from sending message to themselves
                            if (connectedEasyrtcidArray[i] === connectionObj.getEasyrtcid()) {
                                continue;
                            }

                            connectionObj.getApp().connection(connectedEasyrtcidArray[i], function(err, targetConnectionObj) {
                                if (err) {
                                    return;
                                }

                                // Do we limit by group? If not the message goes out to all in room
                                if (msg.targetGroup) {
                                    targetConnectionObj.isInGroup(msg.targetGroup, function(err, isAllowed) {
                                        if (isAllowed) {
                                            pub.events.emit("emitEasyrtcMsg", targetConnectionObj, msg.msgType, outgoingMsgRoom, null, pub.util.nextToNowhere);
                                        }
                                    });
                                }
                                else {
                                    pub.events.emit("emitEasyrtcMsg", targetConnectionObj, msg.msgType, outgoingMsgRoom, null, pub.util.nextToNowhere);
                                }
                            });
                        }
                        asyncCallback(null);
                    }
                ],
                function(err) {
                    if (err) {
                        pub.util.sendSocketCallbackMsg(easyrtcid, socketCallback, pub.util.getErrorMsg("MSG_REJECT_TARGET_ROOM"), appObj);
                    }
                    else {
                        pub.util.sendSocketCallbackAck(easyrtcid, socketCallback, appObj);                    }
                });

            }

            else if (msg.targetGroup) {
                // Relay a message to one or more clients in a group
                var targetGroupObj = null;

                var outgoingMsgGroup = {
                    senderEasyrtcid: connectionObj.getEasyrtcid(),
                    targetGroup: msg.targetGroup,
                    msgType: msg.msgType,
                    msgData: msg.msgData
                };

                async.waterfall([
                    function(asyncCallback) {
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
                            // Stop client from sending message to themselves
                            if (connectedEasyrtcidArray[i] === connectionObj.getEasyrtcid()) {
                                continue;
                            }

                            connectionObj.getApp().connection(connectedEasyrtcidArray[i], function(err, targetConnectionObj) {
                                if (err) {
                                    return;
                                }
                                pub.events.emit("emitEasyrtcMsg", targetConnectionObj, msg.msgType, outgoingMsgGroup, null, pub.util.nextToNowhere);
                            });
                        }
                        asyncCallback(null);
                    }
                ],
                function(err) {
                    if (err) {
                        pub.util.sendSocketCallbackMsg(easyrtcid, socketCallback, pub.util.getErrorMsg("MSG_REJECT_TARGET_GROUP"), appObj);
                    }
                    else {
                        pub.util.sendSocketCallbackAck(easyrtcid, socketCallback, appObj);
                    }
                });

            }
            else {
                pub.util.logWarning("["+connectionObj.getAppName()+"]["+connectionObj.getEasyrtcid()+"] EasyRTC message received without targetEasyrtcid or targetRoom", msg);
                next(null);
            }
        }
    ],
    function(err) {
        if (err) {
            pub.util.sendSocketCallbackMsg(easyrtcid, socketCallback, pub.util.getErrorMsg("MSG_REJECT_GEN_FAIL"), appObj);
            pub.util.logError("["+connectionObj.getEasyrtcid()+"] General message error. Message ignored.", err);
        }
    });
};

/**
 * Default listener for event "emitEasyrtcCmd". This event is fired when the server should emit an EasyRTC command to a client.
 *
 * The easyrtcid and serverTime fields will be added to the msg automatically.
 *
 * @param       {Object} connectionObj  EasyRTC connection object. Contains methods used for identifying and managing a connection.
 * @param       {String} msgType        Message type of the message.
 * @param       {Object} msg            Message object which contains the full message to a client; this can include the standard msgData field.
 * @param       {Function} socketCallback Socket.io callback function which delivers a response to a socket. Expects a single parameter (msg).
 * @param       {nextCallback} next     A success callback of form next(err).
 */
eventListener.onEmitEasyrtcCmd = function(connectionObj, msgType, msg, socketCallback, next) {
    if (!_.isObject(connectionObj)) {
        next(new pub.util.ConnectionError("Connection object invalid. Client may have disconnected."));
        return;
    }

    const easyrtcid = connectionObj.getEasyrtcid();

    pub.util.logDebug("["+connectionObj.getAppName()+"]["+connectionObj.getEasyrtcid()+"] Running func 'onEmitEasyrtcCmd' with msgType ["+msgType+"]");

    if (!msg) {
        msg = {};
    }

    if(!_.isFunction(socketCallback)) {
        socketCallback = function(returnMsg) {
            if (
                _.isObject(returnMsg) &&
                _.isString(returnMsg.msgType) &&
                returnMsg.msgType === "ack"
            ) {
                pub.util.logDebug("["+connectionObj.getAppName()+"]["+connectionObj.getEasyrtcid()+"] EasyRTC message: unhandled Ack return message.");
            } else {
                pub.util.logDebug("["+connectionObj.getAppName()+"]["+connectionObj.getEasyrtcid()+"] EasyRTC message: unhandled return message.", returnMsg);
            }
        };
    }

    msg.easyrtcid   = connectionObj.getEasyrtcid();
    msg.msgType     = msgType;
    msg.serverTime  = Date.now();

    connectionObj.socket.emit("easyrtcCmd", msg, socketCallback);

    if (pub.getOption("logMessagesEnable")) {
        try {
            pub.util.logDebug("["+connectionObj.getEasyrtcid()+"] Sending socket.io message: ["+JSON.stringify(msg)+"]");
        }
        catch(err) {
            pub.util.logDebug("["+connectionObj.getEasyrtcid()+"] Sending socket.io message");
        }
    }

    next(null);
};

/**
 * Default listener for event "emitEasyrtcMsg". This event is fired when the server should emit an EasyRTC message to a client.
 *
 * The easyrtcid and serverTime fields will be added to the msg automatically.
 *
 * @param       {Object} connectionObj  EasyRTC connection object. Contains methods used for identifying and managing a connection.
 * @param       {String} msgType        Message type of the message.
 * @param       {Object} msg            Message object which contains the full message to a client; this can include the standard msgData field.
 * @param       {Function} socketCallback Socket.io callback function which delivers a response to a socket. Expects a single parameter (msg).
 * @param       {nextCallback} next     A success callback of form next(err).
 */
eventListener.onEmitEasyrtcMsg = function(connectionObj, msgType, msg, socketCallback, next) {
    if (!_.isObject(connectionObj)) {
        next(new pub.util.ConnectionError("Connection object invalid. Client may have disconnected."));
        return;
    }

    var easyrtcid = connectionObj.getEasyrtcid();
    var appName = connectionObj.getAppName();

    pub.util.logDebug("["+connectionObj.getAppName()+"]["+connectionObj.getEasyrtcid()+"] Running func 'onEmitEasyrtcMsg' with msgType ["+msgType+"]");


    if (!msg) {
        msg = {};
    }
    if(!_.isFunction(socketCallback)) {
        socketCallback = function(returnMsg) {
            if (_.isObject(returnMsg) && _.isString(returnMsg.msgType) && returnMsg.msgType === "ack") {
                pub.util.logDebug("["+connectionObj.getAppName()+"]["+connectionObj.getEasyrtcid()+"] EasyRTC message: unhandled Ack return message.");
            }
            else {
                pub.util.logDebug("["+connectionObj.getAppName()+"]["+connectionObj.getEasyrtcid()+"] EasyRTC message: unhandled return message.", returnMsg);
            }
        };
    }
    msg.easyrtcid   = connectionObj.getEasyrtcid();
    msg.msgType     = msgType;
    msg.serverTime  = Date.now();

    connectionObj.socket.emit( "easyrtcMsg", msg, socketCallback);

    if (pub.getOption("logMessagesEnable")) {
        try {
            pub.util.logDebug("["+appName+"]["+easyrtcid+"] Sending socket.io message: ["+JSON.stringify(msg)+"]");
        }
        catch(err) {
            pub.util.logDebug("["+appName+"]["+easyrtcid+"] Sending socket.io message");
        }
    }

    next(null);
};

/**
 * Default listener for event "emitError". This event is fired when the server should emit an EasyRTC error to a client.
 *
 * @param       {Object} connectionObj  EasyRTC connection object. Contains methods used for identifying and managing a connection.
 * @param       {String} errorCode      EasyRTC error code associated with an error.
 * @param       {Function} socketCallback Socket.io callback function which delivers a response to a socket. Expects a single parameter (msg).
 * @param       {nextCallback} next     A success callback of form next(err).
 */
eventListener.onEmitError = function(connectionObj, errorCode, socketCallback, next) {
    pub.util.logDebug("["+connectionObj.getAppName()+"]["+connectionObj.getEasyrtcid()+"] Running func 'onEmitError'");
    if(!_.isFunction(socketCallback)) {
        socketCallback = function(returnMsg) {
            pub.util.logDebug("["+connectionObj.getAppName()+"]["+connectionObj.getEasyrtcid()+"] EasyRTC info: unhandled ACK return message.", returnMsg);
        };
    }
    if(!_.isFunction(next)) {
        next = pub.util.nextToNowhere;
    }

    pub.events.emit("emitEasyrtcCmd", connectionObj, "error", pub.util.getErrorMsg(errorCode), socketCallback, next);
};

/**
 * Default listener for event "emitReturnAck". This event is fired when the server should return an Ack to a client via an acknowledgment message.
 *
 * @param       {Object} connectionObj  EasyRTC connection object. Contains methods used for identifying and managing a connection.
 * @param       {Function} socketCallback Socket.io callback function which delivers a response to a socket. Expects a single parameter (msg).
 * @param       {nextCallback} next     A success callback of form next(err).
 */
eventListener.onEmitReturnAck = function(connectionObj, socketCallback, next) {
    var easyrtcid = connectionObj.getEasyrtcid();
    var appObj = connectionObj.getApp();

    pub.util.logDebug("["+connectionObj.getAppName()+"]["+connectionObj.getEasyrtcid()+"] Running func 'onEmitReturnAck'");
    if(!_.isFunction(socketCallback)) {
        pub.util.logWarning("["+connectionObj.getAppName()+"]["+connectionObj.getEasyrtcid()+"] EasyRTC: unable to return ack to socket.");
        return;
    }
    if(!_.isFunction(next)) {
        next = pub.util.nextToNowhere;
    }

    var msg = {
        msgType: "ack",
        msgData:{}
    };

    pub.util.sendSocketCallbackMsg(easyrtcid, socketCallback, msg, appObj);

    next(null);
};

/**
 * Default listener for event "emitReturnError". This event is fired when the server should return an Error to a client via an acknowledgment message.
 *
 * @param       {Object} connectionObj  EasyRTC connection object. Contains methods used for identifying and managing a connection.
 * @param       {Function} socketCallback Socket.io callback function which delivers a response to a socket. Expects a single parameter (msg).
 * @param       {String} errorCode      EasyRTC error code associated with an error.
 * @param       {nextCallback} next     A success callback of form next(err).
 */
eventListener.onEmitReturnError = function(connectionObj, socketCallback, errorCode, next) {
    var easyrtcid = connectionObj.getEasyrtcid();
    var appObj = connectionObj.getApp();

    pub.util.logDebug("["+connectionObj.getAppName()+"]["+connectionObj.getEasyrtcid()+"] Running func 'onEmitReturnError'");
    if(!_.isFunction(socketCallback)) {
        pub.util.logWarning("["+connectionObj.getAppName()+"]["+connectionObj.getEasyrtcid()+"] EasyRTC: unable to return error to socket. Error code was [" + errorCode + "]");

        next(new pub.util.ConnectionError("["+connectionObj.getAppName()+"]["+connectionObj.getEasyrtcid()+"] Unable to return error to socket. Error code was [" + errorCode + "]"));
        return;
    }
    if(!_.isFunction(next)) {
        next = pub.util.nextToNowhere;
    }

    var msg = pub.util.getErrorMsg(errorCode);

    pub.util.sendSocketCallbackMsg(easyrtcid, socketCallback, msg, appObj);

    next(null);
};

/**
 * Default listener for event "emitReturnToken". This event is fired when the server should return a token to a client via an acknowledgment message.
 *
 * This is done after a client has been authenticated and the connection has been established.
 *
 * @param       {Object} connectionObj  EasyRTC connection object. Contains methods used for identifying and managing a connection.
 * @param       {Function} socketCallback Socket.io callback function which delivers a response to a socket. Expects a single parameter (msg).
 * @param       {nextCallback} next     A success callback of form next(err).
 */
eventListener.onEmitReturnToken = function(connectionObj, socketCallback, next) {
    var easyrtcid = connectionObj.getEasyrtcid();
    var appObj = connectionObj.getApp();

    pub.util.logDebug("["+connectionObj.getAppName()+"]["+connectionObj.getEasyrtcid()+"] Running func 'onSendToken'");

    var tokenMsg = {
        msgType: "token",
        msgData:{}
    };

    // Ensure socketCallback is present
    if(!_.isFunction(socketCallback)) {
        pub.util.logWarning("["+connectionObj.getAppName()+"]["+connectionObj.getEasyrtcid()+"] EasyRTC onSendToken called with no socketCallback.");
        pub.util.socketDisconnect(connectionObj.socket);
        return;
    }

    async.waterfall([
        function(asyncCallback) {
            // Get rooms user is in along with list
            connectionObj.generateRoomClientList("join", null, asyncCallback);
        },
        function(roomData, asyncCallback) {
            // Set roomData
            tokenMsg.msgData.roomData = roomData;

            // Retrieve ice config
            connectionObj.events.emit("getIceConfig", connectionObj, asyncCallback);
        },

        function(iceServers, asyncCallback) {
            tokenMsg.msgData.application        = { applicationName: connectionObj.getAppName() };
            tokenMsg.msgData.easyrtcid          = connectionObj.getEasyrtcid();
            tokenMsg.msgData.iceConfig          = { iceServers: iceServers };
            tokenMsg.msgData.serverTime         = Date.now();

            easyrtcid = tokenMsg.msgData.easyrtcid;

            // Get Application fields
            appObj.getFields(true, asyncCallback);
        },

        function(fieldObj, asyncCallback) {
            if (!_.isEmpty(fieldObj)) {
                tokenMsg.msgData.application.field = fieldObj;
            }

            // Get Connection fields
            connectionObj.getFields(true, asyncCallback);
        },

        function(fieldObj, asyncCallback) {
            if (!_.isEmpty(fieldObj)) {
                tokenMsg.msgData.field = fieldObj;
            }

            // get session object
            connectionObj.getSession(asyncCallback);
        },

        function(sessionObj, asyncCallback) {
            if (sessionObj) {

                // TODO config name for easyrtcsid ?
                tokenMsg.msgData.sessionData = {
                    "easyrtcsid": sessionObj.getEasyrtcsid()
                };

                // Get session fields
                sessionObj.getFields(true, asyncCallback);
            }
            else {
                asyncCallback(null, null);
            }
        },

        function(fieldObj, asyncCallback) {
            // Set session field (if present)
            if (fieldObj && !_.isEmpty(fieldObj)) {
                tokenMsg.msgData.sessionData.field = fieldObj;
            }

            // Emit token back to socket (SUCCESS!)
            pub.util.sendSocketCallbackMsg(easyrtcid, socketCallback, tokenMsg, appObj);

            asyncCallback(null);
        }

    ],
    // This function is called upon completion of the async waterfall, or upon an error being thrown.
    function (err) {
        if (err) {
            next(err);
        } else {
            next(null);
        }
    });
};

/**
 * Default listener for event "log". This event is fired when ever a loggable item is observed.
 *
 * @param       {string} level          Log severity level. Can be ("debug"|"info"|"warning"|"error")
 * @param       {string} logText        Text for log.
 * @param       {?*} [logFields]        Simple JSON object which contains extra fields to be logged.
 * @param       {?nextCallback} next    A success callback of form next(err).
 */
eventListener.onLog = function(level, logText, logFields, next) {
    if(!_.isFunction(next)) {
        next = pub.util.nextToNowhere;
    }

    var consoleText = "";

    var currentDate = new Date();
    if (pub.getOption("logColorEnable")) {
        var colors = require("colors");
        if(pub.getOption("logDateEnable")) {
            consoleText += currentDate.toISOString().grey + " - ";
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
        consoleText += " - " + "EasyRTC: ".bold + logText;
    }
    else {
        if(pub.getOption("logDateEnable")) {
            consoleText += currentDate.toISOString() + " - ";
        }
        consoleText += level;
        consoleText += " - " + "EasyRTC: " + logText;
    }

    if (logFields !== undefined || logFields !== null) {
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
    next(null);
};

/**
 * Default listener for event "msgTypeRoomJoin". This event is fired when an easyrtcCmd message with msgType of "roomJoin" is received from a client.
 *
 * @param       {Object} connectionObj  EasyRTC connection object. Contains methods used for identifying and managing a connection.
 * @param       {Object} rooms          A room object containing a map of room names and room parameters.
 * @param       {Function} socketCallback Socket.io callback function which delivers a response to a socket. Expects a single parameter (msg).
 * @param       {nextCallback} next     A success callback of form next(err).
 */
eventListener.onMsgTypeRoomJoin = function(connectionObj, rooms, socketCallback, next) {
    var easyrtcid = connectionObj.getEasyrtcid();
    var appObj = connectionObj.getApp();

    pub.util.logDebug("["+connectionObj.getAppName()+"]["+connectionObj.getEasyrtcid()+"] Running func 'onMsgTypeRoomJoin'");
    if(!_.isFunction(socketCallback)) {
        pub.util.logWarning("["+connectionObj.getAppName()+"]["+connectionObj.getEasyrtcid()+"] EasyRTC info: unhandled socket message callback.");
        return;
    }

    if(!_.isFunction(next)) {
        next = pub.util.nextToNowhere;
    }

    if(!_.isObject(rooms) || _.isEmpty(rooms)) {
        pub.events.emit("emitReturnError", socketCallback, "MSG_REJECT_BAD_STRUCTURE", pub.util.nextToNowhere);
        return;
    }

    for (var currentRoomName in rooms) {
        if (rooms.hasOwnProperty(currentRoomName)) {
            if (!_.isString(currentRoomName) || !connectionObj.getApp().getOption("roomNameRegExp").test(currentRoomName)) {
                pub.events.emit("emitReturnError", socketCallback, "MSG_REJECT_TARGET_ROOM", pub.util.nextToNowhere);
                return;
            }
        }
    }

    async.each(Object.keys(rooms), function(currentRoomName, roomCallback) {
        appObj.isRoom(currentRoomName, function(err, isRoom) {

            // Set roomParameter map. This may be used by custom listeners.
            var currentRoomParameter;
            if (rooms[currentRoomName] && _.isObject(rooms[currentRoomName].roomParameter)) {
                currentRoomParameter = rooms[currentRoomName].roomParameter;
            }

            if (isRoom) {
                pub.events.emit("roomJoin", connectionObj, currentRoomName, currentRoomParameter, roomCallback);
            }
            else if (appObj.getOption("roomAutoCreateEnable")) {
                pub.events.emit("roomCreate", appObj, connectionObj, currentRoomName, null, function(err, roomObj) {
                    if (err) {
                        roomCallback(err);
                        return;
                    }
                    pub.events.emit("roomJoin", connectionObj, currentRoomName, currentRoomParameter, roomCallback);
                });
            }
            else {
                pub.util.logWarning("["+connectionObj.getAppName()+"]["+connectionObj.getEasyrtcid()+"]["+currentRoomName+"] Unable to join non-existent room.");
                roomCallback(new pub.util.ConnectionError("["+connectionObj.getAppName()+"]["+connectionObj.getEasyrtcid()+"]["+currentRoomName+"] Unable to join room."));
            }
        });
    }, function(err, newRoomObj) {
        if (err) {
            pub.util.sendSocketCallbackMsg(easyrtcid, socketCallback, pub.util.getErrorMsg("MSG_REJECT_BAD_ROOM"), appObj);
            next(null); // Error has been handled
            return;
        }

        connectionObj.generateRoomClientList("join", rooms, function(err, roomData) {
            if (err) {
                pub.util.sendSocketCallbackMsg(easyrtcid, socketCallback, pub.util.getErrorMsg("MSG_REJECT_BAD_ROOM"), appObj);
                next(null); // Error has been handled
            }
            else {
                pub.util.sendSocketCallbackMsg(easyrtcid, socketCallback, {"msgType":"roomData", "msgData":{"roomData":roomData}}, appObj);
            }
        });
    });
};

/**
 * Default listener for event "msgTypeRoomLeave". This event is fired when an easyrtcCmd message with msgType of "roomLeave" is received from a client.
 *
 * @param       {Object} connectionObj  EasyRTC connection object. Contains methods used for identifying and managing a connection.
 * @param       {Object} rooms          A room object containing a map of room names.
 * @param       {Function} socketCallback Socket.io callback function which delivers a response to a socket. Expects a single parameter (msg).
 * @param       {nextCallback} next     A success callback of form next(err).
 */
eventListener.onMsgTypeRoomLeave = function(connectionObj, rooms, socketCallback, next) {
    var easyrtcid = connectionObj.getEasyrtcid();
    var appObj = connectionObj.getApp();

    pub.util.logDebug("["+connectionObj.getAppName()+"]["+connectionObj.getEasyrtcid()+"] Running func 'onMsgTypeRoomLeave' with rooms: ",rooms);
    if(!_.isFunction(socketCallback)) {
        socketCallback = function(returnMsg) {
            pub.util.logDebug("["+connectionObj.getAppName()+"]["+connectionObj.getEasyrtcid()+"] EasyRTC info: unhandled ACK return message.", returnMsg);
        };
    }

    if(!_.isFunction(next)) {
        next = pub.util.nextToNowhere;
    }

    // Loop through each room in the rooms object. Emit the leaveRoom event for each one.
    async.each(Object.keys(rooms), function(currentRoomName, asyncCallback) {
        connectionObj.events.emit("roomLeave", connectionObj, currentRoomName, function(err) {
            if (err) {
                pub.util.logWarning("["+connectionObj.getAppName()+"]["+connectionObj.getEasyrtcid()+"] Error leaving room ["+currentRoomName+"].", err);
            }
            asyncCallback(null);
        });
    }, function(err, newRoomObj) {
        var roomData = {};
        for (var currentRoomName in rooms) {
            if (rooms.hasOwnProperty(currentRoomName)) {
                roomData[currentRoomName] = {
                    "roomName":     currentRoomName,
                    "roomStatus":   "leave"
                };
            }
        }
        pub.util.sendSocketCallbackMsg(easyrtcid, socketCallback, {"msgType":"roomData", "msgData":{"roomData":roomData}}, appObj);
        next(null);
    });
};

/**
 * Default listener for event "msgTypeGetIceConfig". This event is fired when an easyrtcCmd message with msgType of "getIceConfig" is received from a client.
 *
 * @param       {Object} connectionObj  EasyRTC connection object. Contains methods used for identifying and managing a connection.
 * @param       {Function} socketCallback Socket.io callback function which delivers a response to a socket. Expects a single parameter (msg).
 * @param       {nextCallback} next     A success callback of form next(err).
 */
eventListener.onMsgTypeGetIceConfig = function(connectionObj, socketCallback, next) {
    var easyrtcid = connectionObj.getEasyrtcid();
    var appObj = connectionObj.getApp();

    pub.util.logDebug("["+connectionObj.getAppName()+"]["+connectionObj.getEasyrtcid()+"] Running func 'onMsgTypeGetIceConfig'");

    if(!_.isFunction(socketCallback)) {
        socketCallback = function(returnMsg) {
            pub.util.logDebug("["+connectionObj.getAppName()+"]["+connectionObj.getEasyrtcid()+"] EasyRTC info: unhandled ACK return message.", returnMsg);
        };
    }

    if(!_.isFunction(next)) {
        next = pub.util.nextToNowhere;
    }

    connectionObj.events.emit("getIceConfig", connectionObj, function(err, iceConfigObj) {
        if (err) {
            pub.util.sendSocketCallbackMsg(easyrtcid, socketCallback, pub.util.getErrorMsg("MSG_REJECT_GEN_FAIL"), appObj);
        }
        else {
            pub.util.sendSocketCallbackMsg(easyrtcid, socketCallback, {"msgType":"iceConfig", "msgData":{"iceConfig":{"iceServers":iceConfigObj}}}, appObj);
        }
        next(null);
    });
};

/**
 * Default listener for event "msgTypeGetRoomList". This event is fired when an easyrtcCmd message with msgType of "getRoomList" is received from a client.
 *
 * @param       {Object} connectionObj  EasyRTC connection object. Contains methods used for identifying and managing a connection.
 * @param       {Function} socketCallback Socket.io callback function which delivers a response to a socket. Expects a single parameter (msg).
 * @param       {nextCallback} next     A success callback of form next(err).
 */
eventListener.onMsgTypeGetRoomList = function(connectionObj, socketCallback, next) {
    var easyrtcid = connectionObj.getEasyrtcid();
    var appObj = connectionObj.getApp();

    pub.util.logDebug("["+connectionObj.getAppName()+"]["+connectionObj.getEasyrtcid()+"] Running func 'onMsgTypeGetRoomList'");

    if(!_.isFunction(socketCallback)) {
        socketCallback = function(returnMsg) {
            pub.util.logDebug("["+connectionObj.getAppName()+"]["+connectionObj.getEasyrtcid()+"] EasyRTC info: unhandled ACK return message.", returnMsg);
        };
    }

    if(!_.isFunction(next)) {
        next = pub.util.nextToNowhere;
    }

    connectionObj.generateRoomList(
        function(err, roomList) {
            if(err) {
                pub.util.sendSocketCallbackMsg(easyrtcid, socketCallback, pub.util.getErrorMsg("MSG_REJECT_NO_ROOM_LIST"), appObj);
            }
            else {
                pub.util.sendSocketCallbackMsg(easyrtcid, socketCallback, {"msgType":"roomList", "msgData":{"roomList":roomList}}, appObj);
            }
            next(null);
        }
    );
};



/**
 * Default listener for event "msgTypeSetPresence". This event is fired when an easyrtcCmd message with msgType of "setPresence" is received from a client.
 *
 * @param       {Object} connectionObj  EasyRTC connection object. Contains methods used for identifying and managing a connection.
 * @param       {Object} presenceObj    Presence object which contains all the fields for setting a presence for a connection.
 * @param       {Function} socketCallback Socket.io callback function which delivers a response to a socket. Expects a single parameter (msg).
 * @param       {nextCallback} next     A success callback of form next(err).
 */
eventListener.onMsgTypeSetPresence = function(connectionObj, presenceObj, socketCallback, next) {
    var easyrtcid = connectionObj.getEasyrtcid();
    var appObj = connectionObj.getApp();

    pub.util.logDebug("["+connectionObj.getAppName()+"]["+connectionObj.getEasyrtcid()+"] Running func 'onMsgTypeSetPresence' with setPresence: ",presenceObj);
    if(!_.isFunction(socketCallback)) {
        socketCallback = function(returnMsg) {
            pub.util.logDebug("["+connectionObj.getAppName()+"]["+connectionObj.getEasyrtcid()+"] EasyRTC info: unhandled ACK return message.", returnMsg);
        };
    }

    if(!_.isFunction(next)) {
        next = pub.util.nextToNowhere;
    }

    connectionObj.setPresence(
        presenceObj,
        function(err) {
            if (err) {
                pub.util.sendSocketCallbackMsg(easyrtcid, socketCallback, pub.util.getErrorMsg("MSG_REJECT_PRESENCE"), appObj);
            }
            else {
                connectionObj.emitRoomDataDelta(false, function(err, roomDataObj) {
                    if (err) {
                        pub.util.sendSocketCallbackMsg(easyrtcid, socketCallback, pub.util.getErrorMsg("MSG_REJECT_PRESENCE"), appObj);
                    }
                    else {
                        pub.util.sendSocketCallbackMsg(easyrtcid, socketCallback, {"msgType":"roomData", "msgData":{"roomData":roomDataObj}}, appObj);
                    }
                });
            }
            next(null);
        }
    );
};

/**
 * Default listener for event "msgTypeSetRoomApiField". This event is fired when an easyrtcCmd message with msgType of "setRoomApiField" is received from a client.
 *
 * @param       {Object} connectionObj  EasyRTC connection object. Contains methods used for identifying and managing a connection.
 * @param       {Object} roomApiFieldObj Api Field object which contains all the fields for setting a presence for a connection.
 * @param       {Function} socketCallback Socket.io callback function which delivers a response to a socket. Expects a single parameter (msg).
 * @param       {nextCallback} next     A success callback of form next(err).
 */
eventListener.onMsgTypeSetRoomApiField = function(connectionObj, roomApiFieldObj, socketCallback, next) {
    var easyrtcid = connectionObj.getEasyrtcid();
    var appObj = connectionObj.getApp();

    pub.util.logDebug("["+connectionObj.getAppName()+"]["+connectionObj.getEasyrtcid()+"] Running func 'onMsgTypeSetRoomApiField' with apiFieldObj: ",roomApiFieldObj);
    if(!_.isFunction(socketCallback)) {
        socketCallback = function(returnMsg) {
            pub.util.logDebug("["+connectionObj.getAppName()+"]["+connectionObj.getEasyrtcid()+"] EasyRTC info: unhandled ACK return message.", returnMsg);
        };
    }

    if(!_.isFunction(next)) {
        next = pub.util.nextToNowhere;
    }

    connectionObj.room(roomApiFieldObj.roomName, function(err, connectionRoomObj) {
        if (err) {
            pub.util.sendSocketCallbackMsg(easyrtcid, socketCallback, pub.util.getErrorMsg("MSG_REJECT_BAD_ROOM"), appObj);
            next(null);
            return;
        }
        connectionRoomObj.setApiField(roomApiFieldObj.field, function(err) {
            if (err) {
                pub.util.sendSocketCallbackMsg(easyrtcid, socketCallback, pub.util.getErrorMsg("MSG_REJECT_BAD_FIELD"), appObj);
                next(null);
                return;
            }
            connectionRoomObj.emitRoomDataDelta(false, function(err, roomDataDelta) {
                if (err) {
                    pub.util.sendSocketCallbackMsg(easyrtcid, socketCallback, pub.util.getErrorMsg("MSG_REJECT_GEN_FAIL"), appObj);
                    next(null);
                    return;
                }

                var msg = {"msgType":"roomData", "msgData": {"roomData": {}}};
                msg.msgData.roomData[roomApiFieldObj.roomName] = roomDataDelta;
                pub.util.sendSocketCallbackMsg(easyrtcid, socketCallback, msg, appObj);
            });
        });
    });
};

/**
 * Default listener for event "getIceConfig". Returns an ICE configuration object to the callback.
 *
 * The ICE configuration object will hold the array of STUN and TURN servers the connection should use when forming a peer connection. This default listener uses the "appIceServers" configuration option at the application level.
 *
 * @param       {Object} connectionObj  EasyRTC connection object. Contains methods used for identifying and managing a connection.
 * @param       {Function} callback     Callback of form (err, iceConfigArray)
 */
eventListener.onGetIceConfig = function(connectionObj, callback) {
    pub.util.logDebug("["+connectionObj.getAppName()+"]["+connectionObj.getEasyrtcid()+"] Running func 'onGetIceConfig'");
    callback(null, connectionObj.getApp().getOption("appIceServers"));
};

/**
 * Default listener for event "roomCreate". Creates a room attached to an application with a specified room name. The optional creatorConnectionObj is provided to provide context; joining the room is done separately. If successful, the callback returns a roomObj.
 *
 * @param       {Object} appObj         EasyRTC application object. Contains methods used for identifying and managing an application.
 * @param       {?Object} creatorConnectionObj EasyRTC connection object belonging to the creator of the room. Contains methods used for identifying and managing a connection.
 * @param       {string} roomName       Room name which uniquely identifies a room within an EasyRTC application.
 * @param       {?Object} roomOptions   Sets room level options. May be null or map of key/value pairs.
 * @param       {Function} callback     Callback of form (err, roomObj)
 */
eventListener.onRoomCreate = function(appObj, creatorConnectionObj, roomName, roomOptions, callback) {
    pub.util.logDebug("["+appObj.getAppName()+"]" + (creatorConnectionObj?"["+creatorConnectionObj.getEasyrtcid()+"]":"") +  " Room ["+ roomName +"] Running func 'onRoomCreate'");
    appObj.createRoom(roomName, roomOptions, callback);
};

/**
 * Default listener for event "roomJoin". Joins a connection to a a specified room. If successful, the callback will return a connectionRoomObj.
 *
 * @param       {Object} connectionObj  EasyRTC connection object. Contains methods used for identifying and managing a connection.
 * @param       {string} roomName       Room name which uniquely identifies a room within an EasyRTC application.
 * @param       {?Object} roomParameter A map(dictionary) object with key/value pairs. The values can be any JSONable object. This field is not currently looked at by EasyRTC, however it is available for custom server applications. May be used for room options or authentication needs.
 * @param       {Function} callback     Callback of form (err, connectionRoomObj)
 */
eventListener.onRoomJoin = function(connectionObj, roomName, roomParameter, callback) {
    pub.util.logDebug("["+connectionObj.getAppName()+"]["+connectionObj.getEasyrtcid()+"] Running func 'onRoomJoin'");

    // roomParameter is a new field. To ease upgrading we'll just show a warning to server applications which haven't updated
    if (_.isFunction(roomParameter)) {
        pub.util.logWarning("Upgrade notice: EasyRTC roomJoin event called without roomParameter object.");
        callback = roomParameter;
        roomParameter = null;
    }

    connectionObj.joinRoom(roomName, function(err, connectionRoomObj) {
        if (err) {
            callback(err);
            return;
        }
        connectionRoomObj.emitRoomDataDelta(false, function(err, roomDataDelta) {
            // Return connectionRoomObj regardless of if there was a problem sending out the deltas
            callback(null, connectionRoomObj);
        });
    });
};

/**
 * Default listener for event "roomLeave". Run upon a connection leaving a room.
 *
 * @param       {Object} connectionObj  EasyRTC connection object. Contains methods used for identifying and managing a connection.
 * @param       {string} roomName       Room name which uniquely identifies a room within an EasyRTC application.
 * @param       {nextCallback} next     A success callback of form next(err).
 */
eventListener.onRoomLeave = function(connectionObj, roomName, next) {
    pub.util.logDebug("["+connectionObj.getAppName()+"]["+connectionObj.getEasyrtcid()+"] Running func 'onRoomLeave' with rooms ["+roomName+"]");

    if(!_.isFunction(next)) {
        next = pub.util.nextToNowhere;
    }

    connectionObj.room(roomName, function(err, connectionRoomObj) {
        if (err) {
            pub.util.logWarning("["+connectionObj.getAppName()+"]["+connectionObj.getEasyrtcid()+"] Couldn't leave room [" + roomName + "]");
            next(err);
            return;
        }

        pub.util.logDebug("["+connectionObj.getAppName()+"]["+connectionObj.getEasyrtcid()+"] Leave room [" + roomName + "]");
        connectionRoomObj.leaveRoom(next);
    });
};

/**
 * Default listener for event "shutdown". This event is fired when the server is being shutdown.
 *
 * @param       {nextCallback} next     A success callback of form next(err).
 */
eventListener.onShutdown = function(next) {
    pub.util.logDebug("Running func 'onShutdown'");
    next(null);
};

/**
 * Default listener for event "startup". This event initializes EasyRTC server so it is ready for connections.
 *
 * @param       {nextCallback} next     A success callback of form next(err).
 */
eventListener.onStartup = function(next) {
    if (!_.isFunction(next)) {
        next = pub.util.nextToNowhere;
    }

    pub.util.logDebug("Running func 'onStartup'");
    async.waterfall([
        function(callback) {
            pub.util.logDebug("Configuring Http server");

            // Set the EasyRTC demos
            if (pub.getOption("demosEnable")) {
                pub.util.logDebug("Setting up demos to be accessed from '" + pub.getOption("demosPublicFolder") + "/'");

                pub.httpApp.get(pub.getOption("demosPublicFolder") + "/*", function(req, res) {
                    const filePath = "./demos/" + (req.params[0] ? req.params[0] : "index.html");
                    pub.util.sendSessionCookie(req, res);
                    pub.util.sendFileResponse(req, res, filePath);
                });
                // Forward people who forget the trailing slash to the folder.
                pub.httpApp.get(pub.getOption("demosPublicFolder"), function(req, res) {res.redirect(pub.getOption("demosPublicFolder") + "/");});
            }

            // Set the EasyRTC API files
            if (pub.getOption("apiEnable")) {
                pub.util.logDebug("Setting up API files to be accessed from '" + pub.getOption("apiPublicFolder") + "/'");

                pub.httpApp.get(pub.getOption("apiPublicFolder") + "/easyrtc.js",     function(req, res) { pub.util.sendFileResponse(req, res, "api/easyrtc.js"); });
                pub.httpApp.get(pub.getOption("apiPublicFolder") + "/easyrtc_ft.js",  function(req, res) { pub.util.sendFileResponse(req, res, "api/easyrtc_ft.js"); });
                pub.httpApp.get(pub.getOption("apiPublicFolder") + "/easyrtc.css",    function(req, res) { pub.util.sendFileResponse(req, res, "api/easyrtc.css"); });
                pub.httpApp.get(pub.getOption("apiPublicFolder") + "/img/*", function(req, res) {
                    const filePath = "./api/img/" + (req.params[0] ? req.params[0] : "index.html");
                    pub.util.sendFileResponse(req, res, filePath);
                });

                if (pub.getOption("apiLabsEnable")) {
                    pub.httpApp.get(pub.getOption("apiPublicFolder") + "/labs/*", function(req, res) {
                        const filePath = "./api/labs/" + (req.params[0] ? req.params[0] : "index.html");
                        pub.util.sendFileResponse(req, res, filePath);
                    });
                }
            }

            // Transition - Old locations of EasyRTC API files
            if (pub.getOption("apiEnable") && pub.getOption("apiOldLocationEnable")) {
                pub.util.logWarning("Enabling listening for API files in older depreciated location.");
                pub.httpApp.get("/js/easyrtc.js", function(req, res) { pub.util.sendFileResponse(req, res, "api/easyrtc.js"); });
                pub.httpApp.get("/css/easyrtc.css", function(req, res) { pub.util.sendFileResponse(req, res, "api/easyrtc.css"); });
            }

            callback(null);
        },

        function(callback) {
            pub.util.logDebug("Configuring Socket server");

            pub.socketServer.sockets.on("connection", function (socket) {
                var easyrtcid = pub.getAvailableEasyrtcid();

                pub.util.logDebug("["+easyrtcid+"]["+socket.id+"] Socket connected");
                pub.util.logDebug("Emitting event 'connection'");
                pub.events.emit("connection", socket, easyrtcid, function(err) {
                    if (err) {
                        pub.util.socketDisconnect(socket);
                        pub.util.logError("["+easyrtcid+"] Connect error", err);
                    }
                });
            });
            callback(null);
        },

        // Setup default application
        function(callback) {
            pub.createApp(pub.getOption("appDefaultName"), null, callback);
        }
    ],
    // This function is called upon completion of the async waterfall, or upon an error being thrown.
    function (err) {
        next(err);
    });
};