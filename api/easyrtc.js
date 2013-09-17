/** @class
 *@version 0.8.1
 *<p>
 * Provides client side support for the easyrtc framework.
 * Please see the easyrtc_client_api.md and easyrtc_client_tutorial.md
 * for more details.</p>
 *
 *</p>
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
/** Error codes that the easyrtc will use in the errCode field of error object passed
 *  to error handler set by easyrtc.setOnError. The error codes are short printable strings.
 * @type Dictionary
 */
easyrtc.errCodes = {
    BAD_NAME: "BAD_NAME", // a user name wasn't of the desired form 
    DEVELOPER_ERR: "DEVELOPER_ERR", // the developer using the easyrtc library made a mistake
    SYSTEM_ERR: "SYSTEM_ERR", // probably an error related to the network
    CONNECT_ERR: "CONNECT_ERR", // error occured when trying to create a connection
    MEDIA_ERR: "MEDIA_ERR", // unable to get the local media
    MEDIA_WARNING: "MEDIA_WARNING", // didn't get the desired resolution
    INTERNAL_ERR: "INTERNAL_ERR"
};
easyrtc.apiVersion = "0.9.0a";
/** Most basic message acknowledgement object */
easyrtc.ackMessage = {msgType: "ack", msgData: {}};
/** Regular expression pattern for user ids. This will need modification to support non US character sets */
easyrtc.userNamePattern = /^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,30}[a-zA-Z0-9]$/;

/** @private */
easyrtc.userName = null;
/** @private */
easyrtc.loggingOut = false;
/** @private */
easyrtc.disconnecting = false;
/** @private */
easyrtc.localStream = null;
/** @private */
easyrtc.videoFeatures = true; // default video 

/** @private */
easyrtc.isMozilla = (webrtcDetectedBrowser === "firefox");

/** @private */
easyrtc.audioEnabled = true;
/** @private */
easyrtc.videoEnabled = true;
/** @private */
easyrtc.datachannelName = "dc";
/** @private */
easyrtc.debugPrinter = null;
/** @private */
easyrtc.myEasyrtcid = "";
/** @private */
easyrtc.oldConfig = {};
/** @private */
easyrtc.offersPending = {};


/** The height of the local media stream video in pixels. This field is set an indeterminate period 
 * of time after easyrtc.initMediaSource succeeds.
 */
easyrtc.nativeVideoHeight = 0;
/** The width of the local media stream video in pixels. This field is set an indeterminate period 
 * of time after easyrtc.initMediaSource succeeds.
 */
easyrtc.nativeVideoWidth = 0;
/** @private */
easyrtc.apiKey = "cmhslu5vo57rlocg"; // default key for now

/** @private */
easyrtc.credential = null;
/* temporary hack */


/** The rooms the user is in. This only applies to room oriented applications and is set at the same
 * time a token is received.
 */
easyrtc.roomJoin = {};

/** Checks if the supplied string is a valid user name (standard identifier rules)
 * @param {String} name
 * @return {Boolean} true for a valid user name
 * @example
 *    var name = document.getElementById('nameField').value;
 *    if( !easyrtc.isNameValid(name)) {
 *        alert("Bad user name");
 *    }
 */
easyrtc.isNameValid = function(name) {
    return easyrtc.userNamePattern.test(name);
};
/**
 * This function sets the name of the cookie that client side library will look for
 * and transmit back to the server as it's easyrtcsid in the first message.
 * @param {type} cookieId
 */
easyrtc.setCookieId = function(cookieId) {
    easyrtc.cookieId = cookieId;
};

/**
 * This method allows you to join a single room. It may be called multiple times to be in 
 * multiple rooms simultaneously. It may be called before or after connecting to the server.
 * Note: the successCB and failureDB will only be called if you are already connected to the server.
 * @param {type} roomName
 * @param {type} roomParameters : application specific parameters, can be null.
 * @param {Function} successCB called once the room is joined.
 * @param {Function} failureCB called if the room can not be joined. The arguments of failureCB are errorCode, errorText, roomName.
 */
easyrtc.joinRoom = function(roomName, roomParameters, successCB, failureCB) {
    if (easyrtc.roomJoin[roomName]) {
        alert("Programmer error: attempt to join room " + roomName + " which you are already in.");
        return;
    }
    var newRoomData = {roomName: roomName};
    if (roomParameters) {
        for (var key in roomParameters) {
            newRoomData[key] = roomParameters[key];
        }
    }

    if (failureCB === null) {
        failureCB = function(why) {
            easyrtc.showError("Unable to enter room " + roomName + " because " + why);
        };
    }
    if (easyrtc.webSocket) {
        var entry = {};
        entry[roomName] = newRoomData;
        easyrtc.sendSignalling(null, "roomJoin", {roomJoin: entry},
            function(msgType, msg) {
                easyrtc.roomJoin[roomName] = newRoomData;
                var roomData = msg.roomData;
                if (successCB) {
                    successCB(roomName);
                    easyrtc.lastLoggedInList[roomName] = {};
                    for (var key in roomData[roomName].clientList) {
                        if (key !== easyrtc.myEasyrtcid) {
                            easyrtc.lastLoggedInList[roomName][key] = roomData[roomName].clientList[key];
                        }
                    }
                    easyrtc.roomOccupantListener(roomName, easyrtc.lastLoggedInList[roomName]);
                }
            },
            function(errorCode, errorText) {
                if (failureCB) {
                    failureCB(errorCode, errorText, roomName);
                }
                else {
                    easyrtc.showError("Unable to enter room " + roomName + " because " + why);
                }
            }
        );
    }
    else {
        easyrtc.roomJoin[roomName] = newRoomData;
    }
};

/**
 * This function allows you to leave a single room. 
 * @param {type} roomName
 * @example 
 *    easyrtc.leaveRoom("freds_room");
 */
easyrtc.leaveRoom = function(roomName) {
    if (easyrtc.roomJoin[roomName]) {
        delete easyrtc.roomJoin[roomName];
        if (easyrtc.webSocket) {

        }
        roomItem = {};
        roomItem[roomName] = {roomName: roomName};
        easyrtc.sendSignalling(null, "roomLeave", {roomLeave: roomItem}, null, null);
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
/** Set the API Key. The API key identifies the owner of the application. 
 *  The API key has no meaning for the Open Source server.
 * @param {String} key 
 * @example
 *      easyrtc.setApiKey('cmhslu5vo57rlocg');
 */
easyrtc.setApiKey = function(key) {
    easyrtc.credential = {apiKey: key};
};
/** Set the application name. Applications can only communicate with other applications
 * that share the sname API Key and application name. There is no predefined set of application
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
easyrtc.supportsPeerConnection = function() {
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
// 
//
if (easyrtc.isMozilla) {
    easyrtc.datachannelConstraints = {};
}
else {
    easyrtc.datachannelConstraints = {
        reliable: false
    };
}
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
easyrtc.receivePeerCB = null;

/** @private */
easyrtc.receiveServerCB = null;

/** @private */
easyrtc.appDefinedFields = {};
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
//        connectTime: timestamp when the connection was started
//        sharingAudio: true if audio is being shared
//        sharingVideo: true if video is being shared
//        cancelled: temporarily true if a connection was cancelled by the peer asking to initiate it.
//        candidatesToSend: SDP candidates temporarily queued 
//        pc: RTCPeerConnection
//        mediaStream: mediaStream
//	  function callSuccessCB(string) - see the easyrtc.call documentation.
//        function callFailureCB(string) - see the easyrtc.call documentation.
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
 * the maximum length of the appDefinedFields. This is defined on the
 * server side as well, so changing it here alone is insufficient.
 */
/** @private */
var maxAppDefinedFieldsLength = 128;
/**
 * Disconnect from the easyrtc server.
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
/** Provide a set of application defined fields that will be part of this instances
 * configuration information. This data will get sent to other peers via the websocket
 * path. 
 * @param {type} fields just be JSON serializable to a length of not more than 128 bytes.
 * @example 
 *   easyrtc.setAppDefinedFields( { favorite_alien:'Mr Spock'});
 *   easyrtc.setRoomOccupantListener( function(roomName, list, isPrimaryOwner) {
 *      for( var i in list ) {
 *         console.log("easyrtcid=" + i + " favorite alien is " + list[i].appDefinedFields.favorite_alien);
 *      }
 *   });
 */
easyrtc.setAppDefinedFields = function(fields) {
    var fieldAsString = JSON.stringify(fields);
    if (JSON.stringify(fieldAsString).length <= 128) {
        easyrtc.appDefinedFields = JSON.parse(fieldAsString);
        easyrtc.updateConfigurationInfo();
    }
    else {
        throw "Developer error: your appDefinedFields were too big";
    }
};
/** Default error reporting function. The default implementation displays error messages
 *  in a programatically created div with the id easyrtcErrorDialog. The div has title
 *  component with a classname of easyrtcErrorDialog_title. The error messages get added to a
 *  container with the id easyrtcErrorDialog_body. Each error message is a text node inside a div
 *  with a class of easyrtcErrorDialog_element. There is an "okay" button with the className of easyrtcErrorDialog_okayButton.
 *  @param {String} messageCode An error message code
 *  @param {String} message the error message text without any markup.
 *  @example
 *      easyrtc.showError("BAD_NAME", "Invalid username");
 */
easyrtc.showError = function(messageCode, message) {
    easyrtc.onError({errCode: messageCode, errText: message});
};
/** @private 
 * @param errorObject
 */
easyrtc.onError = function(errorObject) {
    if (easyrtc.debugPrinter) {
        easyrtc.debugPrinter("saw error " + errorObject.errText);
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
    messageNode.appendChild(document.createTextNode(errorObject.errText));
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
 *       if( entry ) {
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
 * The callback expects to receive a map whose ideas are easyrtcids and whose values are in turn maps
 * supplying user specific information. The inner maps have the following keys:
 *  userName, applicationName, browserFamily, browserMajor, osFamily, osMajor, deviceFamily.
 * The callback also receives a boolean that indicates whether the owner is the primary owner of a room.
 * @param {Function} listener
 * @example
 *   easyrtc.setRoomOccupantListener( function(roomName, list, isPrimaryOwner) {
 *      for( var i in list ) {
 *         ("easyrtcid=" + i + " belongs to user " + list[i].userName);
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
 * Sets whether webrtc data channels are used to send inter-client messages.
 * This is only the messages that applications explicitly send to other applications, not the webrtc signalling messages.
 * @param {Boolean} enabled  true to use data channels, false otherwise. The default is false.
 * @example
 *     easyrtc.enableDataChannels(true);
 */
easyrtc.enableDataChannels = function(enabled) {
    easyrtc.dataEnabled = enabled;
};
/**
 * Returns a URL for your local camera and microphone.
 *  It can be called only after easyrtc.initMediaSource has succeeded.
 *  It returns a url that can be used as a source by the chrome video element or the &lt;canvas&gt; element.
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
 * @param {type} element the video object.
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
 *  Failure could be caused a browser that didn't support webrtc, or by the user
 * not granting permission.
 * If you are going to call easyrtc.enableAudio or easyrtc.enableVideo, you need to do it before
 * calling easyrtc.initMediaSource. 
 * @param {Function} successCallback - will be called when the media source is ready.
 * @param {Function} errorCallback - is called with a message string if the attempt to get media failed.
 * @example
 *       easyrtc.initMediaSource(
 *          function() { 
 *              easyrtc.setVideoObjectSrc( document.getElementById("mirrorVideo"), easyrtc.getLocalStream()); 
 *          },
 *          function() {
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
            easyrtc.showError("no-media", message);
        };
    }

    if (!successCallback) {
        alert("easyrtc.initMediaSource not supplied a successCallback");
        return;
    }



    var mode = {'audio': (easyrtc.audioEnabled ? true : false),
        'video': ((easyrtc.videoEnabled) ? (easyrtc.videoFeatures) : false)};

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
                            (easyrtc.nativeVideoHeight != easyrtc.videoFeatures.mandatory.minHeight ||
                                    easyrtc.nativeVideoWidth != easyrtc.videoFeatures.mandatory.minWidth)) {
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
 * @param {Function} acceptCheck takes the arguments (callerEasyrtcid, function():boolean ) {}
 * The acceptCheck callback is passed (as it's second argument) a function that should be called with either
 * a true value (accept the call) or false value( reject the call).
 * @example
 *      easyrtc.setAcceptChecker( function(easyrtcid, acceptor) {
 *           if( easyrtc.idToName(easyrtcid) === 'Fred' ) {
 *              acceptor(true);
 *           }
 *           else if( easyrtc.idToName(easyrtcid) === 'Barney' ) {
 *              setTimeout( function() {  acceptor(true)}, 10000);
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
 * @param {Function} errListener takes an object of the form { errCode: String, errText: String}
 * @example
 *    easyrtc.setOnError( function(errorObject) {
 *        document.getElementById("errMessageDiv").innerHTML += errorObject.errText;
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
 *        if( explicitlyCancelled ) {
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


/**
 * Sets a listener for data sent from another client (either peer to peer or via websockets).
 * @param {Function} listener has the signature (easyrtcid, msgType, data, targetting).
 *   msgType is a string. targetting is null if the message was received using WebRTC data channels, otherwise it
 *   is an object that contains one or more of the following string valued elements {targetEasyrtcid, targetGroup, targetRoom}.
 * @example
 *     easyrtc.setPeerListener( function(easyrtcid, msgType, data, targetting) {
 *         ("From " + easyrtc.idToName(easyrtcid) + 
 *             " sent the follow data " + JSON.stringify(data));
 *     });
 *     
 *     
 */
easyrtc.setPeerListener = function(listener) {
    easyrtc.receivePeerCB = listener;
};

/**
 * Sets a listener for data sent from another client (either peer to peer or via websockets).
 * @deprecated This is now a synonym for setPeerListener.
 * @param {Function} listener has the signature (easyrtcid, data)
 * @example
 *     easyrtc.setDataListener( function(easyrtcid, data) {
 *         ("From " + easyrtc.idToName(easyrtcid) + 
 *             " sent the follow data " + JSON.stringify(data));
 *     });
 *     
 *     
 */
easyrtc.setDataListener = function(listener) {
    easyrtc.receivePeerCB = listener;
};

/**
 * Sets a listener for messages from the server.
 * @param {Function} listener has the signature (data)
 * @example
 *     easyrtc.setPeerListener( function(msg) {
 *         ("From Server sent the following message " + JSON.stringify(msg));
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
 * pages from a regular webserver, but the easyrtc library can still reach the
 * socket server.
 * @param {DOMString} socketUrl
 * @example
 *     easyrtc.setSocketUrl(":8080");
 */
easyrtc.setSocketUrl = function(socketUrl) {
    if (easyrtc.debugPrinter) {
        easyrtc.debugPrinter("webrtc signaling server URL set to " + socketUrl);
    }
    easyrtc.serverPath = socketUrl;
};
/** 
 * Sets the user name associated with the connection. 
 * @param {String} userName must obey standard identifier conventions.
 * @returns {Boolean} true if the call succeeded, false if the username was invalid.
 * @example
 *    if ( !easyrtc.setUserName("JohnSmith") ) {
 *        alert("bad user name);
 *    
 */
easyrtc.setUserName = function(userName) {

    if (easyrtc.isNameValid(userName)) {
        easyrtc.userName = userName;
        return true;
    }
    else {
        easyrtc.showError(easyrtc.errCodes.BAD_NAME, "Illegal username " + userName);
        return false;
    }
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
 *    easyrtc.setDisconnectListener(function() {
 *        easyrtc.showError("SYSTEM-ERROR", "Lost our connection to the socket server");
 *    });
 */
easyrtc.setDisconnectListener = function(disconnectListener) {
    easyrtc.disconnectListener = disconnectListener;
};
/**
 * Convert an easyrtcid to a user name. This is useful for labelling buttons and messages
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
/**
 * Connects to the easyrtc signalling server. You must connect before trying to
 * call other users.
 * @param {String} applicationName is a string that identifies the application so that different applications can have different
 *        lists of users.
 * @param {Function} successCallback (easyrtcId, cookieOwner) - is called on successful connect. easyrtcId is the 
 *   unique name that the client is known to the server by. A client usually only needs it's own easyrtcId for debugging purposes.
 *       cookieOwner is true if the server sent back a isOwner:true field in response to a cookie.
 * @param {Function} errorCallback (errorCode, errorText) - is called on unsuccessful connect. if null, an alert is called instead.
 *  The errorCode takes it's value from easyrtc.errCodes.
 * @example 
 *   easyrtc.connect("mychat_app", 
 *                   function(easyrtcid, cookieOwner) {
 *                       if( cookieOwner) { console.log("I'm the room owner"); }
 *                       console.log("my id is " + easyrtcid);
 *                   },
 *                   function(errText) {
 *                       console.log("failed to connect ", erFrText);
 *                   });
 */
easyrtc.connect = function(applicationName, successCallback, errorCallback) {
    easyrtc.pc_config = {};
    easyrtc.closedChannel = null;

    if (easyrtc.debugPrinter) {
        easyrtc.debugPrinter("attempt to connect to webrtc signalling server with application name=" + applicationName);
    }
    var mediaConstraints = {
        'mandatory': {
            'OfferToReceiveAudio': true,
            'OfferToReceiveVideo': true
        },
        'optional': [{
                RtpDataChannels: easyrtc.dataEnabled
            }]
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
        easyrtc.loggingOut = false;
        easyrtc.disconnecting = false;
        easyrtc.oldConfig = {};
    };
    easyrtc.disconnect = function() {
        if (easyrtc.debugPrinter) {
            easyrtc.debugPrinter("attempt to disconnect from webrtc signalling server");
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
            easyrtc.oldConfig = {};
        }, 250);
    };
    if (errorCallback === null) {
        errorCallback = function(errorCode, errorText) {
            alert("easyrtc.connect: " + errorText);
        };
    }

    //
    // This function is used to send webrtc signalling messages to another client. These messages all the form:
    //   msgType: one of ["offer"/"answer"/"candidate","reject","hangup", "getRoomList"]
    //   targetEasyrtcid: someid or null
    //   msgData: either null or an SDP record
    //   successCallback: a function with the signature  function(msgType, wholeMsg);
    //   errorCallback: a function with signature function(errorCode, errorText)
    //
    function sendSignalling(destUser, instruction, data, successCallback, errorCallback) {
        if (!easyrtc.webSocket) {
            throw "Attempt to send message without a valid connection to the server.";
        }
        else {
            var dataToShip = {
                msgType: instruction
            };
            if (destUser) {
                dataToShip.targetEasyrtcid = destUser;
            }
            if (data) {
                dataToShip.msgData = data;
            }
            ;
            if (easyrtc.debugPrinter) {
                easyrtc.debugPrinter("sending socket message " + JSON.stringify(dataToShip));
            }
            easyrtc.webSocket.json.emit("easyrtcCmd", dataToShip,
                    function(ackmsg) {
                        if (ackmsg.msgType !== "error") {
                            if (successCallback) {
                                successCallback(ackmsg.msgType, ackmsg);
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
    /**
     *Sends data to another user using previously established data channel. This method will
     * fail if no data channel has been established yet. Unlike the easyrtc.sendWS method, 
     * you can't send a dictionary, convert dictionaries to strings using JSON.stringify first. 
     * What datatypes you can send, and how large a datatype depends on your browser.
     * @param {String} destUser (an easyrtcid)
     * @param {String} msgType 
     * @param {Object} data - an object which can be JSON'ed.
     * @example
     *     easyrtc.sendDataP2P(someEasyrtcid, "roomdata", {room:499, bldgNum:'asd'});
     */
    easyrtc.sendDataP2P = function(destUser, msgType, data) {

        var flattenedData = JSON.stringify({msgType: msgType, msgData: data});
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
            easyrtc.peerConns[destUser].dataChannelS.send(flattenedData);
        }
    };



    /** Sends data to another user using websockets. Messages are received by the other party's peerListener.
     * @param {String} destination - either a string containing the easyrtcId of the other user, or an object containing some subset of the following fields: targetEasyrtcid, targetGroup, targetRoom.
     * Specifying multiple fields restricts the scope of the destination (operates as a logical AND, not a logical OR).
     * @param {String msgType
     * @param {String} data - an object which can be JSON'ed.
     * @param {Function} ackhandler - by default, the ackhandler handles acknowledgements from the server that your message was delivered to it's destination.
     * However, application logic in the server can over-ride this. If you leave this null, a stub ackHandler will be used. The ackHandler
     * gets passed a message with the same msgType as your outgoing message, or a message type of "error" in which case
     * msgData will contain a errorCode and errorText fields.
     * @example 
     *    easyrtc.sendDataWS(someEasyrtcid, "setPostalAddress", {room:499, bldgNum:'asd'}, 
     *      function(ackmessage){
     *          console.log("saw the following acknowledgement " + JSON.stringify(ackmessage));
     *      }
     *    );
     */
    easyrtc.sendDataWS = function(destination, msgType, data, ackhandler) {
        if (easyrtc.debugPrinter) {
            easyrtc.debugPrinter("sending client message via websockets to " + destination + " with data=" + JSON.stringify(data));
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
            msgData: data
        };
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
     * @param {String} destUser (an easyrtcid)
     * @param {String} msgType
     * @param {String} data - an object which can be JSON'ed.
     * @param {Function} ackHandler - a function which receives acknowledgements. May only be invoked in
     *  the websocket case.
     * @example 
     *    easyrtc.sendData(someEasyrtcid, {room:499, bldgNum:'asd'});
     */
    easyrtc.sendData = function(destUser, msgType, data, ackHandler) {
        if (easyrtc.peerConns[destUser] && easyrtc.peerConns[destUser].dataChannelReady) {
            easyrtc.sendDataP2P(destUser, msgType, data);
        }
        else {
            easyrtc.sendDataWS(destUser, msgType, data, ackHandler);
        }
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
        easyrtc.sendSignalling(null, "getRoomList", null, function(ackType, ackMsg) {
            if (ackType === 'error') {
                if (errorCallback) {
                    errorCallback(ackMsg.msgData.errorCode, ackMsg.msgData.errorText);
                }
                else {
                    easyrtc.showError(ackMsg.msgData.errorCode, ackMsg.msgData.errorText);
                }
            }
            else {
                callback(ackMsg.roomList);
            }
        });
    };


    function haveTracks(easyrtcid, checkAudio) {
        var peerConnObj = easyrtc.peerConns[easyrtcid];
        if (!peerConnObj) {
            alert("Programmer error: haveTracks called about a peer you don't have a connection to");
        }
        var stream = peerConnObj.stream;
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
    }

    /** Determines if a particular peer2peer connection has an audio track.
     * @param easyrtcid - the id of the other caller in the connection.
     * @return {Boolean} true if there is an audio track or the browser can't tell us.
     */
    easyrtc.haveAudioTrack = function(easyrtcid) {
        return haveTracks(easyrtcid, true);
    };
    /** Determines if a particular peer2peer connection has a video track.
     * @param easyrtcid - the id of the other caller in the connection.
     * @return {Boolean} true if there is an video track or the browser can't tell us.
     */
    easyrtc.haveVideoTrack = function(easyrtcid) {
        return haveTracks(easyrtcid, false);
    };

    /** Value returned by easyrtc.getConnectStatus if the other user isn't connected. */
    easyrtc.NOT_CONNECTED = "not connected";
    /** Value returned by easyrtc.getConnectStatus if the other user is in the process of getting connected */
    easyrtc.BECOMING_CONNECTED = "connection in progress";
    /** Value returned by easyrtc.getConnectStatus if the other user is connected. */
    easyrtc.IS_CONNECTED = "is connected";
    /**
     * Return true if the client has a peer-2-peer connection to another user.
     * The return values are text strings so you can use them in debugging output.
     *  @param {String} otherUser - the easyrtcid of the other user.
     *  @return {String} one of the following values: easyrtc.NOT_CONNECTED, easyrtc.BECOMING_CONNECTED, easyrtc.IS_CONNECTED
     *  @example
     *     if( easyrtc.getConnectStatus(otherEasyrtcid) == easyrtc.NOT_CONNECTED ) {
     *         easyrtc.call(otherEasyrtcid, 
     *                  function() { console.log("success"); },
     *                  function() { console.log("failure"); });
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

        if (easyrtc.dataEnabled) {
            options.push({RtpDataChannels: true});
        }

        return {optional: options};
    };
    /**
     *  Initiates a call to another user. If it succeeds, the streamAcceptor callback will be called.
     * @param {String} otherUser - the easyrtcid of the peer being called.
     * @param {Function} callSuccessCB (otherCaller, mediaType) - is called when the datachannel is established or the mediastream is established. mediaType will have a value of "audiovideo" or "datachannel"
     * @param {Function} callFailureCB (errMessage) - is called if there was a system error interfering with the call.
     * @param {Function} wasAcceptedCB (wasAccepted:boolean,otherUser:string) - is called when a call is accepted or rejected by another party. It can be left null.
     * @example
     *    easyrtc.call( otherEasyrtcid, 
     *        function(easyrtcid, mediaType) {
     *           console.log("Got mediatype " + mediaType + " from " + easyrtc.idToName(easyrtcid);
     *        },
     *        function(errMessage) {
     *           console.log("call to  " + easyrtc.idToName(otherEasyrtcid) + " failed:" + errMessage);
     *        },
     *        function(wasAccepted, easyrtcid) {
     *            if( wasAccepted ) {
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
            callFailureCB(message);
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
            pc.setLocalDescription(sessionDescription, sendOffer, callFailureCB);
        };
        pc.createOffer(setLocalAndSendMessage0, null, mediaConstraints);
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
                }, function(msg) {
                    if (easyrtc.debugPrinter) {
                        easyrtc.debugPrinter("hangup failed:" + msg);
                    }
                });
            }
        }
        if (sawAConnection) {
            easyrtc.updateConfigurationInfo();
        }
    };


    var buildPeerConnection = function(otherUser, isInitiator, failureCB) {
        var pc;
        var message;

        if (easyrtc.debugPrinter) {
            easyrtc.debugPrinter("building peer connection to " + otherUser);
        }


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
                            failureCB("Candidate disappeared");
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
//                console.log("saw onremovestream ", event);
                if (easyrtc.peerConns[otherUser]) {
                    easyrtc.peerConns[otherUser].stream = null;
                    if (easyrtc.onStreamClosed) {
                        easyrtc.onStreamClosed(otherUser);
                    }
                    delete easyrtc.peerConns[otherUser];
                    easyrtc.updateConfigurationInfo();
                }

            };
            easyrtc.peerConns[otherUser] = newPeerConn;

        } catch (e) {
            if (easyrtc.debugPrinter) {
                easyrtc.debugPrinter(JSON.stringify(e));
            }
            failureCB(e.message);
            return null;
        }

        if (easyrtc.videoEnabled || easyrtc.audioEnabled) {
            if (easyrtc.localStream === null) {
                message = "Application program error: attempt to share audio or video before calling easyrtc.initMediaSource.";
                if (easyrtc.debugPrinter) {
                    easyrtc.debugPrinter(message);
                }
                alert(message);
            }
            else {
                if (easyrtc.debugPrinter) {
                    easyrtc.debugPrinter("adding local media stream to peer connection");
                }
                pc.addStream(easyrtc.localStream);
            }
        }


        function initOutGoingChannel(otherUser) {
            if (easyrtc.debugPrinter) {
                easyrtc.debugPrinter("saw initOutgoingChannel call");
            }
            var dataChannel = pc.createDataChannel(easyrtc.datachannelName, easyrtc.datachannelConstraints);
            easyrtc.peerConns[otherUser].dataChannelS = dataChannel;
            if (!easyrtc.isMozilla) {
                easyrtc.peerConns[otherUser].dataChannelR = dataChannel;
            }

            if (!easyrtc.isMozillia) {
                dataChannel.onmessage = function(event) {
                    if (easyrtc.debugPrinter) {
                        easyrtc.debugPrinter("saw dataChannel.onmessage event");
                    }
                    if (easyrtc.receivePeerCB) {
                        easyrtc.receivePeerCB(otherUser, JSON.parse(event.data), null);
                    }
                };

            }
            //   dataChannel.binaryType = "blob";

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
                        easyrtc.onDataChannelOpen(otherUser);
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
                dataChannel.onmessage = function(event) {
                    if (easyrtc.debugPrinter) {
                        easyrtc.debugPrinter("saw dataChannel.onmessage event");
                    }
                    if (easyrtc.receivePeerCB) {
                        easyrtc.receivePeerCB(otherUser, JSON.parse(event.data), null);
                    }
                };
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

                if (easyrtc.onDataChannelOpen) {
                    easyrtc.onDataChannelOpen(otherUser);
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
                    failureCB(easyrtc.formatError(channelErrorEvent));
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

        if (!easyrtc.localStream && (easyrtc.videoEnabled || easyrtc.audioEnabled)) {
            easyrtc.initMediaSource(
                    function(s) {
                        doAnswer(caller, msgData);
                    },
                    function(err) {
                        easyrtc.showError(easyrtc.errCodes.MEDIA_ERR, "Error getting local media stream: " + err);
                    });
            return;
        }
        else if (easyrtc.dataEnabled && !easyrtc.videoEnabled && !easyrtc.audioEnabled
                && navigator.mozGetUserMedia && easyrtc.mozFakeStream === null) {
            navigator.mozGetUserMedia({
                audio: true,
                fake: true
            }, function(s) {
                if (!s) {
                    easyrtc.showError(easyrtc.errCodes.MEDIA_ERR, "Error getting fake media stream for Firefox datachannels: null stream");
                }
                easyrtc.mozFakeStream = s;
                doAnswer(caller, msgData);
            }, function(err) {
                easyrtc.showError(easyrtc.errCodes.MEDIA_ERR, "Error getting fake media stream for Firefox datachannels: " + err);
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
            ;
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

    function processList(roomName, list) {
        var isPrimaryOwner = easyrtc.cookieOwner ? true : false;
        easyrtc.reducedList = {};
        for (var id in list) {
            var item = list[id];
            if (item.isOwner &&
                    item.roomJoinTime < list[easyrtc.myEasyrtcid].roomJoinTime) {
                isPrimaryOwner = false;
            }
            if (id !== easyrtc.myEasyrtcid) {
                easyrtc.reducedList[id] = list[id];
            }
        }
        processConnectedList(easyrtc.reducedList);
        if (easyrtc.roomOccupantListener) {
            easyrtc.roomOccupantListener(roomName, easyrtc.reducedList, isPrimaryOwner);
        }
    }



    var onChannelMsg = function(msg) {
        if (easyrtc.receivePeerCB) {
            var targetting = {};
            if (msg.targetEasyrtcId) {
                targetting.targetEasyrtcId = msg.targetEasyrtcId;
            }
            if (msg.targetRoom) {
                targetting.targetRoom = msg.targetRoom;
            }
            if (msg.targetGroup) {
                targetting.targetGroup = msg.targetGroup;
            }
            easyrtc.receivePeerCB(msg.senderEasyrtcid, msg.msgType, msg.msgData, targetting);
        }
    };

    var onChannelMessage = function(msg) {

        if (easyrtc.receivePeerCB) {
            var targetting = {};
            if (msg.targetEasyrtcId) {
                targetting.targetEasyrtcId = msg.targetEasyrtcId;
            }
            if (msg.targetRoom) {
                targetting.targetRoom = msg.targetRoom;
            }
            if (msg.targetGroup) {
                targetting.targetGroup = msg.targetGroup;
            }
            if (easyrtc.receivePeerCB) {
                easyrtc.receivePeerCB(msg.senderEasyrtcid, msg.msgType, msg.msgData, targetting);
            }
        }
        else {
            if (easyrtc.receiveServerCB) {
                easyrtc.receiveServerCB(msg);
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
            pc.setRemoteDescription(sd, function() {
                if (pc.connectDataConnection) {
                    if (easyrtc.debugPrinter) {
                        easyrtc.debugPrinter("calling connectDataConnection(5001,5002)");
                    }
                    pc.connectDataConnection(5001, 5002); // these are like ids for data channels
                }
            });
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
            case "roomData":
                processRoomData(msgData.roomData);
                break;
            case "list":
                processList(msgData);
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
                alert("received unknown message type from server, msgType is " + msgType);
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

        addSocketListener('error', function() {
            if (easyrtc.myEasyrtcid) {
                easyrtc.showError(easyrtc.errCodes.SIGNAL_ERROR, "Miscellaneous error from signalling server. It may be ignorable.");
            }
            else {
                errorCallback(easyrtc.errCodes.CONNECT_ERR, "Unable to reach the EasyRTC signalling server.");
            }
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

    function  getStatistics(pc, track, results) {
        var successcb = function(stats) {
            for (var i in stats) {
                results[i] = stats[i];
            }
        };
        var failurecb = function(event) {
            results.error = event;
        };
        pc.getStats(track, successcb, failurecb);
    }


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
        if (!isEmptyObj(easyrtc.appDefinedFields)) {
            newConfig.apiField = easyrtc.appDefinedFields;
        }
        if ( !isEmptyObj(p2pList)) {
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


    function processRoomData(roomData) {
        for (var roomname in roomData) {
            easyrtc.roomHasPassword = roomData[roomname].hasPassword;
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
            if (roomData[roomname].field && roomData[roomname].field.isOwner) {
                easyrtc.cookieOwner = true;
            }

            if (roomData[roomname].clientList) {
                easyrtc.lastLoggedInList[roomname] = roomData[roomname].clientList;
            }
            else if (roomData[roomname].clientListDelta) {
                var stuffToAdd = roomData[roomname].clientListDelta.updateClient;
                if (stuffToAdd) {
                    for (var id in stuffToAdd) {
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
            processList(roomname, easyrtc.lastLoggedInList[roomname]);
        }
    }


    function processToken(msg) {
        if (easyrtc.debugPrinter) {
            easyrtc.debugPrinter("entered process token");
        }

        var msgData = msg.msgData;
        if (msgData.easyrtcid) {
            easyrtc.myEasyrtcid = msgData.easyrtcid;
        }
        if (msgData.iceConfig) {

            easyrtc.pc_config = {iceServers: []};
            for (var i in msgData.iceConfig.iceServers) {
                var item = msgData.iceConfig.iceServers[i];
                var fixedItem;
                if (item.url.indexOf('turn:') === 0) {
                    if (item.username) {
                        fixedItem = createIceServer(item.url, item.username, item.credential);
                    }
                    else {
                        var parts = item.url.substring("turn:".length).split("@");
                        if (parts.length != 2) {
                            easyrtc.showError("badparam", "turn server url looked like " + item.url);
                        }
                        var username = parts[0];
                        var url = parts[1];
                        fixedItem = createIceServer(url, username, item.credential);
                    }
                }
                else { // is stun server entry
                    fixedItem = item;
                }
                easyrtc.pc_config.iceServers.push(fixedItem);
            }
        }



        if (msgData.roomData) {
            processRoomData(msg.msgData.roomData);
        }

    }

    function sendAuthenticate(successCallback, errorCallback) {

        //
        // find our easyrtsid
        //
        var easyrtcsid = null;
        if (easyrtc.cookieId && document.cookie) {
            var cookies = document.cookie.split("[; ]");
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
        if (easyrtc.userName) {
            msgData.username = easyrtc.userName;
        }
        if (easyrtc.roomJoin && !isEmptyObj(easyrtc.roomJoin)) {
            msgData.roomJoin = easyrtc.roomJoin;
        }
        if (easyrtc.easyrtcsid) {
            msgData.easyrtcsid = easyrtc.easyrtcsid;
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
                    if (successCallback) {
                        successCallback(easyrtc.myEasyrtcid, easyrtc.cookieOwner);
                    }
                }
            }
        );
    }


};
// this flag controls whether the initManaged routine adds close buttons to the caller
// video objects

/** @private */
easyrtc.autoAddCloseButtons = true;
/** By default, the initManaged routine sticks a "close" button on top of each caller
 * video object that it manages. Call this function (before calling initManaged) to disable that particular feature.
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
 *  @param {Function} onReady - a callback function used on success.
 *  @param {Function} onFailure - a callbackfunction used on failure (failed to get local media or a connection of the signaling server).
 *  @example
 *     easyrtc.initManaged('multiChat', 'selfVideo', ['remote1', 'remote2', 'remote3'], 
 *              function() {
 *                  console.log("successfully connected.");
 *              },
 *              function(errorCode, errorText) {
 *                  console.log(errorText);
 *              );
 */
easyrtc.initManaged = function(applicationName, monitorVideoId, videoIds, onReady, onFailure) {
    var numPEOPLE = videoIds.length;
    var refreshPane = 0;
    var onCall = null, onHangup = null, gotMediaCallback = null, gotConnectionCallback = null;
    if (videoIds === null) {
        videoIds = [];
    }

// verify that video ids were not typos.    
    if (monitorVideoId && !document.getElementById(monitorVideoId)) {
        easyrtc.showError(easyrtc.errCodes.DEVELOPER_ERR, "The monitor video id passed to initManaged was bad, saw " + monitorVideoId);
        return;
    }

    document.getElementById(monitorVideoId).muted = "muted";
    for (var i in videoIds) {
        var name = videoIds[i];
        if (!document.getElementById(name)) {
            easyrtc.showError(easyrtc.errCodes.DEVELOPER_ERR, "The caller video id '" + name + "' passed to initManaged was bad.");
            return;
        }
    }
    /** Sets an event handler that gets called when the local media stream is
     *  created or not. Can only be called after calling easyrtc.initManaged.
     *  @param {Function} gotMediaCB has the signature function(gotMedia, why)
     *  @example 
     *     easyrtc.setGotMedia( function(gotMediaCB, why) {
     *         if( gotMedia ) {
     *             console.log("Got the requested user media");
     *         }
     *         else {
     *             console.log("Failed to get media because: " +  why);
     *         }
     *     });
     */
    easyrtc.setGotMedia = function(gotMediaCB) {
        gotMediaCallback = gotMediaCB;
    };
    /** Sets an event handler that gets called when a connection to the signalling
     * server has or has not been made. Can only be called after calling easyrtc.initManaged.
     * @param {Function} gotConnectionCB has the signature (gotConnection, why)
     * @example 
     *    easyrtc.setGotConnection( function(gotConnection, why) {
     *        if( gotConnection ) {
     *            console.log("Successfully connected to signalling server");
     *        }
     *        else {
     *            console.log("Failed to connect to signalling server because: " + why);
     *        }
     *    });
     */
    easyrtc.setGotConnection = function(gotConnectionCB) {
        gotConnectionCallback = gotConnectionCB;
    };
    /** Sets an event handler that gets called when a call is established.
     * It's only purpose (so far) is to support transitions on video elements.
     * This function is only defined after easyrtc.initManaged is called.
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
     x     * this function is only defined after easyrtc.initManaged is called.
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
    easyrtc.setOnStreamClosed(function(caller) {
        for (var i = 0; i < numPEOPLE; i++) {
            var video = getIthVideo(i);
            if (video.caller === caller) {
                easyrtc.setVideoObjectSrc(video, "");
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
            if (video.caller === "") {
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
        var i, video;
        if (refreshPane && refreshPane.caller === "") {
            easyrtc.setVideoObjectSrc(video, stream);
            if (onCall) {
                onCall(caller);
            }
            refreshPane = null;
            return;
        }
        for (i = 0; i < numPEOPLE; i++) {
            video = getIthVideo(i);
            if (video.caller === caller) {
                easyrtc.setVideoObjectSrc(video, stream);
                if (onCall) {
                    onCall(caller, i);
                }
                return;
            }
        }

        for (i = 0; i < numPEOPLE; i++) {
            video = getIthVideo(i);
            if (!video.caller || video.caller === "") {
                video.caller = caller;
                if (onCall) {
                    onCall(caller, i);
                }
                easyrtc.setVideoObjectSrc(video, stream);
                return;
            }
        }
//
// no empty slots, so drop whatever caller we have in the first slot and use that one.
//
        video = getIthVideo(0);
        if (video) {
            easyrtc.hangup(video.caller);
            easyrtc.setVideoObjectSrc(video, stream);
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
                    easyrtc.setVideoObjectSrc(video, "");
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
            alert("Programmer error: no object called " + monitorVideoId);
            return;
        }
        monitorVideo.muted = "muted";
        monitorVideo.defaultMuted = true;
    }


    var nextInitializationStep;

    nextInitializationStep = function(token, isOwner) {
        if (gotConnectionCallback) {
            gotConnectionCallback(true, "");
        }
        onReady(easyrtc.myEasyrtcid, easyrtc.cookieOwner);
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
            function(errorText) {
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

var easyrtc = easyrtc; // an alias for the deprecated name 

//
// the below code is a copy of the standard polyfill adapter.js
//
var RTCPeerConnection = null;
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
    RTCPeerConnection = mozRTCPeerConnection;

    // The RTCSessionDescription object.
    RTCSessionDescription = mozRTCSessionDescription;

    // The RTCIceCandidate object.
    RTCIceCandidate = mozRTCIceCandidate;

    // Get UserMedia (only difference is the prefix).
    // Code from Adam Barth.
    getUserMedia = navigator.mozGetUserMedia.bind(navigator);

    // Creates iceServer from the url for FF.
    createIceServer = function(url, username, password) {
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
    createIceServer = function(url, username, password) {
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
    RTCPeerConnection = webkitRTCPeerConnection;

    // Get UserMedia (only difference is the prefix).
    // Code from Adam Barth.
    getUserMedia = navigator.webkitGetUserMedia.bind(navigator);

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

//
// This is the end of the polyfill adapter.js
//
