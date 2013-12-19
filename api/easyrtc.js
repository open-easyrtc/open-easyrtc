/** @class
 *@version 1.0.7
 *<p>
 * Provides client side support for the EasyRTC framework.
 * Please see the easyrtc_client_api.md and easyrtc_client_tutorial.md
 * for more details.</p>
 *
 *<p>
 *copyright Copyright (c) 2013, Priologic Software Inc.
 *All rights reserved.</p>
 *
 *<p>
 *Redistribution and use in source and binary forms, with or without
 *modification, are permitted provided that the following conditions are met:
 *</p>
 * <ul>
 *   <li> Redistributions of source code must retain the above copyright notice,
 *      this list of conditions and the following disclaimer. </li>
 *   <li> Redistributions in binary form must reproduce the above copyright
 *      notice, this list of conditions and the following disclaimer in the
 *      documentation and/or other materials provided with the distribution. </li>
 *</ul>
 *<p>
 *THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 *AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 *IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 *ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
 *LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 *CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 *SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 *INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 *CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 *ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 *POSSIBILITY OF SUCH DAMAGE.
 *</p>
 */


var easyrtc = {};

/** @private 
 * @param {Object} destObject
 * @param {Object} allowedEventsArray
 */
var easyrtcAddEventHandling = function(destObject, allowedEventsArray) {
    //
    // build a dictionary of allowed events for this object.
    //
    var allowedEvents = {};
    for (var i = 0; i < allowedEventsArray.length; i++) {
        allowedEvents[allowedEventsArray[i]] = true;
    }
    //
    // verify that the eventName argument is a valid event type for the object.
    //
    function eventChecker(eventName, src) {
        if (typeof eventName !== 'string') {
            easyrtc.showError(easyrtc.errCodes.DEVELOPER_ERR, src + " called without a string as the first argument");
            throw "developer error";
        }
        if (!allowedEvents[eventName]) {
            easyrtc.showError(easyrtc.errCodes.DEVELOPER_ERR, src + " called with a bad event name = " + eventName);
            throw "developer error";
        }
    }
    var eventListeners = {};
    destObject.addEventListener = function(eventName, eventListener) {
        eventChecker(eventName, "addEventListener");
        if (typeof eventListener !== 'function') {
            easyrtc.showError(easyrtc.errCodes.DEVELOPER_ERR, "addEventListener called with a nonfunction for second argument");
            throw "developer error";
        }
        //
        // remove the event listener if it's already present so we don't end up with two copies
        //
        destObject.removeEventListener(eventName, eventListener);
        if (!eventListeners[eventName]) {
            eventListeners[eventName] = [];
        }
        eventListeners[eventName][eventListeners[eventName].length] = eventListener;
    };
    destObject.removeEventListener = function(eventName, eventListener) {
        eventChecker(eventName, "removeEventListener");
        var listeners = eventListeners[eventName];
        var i = 0;
        if (listeners) {
            for (i = 0; i < listeners.length; i++) {
                if (listeners[i] === eventListener) {
                    if (i < listeners.length - 1) {
                        listeners[i] = listeners[listeners.length - 1];
                    }
                    listeners.length = listeners.length - 1;
                }
            }
        }
    };
    destObject.emitEvent = function(eventName, eventData) {
        eventChecker(eventName, "emitEvent");
        var listeners = eventListeners[eventName];
        var i = 0;
        if (listeners) {
            for (i = 0; i < listeners.length; i++) {
                listeners[i](eventName, eventData);
            }
        }
    };
};

easyrtcAddEventHandling(easyrtc, ["roomOccupant"]);

/** Error codes that the EasyRTC will use in the errorCode field of error object passed
 *  to error handler set by easyrtc.setOnError. The error codes are short printable strings.
 * @type Dictionary
 */
easyrtc.errCodes = {
    BAD_NAME: "BAD_NAME", // a user name wasn't of the desired form
    CALL_ERR: "CALL_ERR", // something went wrong creating the peer connection
    DEVELOPER_ERR: "DEVELOPER_ERR", // the developer using the EasyRTC library made a mistake
    SYSTEM_ERR: "SYSTEM_ERR", // probably an error related to the network
    CONNECT_ERR: "CONNECT_ERR", // error occurred when trying to create a connection
    MEDIA_ERR: "MEDIA_ERR", // unable to get the local media
    MEDIA_WARNING: "MEDIA_WARNING", // didn't get the desired resolution
    INTERNAL_ERR: "INTERNAL_ERR",
    PEER_GONE: "PEER_GONE", // peer doesn't exist
    ALREADY_CONNECTED: "ALREADY_CONNECTED"
};
easyrtc.apiVersion = "1.0.7";
/** Most basic message acknowledgment object */
easyrtc.ackMessage = {msgType: "ack", msgData: {}};
/** Regular expression pattern for user ids. This will need modification to support non US character sets */
easyrtc.usernameRegExp = /^(.){1,64}$/;
/** @private */
easyrtc.cookieId = "easyrtcsid";
/** @private */
easyrtc.username = null;
/** @private */
easyrtc.loggingOut = false;
/** @private */
easyrtc.disconnecting = false;
/** @private */
easyrtc.localStream = null;
/** @private */
easyrtc.videoFeatures = true; // default video


/** @private */
easyrtc.audioEnabled = true;
/** @private */
easyrtc.videoEnabled = true;
/** @private */
easyrtc.forwardStreamEnabled = false;
/** @private */
easyrtc.datachannelName = "dc";
/** @private */
easyrtc.debugPrinter = null;
/** Your easyrtcid */
easyrtc.myEasyrtcid = "";
/** @private */
easyrtc.oldConfig = {};
/** @private */
easyrtc.offersPending = {};
/** @private */
easyrtc.selfRoomJoinTime = 0;
/** The height of the local media stream video in pixels. This field is set an indeterminate period
 * of time after easyrtc.initMediaSource succeeds.
 */
easyrtc.nativeVideoHeight = 0;
/** The width of the local media stream video in pixels. This field is set an indeterminate period
 * of time after easyrtc.initMediaSource succeeds.
 */
easyrtc.nativeVideoWidth = 0;
/** @private */
easyrtc.credential = null;

/** The rooms the user is in. This only applies to room oriented applications and is set at the same
 * time a token is received.
 */
easyrtc.roomJoin = {};



/** Checks if the supplied string is a valid user name (standard identifier rules)
 * @param {String} name
 * @return {Boolean} true for a valid user name
 * @example
 *    var name = document.getElementById('nameField').value;
 *    if( !easyrtc.isNameValid(name)){
 *        console.error("Bad user name");
 *    }
 */
easyrtc.isNameValid = function(name) {
    return easyrtc.usernameRegExp.test(name);
};
/**
 * This function sets the name of the cookie that client side library will look for
 * and transmit back to the server as it's easyrtcsid in the first message.
 * @param {String} cookieId
 */
easyrtc.setCookieId = function(cookieId) {
    easyrtc.cookieId = cookieId;
};
/**
 * This method allows you to join a single room. It may be called multiple times to be in
 * multiple rooms simultaneously. It may be called before or after connecting to the server.
 * Note: the successCB and failureDB will only be called if you are already connected to the server.
 * @param {String} roomName
 * @param {String} roomParameters : application specific parameters, can be null.
 * @param {Function} successCB called once, with a roomname as it's argument, once the room is joined. 
 * @param {Function} failureCB called if the room can not be joined. The arguments of failureCB are errorCode, errorText, roomName.
 */
easyrtc.joinRoom = function(roomName, roomParameters, successCB, failureCB) {
    if (easyrtc.roomJoin[roomName]) {
        console.error("Programmer error: attempt to join room " + roomName + " which you are already in.");
        return;
    }
    var newRoomData = {roomName: roomName};
    if (roomParameters) {
        try {
            JSON.stringify(roomParameters);
        } catch (error) {
            easyrtc.showError(easyrtc.errCodes.DEVELOPER_ERR, "non-jsonable parameter to easyrtc.joinRoom");
            throw "Developer error, see application error messages";
        }
        var parameters = {};
        for (var key in roomParameters) {
            parameters[key] = roomParameters[key];
        }
        newRoomData.roomParameter = parameters;
    }


    if (failureCB === null) {
        failureCB = function(errorCode, errorText, roomName) {
            easyrtc.showError(errorCode, "Unable to enter room " + roomName + " because " + errorText);
        };
    }
    if (easyrtc.webSocket) {
        var entry = {};
        entry[roomName] = newRoomData;
        function success(msgType, msgData) {
            easyrtc.roomJoin[roomName] = newRoomData;
            var roomData = msgData.roomData;
            if (successCB) {
                successCB(roomName);
            }
            easyrtc._processRoomData(roomData);

            /*
            easyrtc.lastLoggedInList[roomName] = {};
            for (var key in roomData[roomName].clientList) {
                if (key !== easyrtc.myEasyrtcid) {
                    easyrtc.lastLoggedInList[roomName][key] = roomData[roomName].clientList[key];
                }
            }
            easyrtc.roomOccupantListener(roomName, easyrtc.lastLoggedInList[roomName]);
            easyrtc.emitEvent("roomOccupant", easyrtc.lastLoggedInList);
            */
        }
        
        function failure(errorCode, errorText) {
            if (failureCB) {
                failureCB(errorCode, errorText, roomName);
            }
            else {
                easyrtc.showError(errorCode, "Unable to enter room " + roomName + " because " + errorText);
            }
        }
        easyrtc.sendSignalling(null, "roomJoin", {roomJoin: entry}, success, failure);
    }
    else {
        easyrtc.roomJoin[roomName] = newRoomData;
    }
};
/**
 * This function allows you to leave a single room. Note: the successCB and failureDB
 *  arguments are optional and will only be called if you are already connected to the server.
 * @param {String} roomName
 * @param {Function} successCallback - A function which expects a roomName.
 * @param {Function} failureCallback - A function which expects the following arguments: errorCode, errorText, roomName.
 * @example
 *    easyrtc.leaveRoom("freds_room");
 *    easyrtc.leaveRoom("freds_room", function(roomname) { console.log("left the room")},
 *                       function(errorCode, errroText, roomname) { console.log("left the room")});           
 */
easyrtc.leaveRoom = function(roomName, successCallback, failureCallback) {
    if (easyrtc.roomJoin[roomName]) {
        if (!easyrtc.webSocket) {
            delete easyrtc.roomJoin[roomName];
        }
        else {
            var roomItem = {};
            roomItem[roomName] = {roomName: roomName};
            easyrtc.sendSignalling(null, "roomLeave", {roomLeave: roomItem},
            function(msgType, msgData) {
                var roomData = msgData.roomData;
                easyrtc._processRoomData(roomData);
                if (successCallback) {
                    successCallback(roomName);
                }
            },
            function(errorCode, errorText) {
                if (failureCallback) {
                    failureCallback(errorCode, errorText, roomName);
                }
            });
        }
    }
};
/** This function is used to set the dimensions of the local camera, usually to get HD.
 *  If called, it must be called before calling easyrtc.initMediaSource (explicitly or implicitly).
 *  assuming it is supported. If you don't pass any parameters, it will default to 720p dimensions.
 * @param {Number} width in pixels
 * @param {Number} height in pixels
 * @example
 *    easyrtc.setVideoDims(1280,720);
 * @example
 *    easyrtc.setVideoDims();
 */
easyrtc.setVideoDims = function(width, height) {
    if (!width) {
        width = 1280;
        height = 720;
    }

    easyrtc.videoFeatures = {
        mandatory: {
            minWidth: width,
            minHeight: height,
            maxWidth: width,
            maxHeight: height
        },
        optional: []
    };
};
/** This function requests that screen capturing be used to provide the local media source
 * rather than a webcam. If you have multiple screens, they are composited side by side.
 * @example
 *    easyrtc.setScreenCapture();
 */
easyrtc.setScreenCapture = function() {
    easyrtc.videoFeatures = {
        mandatory: {
            chromeMediaSource: "screen"
        },
        optional: []
    };
};
/** Set the application name. Applications can only communicate with other applications
 * that share the same API Key and application name. There is no predefined set of application
 * names. Maximum length is
 * @param {String} name
 * @example
 *    easyrtc.setApplicationName('simpleAudioVideo');
 */
easyrtc.setApplicationName = function(name) {
    easyrtc.applicationName = name;
};
/** Enable or disable logging to the console.
 * Note: if you want to control the printing of debug messages, override the
 *    easyrtc.debugPrinter variable with a function that takes a message string as it's argument.
 *    This is exactly what easyrtc.enableDebug does when it's enable argument is true.
 * @param {Boolean} enable - true to turn on debugging, false to turn off debugging. Default is false.
 * @example
 *    easyrtc.enableDebug(true);
 */
easyrtc.enableDebug = function(enable) {
    if (enable) {
        easyrtc.debugPrinter = function(message) {
            var stackString = new Error().stack;
            var srcLine = "location unknown";
            if (stackString) {
                var stackFrameStrings = new Error().stack.split('\n');
                srcLine = "";
                if (stackFrameStrings.length >= 3) {
                    srcLine = stackFrameStrings[2];
                }
            }
            console.log("debug " + (new Date()).toISOString() + " : " + message + " [" + srcLine + "]");
        };
    }
    else {
        easyrtc.debugPrinter = null;
    }
};
easyrtc.updatePresence = function(state, statusText) {
    easyrtc.presenceShow = state;
    easyrtc.presenceStatus = statusText;
};
/**
 * Determines if the local browser supports WebRTC GetUserMedia (access to camera and microphone).
 * @returns {Boolean} True getUserMedia is supported.
 */
easyrtc.supportsGetUserMedia = function() {
    return !!getUserMedia;
};
/**
 * Determines if the local browser supports WebRTC Peer connections to the extent of being able to do video chats.
 * @returns {Boolean} True if Peer connections are supported.
 */
easyrtc.supportsPeerConnections = function() {
    if (!easyrtc.supportsGetUserMedia()) {
        return false;
    }
    if (!window.RTCPeerConnection) {
        return false;
    }
    try {
        easyrtc.createRTCPeerConnection({"iceServers": []}, null);
    } catch (oops) {
        return false;
    }
    return true;
};
/** @private
 * @param pc_config ice configuration array
 * @param optionalStuff peer constraints.
 */
/** @private
 * @param pc_config ice configuration array
 * @param optionalStuff peer constraints.
 */
easyrtc.createRTCPeerConnection = function(pc_config, optionalStuff) {
    if (RTCPeerConnection) {
        return new RTCPeerConnection(pc_config, optionalStuff);
    }
    else {
        throw "Your browser doesn't support webRTC (RTCPeerConnection)";
    }
};
//
// this should really be part of adapter.js
// Versions of chrome < 31 don't support reliable data channels transport.
// Firefox does.
//
easyrtc.getDatachannelConstraints = function() {
    if (webrtcDetectedBrowser === "chrome" && webrtcDetectedVersion < 31) {
        return {reliable: false};
    }
    else {
        return {reliable: true};
    }
};
/** @private */
easyrtc.haveAudioVideo = {
    audio: false,
    video: false
};
/** @private */
easyrtc.dataEnabled = false;
/** @private */
easyrtc.serverPath = null;
/** @private */
easyrtc.roomOccupantListener = null;
/** @private */
easyrtc.onDataChannelOpen = null;
/** @private */
easyrtc.onDataChannelClose = null;
/** @private */
easyrtc.lastLoggedInList = {};
/** @private */
easyrtc.receivePeer = {msgTypes: {}};
/** @private */
easyrtc.receiveServerCB = null;
/** @private */
easyrtc.updateConfigurationInfo = function() {

}; // dummy placeholder for when we aren't connected
//
//
//  easyrtc.peerConns is a map from caller names to the below object structure
//     {  startedAV: boolean,  -- true if we have traded audio/video streams
//        dataChannelS: RTPDataChannel for outgoing messages if present
//        dataChannelR: RTPDataChannel for incoming messages if present
//        dataChannelReady: true if the data channel can be used for sending yet
//        dataChannelWorks: true if the data channel has been tested and found to work.
//        connectTime: timestamp when the connection was started
//        sharingAudio: true if audio is being shared
//        sharingVideo: true if video is being shared
//        cancelled: temporarily true if a connection was cancelled by the peer asking to initiate it.
//        candidatesToSend: SDP candidates temporarily queued
//        pc: RTCPeerConnection
//        mediaStream: mediaStream
//	  function callSuccessCB(string) - see the easyrtc.call documentation.
//        function callFailureCB(errorCode, string) - see the easyrtc.call documentation.
//        function wasAcceptedCB(boolean,string) - see the easyrtc.call documentation.
//     }
//
/** @private */
easyrtc.peerConns = {};
//
// a map keeping track of whom we've requested a call with so we don't try to
// call them a second time before they've responded.
//
/** @private */
easyrtc.acceptancePending = {};
/*
 * the maximum length of the apiFields. This is defined on the
 * server side as well, so changing it here alone is insufficient.
 */
/** @private */
var maxApiFieldsLength = 128;
/**
 * Disconnect from the EasyRTC server.
 * @example
 *    easyrtc.disconnect();
 */
easyrtc.disconnect = function() {
};
/** @private
 * @param caller
 * @param helper
 */
easyrtc.acceptCheck = function(caller, helper) {
    helper(true);
};
/** @private
 * @param easyrtcid
 * @param stream
 */
easyrtc.streamAcceptor = function(easyrtcid, stream) {
};
/** @private
 * @param easyrtcid
 */
easyrtc.onStreamClosed = function(easyrtcid) {
};
/** @private
 * @param easyrtcid
 */
easyrtc.callCancelled = function(easyrtcid) {
};

/*
 * This function gets the statistics for a particular peer connection. 
 * @param {String} peerId
 * @param {String} callback gets a map of { userDefinedKey: value}
 * @param {String} filter has is a map of maps of the form {reportNum:{googleKey: userDefinedKey}}
 * It is still experimental and hence isn't advertised in the documentation.
 */
var count = 0;
easyrtc.getPeerStatistics = function(peerId, callback, filter) {
    count++;

    if (!easyrtc.peerConns[peerId]) {
        callback({"notConnected": peerId});
    }
    else if (easyrtc.peerConns[peerId].pc.getStats) {
        easyrtc.peerConns[peerId].pc.getStats(function(stats) {
            var localStats = {};
            var part, parts = stats.result();
            var i, j;
            var itemKeys;
            var itemKey;
            if (!filter) {
                for (i = 0; i < parts.length; i++) {
                    var names = parts[i].names();
                    for (var j = 0; j < names.length; j++) {
                        itemKey = names[j];
                        localStats[parts[i].id + "." + itemKey] = parts[i].local.stat(itemKey);
                    }
                }
            }
            else {
                var partNames = [];
                var partList;
                for (i = 0; i < parts.length; i++) {
                    partNames[i] = {};
                    //
                    // convert the names into a dictionary
                    //
                    var names = parts[i].names();
                    for (j = 0; j < names.length; j++) {
                        partNames[i][names[j]] = true;
                    }

                    //
                    // discard info from any inactive connection.
                    //
                    if (partNames[i].googActiveConnection) {
                        var flag = parts[i].local.stat("googActiveConnection");
                        if (!flag || flag === "false") {
                            partNames[i] = {};
                        }
                    }
                }

                for (i = 0; i < filter.length; i++) {
                    itemKeys = filter[i];
                    partList = [];
                    part = null;
                    for (j = 0; j < parts.length; j++) {
                        var fullMatch = true;
                        for (itemKey in itemKeys) {
                            if (!partNames[j][itemKey]) {
                                fullMatch = false;
                                break;
                            }
                        }
                        if (fullMatch && parts[j]) {
                            partList.push(parts[j]);
                        }
                    }
                    if (partList.length === 1) {
                        for (j = 0; j < partList.length; j++) {
                            part = partList[j];
                            if (part.local) {
                                for (itemKey in itemKeys) {
                                    var userKey = itemKeys[itemKey];
                                    localStats[userKey] = part.local.stat(itemKey);
                                }
                            }
                        }
                    }
                    else if (partList.length > 1) {
                        for (itemKey in itemKeys) {
                            localStats[itemKeys[itemKey]] = [];
                        }
                        for (j = 0; j < partList.length; j++) {
                            part = partList[j];
                            if (part.local) {
                                for (itemKey in itemKeys) {
                                    var userKey = itemKeys[itemKey];
                                    localStats[userKey].push(part.local.stat(itemKey));
                                }
                            }
                        }
                    }
                }
            }
            callback(peerId, localStats);
        });
    }
    else {
        callback({"statistics": "not supported by this browser, try Chrome."});
    }
};

easyrtc.standardStatsFilter = [
    {"googTransmitBitrate": "transmitBitRate",
        "googActualEncBitrate": "encodeRate", "googAvailableSendBandwidth": "availableSendRate"},
    {"googCodecName": "audioCodec", "googTypingNoiseState": "typingNoise", "packetsSent": "audioPacketsSent"},
    {"googCodecName": "videoCodec", "googFrameRateSent": "outFrameRate", "packetsSent": "videoPacketsSent"},
    {"packetsLost": "videoPacketsLost", "packetsReceived": "videoPacketsReceived",
        "googFrameRateOutput": "frameRateOut"},
    {"packetsLost": "audioPacketsLost", "packetsReceived": "audioPacketsReceived",
        "audioOutputLevel": "audioOutputLevel"},
    {"googRemoteAddress": "remoteAddress", "googActiveConnection": "activeConnection"},
    {"audioInputLevel": "audioInputLevel"}
];



/** Provide a set of application defined fields that will be part of this instances
 * configuration information. This data will get sent to other peers via the websocket
 * path.
 * @param roomName
 * @param fieldName - the name of the field.
 * @param {Object} fieldValue - the value of the field.
 * @example
 *   easyrtc.setRoomApiFields("trekkieRoom",  "favorite_alien", "Mr Spock");
 *   easyrtc.setRoomOccupantListener( function(roomName, list) {
 *      for( var i in list ){
 *         console.log("easyrtcid=" + i + " favorite alien is " + list[i].apiFields.favorite_alien);
 *      }
 *   });
 */
easyrtc.setRoomApiField = function(roomName, fieldName, fieldValue) {
    //
    // if we're not connected yet, we'll just cache the fields until we are.
    //
    if (!easyrtc._roomApiFields) {
        easyrtc._roomApiFields = {};
    }
    if (!fieldName && !fieldValue) {
        delete easyrtc._roomApiFields[roomName];
        return;
    }

    if (!easyrtc._roomApiFields[roomName]) {
        easyrtc._roomApiFields[roomName] = {};
    }
    if (fieldValue !== undefined && fieldValue !== null) {
        if (typeof fieldValue === "object") {
            try {
                JSON.stringify(fieldValue);
            }
            catch (jsonError) {
                easyrtc.showError(easyrtc.errCodes.DEVELOPER_ERR, "easyrtc.setRoomApiField passed bad object ");
                return;
            }
        }
        easyrtc._roomApiFields[roomName][fieldName] = {fieldName: fieldName, fieldValue: fieldValue};
    }
    else {
        delete easyrtc._roomApiFields[roomName][fieldName];
    }
    if (easyrtc.webSocketConnected) {
        easyrtc._enqueueSendRoomApi(roomName);
    }
};
/** @private
 * @param {String} roomName
 */
easyrtc._enqueueSendRoomApi = function(roomName) {
//
// Rather than issue the send request immediately, we set a timer so we can accumulate other 
// calls 
//
    if (easyrtc.roomApiFieldTimer) {
        clearTimeout(easyrtc.roomApiFieldTimer);
    }
    easyrtc.roomApiFieldTimer = setTimeout(function() {
        easyrtc._sendRoomApiFields(roomName, easyrtc._roomApiFields[roomName]);
        easyrtc.roomApiFieldTimer = null;
    }, 10);
};

/**
 *  @private 
 *  @param roomName
 * @param fields
 */
easyrtc._sendRoomApiFields = function(roomName, fields) {
    var fieldAsString = JSON.stringify(fields);
    JSON.parse(fieldAsString);
    var dataToShip = {
        msgType: "setRoomApiField",
        msgData: {
            setRoomApiField: {
                roomName: roomName,
                field: fields
            }
        }
    };
    easyrtc.webSocket.json.emit("easyrtcCmd", dataToShip,
            function(ackmsg) {
                if (ackmsg.msgType === "error") {
                    easyrtc.showError(ackmsg.msgData.errorCode, ackmsg.msgData.errorText);
                }
            }
    );
};
/** Default error reporting function. The default implementation displays error messages
 *  in a programmatically created div with the id easyrtcErrorDialog. The div has title
 *  component with a class name of easyrtcErrorDialog_title. The error messages get added to a
 *  container with the id easyrtcErrorDialog_body. Each error message is a text node inside a div
 *  with a class of easyrtcErrorDialog_element. There is an "okay" button with the className of easyrtcErrorDialog_okayButton.
 *  @param {String} messageCode An error message code
 *  @param {String} message the error message text without any markup.
 *  @example
 *      easyrtc.showError("BAD_NAME", "Invalid username");
 */
easyrtc.showError = function(messageCode, message) {
    easyrtc.onError({errorCode: messageCode, errorText: message});
};
/** @private
 * @param errorObject
 */
easyrtc.onError = function(errorObject) {
    if (easyrtc.debugPrinter) {
        easyrtc.debugPrinter("saw error " + errorObject.errorText);
    }
    var errorDiv = document.getElementById('easyrtcErrorDialog');
    var errorBody;
    if (!errorDiv) {
        errorDiv = document.createElement("div");
        errorDiv.id = 'easyrtcErrorDialog';
        var title = document.createElement("div");
        title.innerHTML = "Error messages";
        title.className = "easyrtcErrorDialog_title";
        errorDiv.appendChild(title);
        errorBody = document.createElement("div");
        errorBody.id = "easyrtcErrorDialog_body";
        errorDiv.appendChild(errorBody);
        var clearButton = document.createElement("button");
        clearButton.appendChild(document.createTextNode("Okay"));
        clearButton.className = "easyrtcErrorDialog_okayButton";
        clearButton.onclick = function() {
            errorBody.innerHTML = ""; // remove all inner nodes
            errorDiv.style.display = "none";
        };
        errorDiv.appendChild(clearButton);
        document.body.appendChild(errorDiv);
    }
    ;
    errorBody = document.getElementById("easyrtcErrorDialog_body");
    var messageNode = document.createElement("div");
    messageNode.className = 'easyrtcErrorDialog_element';
    messageNode.appendChild(document.createTextNode(errorObject.errorText));
    errorBody.appendChild(messageNode);
    errorDiv.style.display = "block";
};
//
// add the style sheet to the head of the document. That way, developers
// can overide it.
//
(function() {
    //
    // check to see if we already have an easyrtc.css file loaded
    // if we do, we can exit immediately.
    //
    var links = document.getElementsByTagName("link");
    for (var cssindex in links) {
        var css = links[cssindex];
        if (css.href && (css.href.match("\/easyrtc.css") || css.href.match("\/easyrtc.css\?"))) {
            return;
        }
    }
    //
    // add the easyrtc.css file since it isn't present
    //
    var easySheet = document.createElement("link");
    easySheet.setAttribute("rel", "stylesheet");
    easySheet.setAttribute("type", "text/css");
    easySheet.setAttribute("href", "/easyrtc/easyrtc.css");
    var headSection = document.getElementsByTagName("head")[0];
    var firstHead = headSection.childNodes[0];
    headSection.insertBefore(easySheet, firstHead);
})();
/** @private */
easyrtc.videoBandwidthString = "b=AS:50"; // default video band width is 50kbps

//
// easyrtc.createObjectURL builds a URL from a media stream.
// Arguments:
//     mediaStream - a media stream object.
// The video object in Chrome expects a URL.
//
/** @private
 * @param mediaStream */
easyrtc.createObjectURL = function(mediaStream) {
    if (window.URL && window.URL.createObjectURL) {
        return window.URL.createObjectURL(mediaStream);
    }
    else if (window.webkitURL && window.webkitURL.createObjectURL) {
        return window.webkit.createObjectURL(mediaStream);
    }
    else {
        var errMessage = "Your browsers does not support URL.createObjectURL.";
        if (easyrtc.debugPrinter) {
            easyrtc.debugPrinter("saw exception " + errMessage);
        }
        throw errMessage;
    }
};
/**
 * A convenience function to ensure that a string doesn't have symbols that will be interpreted by HTML.
 * @param {String} idString
 * @return {String} The cleaned string.
 * @example
 *     console.log( easyrtc.cleanId('&hello'));
 */
easyrtc.cleanId = function(idString) {
    var MAP = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;'
    };
    return idString.replace(/[&<>]/g, function(c) {
        return MAP[c];
    });
};
/** Set a callback that will be invoked when the application enters or leaves a room.
 *
 * @param {Function} handler - the first parameter is true for entering a room, false for leaving a room. The second parameter is the room name.
 * @example
 *   easyrtc.setRoomEntryListener(function(entry, roomName) {
 *       if( entry ){
 *           console.log("entering room " + roomName);
 *       }
 *       else {
 *           console.log("leaving room " + roomName);
 *       }
 *   });
 */
easyrtc.setRoomEntryListener = function(handler) {
    easyrtc.roomEntryListener = handler;
};
/** Set the callback that will be invoked when the list of people logged in changes.
 * The callback expects to receive a room name argument, and 
 *  a map whose ideas are easyrtcids and whose values are in turn maps
 * supplying user specific information. The inner maps have the following keys:
 *  username, applicationName, browserFamily, browserMajor, osFamily, osMajor, deviceFamily.
 *  The third argument is the listener is the innerMap for the connections own data (not needed by most applications).
 * @param {Function} listener
 * @example
 *   easyrtc.setRoomOccupantListener( function(roomName, list, selfInfo) {
 *      for( var i in list ){
 *         ("easyrtcid=" + i + " belongs to user " + list[i].username);
 *      }
 *   });
 */
easyrtc.setRoomOccupantListener = function(listener) {
    easyrtc.roomOccupantListener = listener;
};
/**
 * Sets a callback that is called when a data channel is open and ready to send data.
 * The callback will be called with an easyrtcid as it's sole argument.
 * @param {Function} listener
 * @example
 *    easyrtc.setDataChannelOpenListener( function(easyrtcid) {
 *         easyrtc.sendDataP2P(easyrtcid, "greeting", "hello");
 *    });
 */
easyrtc.setDataChannelOpenListener = function(listener) {
    easyrtc.onDataChannelOpen = listener;
};
/** Sets a callback that is called when a previously open data channel closes.
 * The callback will be called with an easyrtcid as it's sole argument.
 * @param {Function} listener
 * @example
 *    easyrtc.setDataChannelCloseListener( function(easyrtcid) {
 *            ("No longer connected to " + easyrtc.idToName(easyrtcid));
 *    });
 */
easyrtc.setDataChannelCloseListener = function(listener) {
    easyrtc.onDataChannelClose = listener;
};
/** Returns the number of live peer connections the client has.
 * @return {Number}
 * @example
 *    ("You have " + easyrtc.getConnectionCount() + " peer connections");
 */
easyrtc.getConnectionCount = function() {
    var count = 0;
    for (var i in easyrtc.peerConns) {
        if (easyrtc.peerConns[i].startedAV) {
            count++;
        }
    }
    return count;
};
/** Sets whether audio is transmitted by the local user in any subsequent calls.
 * @param {Boolean} enabled true to include audio, false to exclude audio. The default is true.
 * @example
 *      easyrtc.enableAudio(false);
 */
easyrtc.enableAudio = function(enabled) {
    easyrtc.audioEnabled = enabled;
};
/**
 *Sets whether video is transmitted by the local user in any subsequent calls.
 * @param {Boolean} enabled - true to include video, false to exclude video. The default is true.
 * @example
 *      easyrtc.enableVideo(false);
 */
easyrtc.enableVideo = function(enabled) {
    easyrtc.videoEnabled = enabled;
};
/**
 * Sets whether WebRTC data channels are used to send inter-client messages.
 * This is only the messages that applications explicitly send to other applications, not the WebRTC signaling messages.
 * @param {Boolean} enabled  true to use data channels, false otherwise. The default is false.
 * @example
 *     easyrtc.enableDataChannels(true);
 */
easyrtc.enableDataChannels = function(enabled) {
    easyrtc.dataEnabled = enabled;
};
/**
 * @private
 * @param {Boolean} enable
 * @param {Array[MediaStreamTrack]} tracks
 */
easyrtc.enableMediaTracks = function(enable, tracks) {
    if (tracks) {
        for (var i = 0; i < tracks.length; i++) {
            var track = tracks[i];
            track.enabled = enable;
        }
    }
};
/**
 * This function is used to enable and disable the local camera. If you disable the
 * camera, video objects display it will "freeze" until the camera is re-enabled. * 
 * By default, a camera is enabled.
 * @param {Boolean} enable - true to enable the camera, false to disable it.
 */
easyrtc.enableCamera = function(enable) {
    if (easyrtc.localStream && easyrtc.localStream.getVideoTracks) {
        enableMediaTracks(enable, easyrtc.localStream.getVideoTracks());
    }
};
/**
 * This function is used to enable and disable the local microphone. If you disable
 * the microphone, sounds stops being transmitted to your peers. By default, the microphone
 * is enabled.
 * @param {Boolean} enable - true to enable the microphone, false to disable it.
 */
easyrtc.enableMicrophone = function(enable) {
    if (easyrtc.localStream && easyrtc.localStream.getAudioTracks) {
        enableMediaTracks(enable, easyrtc.localStream.getAudioTracks());
    }
};
/** 
 * Mute a video object.
 * @param {String} videoObjectName - A DOMObject or the id of the DOMObject.
 * @param {Boolean} mute - true to mute the video object, false to unmute it.
 */
easyrtc.muteVideoObject = function(videoObjectName, mute) {
    var videoObject;
    if (typeof (videoObjectName) === 'string') {
        videoObject = document.getElementById(videoObjectName);
        if (!videoObject) {
            throw "Unknown video object " + videoObjectName;
        }
    }
    else if (!videoObjectName) {
        throw "muteVideoObject passed a null";
    }
    else {
        videoObject = videoObjectName;
    }
    videoObject.muted = !!mute;
};
/**
 * Returns a URL for your local camera and microphone.
 *  It can be called only after easyrtc.initMediaSource has succeeded.
 *  It returns a url that can be used as a source by the Chrome video element or the &lt;canvas&gt; element.
 *  @return {URL}
 *  @example
 *      document.getElementById("myVideo").src = easyrtc.getLocalStreamAsUrl();
 */
easyrtc.getLocalStreamAsUrl = function() {
    if (easyrtc.localStream === null) {
        throw "Developer error: attempt to get a mediastream without invoking easyrtc.initMediaSource successfully";
    }
    return easyrtc.createObjectURL(easyrtc.localStream);
};
/**
 * Returns a media stream for your local camera and microphone.
 *  It can be called only after easyrtc.initMediaSource has succeeded.
 *  It returns a stream that can be used as an argument to easyrtc.setVideoObjectSrc.
 * @return {MediaStream}
 * @example
 *    easyrtc.setVideoObjectSrc( document.getElementById("myVideo"), easyrtc.getLocalStream());
 */
easyrtc.getLocalStream = function() {
    return easyrtc.localStream;
};
/** Clears the media stream on a video object.
 *
 * @param {DomElement} element the video object.
 * @example
 *    easyrtc.clearMediaStream( document.getElementById('selfVideo'));
 *
 */
easyrtc.clearMediaStream = function(element) {
    if (typeof element.srcObject !== 'undefined') {
        element.srcObject = null;
    } else if (typeof element.mozSrcObject !== 'undefined') {
        element.mozSrcObject = null;
    } else if (typeof element.src !== 'undefined') {
        element.src = null;
    } else {
    }
};
/**
 *  Sets a video or audio object from a media stream.
 *  Chrome uses the src attribute and expects a URL, while firefox
 *  uses the mozSrcObject and expects a stream. This procedure hides
 *  that from you.
 *  If the media stream is from a local webcam, you may want to add the
 *  easyrtcMirror class to the video object so it looks like a proper mirror.
 *  The easyrtcMirror class is defined in easyrtc.css, which is automatically added
 *  when you add the easyrtc.js file to an HTML file.
 *  @param {DOMObject} videoObject an HTML5 video object
 *  @param {MediaStream} stream a media stream as returned by easyrtc.getLocalStream or your stream acceptor.
 * @example
 *    easyrtc.setVideoObjectSrc( document.getElementById("myVideo"), easyrtc.getLocalStream());
 *
 */
easyrtc.setVideoObjectSrc = function(videoObject, stream) {
    if (stream && stream !== "") {
        videoObject.autoplay = true;
        attachMediaStream(videoObject, stream);
        videoObject.play();
    }
    else {
        easyrtc.clearMediaStream(videoObject);
    }
};
/** @private
 * @param {String} x */
easyrtc.formatError = function(x) {
    if (x === null || typeof x === 'undefined') {
        message = "null";
    }
    if (typeof x === 'string') {
        return x;
    }
    else if (x.type && x.description) {
        return x.type + " : " + x.description;
    }
    else if (typeof x === 'object') {
        try {
            return JSON.stringify(x);
        }
        catch (oops) {
            var result = "{";
            for (var name in x) {
                if (typeof x[name] === 'string') {
                    result = result + name + "='" + x[name] + "' ";
                }
            }
            result = result + "}";
            return result;
        }
    }
    else {
        return "Strange case";
    }
};
/** Initializes your access to a local camera and microphone.
 *  Failure could be caused a browser that didn't support WebRTC, or by the user
 * not granting permission.
 * If you are going to call easyrtc.enableAudio or easyrtc.enableVideo, you need to do it before
 * calling easyrtc.initMediaSource.
 * @param {Function} successCallback - will be called when the media source is ready.
 * @param {Function} errorCallback - is called with a message string if the attempt to get media failed.
 * @example
 *       easyrtc.initMediaSource(
 *          function (){
 *              easyrtc.setVideoObjectSrc( document.getElementById("mirrorVideo"), easyrtc.getLocalStream());
 *          },
 *          function (){
 *               easyrtc.showError("no-media", "Unable to get local media");
 *          });
 *
 */
easyrtc.initMediaSource = function(successCallback, errorCallback) {

    if (easyrtc.debugPrinter) {
        easyrtc.debugPrinter("about to request local media");
    }

    if (!window.getUserMedia) {
        errorCallback("Your browser doesn't appear to support WebRTC.");
    }

    if (errorCallback === null) {
        errorCallback = function(errorCode, errorText) {
            var message = "easyrtc.initMediaSource: " + easyrtc.formatError(errorText);
            if (easyrtc.debugPrinter) {
                easyrtc.debugPrinter(message);
            }
            easyrtc.showError(easyrtc.errCodes.MEDIA_ERR, message);
        };
    }

    if (!successCallback) {
        console.error("easyrtc.initMediaSource not supplied a successCallback");
        return;
    }


    var mode = {'audio': (easyrtc.audioEnabled ? true : false),
        'video': ((easyrtc.videoEnabled) ? (easyrtc.videoFeatures) : false)};

    if (easyrtc.videoEnabled && easyrtc.videoFeatures && easyrtc.videoFeatures.mandatory &&
            easyrtc.videoFeatures.mandatory.chromeMediaSource === "screen") {
        if (mode.audio) {
            mode.audio = false;
            easyrtc.showError(easyrtc.errCodes.DEVELOPER_ERR,
                    "You can't have audio with a screen share. Masking your audio.");
        }
    }
    /** @private
     * @param {Stream} stream
     *  */
    var onUserMediaSuccess = function(stream) {
        if (easyrtc.debugPrinter) {
            easyrtc.debugPrinter("getUserMedia success callback entered");
        }


        if (easyrtc.debugPrinter) {
            easyrtc.debugPrinter("successfully got local media");
        }
        easyrtc.localStream = stream;
        if (easyrtc.haveAudioVideo.video) {
            var videoObj = document.createElement('video');
            videoObj.muted = true;
            var triesLeft = 30;
            var tryToGetSize = function() {
                if (videoObj.videoWidth > 0 || triesLeft < 0) {
                    easyrtc.nativeVideoWidth = videoObj.videoWidth;
                    easyrtc.nativeVideoHeight = videoObj.videoHeight;
                    if (easyrtc.videoFeatures.mandatory &&
                            easyrtc.videoFeatures.mandatory.minHeight &&
                            (easyrtc.nativeVideoHeight !== easyrtc.videoFeatures.mandatory.minHeight ||
                                    easyrtc.nativeVideoWidth !== easyrtc.videoFeatures.mandatory.minWidth)) {
                        easyrtc.showError(easyrtc.errCodes.MEDIA_WARNING,
                                "requested video size of " + easyrtc.videoFeatures.mandatory.minWidth + "x" + easyrtc.videoFeatures.mandatory.minHeight +
                                " but got size of " + easyrtc.nativeVideoWidth + "x" + easyrtc.nativeVideoHeight);
                    }
                    easyrtc.setVideoObjectSrc(videoObj, "");
                    if (videoObj.removeNode) {
                        videoObj.removeNode(true);
                    }
                    else {
                        var ele = document.createElement('div');
                        ele.appendChild(videoObj);
                        ele.removeChild(videoObj);
                    }

                    easyrtc.updateConfigurationInfo();
                    if (successCallback) {
                        successCallback();
                    }
                }
                else {
                    triesLeft -= 1;
                    setTimeout(tryToGetSize, 100);
                }
            };
            easyrtc.setVideoObjectSrc(videoObj, stream);
            tryToGetSize();
        }
        else {
            easyrtc.updateConfigurationInfo();
            if (successCallback) {
                successCallback();
            }
        }
    };
    /** @private
     * @param {String} error
     */
    var onUserMediaError = function(error) {
        console.log("getusermedia failed");
        if (easyrtc.debugPrinter) {
            easyrtc.debugPrinter("failed to get local media");
        }
        if (errorCallback) {
            errorCallback(easyrtc.errCodes.MEDIA_ERR, "Failed to get access to local media. Error code was " + error.code + ".");
        }
        easyrtc.localStream = null;
        easyrtc.haveAudioVideo = {
            audio: false,
            video: false
        };
        easyrtc.updateConfigurationInfo();
    };
    if (!easyrtc.audioEnabled && !easyrtc.videoEnabled) {
        onUserMediaError("At least one of audio and video must be provided");
        return;
    }

    /** @private */
    easyrtc.haveAudioVideo = {
        audio: easyrtc.audioEnabled,
        video: easyrtc.videoEnabled
    };
    if (easyrtc.videoEnabled || easyrtc.audioEnabled) {
//
// getUserMedia usually fails the first time I call it. I suspect it's a page loading
// issue. So I'm going to try adding a 1 second delay to allow things to settle down first.
//
        setTimeout(function() {
            try {
                getUserMedia(mode, onUserMediaSuccess, onUserMediaError);
            } catch (e) {
                errorCallback(easyrtc.errCodes.MEDIA_ERR, "getUserMedia failed with exception: " + e.message);
            }
        }, 1000);
    }
    else {
        onUserMediaSuccess(null);
    }
};
/**
 * easyrtc.setAcceptChecker sets the callback used to decide whether to accept or reject an incoming call.
 * @param {Function} acceptCheck takes the arguments (callerEasyrtcid, function ():boolean ){}
 * The acceptCheck callback is passed (as it's second argument) a function that should be called with either
 * a true value (accept the call) or false value( reject the call).
 * @example
 *      easyrtc.setAcceptChecker( function(easyrtcid, acceptor) {
 *           if( easyrtc.idToName(easyrtcid) === 'Fred' ){
 *              acceptor(true);
 *           }
 *           else if( easyrtc.idToName(easyrtcid) === 'Barney' ){
 *              setTimeout( function (){  acceptor(true)}, 10000);
 *           }
 *           else {
 *              acceptor(false);
 *           }
 *      });
 */
easyrtc.setAcceptChecker = function(acceptCheck) {
    easyrtc.acceptCheck = acceptCheck;
};
/**
 * easyrtc.setStreamAcceptor sets a callback to receive media streams from other peers, independent
 * of where the call was initiated (caller or callee).
 * @param {Function} acceptor takes arguments (caller, mediaStream)
 * @example
 *  easyrtc.setStreamAcceptor(function(easyrtcid, stream) {
 *     document.getElementById('callerName').innerHTML = easyrtc.idToName(easyrtcid);
 *     easyrtc.setVideoObjectSrc( document.getElementById("callerVideo"), stream);
 *  });
 */
easyrtc.setStreamAcceptor = function(acceptor) {
    easyrtc.streamAcceptor = acceptor;
};
/** Sets the easyrtc.onError field to a user specified function.
 * @param {Function} errListener takes an object of the form { errorCode: String, errorText: String}
 * @example
 *    easyrtc.setOnError( function(errorObject) {
 *        document.getElementById("errMessageDiv").innerHTML += errorObject.errorText;
 *    });
 */
easyrtc.setOnError = function(errListener) {
    easyrtc.onError = errListener;
};
/**
 * Sets the callCancelled callback. This will be called when a remote user
 * initiates a call to you, but does a "hangup" before you have a chance to get his video stream.
 * @param {Function} callCancelled takes an easyrtcid as an argument and a boolean that indicates whether
 *  the call was explicitly cancelled remotely (true), or actually accepted by the user attempting a call to
 *  the same party.
 * @example
 *     easyrtc.setCallCancelled( function(easyrtcid, explicitlyCancelled) {
 *        if( explicitlyCancelled ){
 *            console..log(easyrtc.idToName(easyrtcid) + " stopped trying to reach you");
 *         }
 *         else {
 *            console.log("Implicitly called "  + easyrtc.idToName(easyrtcid));
 *         }
 *     });
 */
easyrtc.setCallCancelled = function(callCancelled) {
    easyrtc.callCancelled = callCancelled;
};
/**  Sets a callback to receive notification of a media stream closing. The usual
 *  use of this is to clear the source of your video object so you aren't left with
 *  the last frame of the video displayed on it.
 *  @param {Function} onStreamClosed takes an easyrtcid as it's first parameter.
 *  @example
 *     easyrtc.setOnStreamClosed( function(easyrtcid) {
 *         easyrtc.setVideoObjectSrc( document.getElementById("callerVideo"), "");
 *         ( easyrtc.idToName(easyrtcid) + " went away");
 *     });
 */
easyrtc.setOnStreamClosed = function(onStreamClosed) {
    easyrtc.onStreamClosed = onStreamClosed;
};
/**
 * Sets the bandwidth for sending video data.
 * Setting the rate too low will cause connection attempts to fail. 40 is probably good lower limit.
 * The default is 50. A value of zero will remove bandwidth limits.
 * @param {Number} kbitsPerSecond is rate in kilobits per second.
 * @example
 *    easyrtc.setVideoBandwidth( 40);
 */
easyrtc.setVideoBandwidth = function(kbitsPerSecond) {
    if (easyrtc.debugPrinter) {
        easyrtc.debugPrinter("video bandwidth set to " + kbitsPerSecond + " kbps");
    }
    if (kbitsPerSecond > 0) {
        easyrtc.videoBandwidthString = "b=AS:" + kbitsPerSecond;
    }
    else {
        easyrtc.videoBandwidthString = "";
    }
};

/** Determines whether the current browser supports the new data channels.
 * EasyRTC will not open up connections with the old data channels.
 * @returns {boolean}
 */
easyrtc.supportsDataChannels = function() {
    return (webrtcDetectedBrowser === "firefox" || webrtcDetectedVersion >= 31);
};
/**
 * Sets a listener for data sent from another client (either peer to peer or via websockets).
 * If no msgType or source is provided, the listener applies to all events that aren't otherwise handled.
 * If a msgType but no source is provided, the listener applies to all messages of that msgType that aren't otherwise handled.
 * If a msgType and a source is provided, the listener applies to only message of the specified type coming from the specified peer.
 * The most specific case takes priority over the more general.
 * @param {Function} listener has the signature (easyrtcid, msgType, msgData, targeting).
 *   msgType is a string. targeting is null if the message was received using WebRTC data channels, otherwise it
 *   is an object that contains one or more of the following string valued elements {targetEasyrtcid, targetGroup, targetRoom}.
 * @param {String} msgType - a string, optional.
 * @param {String} source - the sender's easyrtcid, optional.
 * @example
 *     easyrtc.setPeerListener( function(easyrtcid, msgType, msgData, targeting) {
 *         ("From " + easyrtc.idToName(easyrtcid) +
 *             " sent the following data " + JSON.stringify(msgData));
 *     });
 *     easyrtc.setPeerListener( function(easyrtcid, msgType, msgData, targeting) {
 *         ("From " + easyrtc.idToName(easyrtcid) +
 *             " sent the following data " + JSON.stringify(msgData));
 *     }, 'food', 'dkdjdekj44--');
 *     easyrtc.setPeerListener( function(easyrtcid, msgType, msgData, targeting) {
 *         ("From " + easyrtcid +
 *             " sent the following data " + JSON.stringify(msgData));
 *     }, 'drink');
 *
 *
 */
easyrtc.setPeerListener = function(listener, msgType, source) {
    if (!msgType) {
        easyrtc.receivePeer.cb = listener;
    }
    else {
        if (!easyrtc.receivePeer.msgTypes[msgType]) {
            easyrtc.receivePeer.msgTypes[msgType] = {sources: {}};
        }
        if (!source) {
            easyrtc.receivePeer.msgTypes[msgType].cb = listener;
        }
        else {
            easyrtc.receivePeer.msgTypes[msgType].sources[source] = {cb: listener};
        }
    }
};
/* This function serves to distribute peer messages to the various peer listeners */
/** @private
 * @param {String} easyrtcid
 * @param {Object} msg - needs to contain a msgType and a msgData field.
 * @param {Object} targeting
 */
easyrtc.receivePeerDistribute = function(easyrtcid, msg, targeting) {
    var msgType = msg.msgType;
    var msgData = msg.msgData;
    if (!msgType) {
        console.log("received peer message without msgType", msg);
        return;
    }

    if (easyrtc.receivePeer.msgTypes[msgType]) {
        if (easyrtc.receivePeer.msgTypes[msgType].sources[easyrtcid] &&
                easyrtc.receivePeer.msgTypes[msgType].sources[easyrtcid].cb) {
            easyrtc.receivePeer.msgTypes[msgType].sources[easyrtcid].cb(easyrtcid, msgType, msgData, targeting);
            return;
        }
        if (easyrtc.receivePeer.msgTypes[msgType].cb) {
            easyrtc.receivePeer.msgTypes[msgType].cb(easyrtcid, msgType, msgData, targeting);
            return;
        }
    }
    if (easyrtc.receivePeer.cb) {
        easyrtc.receivePeer.cb(easyrtcid, msgType, msgData, targeting);
    }
};
/**
 * Sets a listener for messages from the server.
 * @param {Function} listener has the signature (msgType, msgData, targeting)
 * @example
 *     easyrtc.setServerListener( function(msgType, msgData, targeting) {
 *         ("The Server sent the following message " + JSON.stringify(msgData));
 *     });
 */
easyrtc.setServerListener = function(listener) {
    easyrtc.receiveServerCB = listener;
};
/**
 * Sets the url of the Socket server.
 * The node.js server is great as a socket server, but it doesn't have
 * all the hooks you'd like in a general web server, like PHP or Python
 * plug-ins. By setting the serverPath your application can get it's regular
 * pages from a regular webserver, but the EasyRTC library can still reach the
 * socket server.
 * @param {DOMString} socketUrl
 * @example
 *     easyrtc.setSocketUrl(":8080");
 */
easyrtc.setSocketUrl = function(socketUrl) {
    if (easyrtc.debugPrinter) {
        easyrtc.debugPrinter("WebRTC signaling server URL set to " + socketUrl);
    }
    easyrtc.serverPath = socketUrl;
};
/**
 * Sets the user name associated with the connection.
 * @param {String} username must obey standard identifier conventions.
 * @returns {Boolean} true if the call succeeded, false if the username was invalid.
 * @example
 *    if ( !easyrtc.setUsername("JohnSmith") ){
 *        console.error("bad user name);
 *
 */
easyrtc.setUsername = function(username) {

    if (easyrtc.isNameValid(username)) {
        easyrtc.username = username;
        return true;
    }
    else {
        easyrtc.showError(easyrtc.errCodes.BAD_NAME, "Illegal username " + username);
        return false;
    }
};

/**
 * Get an array of easyrtcids that are using a particular username
 * @param {String} username - the username of interest.
 * @param {String} room - an optional room name argument limiting results to a particular room.
 * @returns an array of {easyrtcid:id, roomName: roomName}.
 */
easyrtc.usernameToIds = function(username, room) {
    var results = [];
    for (var roomname in easyrtc.lastLoggedInList) {
        if (room && roomname !== room) {
            continue;
        }
        for (id in easyrtc.lastLoggedInList[roomname]) {
            if (easyrtc.lastLoggedInList[roomname][id].username === username) {
                results.push({easyrtcid: id, roomName: roomname});
            }
        }
    }
    return results;
};

/**
 * Set the authentication credential if needed.
 * @param {Object} credential - a JSONifiable object.
 */
easyrtc.setCredential = function(credential) {
    try {
        JSON.stringify(credential);
        easyrtc.credential = credential;
        return true;
    }
    catch (oops) {
        easyrtc.showError(easyrtc.errCodes.BAD_CREDENTIAL, "easyrtc.setCredential passed a non-JSON-able object");
        throw "easyrtc.setCredential passed a non-JSON-able object";
    }
};
/**
 * Sets the listener for socket disconnection by external (to the API) reasons.
 * @param {Function} disconnectListener takes no arguments and is not called as a result of calling easyrtc.disconnect.
 * @example
 *    easyrtc.setDisconnectListener(function (){
 *        easyrtc.showError("SYSTEM-ERROR", "Lost our connection to the socket server");
 *    });
 */
easyrtc.setDisconnectListener = function(disconnectListener) {
    easyrtc.disconnectListener = disconnectListener;
};
/**
 * Convert an easyrtcid to a user name. This is useful for labeling buttons and messages
 * regarding peers.
 * @param {String} easyrtcid
 * @return {String} the username associated with the easyrtcid, or the easyrtcid if there is
 * no associated username.
 * @example
 *    console.log(easyrtcid + " is actually " + easyrtc.idToName(easyrtcid));
 */
easyrtc.idToName = function(easyrtcid) {
    for (var roomname in easyrtc.lastLoggedInList) {
        if (easyrtc.lastLoggedInList[roomname][easyrtcid]) {
            if (easyrtc.lastLoggedInList[roomname][easyrtcid].username) {
                return easyrtc.lastLoggedInList[roomname][easyrtcid].username;
            }
        }
    }
    return "--" + easyrtcid + "--";
};


/* used in easyrtc.connect */
/** @private */
easyrtc.webSocket = null;
/** @private  */
easyrtc.pc_config = {};
/** @private  */
easyrtc.closedChannel = null;
/** @private
 * @param easyrtcid
 * @param checkAudio
 *  */
easyrtc._haveTracks = function(easyrtcid, checkAudio) {
    var stream;
    if (!easyrtcid) {
        stream = easyrtc.localStream;
    }
    else {
        var peerConnObj = easyrtc.peerConns[easyrtcid];
        if (!peerConnObj) {
            console.error("Programmer error: haveTracks called about a peer you don't have a connection to");
            return false;
        }
        stream = peerConnObj.stream;
    }
    if (!stream) {
        return false;
    }

    var tracks;
    try {
        if (checkAudio) {
            tracks = stream.getAudioTracks();
        }
        else {
            tracks = stream.getVideoTracks();
        }
    } catch (oops) {
        return true;
    }
    if (!tracks)
        return false;
    return tracks.length > 0;
};
/** Determines if a particular peer2peer connection has an audio track.
 * @param easyrtcid - the id of the other caller in the connection. If easyrtcid is not supplied, checks the local media.
 * @return {Boolean} true if there is an audio track or the browser can't tell us.
 */
easyrtc.haveAudioTrack = function(easyrtcid) {
    return easyrtc._haveTracks(easyrtcid, true);
};
/** Determines if a particular peer2peer connection has a video track.
 * @param easyrtcid - the id of the other caller in the connection. If easyrtcid is not supplied, checks the local media.
 * @return {Boolean} true if there is an video track or the browser can't tell us.
 */
easyrtc.haveVideoTrack = function(easyrtcid) {
    return easyrtc._haveTracks(easyrtcid, false);
};

easyrtc.supportsStatistics = function() {
    try {
        var peer = new RTCPeerConnection({iceServers: []}, {});
        return !!peer.getStats;
    }
    catch (err) {
        return false;
    }
};
/**
 * Connects to the EasyRTC signaling server. You must connect before trying to
 * call other users.
 * @param {String} applicationName is a string that identifies the application so that different applications can have different
 *        lists of users.
 * @param {Function} successCallback (easyrtcId, roomOwner) - is called on successful connect. easyrtcId is the
 *   unique name that the client is known to the server by. A client usually only needs it's own easyrtcId for debugging purposes.
 *       roomOwner is true if the user is the owner of a room. It's value is random if the user is in multiple rooms.
 * @param {Function} errorCallback (errorCode, errorText) - is called on unsuccessful connect. if null, an alert is called instead.
 *  The errorCode takes it's value from easyrtc.errCodes.
 * @example
 *   easyrtc.connect("mychat_app",
 *                   function(easyrtcid, roomOwner) {
 *                       if( roomOwner) { console.log("I'm the room owner"); }
 *                       console.log("my id is " + easyrtcid);
 *                   },
 *                   function(errorText) {
 *                       console.log("failed to connect ", erFrText);
 *                   });
 */
easyrtc.connect = function(applicationName, successCallback, errorCallback) {
    easyrtc.pc_config = {};
    easyrtc.closedChannel = null;
    if (easyrtc.webSocket) {
        console.error("Developer error: attempt to connect when already connected to socket server");
        return;
    }


    easyrtc.fields = {
        rooms: {},
        application: {},
        connection: {}
    };
    if (easyrtc.debugPrinter) {
        easyrtc.debugPrinter("attempt to connect to WebRTC signalling server with application name=" + applicationName);
    }
    var mediaConstraints = {
        'mandatory': {
            'OfferToReceiveAudio': true,
            'OfferToReceiveVideo': true
        }

    };
    function isEmptyObj(obj) {
        if (obj === null || obj === undefined) {
            return true;
        }
        for (var key in obj) {
            return false;
        }
        return true;
    }
//
// easyrtc.disconnect performs a clean disconnection of the client from the server.
//
    easyrtc.disconnectBody = function() {
        easyrtc.loggingOut = true;
        easyrtc.disconnecting = true;
        easyrtc.closedChannel = easyrtc.webSocket;
        if (easyrtc.webSocketConnected) {
            easyrtc.webSocket.close();
            easyrtc.webSocketConnected = false;
        }
        easyrtc.hangupAll();
        if (easyrtc.roomOccupantListener) {
            for (var key in easyrtc.lastLoggedInList) {
                easyrtc.roomOccupantListener(key, {}, false);
            }
        }
        easyrtc.emitEvent("roomOccupant", {});
        easyrtc.loggingOut = false;
        easyrtc.disconnecting = false;
        easyrtc.oldConfig = {};
    };
    easyrtc.disconnect = function() {
        if (easyrtc.debugPrinter) {
            easyrtc.debugPrinter("attempt to disconnect from WebRTC signalling server");
        }


        easyrtc.disconnecting = true;
        easyrtc.hangupAll();
        easyrtc.loggingOut = true;
        //
        // The hangupAll may try to send configuration information back to the server.
        // Collecting that information is asynchronous, we don't actually close the
        // connection until it's had a chance to be sent. We allocate 100ms for collecting
        // the info, so 250ms should be sufficient for the disconnecting.
        //
        setTimeout(function() {
            if (easyrtc.webSocket) {
                try {
                    easyrtc.webSocket.disconnect();
                } catch (e) {
// we don't really care if this fails.
                }
                ;
                easyrtc.closedChannel = easyrtc.webSocket;
                easyrtc.webSocket = 0;
            }
            easyrtc.loggingOut = false;
            easyrtc.disconnecting = false;
            if (easyrtc.roomOccupantListener) {
                easyrtc.roomOccupantListener(null, {}, false);
            }
            easyrtc.emitEvent("roomOccupant", {});
            easyrtc.oldConfig = {};
        }, 250);
    };
    if (errorCallback === null) {
        errorCallback = function(errorCode, errorText) {
            console.error("easyrtc.connect: " + errorText);
        };
    }

//
// This function is used to send WebRTC signaling messages to another client. These messages all the form:
//   destUser: someid or null
//   msgType: one of ["offer"/"answer"/"candidate","reject","hangup", "getRoomList"]
//   msgData: either null or an SDP record
//   successCallback: a function with the signature  function(msgType, wholeMsg);
//   errorCallback: a function with signature function(errorCode, errorText)
//
    function sendSignalling(destUser, msgType, msgData, successCallback, errorCallback) {
        if (!easyrtc.webSocket) {
            throw "Attempt to send message without a valid connection to the server.";
        }
        else {
            var dataToShip = {
                msgType: msgType
            };
            if (destUser) {
                dataToShip.targetEasyrtcid = destUser;
            }
            if (msgData) {
                dataToShip.msgData = msgData;
            }
            ;
            if (easyrtc.debugPrinter) {
                easyrtc.debugPrinter("sending socket message " + JSON.stringify(dataToShip));
            }
            easyrtc.webSocket.json.emit("easyrtcCmd", dataToShip,
                    function(ackmsg) {
                        if (ackmsg.msgType !== "error") {
                            if (successCallback) {
                                successCallback(ackmsg.msgType, ackmsg.msgData);
                            }
                        }
                        else {
                            if (errorCallback) {
                                errorCallback(ackmsg.msgData.errorCode, ackmsg.msgData.errorText);
                            }
                            else {
                                easyrtc.showError(ackmsg.msgData.errorCode, ackmsg.msgData.errorText);
                            }
                        }
                    }
            );
        }
    }

    easyrtc.sendSignalling = sendSignalling;
    var totalLengthSent = 0;
    
     /**
     *Sends data to another user using previously established data channel. This method will
     * fail if no data channel has been established yet. Unlike the easyrtc.sendWS method,
     * you can't send a dictionary, convert dictionaries to strings using JSON.stringify first.
     * What datatypes you can send, and how large a datatype depends on your browser.
     * @param {String} destUser (an easyrtcid)
     * @param {String} msgType - the type of message being sent (application specific).
     * @param {Object} msgData - an object which can be JSON'ed.
     * @example
     *     easyrtc.sendDataP2P(someEasyrtcid, "roomdata", {room:499, bldgNum:'asd'});
     */
    easyrtc.sendDataP2P = function(destUser, msgType, msgData) {

        var flattenedData = JSON.stringify({msgType: msgType, msgData: msgData});
        if (easyrtc.debugPrinter) {
            easyrtc.debugPrinter("sending p2p message to " + destUser + " with data=" + JSON.stringify(flattenedData));
        }

        if (!easyrtc.peerConns[destUser]) {
            easyrtc.showError(easyrtc.errCodes.DEVELOPER_ERR, "Attempt to send data peer to peer without a connection to " + destUser + ' first.');
        }
        else if (!easyrtc.peerConns[destUser].dataChannelS) {
            easyrtc.showError(easyrtc.errCodes.DEVELOPER_ERR, "Attempt to send data peer to peer without establishing a data channel to " + destUser + ' first.');
        }
        else if (!easyrtc.peerConns[destUser].dataChannelReady) {
            easyrtc.showError(easyrtc.errCodes.DEVELOPER_ERR, "Attempt to use data channel to " + destUser + " before it's ready to send.");
        }
        else {
            try {
                easyrtc.peerConns[destUser].dataChannelS.send(flattenedData);
            } catch (oops) {
                console.log("error=", oops);
                throw oops;
            }
            totalLengthSent += flattenedData.length;
        }
    };
    /** Sends data to another user using websockets. The easyrtc.sendServerMessage or easyrtc.sendPeerMessage methods
     * are wrappers for this method; application code should use them instead.
     * @param {String} destination - either a string containing the easyrtcId of the other user, or an object containing some subset of the following fields: targetEasyrtcid, targetGroup, targetRoom.
     * Specifying multiple fields restricts the scope of the destination (operates as a logical AND, not a logical OR).
     * @param {String} msgType -the type of message being sent (application specific).
     * @param {Object} msgData - an object which can be JSON'ed.
     * @param {Function} ackhandler - by default, the ackhandler handles acknowledgments from the server that your message was delivered to it's destination.
     * However, application logic in the server can over-ride this. If you leave this null, a stub ackHandler will be used. The ackHandler
     * gets passed a message with the same msgType as your outgoing message, or a message type of "error" in which case
     * msgData will contain a errorCode and errorText fields.
     * @example
     *    easyrtc.sendDataWS(someEasyrtcid, "setPostalAddress", {room:499, bldgNum:'asd'},
     *      function(ackmessage){
     *          console.log("saw the following acknowledgment " + JSON.stringify(ackmessage));
     *      }
     *    );
     */
    easyrtc.sendDataWS = function(destination, msgType, msgData, ackhandler) {
        if (easyrtc.debugPrinter) {
            easyrtc.debugPrinter("sending client message via websockets to " + destination + " with data=" + JSON.stringify(msgData));
        }
        if (!ackhandler) {
            ackhandler = function(msg) {
                if (msg.msgType === "error") {
                    easyrtc.showError(msg.msgData.errorCode, msg.msgData.errorText);
                }
            };
        }

        var outgoingMessage = {
            msgType: msgType,
            msgData: msgData
        };
        if (destination) {
            if (typeof destination === 'string') {
                outgoingMessage.targetEasyrtcid = destination;
            }
            else if (typeof destination === 'object') {
                if (destination.targetEasyrtcid) {
                    outgoingMessage.targetEasyrtcid = destination.targetEasyrtcid;
                }
                if (destination.targetRoom) {
                    outgoingMessage.targetRoom = destination.targetRoom;
                }
                if (destination.targetGroup) {
                    outgoingMessage.targetGroup = destination.targetGroup;
                }
            }
        }



        if (easyrtc.webSocket) {
            easyrtc.webSocket.json.emit("easyrtcMsg", outgoingMessage, ackhandler);
        }
        else {
            if (easyrtc.debugPrinter) {
                easyrtc.debugPrinter("websocket failed because no connection to server");
            }
            throw "Attempt to send message without a valid connection to the server.";
        }
    };
    /** Sends data to another user. This method uses datachannels if one has been set up, or websockets otherwise.
     * @param {String} destUser - a string containing the easyrtcId of the other user.
     * Specifying multiple fields restricts the scope of the destination (operates as a logical AND, not a logical OR).
     * @param {String} msgType -the type of message being sent (application specific).
     * @param {Object} msgData - an object which can be JSON'ed.
     * @param {Function} ackHandler - a function which receives acknowledgments. May only be invoked in
     *  the websocket case.
     * @example
     *    easyrtc.sendData(someEasyrtcid, "roomData",  {room:499, bldgNum:'asd'},
     *       function ackHandler(msgType, msgData);
     *    );
     */
    easyrtc.sendData = function(destUser, msgType, msgData, ackHandler) {
        if (easyrtc.peerConns[destUser] && easyrtc.peerConns[destUser].dataChannelReady) {
            easyrtc.sendDataP2P(destUser, msgType, msgData);
        }
        else {
            easyrtc.sendDataWS(destUser, msgType, msgData, ackHandler);
        }
    };
    /**
     * Sends a message to another peer on the easyrtcMsg channel.
     * @param {String} destination - either a string containing the easyrtcId of the other user, or an object containing some subset of the following fields: targetEasyrtcid, targetGroup, targetRoom.
     * Specifying multiple fields restricts the scope of the destination (operates as a logical AND, not a logical OR).
     * @param {String} msgType - the type of message being sent (application specific).
     * @param {Object} msgData - a JSONable object with the message contents.
     * @param {Function(msgType, msgData)} successCB - a callback function with results from the server.
     * @param {Function(errorCode, errorText)} failureCB - a callback function to handle errors.
     * @example 
     *     easyrtc.sendPeerMessage(otherUser, 'offer_candy', {candy_name:'mars'}, 
     *             function(msgType, msgBody ) {
     *                console.log("message was sent");
     *             },
     *             function(errorCode, errorText) {
     *                console.log("error was " + errorText);
     *             });
     */
    easyrtc.sendPeerMessage = function(destination, msgType, msgData, successCB, failureCB) {
        if (!destination) {
            console.error("Developer error, destination was null in sendPeerMessage");
        }

        if (easyrtc.debugPrinter) {
            easyrtc.debugPrinter("sending peer message " + JSON.stringify(msgData));
        }
        function ackhandler(response) {
            if (response.msgType === "error") {
                if (failureCB) {
                    failureCB(response.msgData.errorCode, response.msgData.errorText);
                }
            }
            else {
                if (successCB) {
                    successCB(response.msgType, response.msgData);
                }
            }
        }
        easyrtc.sendDataWS(destination, msgType, msgData, ackhandler);
    };
    /**
     * Sends a message to the application code in the server (ie, on the easyrtcMsg channel).
     * @param {String} msgType - the type of message being sent (application specific).
     * @param {Object} msgData - a JSONable object with the message contents.
     * @param {Function(msgType, msgData)} successCB - a callback function with results from the server.
     * @param {Function(errorCode, errorText)} failureCB - a callback function to handle errors.
     * @example 
     *     easyrtc.sendServerMessage('get_candy', {candy_name:'mars'}, 
     *             function(msgType, msgData ) {
     *                console.log("got candy count of " + msgData.barCount);
     *             },
     *             function(errorCode, errorText) {
     *                console.log("error was " + errorText);
     *             });
     */
    easyrtc.sendServerMessage = function(msgType, msgData, successCB, failureCB) {
        if (easyrtc.debugPrinter) {
            easyrtc.debugPrinter("sending server message " + JSON.stringify(dataToShip));
        }
        function ackhandler(response) {
            if (response.msgType === "error") {
                if (failureCB) {
                    failureCB(response.msgData.errorCode, response.msgData.errorText);
                }
            }
            else {
                if (successCB) {
                    successCB(response.msgType, response.msgData);
                }
            }
        }
        easyrtc.sendDataWS(null, msgType, msgData, ackhandler);
    };
    /** Sends the server a request for the list of rooms the user can see.
     * You must have already be connected to use this function.
     * @param {Function} callback - on success, this function is called with a map of the form  { roomname:{"roomName":String, "numberClients": Number}}.
     * The roomname appears as both the key to the map, and as the value of the "roomName" field.
     * @param errorCallback {Function} callback - is called on failure. It gets an errorCode and errorText as it's too arguments.
     * @example
     *    easyrtc.getRoomList(
     *        function(roomList){
     *           for(roomName in roomList) {
     *              console.log("saw room " + roomName);
     *           }
     *         },
     *         function(errorCode, errorText){
     *            easyrtc.showError(errorCode, errorText);
     *         }
     *    );
     */
    easyrtc.getRoomList = function(callback, errorCallback) {
        easyrtc.sendSignalling(null, "getRoomList", null,
                function(msgType, msgData) {
                    callback(msgData.roomList);
                },
                function(errorCode, errorText) {
                    if (errorCallback) {
                        errorCallback(errorCode, errorText);
                    }
                    else {
                        easyrtc.showError(errorCode, errorText);
                    }
                }
        );
    };
    /** Value returned by easyrtc.getConnectStatus if the other user isn't connected to us. */
    easyrtc.NOT_CONNECTED = "not connected";
    /** Value returned by easyrtc.getConnectStatus if the other user is in the process of getting connected */
    easyrtc.BECOMING_CONNECTED = "connection in progress to us.";
    /** Value returned by easyrtc.getConnectStatus if the other user is connected to us. */
    easyrtc.IS_CONNECTED = "is connected";
    /**
     * Check if the client has a peer-2-peer connection to another user.
     * The return values are text strings so you can use them in debugging output.
     *  @param {String} otherUser - the easyrtcid of the other user.
     *  @return {String} one of the following values: easyrtc.NOT_CONNECTED, easyrtc.BECOMING_CONNECTED, easyrtc.IS_CONNECTED
     *  @example
     *     if( easyrtc.getConnectStatus(otherEasyrtcid) == easyrtc.NOT_CONNECTED ){
     *         easyrtc.call(otherEasyrtcid,
     *                  function (){ console.log("success"); },
     *                  function (){ console.log("failure"); });
     *     }
     */
    easyrtc.getConnectStatus = function(otherUser) {
        if (typeof easyrtc.peerConns[otherUser] === 'undefined') {
            return easyrtc.NOT_CONNECTED;
        }
        var peer = easyrtc.peerConns[otherUser];
        if ((peer.sharingAudio || peer.sharingVideo) && !peer.startedAV) {
            return easyrtc.BECOMING_CONNECTED;
        }
        else if (peer.sharingData && !peer.dataChannelReady) {
            return easyrtc.BECOMING_CONNECTED;
        }
        else {
            return easyrtc.IS_CONNECTED;
        }
    };
    /**
     * @private
     */
    easyrtc.buildPeerConstraints = function() {
        var options = [];
        options.push({'DtlsSrtpKeyAgreement': 'true'}); // for interoperability
        return {optional: options};
    };
    /**
     *  Initiates a call to another user. If it succeeds, the streamAcceptor callback will be called.
     * @param {String} otherUser - the easyrtcid of the peer being called.
     * @param {Function} callSuccessCB (otherCaller, mediaType) - is called when the datachannel is established or the mediastream is established. mediaType will have a value of "audiovideo" or "datachannel"
     * @param {Function} callFailureCB (errorCode, errMessage) - is called if there was a system error interfering with the call.
     * @param {Function} wasAcceptedCB (wasAccepted:boolean,otherUser:string) - is called when a call is accepted or rejected by another party. It can be left null.
     * @example
     *    easyrtc.call( otherEasyrtcid,
     *        function(easyrtcid, mediaType) {
     *           console.log("Got mediatype " + mediaType + " from " + easyrtc.idToName(easyrtcid));
     *        },
     *        function(errorCode, errMessage) {
     *           console.log("call to  " + easyrtc.idToName(otherEasyrtcid) + " failed:" + errMessage);
     *        },
     *        function(wasAccepted, easyrtcid) {
     *            if( wasAccepted ){
     *               console.log("call accepted by " + easyrtc.idToName(easyrtcid));
     *            }
     *            else {
     *                console.log("call rejected" + easyrtc.idToName(easyrtcid));
     *            }
     *        });
     */
    easyrtc.call = function(otherUser, callSuccessCB, callFailureCB, wasAcceptedCB) {
        if (easyrtc.debugPrinter) {
            easyrtc.debugPrinter("initiating peer to peer call to " + otherUser +
                    " audio=" + easyrtc.audioEnabled +
                    " video=" + easyrtc.videoEnabled +
                    " data=" + easyrtc.dataEnabled);
        }
        var i;
        //
        // If we are sharing audio/video and we haven't allocated the local media stream yet,
        // we'll do so, recalling ourself on success.
        //
        if (easyrtc.localStream === null && (easyrtc.audioEnabled || easyrtc.videoEnabled)) {
            easyrtc.initMediaSource(function() {
                easyrtc.call(otherUser, callSuccessCB, callFailureCB, wasAcceptedCB);
            }, callFailureCB);
            return;
        }


        if (!easyrtc.webSocket) {
            var message = "Attempt to make a call prior to connecting to service";
            if (easyrtc.debugPrinter) {
                easyrtc.debugPrinter(message);
            }
            throw message;
        }




//
// If B calls A, and then A calls B before accepting, then A should treat the attempt to
// call B as a positive offer to B's offer.
//
        if (easyrtc.offersPending[otherUser]) {
            wasAcceptedCB(true);
            doAnswer(otherUser, easyrtc.offersPending[otherUser]);
            delete easyrtc.offersPending[otherUser];
            easyrtc.callCancelled(otherUser, false);
            return;
        }

// do we already have a pending call?
        if (typeof easyrtc.acceptancePending[otherUser] !== 'undefined') {
            message = "Call already pending acceptance";
            if (easyrtc.debugPrinter) {
                easyrtc.debugPrinter(message);
            }
            callFailureCB(easyrtc.errCodes.ALREADY_CONNECTED, message);
            return;
        }

        easyrtc.acceptancePending[otherUser] = true;
        var pc = buildPeerConnection(otherUser, true, callFailureCB);
        if (!pc) {
            message = "buildPeerConnection failed, call not completed";
            if (easyrtc.debugPrinter) {
                easyrtc.debugPrinter(message);
            }
            return;
        }
        easyrtc.peerConns[otherUser].callSuccessCB = callSuccessCB;
        easyrtc.peerConns[otherUser].callFailureCB = callFailureCB;
        easyrtc.peerConns[otherUser].wasAcceptedCB = wasAcceptedCB;
        var peerConnObj = easyrtc.peerConns[otherUser];
        var setLocalAndSendMessage0 = function(sessionDescription) {
            if (peerConnObj.cancelled) {
                return;
            }
            var sendOffer = function() {

                sendSignalling(otherUser, "offer", sessionDescription, null, callFailureCB);
            };
            pc.setLocalDescription(sessionDescription, sendOffer,
                    function(errorText) {
                        callFailureCB(easyrtc.errCodes.CALL_ERR, errorText);
                    });
        };
        setTimeout(function() {
            pc.createOffer(setLocalAndSendMessage0, function(errorObj) {
                callFailureCB(easyrtc.errCodes.CALL_ERR, JSON.stringify(errObj));
            },
                    mediaConstraints);
        }, 100);
    };
    function limitBandWidth(sd) {
        if (easyrtc.videoBandwidthString !== "") {
            var pieces = sd.sdp.split('\n');
            for (var i = pieces.length - 1; i >= 0; i--) {
                if (pieces[i].indexOf("m=video") === 0) {
                    for (var j = i; j < i + 10 && pieces[j].indexOf("a=") === -1 &&
                            pieces[j].indexOf("k=") === -1; j++) {
                    }
                    pieces.splice(j, 0, (easyrtc.videoBandwidthString + "\r"));
                }
            }
            sd.sdp = pieces.join("\n");
        }
    }



    function hangupBody(otherUser) {
        if (easyrtc.debugPrinter) {
            easyrtc.debugPrinter("Hanging up on " + otherUser);
        }
        clearQueuedMessages(otherUser);
        if (easyrtc.peerConns[otherUser]) {
            if (easyrtc.peerConns[otherUser].startedAV) {
                try {
                    easyrtc.peerConns[otherUser].pc.close();
                } catch (ignoredError) {
                }

                if (easyrtc.onStreamClosed) {
                    easyrtc.onStreamClosed(otherUser);
                }
            }

            easyrtc.peerConns[otherUser].cancelled = true;
            delete easyrtc.peerConns[otherUser];
            if (easyrtc.webSocket) {
                sendSignalling(otherUser, "hangup", null, function() {
                }, function(errorCode, errorText) {
                    if (easyrtc.debugPrinter) {
                        debugPrinter("hangup failed:" + errorText);
                    }
                });
            }
            if (easyrtc.acceptancePending[otherUser]) {
                delete easyrtc.acceptancePending[otherUser];
            }
        }
    }

    /**
     * Hang up on a particular user or all users.
     *  @param {String} otherUser - the easyrtcid of the person to hang up on.
     *  @example
     *     easyrtc.hangup(someEasyrtcid);
     */
    easyrtc.hangup = function(otherUser) {
        hangupBody(otherUser);
        easyrtc.updateConfigurationInfo();
    };
    /**
     * Hangs up on all current connections.
     * @example
     *    easyrtc.hangupAll();
     */
    easyrtc.hangupAll = function() {
        var sawAConnection = false;
        for (otherUser in easyrtc.peerConns) {
            sawAConnection = true;
            hangupBody(otherUser);
            if (easyrtc.webSocket) {
                sendSignalling(otherUser, "hangup", null, function() {
                }, function(errorCode, errorText) {
                    if (easyrtc.debugPrinter) {
                        easyrtc.debugPrinter("hangup failed:" + errorText);
                    }
                });
            }
        }
        if (sawAConnection) {
            easyrtc.updateConfigurationInfo();
        }
    };
    /** Checks to see if data channels work between two peers. 
     * @param {String} otherUser - the other peer.
     * @returns {Boolean} true if data channels work and are ready to be used
     *   between the two peers.
     */
    easyrtc.doesDataChannelWork = function(otherUser) {
        if (!easyrtc.peerConns[otherUser]) {
            return false;
        }
        return !!easyrtc.peerConns[otherUser].dataChannelReady;
    };
    function makeLocalStreamFromRemoteStream() {
        for (var i in easyrtc.peerConns) {
            if (easyrtc.peerConns[i].pc) {
                var remoteStreams = easyrtc.peerConns[i].pc.getRemoteStreams();
                if (remoteStreams.length > 0) {
                    easyrtc.localStream = remoteStreams[0];
                    break;
                }
            }
        }
    }

    var buildPeerConnection = function(otherUser, isInitiator, failureCB) {
        var pc;
        var message;
        if (easyrtc.debugPrinter) {
            easyrtc.debugPrinter("building peer connection to " + otherUser);
        }


//
// we don't support data channels on chrome versions < 31
//


        try {
            pc = easyrtc.createRTCPeerConnection(easyrtc.pc_config, easyrtc.buildPeerConstraints());
            if (!pc) {
                message = "Unable to create PeerConnection object, check your ice configuration(" +
                        JSON.stringify(easyrtc.pc_config) + ")";
                if (easyrtc.debugPrinter) {
                    easyrtc.debugPrinter(message);
                }
                throw(message);
            }

//
// turn off data channel support if the browser doesn't support it.
//
            if (easyrtc.dataEnabled && typeof pc.createDataChannel === 'undefined') {
                easyrtc.dataEnabled = false;
            }


            pc.onconnection = function() {
                if (easyrtc.debugPrinter) {
                    easyrtc.debugPrinter("onconnection called prematurely");
                }
            };
            var newPeerConn = {
                pc: pc,
                candidatesToSend: [],
                startedAV: false,
                isInitiator: isInitiator
            };
            pc.onicecandidate = function(event) {
//                if (easyrtc.debugPrinter) {
//                    easyrtc.debugPrinter("saw ice message:\n" + event.candidate);
//                }
                if (newPeerConn.cancelled) {
                    return;
                }
                if (event.candidate && easyrtc.peerConns[otherUser]) {
                    var candidateData = {
                        type: 'candidate',
                        label: event.candidate.sdpMLineIndex,
                        id: event.candidate.sdpMid,
                        candidate: event.candidate.candidate
                    };
                    if (easyrtc.peerConns[otherUser].startedAV) {

                        sendSignalling(otherUser, "candidate", candidateData, null, function() {
                            failureCB(easyrtc.errCodes.PEER_GONE, "Candidate disappeared");
                        });
                    }
                    else {
                        easyrtc.peerConns[otherUser].candidatesToSend.push(candidateData);
                    }
                }
            };
            pc.onaddstream = function(event) {
                if (easyrtc.debugPrinter) {
                    easyrtc.debugPrinter("saw incoming media stream");
                }
                if (newPeerConn.cancelled)
                    return;
                easyrtc.peerConns[otherUser].startedAV = true;
                easyrtc.peerConns[otherUser].sharingAudio = easyrtc.haveAudioVideo.audio;
                easyrtc.peerConns[otherUser].sharingVideo = easyrtc.haveAudioVideo.video;
                easyrtc.peerConns[otherUser].connectTime = new Date().getTime();
                easyrtc.peerConns[otherUser].stream = event.stream;
                if (easyrtc.peerConns[otherUser].callSuccessCB) {
                    if (easyrtc.peerConns[otherUser].sharingAudio || easyrtc.peerConns[otherUser].sharingVideo) {
                        easyrtc.peerConns[otherUser].callSuccessCB(otherUser, "audiovideo");
                    }
                }
                if (easyrtc.audioEnabled || easyrtc.videoEnabled) {
                    updateConfiguration();
                }
                if (easyrtc.streamAcceptor) {
                    easyrtc.streamAcceptor(otherUser, event.stream);
                }
            };
            pc.onremovestream = function(event) {
                if (easyrtc.debugPrinter) {
                    easyrtc.debugPrinter("saw remove on remote media stream");
                }

                if (easyrtc.peerConns[otherUser]) {
                    easyrtc.peerConns[otherUser].stream = null;
                    if (easyrtc.onStreamClosed) {
                        easyrtc.onStreamClosed(otherUser);
                    }
//                  delete easyrtc.peerConns[otherUser];
                    easyrtc.updateConfigurationInfo();
                }

            };
            easyrtc.peerConns[otherUser] = newPeerConn;
        } catch (e) {
            if (easyrtc.debugPrinter) {
                easyrtc.debugPrinter(JSON.stringify(e));
            }
            failureCB(easyrtc.errCodes.SYSTEM_ERROR, e.message);
            return null;
        }

        if (easyrtc.forwardStreamEnabled) {
            if (!easyrtc.localStream) {
                makeLocalStreamFromRemoteStream();
            }
            if (easyrtc.localStream) {
                pc.addStream(easyrtc.localStream);
            }
        }
        else if (easyrtc.videoEnabled || easyrtc.audioEnabled) {
            if (easyrtc.localStream === null) {
                message = "Application program error: attempt to share audio or video before calling easyrtc.initMediaSource.";
                if (easyrtc.debugPrinter) {
                    easyrtc.debugPrinter(message);
                }
                easyrtc.showError(easyrtc.errCodes.DEVELOPER_ERR, message);
                console.error(message);
            }
            else {
                if (easyrtc.debugPrinter) {
                    easyrtc.debugPrinter("adding local media stream to peer connection");
                }
                pc.addStream(easyrtc.localStream);
            }
        }




        /*
         * This function handles data channel message events.
         */
        function dataChannelMessageHandler(event) {
            if (easyrtc.debugPrinter) {
                easyrtc.debugPrinter("saw dataChannel.onmessage event: " + JSON.stringify(event.data));
            }
            var msg = JSON.parse(event.data);
            if (msg) {
                easyrtc.receivePeerDistribute(otherUser, msg, null);
            }
        }

        function initOutGoingChannel(otherUser) {
            if (easyrtc.debugPrinter) {
                easyrtc.debugPrinter("saw initOutgoingChannel call");
            }
            var dataChannel = pc.createDataChannel(easyrtc.datachannelName, easyrtc.getDatachannelConstraints());
            easyrtc.peerConns[otherUser].dataChannelS = dataChannel;
            if (!easyrtc.isMozilla) {
                easyrtc.peerConns[otherUser].dataChannelR = dataChannel;
            }

            if (!easyrtc.isMozilla) {
                dataChannel.onmessage = dataChannelMessageHandler;
            }


            dataChannel.onopen = function(event) {
                if (easyrtc.debugPrinter) {
                    easyrtc.debugPrinter("saw dataChannel.onopen event");
                }
                if (easyrtc.peerConns[otherUser]) {
                    easyrtc.peerConns[otherUser].dataChannelReady = true;
                    if (easyrtc.peerConns[otherUser].callSuccessCB) {
                        easyrtc.peerConns[otherUser].callSuccessCB(otherUser, "datachannel");
                    }
                    if (easyrtc.onDataChannelOpen) {
                        easyrtc.onDataChannelOpen(otherUser, true);
                    }
                    easyrtc.updateConfigurationInfo();
                }
            };
            dataChannel.onclose = function(event) {
                if (easyrtc.debugPrinter) {
                    easyrtc.debugPrinter("saw dataChannelS.onclose event");
                }
                if (easyrtc.peerConns[otherUser]) {
                    easyrtc.peerConns[otherUser].dataChannelReady = false;
                    delete easyrtc.peerConns[otherUser].dataChannelS;
                }
                if (easyrtc.onDataChannelClose) {
                    easyrtc.onDataChannelClose(otherUser);
                }

                easyrtc.updateConfigurationInfo();
            };
        }

        function initIncomingChannel(otherUser) {
            if (easyrtc.debugPrinter) {
                easyrtc.debugPrinter("initializing incoming channel handler for " + otherUser);
            }
            easyrtc.peerConns[otherUser].pc.ondatachannel = function(event) {

                if (easyrtc.debugPrinter) {
                    easyrtc.debugPrinter("saw incoming data channel");
                }

                var dataChannel = event.channel;
                easyrtc.peerConns[otherUser].dataChannelR = dataChannel;
                if (!easyrtc.isMozilla) {
                    easyrtc.peerConns[otherUser].dataChannelS = dataChannel;
                    easyrtc.peerConns[otherUser].dataChannelReady = true;
                }
                dataChannel.onmessage = dataChannelMessageHandler;
                dataChannel.onclose = function(event) {
                    if (easyrtc.debugPrinter) {
                        easyrtc.debugPrinter("saw dataChannelR.onclose event");
                    }
                    if (easyrtc.peerConns[otherUser]) {
                        easyrtc.peerConns[otherUser].dataChannelReady = false;
                        delete easyrtc.peerConns[otherUser].dataChannelR;
                    }
                    if (easyrtc.onDataChannelClose) {
                        easyrtc.onDataChannelClose(otherUser);
                    }

                    easyrtc.updateConfigurationInfo();
                };
                // the data channel is open implicitly because it was incoming
                if (easyrtc.onDataChannelOpen) {
                    easyrtc.onDataChannelOpen(otherUser, true);
                }

            };
        }


//
//  added for interoperability
//
        if (easyrtc.isMozilla) {
            if (!easyrtc.dataEnabled) {
                mediaConstraints.mandatory.MozDontOfferDataChannel = true;
            }
            else {
                delete mediaConstraints.mandatory.MozDontOfferDataChannel;
            }
        }

        if (easyrtc.dataEnabled) {
            if (isInitiator || easyrtc.isMozilla) {
                try {

                    initOutGoingChannel(otherUser);
                } catch (channelErrorEvent) {
                    console.log("failed to init outgoing channel");
                    failureCB(easyrtc.errCodes.SYSTEM_ERROR,
                            easyrtc.formatError(channelErrorEvent));
                }
            }
            if (!isInitiator || easyrtc.isMozilla) {
                initIncomingChannel(otherUser);
            }
        }


        pc.onconnection = function() {
            if (easyrtc.debugPrinter) {
                easyrtc.debugPrinter("setup pc.onconnection ");
            }
        };
        return pc;
    };
    var doAnswer = function(caller, msgData) {

        if (easyrtc.forwardStreamEnabled) {
            if (!easyrtc.localStream) {
                makeLocalStreamFromRemoteStream();
            }
        }
        else if (!easyrtc.localStream && (easyrtc.videoEnabled || easyrtc.audioEnabled)) {
            easyrtc.initMediaSource(
                    function(s) {
                        doAnswer(caller, msgData);
                    },
                    function(err) {
                        easyrtc.showError(easyrtc.errCodes.MEDIA_ERR, "Error getting local media stream: " + err);
                    });
            return;
        }


        var pc = buildPeerConnection(caller, false, function(message) {
            easyrtc.showError(easyrtc.errCodes.SYSTEM_ERR, message);
        });
        var newPeerConn = easyrtc.peerConns[caller];
        if (!pc) {
            if (easyrtc.debugPrinter) {
                easyrtc.debugPrinter("buildPeerConnection failed. Call not answered");
            }
            return;
        }
        var setLocalAndSendMessage1 = function(sessionDescription) {
            if (newPeerConn.cancelled)
                return;
            var sendAnswer = function() {
                if (easyrtc.debugPrinter) {
                    easyrtc.debugPrinter("sending answer");
                }
                sendSignalling(caller, "answer", sessionDescription,
                        null,
                        function(errorCode, errorText) {
                            delete easyrtc.peerConns[caller];
                            easyrtc.showError(errorCode, errorText);
                        });
                easyrtc.peerConns[caller].startedAV = true;
                if (pc.connectDataConnection) {
                    if (easyrtc.debugPrinter) {
                        easyrtc.debugPrinter("calling connectDataConnection(5002,5001)");
                    }
                    pc.connectDataConnection(5002, 5001);
                }
            };
            pc.setLocalDescription(sessionDescription, sendAnswer, function(message) {
                easyrtc.showError(easyrtc.errCodes.INTERNAL_ERR, "setLocalDescription: " + message);
            });
        };
        var sd = null;
        if (window.mozRTCSessionDescription) {
            sd = new mozRTCSessionDescription(msgData);
        }
        else {
            sd = new RTCSessionDescription(msgData);
        }
        if (easyrtc.debugPrinter) {
            easyrtc.debugPrinter("sdp ||  " + JSON.stringify(sd));
        }
        var invokeCreateAnswer = function() {
            if (newPeerConn.cancelled)
                return;
            pc.createAnswer(setLocalAndSendMessage1,
                    function(message) {
                        easyrtc.showError(easyrtc.errCodes.INTERNAL_ERR, "create-answer: " + message);
                    },
                    mediaConstraints);
        };
        if (easyrtc.debugPrinter) {
            easyrtc.debugPrinter("about to call setRemoteDescription in doAnswer");
        }
        try {

            pc.setRemoteDescription(sd, invokeCreateAnswer, function(message) {
                easyrtc.showError(easyrtc.errCodes.INTERNAL_ERR, "set-remote-description: " + message);
            });
        } catch (srdError) {
            console.log("set remote description failed");
            if (easyrtc.debugPrinter) {
                easyrtc.debugPrinter("saw exception in setRemoteDescription");
            }
            easyrtc.showError(easyrtc.errCodes.INTERNAL_ERR, "setRemoteDescription failed: " + srdError.message);
        }
    };
    var onRemoteHangup = function(caller) {
        delete easyrtc.offersPending[caller];
        if (easyrtc.debugPrinter) {
            easyrtc.debugPrinter("Saw onremote hangup event");
        }
        if (easyrtc.peerConns[caller]) {
            easyrtc.peerConns[caller].cancelled = true;
            if (easyrtc.peerConns[caller].startedAV) {
                if (easyrtc.onStreamClosed) {
                    easyrtc.onStreamClosed(caller);
                }
            }
            else {
                if (easyrtc.callCancelled) {
                    easyrtc.callCancelled(caller, true);
                }
            }
            try {
                easyrtc.peerConns[caller].pc.close();
            } catch (anyErrors) {
            }
            delete easyrtc.peerConns[caller];
            easyrtc.updateConfigurationInfo();
        }
        else {
            if (easyrtc.callCancelled) {
                easyrtc.callCancelled(caller, true);
            }
        }
    };
    var queuedMessages = {};
    var clearQueuedMessages = function(caller) {
        queuedMessages[caller] = {
            candidates: []
        };
    };
    function processConnectedList(connectedList) {
        for (var i in easyrtc.peerConns) {
            if (typeof connectedList[i] === 'undefined') {
                if (easyrtc.peerConns[i].startedAV) {
                    onRemoteHangup(i);
                    clearQueuedMessages(i);
                }
            }
        }
    }
    ;
    function processOccupantList(roomName, list) {
        var myInfo = null;
        easyrtc.reducedList = {};
        for (var id in list) {
            if (id !== easyrtc.myEasyrtcid) {
                easyrtc.reducedList[id] = list[id];
            }
            else {
                myInfo = list[id];
            }
        }
        processConnectedList(easyrtc.reducedList);
        if (easyrtc.roomOccupantListener) {
            easyrtc.roomOccupantListener(roomName, easyrtc.reducedList, myInfo);
        }
    }



    var onChannelMsg = function(msg) {

        var targeting = {};
        if (msg.targetEasyrtcId) {
            targeting.targetEasyrtcId = msg.targetEasyrtcId;
        }
        if (msg.targetRoom) {
            targeting.targetRoom = msg.targetRoom;
        }
        if (msg.targetGroup) {
            targeting.targetGroup = msg.targetGroup;
        }
        if (msg.senderEasyrtcid) {
            easyrtc.receivePeerDistribute(msg.senderEasyrtcid, msg, targeting);
        }
        else {
            if (easyrtc.receiveServerCB) {
                easyrtc.receiveServerCB(msg.msgType, msg.msgData, targeting);
            }
            else {
                console.log("Unhandled server message " + JSON.stringify(msg));
            }
        }
    };
    var onChannelCmd = function(msg, ackAcceptorFn) {
        if (easyrtc.debugPrinter) {
            easyrtc.debugPrinter("received message from socket server=" + JSON.stringify(msg));
        }

        var caller = msg.senderEasyrtcid;
        var msgType = msg.msgType;
        var msgData = msg.msgData;
        var pc;
        if (easyrtc.debugPrinter) {
            easyrtc.debugPrinter('received message of type ' + msgType);
        }

        if (typeof queuedMessages[caller] === "undefined") {
            clearQueuedMessages(caller);
        }



        var processCandidate = function(caller, msgData) {
            var candidate = null;
            if (window.mozRTCIceCandidate) {
                candidate = new mozRTCIceCandidate({
                    sdpMLineIndex: msgData.label,
                    candidate: msgData.candidate
                });
            }
            else {
                candidate = new RTCIceCandidate({
                    sdpMLineIndex: msgData.label,
                    candidate: msgData.candidate
                });
            }
            pc = easyrtc.peerConns[caller].pc;
            pc.addIceCandidate(candidate);
        };
        var flushCachedCandidates = function(caller) {
            if (queuedMessages[caller]) {
                for (var i = 0; i < queuedMessages[caller].candidates.length; i++) {
                    processCandidate(queuedMessages[caller].candidates[i]);
                }
                delete queuedMessages[caller];
            }
        };
        var processOffer = function(caller, msgData) {

            var helper = function(wasAccepted) {
                if (easyrtc.debugPrinter) {
                    easyrtc.debugPrinter("offer accept=" + wasAccepted);
                }
                delete easyrtc.offersPending[caller];
                if (wasAccepted) {
                    doAnswer(caller, msgData);
                    flushCachedCandidates(caller);
                }
                else {
                    sendSignalling(caller, "reject", null, null, null);
                    clearQueuedMessages(caller);
                }
            };
            //
            // There is a very rare case of two callers sending each other offers
            // before receiving the others offer. In such a case, the caller with the
            // greater valued easyrtcid will delete its pending call information and do a
            // simple answer to the other caller's offer.
            //
            if (easyrtc.acceptancePending[caller] && caller < easyrtc.myEasyrtcid) {
                delete easyrtc.acceptancePending[caller];
                if (queuedMessages[caller]) {
                    delete queuedMessages[caller];
                }
                if (easyrtc.peerConns[caller].wasAcceptedCB) {
                    easyrtc.peerConns[caller].wasAcceptedCB(true, caller);
                }
                delete easyrtc.peerConns[caller];
                helper(true);
                return;
            }

            easyrtc.offersPending[caller] = msgData;
            if (!easyrtc.acceptCheck) {
                helper(true);
            }
            else {
                easyrtc.acceptCheck(caller, helper);
            }
        };
        function processReject(caller) {
            delete easyrtc.acceptancePending[caller];
            if (queuedMessages[caller]) {
                delete queuedMessages[caller];
            }
            if (easyrtc.peerConns[caller]) {
                if (easyrtc.peerConns[caller].wasAcceptedCB) {
                    easyrtc.peerConns[caller].wasAcceptedCB(false, caller);
                }
                delete easyrtc.peerConns[caller];
            }
        }

        function processAnswer(caller, msgData) {
            delete easyrtc.acceptancePending[caller];
            if (easyrtc.peerConns[caller].wasAcceptedCB) {
                easyrtc.peerConns[caller].wasAcceptedCB(true, caller);
            }
            easyrtc.peerConns[caller].startedAV = true;
            for (var i = 0; i < easyrtc.peerConns[caller].candidatesToSend.length; i++) {
                sendSignalling(caller, "candidate", easyrtc.peerConns[caller].candidatesToSend[i],
                        null,
                        function(errorCode, errorText) {
                            if (easyrtc.peerConns[caller]) {
                                delete easyrtc.peerConns[caller];
                            }
                            easyrtc.showError(errorCode, errorText);
                        }
                );
            }

            pc = easyrtc.peerConns[caller].pc;
            var sd = null;
            if (window.mozRTCSessionDescription) {
                sd = new mozRTCSessionDescription(msgData);
            }
            else {
                sd = new RTCSessionDescription(msgData);
            }
            if (!sd) {
                throw "Could not create the RTCSessionDescription";
            }

            if (easyrtc.debugPrinter) {
                easyrtc.debugPrinter("about to call initiating setRemoteDescription");
            }
            try {
                pc.setRemoteDescription(sd, function() {
                    if (pc.connectDataConnection) {
                        if (easyrtc.debugPrinter) {
                            easyrtc.debugPrinter("calling connectDataConnection(5001,5002)");
                        }
                        pc.connectDataConnection(5001, 5002); // these are like ids for data channels
                    }
                });
            } catch (smdException) {
                console.log("setRemoteDescription failed ", smdException);
            }
            flushCachedCandidates(caller);
        }

        function processCandidate(caller, msgData) {
            if (easyrtc.peerConns[caller] && easyrtc.peerConns[caller].startedAV) {
                processCandidate(msgData);
            }
            else {
                if (!easyrtc.peerConns[caller]) {
                    queuedMessages[caller] = {
                        candidates: []
                    };
                }
                queuedMessages[caller].candidates.push(msgData);
            }
        }


        switch (msgType) {
            case "sessionData":
                processSessionData(msgData.sessionData);
                break;
            case "roomData":
                processRoomData(msgData.roomData);
                break;
            case "iceConfig":
                processIceConfig(msgData.iceConfig);
                break;
            case "forwardToUrl":
                if (msgData.newWindow) {
                    window.open(msgData.forwardToUrl.url);
                }
                else {
                    window.location.href = msgData.forwardToUrl.url;
                }
                break;
            case "offer":
                processOffer(caller, msgData);
                break;
            case "reject":
                processReject(caller);
                break;
            case "answer":
                processAnswer(caller, msgData);
                break;
            case "candidate":
                processCandidate(caller, msgData);
                break;
            case "hangup":
                onRemoteHangup(caller);
                clearQueuedMessages(caller);
                break;
            case "error":
                easyrtc.showError(msg.errorCode, msg.errorText);
                break;
            default:
                console.error("received unknown message type from server, msgType is " + msgType);
                return;
                break;
        }
        if (ackAcceptorFn) {
            ackAcceptorFn(easyrtc.ackMessage);
        }
    };
    if (!window.io) {
        easyrtc.onError("Your HTML has not included the socket.io.js library");
    }

    function connectToWSServer(successCallback, errorCallback) {

        if (!easyrtc.webSocket) {
            easyrtc.webSocket = io.connect(easyrtc.serverPath, {
                'connect timeout': 10000
            });
            if (!easyrtc.webSocket) {
                throw "io.connect failed";
            }
        }
        else {
            for (var i in easyrtc.websocketListeners) {
                easyrtc.webSocket.removeEventListener(easyrtc.websocketListeners[i].event,
                        easyrtc.websocketListeners[i].handler);
            }
        }
        easyrtc.websocketListeners = [];
        function addSocketListener(event, handler) {
            easyrtc.webSocket.on(event, handler);
            easyrtc.websocketListeners.push({event: event, handler: handler});
        }
        addSocketListener("close", function(event) {
            console.log("the web socket closed");
        });
        addSocketListener('error', function(event) {
            function handleErrorEvent() {
                if (easyrtc.myEasyrtcid) {
                    if (easyrtc.webSocket.socket.connected) {
                        easyrtc.showError(easyrtc.errCodes.SIGNAL_ERROR, "Miscellaneous error from signalling server. It may be ignorable.");
                    }
                    else {
                        /* socket server went down. this will generate a 'disconnect' event as well, so skip this event */
                        console.warn("The connection to the EasyRTC socket server went down. It may come back by itself.");
                    }
                }
                else {
                    errorCallback(easyrtc.errCodes.CONNECT_ERR, "Unable to reach the EasyRTC signalling server.");
                }
            }

            setTimeout(handleErrorEvent, 1);
        });
        addSocketListener("connect", function(event) {

            easyrtc.webSocketConnected = true;
            if (!easyrtc.webSocket || !easyrtc.webSocket.socket || !easyrtc.webSocket.socket.sessionid) {
                easyrtc.showError(easyrtc.errCodes.CONNECT_ERR, "Socket.io connect event fired with bad websocket.");
            }

            if (easyrtc.debugPrinter) {
                easyrtc.debugPrinter("saw socketserver onconnect event");
            }
            if (easyrtc.webSocketConnected) {
// sendAuthenticate();
                sendAuthenticate(successCallback, errorCallback);
            }
            else {
                errorCallback(easyrtc.errCodes.SIGNAL_ERROR, "Internal communications failure.");
            }
        }
        );
        addSocketListener("easyrtcMsg", onChannelMsg);
        addSocketListener("easyrtcCmd", onChannelCmd);
        addSocketListener("disconnect", function(code, reason, wasClean) {
            easyrtc.webSocketConnected = false;
            easyrtc.updateConfigurationInfo = function() {
            }; // dummy update function
            easyrtc.oldConfig = {};
            easyrtc.disconnectBody();
            if (easyrtc.disconnectListener) {
                easyrtc.disconnectListener();
            }
        });
    }
    connectToWSServer(successCallback, errorCallback);


    function DeltaRecord(added, deleted, modified) {
        function objectNotEmpty(obj) {
            for (var i in obj) {
                return true;
            }
            return false;
        }

        var result = {};
        if (objectNotEmpty(added)) {
            result.added = added;
        }

        if (objectNotEmpty(deleted)) {
            result.deleted = deleted;
        }

        if (objectNotEmpty(result)) {
            return result;
        }
        else {
            return null;
        }
    }

    function findDeltas(oldVersion, newVersion) {
        var i;
        var added = {}, deleted = {};
        for (i in newVersion) {
            if (oldVersion === null || typeof oldVersion[i] === 'undefined') {
                added[i] = newVersion[i];
            }
            else if (typeof newVersion[i] === 'object') {
                var subPart = findDeltas(oldVersion[i], newVersion[i]);
                if (subPart !== null) {
                    added[i] = newVersion[i];
                }
            }
            else if (newVersion[i] !== oldVersion[i]) {
                added[i] = newVersion[i];
            }
        }
        for (i in oldVersion) {
            if (typeof newVersion[i] === 'undefined') {
                deleted = oldVersion[i];
            }
        }

        return  new DeltaRecord(added, deleted);
    }

    easyrtc.oldConfig = {}; // used internally by updateConfiguration

//
// this function collects configuration info that will be sent to the server.
// It returns that information, leaving it the responsibility of the caller to
// do the actual sending.
//
    easyrtc.collectConfigurationInfo = function(forAuthentication) {
        var p2pList = {};
        for (var i in easyrtc.peerConns) {
            p2pList[i] = {
                connectTime: easyrtc.peerConns[i].connectTime,
                isInitiator: easyrtc.peerConns[i].isInitiator ? true : false
            };
        }

        var newConfig = {
            userSettings: {
                sharingAudio: easyrtc.haveAudioVideo.audio ? true : false,
                sharingVideo: easyrtc.haveAudioVideo.video ? true : false,
                sharingData: easyrtc.dataEnabled ? true : false,
                nativeVideoWidth: easyrtc.nativeVideoWidth,
                nativeVideoHeight: easyrtc.nativeVideoHeight,
                windowWidth: window.innerWidth,
                windowHeight: window.innerHeight,
                screenWidth: window.screen.width,
                screenHeight: window.screen.height,
                cookieEnabled: navigator.cookieEnabled,
                os: navigator.oscpu,
                language: navigator.language
            }
        };
        if (!isEmptyObj(p2pList)) {
            newConfig.p2pList = p2pList;
        }
        return newConfig;
    };
    function updateConfiguration() {

        var newConfig = easyrtc.collectConfigurationInfo(false);
        //
        // we need to give the getStats calls a chance to fish out the data.
        // The longest I've seen it take is 5 milliseconds so 100 should be overkill.
        //
        var sendDeltas = function() {
            var alteredData = findDeltas(easyrtc.oldConfig, newConfig);
            //
            // send all the configuration information that changes during the session
            //
            if (easyrtc.debugPrinter) {
                easyrtc.debugPrinter("cfg=" + JSON.stringify(alteredData.added));
            }
            if (easyrtc.webSocket) {
                sendSignalling(null, "setUserCfg", {setUserCfg: alteredData.added}, null, null);
            }
            easyrtc.oldConfig = newConfig;
        };
        if (easyrtc.oldConfig === {}) {
            sendDeltas();
        }
        else {
            setTimeout(sendDeltas, 100);
        }
    }
    easyrtc.updateConfigurationInfo = function() {
        updateConfiguration();
    };
    /**
     * Sets the presence state on the server.
     * @param {String} state - one of 'away','chat','dnd','xa'
     * @param {String} statusText - User configurable status string. May be length limited.
     * @example   easyrtc.updatePresence('dnd', 'sleeping');
     */
    easyrtc.updatePresence = function(state, statusText) {
        easyrtc.presenceShow = state;
        easyrtc.presenceStatus = statusText;
        if (easyrtc.webSocketConnected) {
            sendSignalling(null, 'setPresence', {setPresence: {'show': state, 'status': statusText}}, null);
        }
    };
    /**
     * Fetch the collection of session fields as a map. The map has the structure:
     *  { key1: { "fieldName": key1, "fieldValue": value1}, ...,
     *    key2: { "fieldName": key2, "fieldValue": value2}
     *  }
     * @returns {Object}
     */
    easyrtc.getSessionFields = function() {
        return easyrtc.sessionFields;
    };
    /**
     * Fetch the value of a session field by name. 
     * @param {String} name - name of the session field to be fetched.
     * @returns the field value (which can be anything). Returns undefined if the field does not exist.
     */
    easyrtc.getSessionField = function(name) {
        if (easyrtc.sessionFields[name]) {
            return easyrtc.sessionFields[name].fieldValue;
        }
        else {
            return undefined;
        }
    };
    function processSessionData(sessionData) {
        if (sessionData.easyrtcsid) {
            easyrtc.easyrtcsid = sessionData.easyrtcsid;
        }
        if (sessionData.field) {
            easyrtc.sessionFields = sessionData.field;
        }
    }

    function processRoomData(roomData) {
        easyrtc.roomData = roomData;
        for (var roomname in easyrtc.roomData) {
            if (roomData[roomname].roomStatus === "join") {
                if (easyrtc.roomEntryListener) {
                    easyrtc.roomEntryListener(true, roomname);
                }
                if (!(easyrtc.roomJoin[roomname])) {
                    easyrtc.roomJoin[roomname] = roomData[roomname];
                }
            }
            else if (roomData[roomname].roomStatus === "leave") {
                if (easyrtc.roomEntryListener) {
                    easyrtc.roomEntryListener(false, roomname);
                }
                delete easyrtc.roomJoin[roomname];
                continue;
            }

            if (roomData[roomname].clientList) {
                easyrtc.lastLoggedInList[roomname] = roomData[roomname].clientList;
            }
            else if (roomData[roomname].clientListDelta) {
                var stuffToAdd = roomData[roomname].clientListDelta.updateClient;
                if (stuffToAdd) {
                    for (var id in stuffToAdd) {
                        if (!easyrtc.lastLoggedInList[roomname]) {
                            easyrtc.lastLoggedInList[roomname] = [];
                        }
                        easyrtc.lastLoggedInList[roomname][id] = stuffToAdd[id];
                    }
                }
                var stuffToRemove = roomData[roomname].clientListDelta.removeClient;
                if (stuffToRemove) {
                    for (var removeId in stuffToRemove) {
                        delete easyrtc.lastLoggedInList[roomname][removeId];
                    }
                }
            }
            if (easyrtc.roomJoin[roomname] && roomData[roomname].field) {
                easyrtc.fields.rooms[roomname] = roomData[roomname].field;
            }
            processOccupantList(roomname, easyrtc.lastLoggedInList[roomname]);
        }
        easyrtc.emitEvent("roomOccupant", easyrtc.lastLoggedInList);
    }

    easyrtc._processRoomData = processRoomData;

    easyrtc.isTurnServer = function(ipaddress) {
        return !!easyrtc._turnServers[ipaddress];
    };

    function processIceConfig(iceConfig) {
        easyrtc.pc_config = {iceServers: []};
        easyrtc._turnServers = {};
        for (var i = 0; i < iceConfig.iceServers.length; i++) {
            var item = iceConfig.iceServers[i];
            var fixedItem;
            if (item.url.indexOf('turn:') === 0) {
//
// firefox chokes on a transport=tcp entry so filter such out
//
                if (webrtcDetectedBrowser === "firefox" &&
                        item.url.indexOf('?transport=tcp') > 0) {
                    fixedItem = null;
                }
                else if (item.username) {
                    fixedItem = createIceServer(item.url, item.username, item.credential);
                }
                else {
                    var parts = item.url.substring("turn:".length).split("@");
                    if (parts.length !== 2) {
                        easyrtc.showError("badparam", "turn server url looked like " + item.url);
                    }
                    var username = parts[0];
                    var url = parts[1];
                    fixedItem = createIceServer(url, username, item.credential);
                }
                var ipaddress = item.url.split(/[@:&]/g)[1];
                easyrtc._turnServers[ipaddress] = true;

            }
            else { // is stun server entry
                fixedItem = item;
            }
            if (fixedItem) {
                easyrtc.pc_config.iceServers.push(fixedItem);
            }
        }
    }

    /**
     * Request fresh ice config information from the server.
     * This should be done periodically by long running applications.
     * There are no parameters or return values.
     */
    easyrtc.getFreshIceConfig = function() {
        var dataToShip = {
            msgType: "getIceConfig",
            msgData: {}
        };
        easyrtc.webSocket.json.emit("easyrtcCmd", dataToShip,
                function(ackmsg) {
                    if (ackmsg.msgType === "iceConfig") {
                        processIceConfig(ackmsg.msgData.iceConfig);
                    }
                    else {
                        easyrtc.showError(ackmsg.msgData.errorCode, ackmsg.msgData.errorText);
                    }
                }
        );
    };

    function processToken(msg) {
        if (easyrtc.debugPrinter) {
            easyrtc.debugPrinter("entered process token");
        }
        var msgData = msg.msgData;
        if (msgData.easyrtcid) {
            easyrtc.myEasyrtcid = msgData.easyrtcid;
        }
        if (msgData.field) {
            easyrtc.fields.connection = msgData.field;
        }
        if (msgData.iceConfig) {
            processIceConfig(msgData.iceConfig);
        }

        if (msgData.sessionData) {
            processSessionData(msgData.sessionData);
        }

        if (msgData.roomData) {
            processRoomData(msgData.roomData);
        }

        if (msgData.application.field) {
            easyrtc.fields.application = msgData.application.field;
        }

    }

    function sendAuthenticate(successCallback, errorCallback) {

//
// find our easyrtsid
//
        var easyrtcsid = null;
        if (easyrtc.cookieId && document.cookie) {
            var cookies = document.cookie.split(/[; ]/g);
            var target = easyrtc.cookieId + "=";
            for (var i in cookies) {
                if (cookies[i].indexOf(target) === 0) {
                    var cookie = cookies[i].substring(target.length);
                    easyrtcsid = cookie;
                }
            }
        }

        if (!easyrtc.roomJoin) {
            easyrtc.roomJoin = {};
        }

        var msgData = {
            apiVersion: easyrtc.apiVersion,
            applicationName: applicationName,
            setUserCfg: easyrtc.collectConfigurationInfo(true)
        };
        if (easyrtc.presenceShow) {
            msgData.setPresence = {show: easyrtc.presenceShow, status: easyrtc.presenceStatus};
        }
        if (easyrtc.username) {
            msgData.username = easyrtc.username;
        }
        if (easyrtc.roomJoin && !isEmptyObj(easyrtc.roomJoin)) {
            msgData.roomJoin = easyrtc.roomJoin;
        }
        if (easyrtcsid) {
            msgData.easyrtcsid = easyrtcsid;
        }
        if (easyrtc.credential) {
            msgData.credential = easyrtc.credential;
        }

        easyrtc.webSocket.json.emit("easyrtcAuth",
                {msgType: "authenticate",
                    msgData: msgData
                },
        function(msg) {
            if (msg.msgType === "error") {
                errorCallback(msg.msgData.errorCode, msg.msgData.errorText);
                easyrtc.roomJoin = {};
            }
            else {
                processToken(msg);
                if (easyrtc._roomApiFields) {
                    for (var room in easyrtc._roomApiFields) {
                        easyrtc._enqueueSendRoomApi(room, easyrtc._roomApiFields[room]);
                    }
                }

                if (successCallback) {
                    successCallback(easyrtc.myEasyrtcid);
                }
            }
        }
        );
    }
};
/** Get a list of the rooms you are in. You must be connected to call this function.
 * @returns {Map} A map whose keys are the room names
 */
easyrtc.getRoomsJoined = function() {
    var roomsIn = {};
    for (var key in easyrtc.roomJoin) {
        roomsIn[key] = true;
    }
    return roomsIn;
};
/** Get server defined fields associated with a particular room. Only valid
 * after a connection has been made.
 * @param {String} roomName - the name of the room you want the fields for.
 * @returns {Dictionary} A dictionary containing entries of the form {key:{'fieldname':key, 'fieldvalue':value1}}
 */
easyrtc.getRoomFields = function(roomName) {
    return easyrtc.fields.rooms[roomName];
};
/** Get server defined fields associated with the current application. Only valid
 * after a connection has been made.
 * @returns {Dictionary} A dictionary containing entries of the form {key:{'fieldname':key, 'fieldvalue':value1}}
 */
easyrtc.getApplicationFields = function() {
    return easyrtc.fields.application;
};
/** Get server defined fields associated with the connection. Only valid
 * after a connection has been made.
 * @returns {Dictionary} A dictionary containing entries of the form {key:{'fieldname':key, 'fieldvalue':value1}}
 */
easyrtc.getConnectionFields = function() {
    return easyrtc.fields.connection;
};
// this flag controls whether the easyApp routine adds close buttons to the caller
// video objects

/** @private */
easyrtc.autoAddCloseButtons = true;
/** By default, the easyApp routine sticks a "close" button on top of each caller
 * video object that it manages. Call this function (before calling easyApp) to disable that particular feature.
 * @example
 *    easyrtc.dontAddCloseButtons();
 */
easyrtc.dontAddCloseButtons = function() {
    easyrtc.autoAddCloseButtons = false;
};
/**
 * Provides a layer on top of the easyrtc.initMediaSource and easyrtc.connect, assign the local media stream to
 * the video object identified by monitorVideoId, assign remote video streams to
 * the video objects identified by videoIds, and then call onReady. One of it's
 * side effects is to add hangup buttons to the remote video objects, buttons
 * that only appear when you hover over them with the mouse cursor. This method will also add the
 * easyrtcMirror class to the monitor video object so that it behaves like a mirror.
 *  @param {String} applicationName - name of the application.
 *  @param {String} monitorVideoId - the id of the video object used for monitoring the local stream.
 *  @param {Array} videoIds - an array of video object ids (strings)
 *  @param {Function} onReady - a callback function used on success. It is called with the easyrtcId this peer is knopwn to the server as.
 *  @param {Function} onFailure - a callbackfunction used on failure (failed to get local media or a connection of the signaling server).
 *  @example
 *     easyrtc.easyApp('multiChat', 'selfVideo', ['remote1', 'remote2', 'remote3'],
 *              function (easyrtcId){
 *                  console.log("successfully connected, I am " + easyrtcId);
 *              },
 *              function(errorCode, errorText) {
 *                  console.log(errorText);
 *              );
 */
easyrtc.easyApp = function(applicationName, monitorVideoId, videoIds, onReady, onFailure) {
    var numPEOPLE = videoIds.length;
    var refreshPane = 0;
    var onCall = null, onHangup = null, gotMediaCallback = null, gotConnectionCallback = null;
    if (videoIds === null) {
        videoIds = [];
    }

    function videoIsFree(obj) {
        return (obj.caller === "" || obj.caller === null || obj.caller === undefined);
    }

// verify that video ids were not typos.
    if (monitorVideoId && !document.getElementById(monitorVideoId)) {
        easyrtc.showError(easyrtc.errCodes.DEVELOPER_ERR, "The monitor video id passed to easyApp was bad, saw " + monitorVideoId);
        return;
    }

    if (monitorVideoId) {
        document.getElementById(monitorVideoId).muted = "muted";
    }
    for (var i in videoIds) {
        var name = videoIds[i];
        if (!document.getElementById(name)) {
            easyrtc.showError(easyrtc.errCodes.DEVELOPER_ERR, "The caller video id '" + name + "' passed to easyApp was bad.");
            return;
        }
    }
    /** Sets an event handler that gets called when the local media stream is
     *  created or not. Can only be called after calling easyrtc.easyApp.
     *  @param {Function} gotMediaCB has the signature function(gotMedia, errorText)
     *  @example
     *     easyrtc.setGotMedia( function(gotMediaCB, errorText) {
     *         if( gotMedia ){
     *             console.log("Got the requested user media");
     *         }
     *         else {
     *             console.log("Failed to get media because: " +  errorText);
     *         }
     *     });
     */
    easyrtc.setGotMedia = function(gotMediaCB) {
        gotMediaCallback = gotMediaCB;
    };
    /** Sets an event handler that gets called when a connection to the signaling
     * server has or has not been made. Can only be called after calling easyrtc.easyApp.
     * @param {Function} gotConnectionCB has the signature (gotConnection, errorText)
     * @example
     *    easyrtc.setGotConnection( function(gotConnection, errorText) {
     *        if( gotConnection ){
     *            console.log("Successfully connected to signaling server");
     *        }
     *        else {
     *            console.log("Failed to connect to signaling server because: " + errorText);
     *        }
     *    });
     */
    easyrtc.setGotConnection = function(gotConnectionCB) {
        gotConnectionCallback = gotConnectionCB;
    };
    /** Sets an event handler that gets called when a call is established.
     * It's only purpose (so far) is to support transitions on video elements.
     * This function is only defined after easyrtc.easyApp is called.
     * The slot argument is the index into the array of video ids.
     * @param {Function} cb has the signature function(easyrtcid, slot) {}
     * @example
     *   easyrtc.setOnCall( function(easyrtcid, slot) {
     *      console.log("call with " + easyrtcid + "established");
     *   });
     */
    easyrtc.setOnCall = function(cb) {
        onCall = cb;
    };
    /** Sets an event handler that gets called when a call is ended.
     * it's only purpose (so far) is to support transitions on video elements.
     x     * this function is only defined after easyrtc.easyApp is called.
     * The slot is parameter is the index into the array of video ids.
     * Note: if you call easyrtc.getConnectionCount() from inside your callback
     * it's count will reflect the number of connections before the hangup started.
     * @param {Function} cb has the signature function(easyrtcid, slot) {}
     * @example
     *   easyrtc.setOnHangup( function(easyrtcid, slot) {
     *      console.log("call with " + easyrtcid + "ended");
     *   });
     */
    easyrtc.setOnHangup = function(cb) {
        onHangup = cb;
    };
    function getIthVideo(i) {
        if (videoIds[i]) {
            return document.getElementById(videoIds[i]);
        }
        else {
            return null;
        }
    }


    easyrtc.getIthCaller = function(i) {
        if (i < 0 || i > videoIds.length) {
            return null;
        }
        return getIthVideo(i).caller;
    };
    easyrtc.getSlotOfCaller = function(easyrtcid) {
        for (var i = 0; i < numPEOPLE; i++) {
            if (easyrtc.getIthCaller(i) === easyrtcid) {
                return i;
            }
        }
        return -1; // caller not connected
    };

    function hideVideo(video) {
        easyrtc.setVideoObjectSrc(video, "");
        video.style.visibility = "hidden";
    }

    easyrtc.setOnStreamClosed(function(caller) {
        for (var i = 0; i < numPEOPLE; i++) {
            var video = getIthVideo(i);
            if (video.caller === caller) {
                hideVideo(video);
                video.caller = "";
                if (onHangup) {
                    onHangup(caller, i);
                }
            }
        }
    });
    //
    // Only accept incoming calls if we have a free video object to display
    // them in.
    //
    easyrtc.setAcceptChecker(function(caller, helper) {
        for (var i = 0; i < numPEOPLE; i++) {
            var video = getIthVideo(i);
            if (videoIsFree(video)) {
                helper(true);
                return;
            }
        }
        helper(false);
    });


    easyrtc.setStreamAcceptor(function(caller, stream) {
        if (easyrtc.debugPrinter) {
            easyrtc.debugPrinter("stream acceptor called");
        }
        function showVideo(video, stream) {
            easyrtc.setVideoObjectSrc(video, stream);
            if (video.style.visibility) {
                video.style.visibility = 'visible';
            }
        }

        var i, video;
        if (refreshPane && videoIsFree(refreshPane)) {
            showVideo(video, stream);
            if (onCall) {
                onCall(caller);
            }
            refreshPane = null;
            return;
        }
        for (i = 0; i < numPEOPLE; i++) {
            video = getIthVideo(i);
            if (video.caller === caller) {
                showVideo(video, stream);
                if (onCall) {
                    onCall(caller, i);
                }
                return;
            }
        }

        for (i = 0; i < numPEOPLE; i++) {
            video = getIthVideo(i);
            if (!video.caller || videoIsFree(video)) {
                video.caller = caller;
                if (onCall) {
                    onCall(caller, i);
                }
                showVideo(video, stream);
                return;
            }
        }
//
// no empty slots, so drop whatever caller we have in the first slot and use that one.
//
        video = getIthVideo(0);
        if (video) {
            easyrtc.hangup(video.caller);
            showVideo(video, stream);
            if (onCall) {
                onCall(caller, 0);
            }
        }
        video.caller = caller;
    });
    if (easyrtc.autoAddCloseButtons) {
        var addControls = function(video) {
            var parentDiv = video.parentNode;
            video.caller = "";
            var closeButton = document.createElement("div");
            closeButton.className = "easyrtc_closeButton";
            closeButton.onclick = function() {
                if (video.caller) {
                    easyrtc.hangup(video.caller);
                    hideVideo(video);
                    video.caller = "";
                }
            };
            parentDiv.appendChild(closeButton);
        };
        for (var i = 0; i < numPEOPLE; i++) {
            addControls(getIthVideo(i));
        }
    }

    var monitorVideo = null;
    if (easyrtc.videoEnabled && monitorVideoId !== null) {
        monitorVideo = document.getElementById(monitorVideoId);
        if (!monitorVideo) {
            console.error("Programmer error: no object called " + monitorVideoId);
            return;
        }
        monitorVideo.muted = "muted";
        monitorVideo.defaultMuted = true;
    }


    var nextInitializationStep;
    nextInitializationStep = function(token) {
        if (gotConnectionCallback) {
            gotConnectionCallback(true, "");
        }
        onReady(easyrtc.myEasyrtcid);
    };
    easyrtc.initMediaSource(
            function() {
                if (gotMediaCallback) {
                    gotMediaCallback(true, null);
                }
                if (monitorVideo !== null) {
                    easyrtc.setVideoObjectSrc(monitorVideo, easyrtc.getLocalStream());
                }
                function connectError(errorCode, errorText) {
                    if (gotConnectionCallback) {
                        gotConnectionCallback(false, errorText);
                    }
                    else {
                        easyrtc.showError(easyrtc.errCodes.CONNECT_ERR, errorText);
                    }
                    if (onFailure) {
                        onFailure(easyrtc.errCodes.CONNECT_ERR, errorText);
                    }
                }
                easyrtc.connect(applicationName, nextInitializationStep, connectError);
            },
            function(errorcode, errorText) {
                if (gotMediaCallback) {
                    gotMediaCallback(false, errorText);
                }
                else {
                    easyrtc.showError(easyrtc.errCodes.MEDIA_ERR, errorText);
                }
                if (onFailure) {
                    onFailure(easyrtc.errCodes.MEDIA_ERR, errorText);
                }
            }
    );
};
/**
 * 
 * @deprecated now called easyrtc.easyApp.
 */
easyrtc.initManaged = easyrtc.easyApp;
//
// the below code is a copy of the standard polyfill adapter.js
//
var getUserMedia = null;
var attachMediaStream = null;
var reattachMediaStream = null;
var webrtcDetectedBrowser = null;
var webrtcDetectedVersion = null;
if (navigator.mozGetUserMedia) {
// console.log("This appears to be Firefox");

    webrtcDetectedBrowser = "firefox";
    webrtcDetectedVersion =
            parseInt(navigator.userAgent.match(/Firefox\/([0-9]+)\./)[1]);
    // The RTCPeerConnection object.
    window.RTCPeerConnection = mozRTCPeerConnection;
    // The RTCSessionDescription object.
    window.RTCSessionDescription = mozRTCSessionDescription;
    // The RTCIceCandidate object.
    window.RTCIceCandidate = mozRTCIceCandidate;
    // Get UserMedia (only difference is the prefix).
    // Code from Adam Barth.
    window.getUserMedia = navigator.mozGetUserMedia.bind(navigator);
    // Creates iceServer from the url for FF.
    window.createIceServer = function(url, username, password) {
        var iceServer = null;
        var url_parts = url.split(':');
        if (url_parts[0].indexOf('stun') === 0) {
// Create iceServer with stun url.
            iceServer = {'url': url};
        } else if (url_parts[0].indexOf('turn') === 0 &&
                (url.indexOf('transport=udp') !== -1 ||
                        url.indexOf('?transport') === -1)) {
// Create iceServer with turn url.
// Ignore the transport parameter from TURN url.
            var turn_url_parts = url.split("?");
            iceServer = {'url': turn_url_parts[0],
                'credential': password,
                'username': username};
        }
        return iceServer;
    };
    // Attach a media stream to an element.
    attachMediaStream = function(element, stream) {
//        console.log("Attaching media stream");
        element.mozSrcObject = stream;
        element.play();
    };
    reattachMediaStream = function(to, from) {
//        console.log("Reattaching media stream");
        to.mozSrcObject = from.mozSrcObject;
        to.play();
    };
    if (webrtcDetectedVersion < 23) {
// Fake get{Video,Audio}Tracks
        MediaStream.prototype.getVideoTracks = function() {
            return [];
        };
        MediaStream.prototype.getAudioTracks = function() {
            return [];
        };
    }
} else if (navigator.webkitGetUserMedia) {
//    console.log("This appears to be Chrome");

    webrtcDetectedBrowser = "chrome";
    webrtcDetectedVersion =
            parseInt(navigator.userAgent.match(/Chrom(e|ium)\/([0-9]+)\./)[2]);
    // Creates iceServer from the url for Chrome.
    window.createIceServer = function(url, username, password) {
        var iceServer = null;
        var url_parts = url.split(':');
        if (url_parts[0].indexOf('stun') === 0) {
// Create iceServer with stun url.
            iceServer = {'url': url};
        } else if (url_parts[0].indexOf('turn') === 0) {
            if (webrtcDetectedVersion < 28) {
// For pre-M28 chrome versions use old TURN format.
                var url_turn_parts = url.split("turn:");
                iceServer = {'url': 'turn:' + username + '@' + url_turn_parts[1],
                    'credential': password};
            } else {
// For Chrome M28 & above use new TURN format.
                iceServer = {'url': url,
                    'credential': password,
                    'username': username};
            }
        }
        return iceServer;
    };
    // The RTCPeerConnection object.
    window.RTCPeerConnection = webkitRTCPeerConnection;
    // Get UserMedia (only difference is the prefix).
    // Code from Adam Barth.
    window.getUserMedia = navigator.webkitGetUserMedia.bind(navigator);
    // Attach a media stream to an element.
    attachMediaStream = function(element, stream) {
        if (typeof element.srcObject !== 'undefined') {
            element.srcObject = stream;
        } else if (typeof element.mozSrcObject !== 'undefined') {
            element.mozSrcObject = stream;
        } else if (typeof element.src !== 'undefined') {
            element.src = URL.createObjectURL(stream);
        } else {
            console.log('Error attaching stream to element.');
        }
    };
    reattachMediaStream = function(to, from) {
        to.src = from.src;
    };
    // The representation of tracks in a stream is changed in M26.
    // Unify them for earlier Chrome versions in the coexisting period.
    if (!webkitMediaStream.prototype.getVideoTracks) {
        webkitMediaStream.prototype.getVideoTracks = function() {
            return this.videoTracks;
        };
        webkitMediaStream.prototype.getAudioTracks = function() {
            return this.audioTracks;
        };
    }

// New syntax of getXXXStreams method in M26.
    if (!webkitRTCPeerConnection.prototype.getLocalStreams) {
        webkitRTCPeerConnection.prototype.getLocalStreams = function() {
            return this.localStreams;
        };
        webkitRTCPeerConnection.prototype.getRemoteStreams = function() {
            return this.remoteStreams;
        };
    }
} else {
    console.log("Browser does not appear to be WebRTC-capable");
}


/** @private */
easyrtc.isMozilla = (webrtcDetectedBrowser === "firefox");
//
// This is the end of the polyfill adapter.js
//

