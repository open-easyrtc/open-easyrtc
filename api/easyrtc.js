/** @class
 *@version 0.8.1
 *<p>
 * Provides client side support for the easyRTC framework.
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





var easyRTC = {};
/** Error codes that the easyRTC will use in the errCode field of error object passed
 *  to error handler set by easyRTC.setOnError. The error codes are short printable strings.
 * @type Dictionary.
 */
easyRTC.errCodes = {
    BAD_NAME: "BAD_NAME", // a user name wasn't of the desired form 
    DEVELOPER_ERR: "DEVELOPER_ERR", // the developer using the easyRTC library made a mistake
    SYSTEM_ERR: "SYSTEM_ERR", // probably an error related to the network
    CONNECT_ERR: "CONNECT_ERR", // error occured when trying to create a connection
    MEDIA_ERR: "MEDIA_ERR", // unable to get the local media
    MEDIA_WARNING: "MEDIA_WARNING", // didn't get the desired resolution
    INTERNAL_ERR: "INTERNAL_ERR",
    SIP_ERR: "SIP_ERR"  //something went wrong with a sip session 
};
easyRTC.apiVersion = "0.9.0a";
/** Most basic message acknowledgement object */
easyRTC.ackMessage = {msgType: "ack", msgData: {}};
/** Regular expression pattern for user ids. This will need modification to support non US character sets */
easyRTC.userNamePattern = /^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,30}[a-zA-Z0-9]$/;
/** @private */
easyRTC.userName = null;
/** @private */
easyRTC.credential = {apiKey: "cmhslu5vo57rlocg"}; // default key for now

/** @private */
easyRTC.loggingOut = false;
/** @private */
easyRTC.disconnecting = false;
/** @private */
easyRTC.localStream = null;
/** @private */
easyRTC.videoFeatures = true; // default video 

/** @private */
easyRTC.isMozilla = (webrtcDetectedBrowser === "firefox");

/** @private */
easyRTC.audioEnabled = true;
/** @private */
easyRTC.videoEnabled = true;
/** @private */
easyRTC.datachannelName = "dc";
/** @private */
easyRTC.debugPrinter = null;
/** @private */
easyRTC.myEasyrtcid = "";
/** @private */
easyRTC.oldConfig = {};
/** @private */
easyRTC.offersPending = {};
easyRTC.sipUA = null; // JSSIP user agent if SIP is supported.

/** The height of the local media stream video in pixels. This field is set an indeterminate period 
 * of time after easyRTC.initMediaSource succeeds.
 */
easyRTC.nativeVideoHeight = 0;
/** The width of the local media stream video in pixels. This field is set an indeterminate period 
 * of time after easyRTC.initMediaSource succeeds.
 */
easyRTC.nativeVideoWidth = 0;
/** @private */
easyRTC.apiKey = "cmhslu5vo57rlocg"; // default key for now

easyRTC.credential = null;
/* temporary hack */
/**
 * 
 * @private
 */
easyRTC.sipAlreadyInitialized = false;

/** The rooms the user is in. This only applies to room oriented applications and is set at the same
 * time a token is received.
 */
easyRTC.roomJoin = {};

/** Checks if the supplied string is a valid user name (standard identifier rules)
 * @param {String} name
 * @return {Boolean} true for a valid user name
 * @example
 *    var name = document.getElementById('nameField').value;
 *    if( !easyRTC.isNameValid(name)) {
 *        alert("Bad user name");
 *    }
 */
easyRTC.isNameValid = function(name) {
    return easyRTC.userNamePattern.test(name);
};
/**
 * This function sets the name of the cookie that client side library will look for
 * and transmit back to the server as it's easyrtcsid in the first message.
 * @param {type} cookieId
 */
easyRTC.setCookieId = function(cookieId) {
    easyRTC.cookieId = cookieId;
};

/**
 * This method allows you to join a single room. It may be called multiple times to be in 
 * multiple rooms simultaneously. It may be called before or after connecting to the server.
 * Note: the successCB and failureDB will only be called if you are already connected to the server.
 * @param {type} roomName
 * @param {type} roomParameters : application specific parameters, can be null.
 * @param {Function} successCB called once the room is joined.
 * @param {Function} failureCB called if the room can not be joined.
 * @returns {unresolved}
 */
easyRTC.joinRoom = function(roomName, roomParameters, successCB, failureCB) {
    if( easyRTC.roomJoin[roomName]) {
        alert("Programmer error: attempt to join room " + roomName + " which you are already in.");
        return;
    }
    var newRoomData = { roomName:roomName};
    if( roomParameters) {
        for(var key in roomParameters) {
            newRoomData[key] = roomParameters[key];        
        }
    }
    easyRTC.roomJoin[roomName] = newRoomData;
    if( failureCB === null) {
        failureCB = function(why){
            easyRTC.showError("Unable to enter room " + roomName + " because " + why);
        };
    }
    if( easyRTC.webSocket ){
        easyRTC.sendSignalling(null, "roomJoin", {roomJoin:newRoomData}, 
            function() {
                if( successCB) {
                    successCB(roomName);
                }
            }, 
            function(why) {
                if( failureCB) {
                    failureCB(roomName);
                }
                else {
                    easyRTC.showError("Unable to enter room " + roomName + " because " + why);
                }
            }
        );
    }
};

/**
 * This function allows you to leave a single room. 
 * @param {type} roomName
 * @returns {void}
 */
easyRTC.leaveRoom = function(roomName) {
    if( easyRTC.roomJoin[roomName]) {
        delete easyRTC.roomJoin[roomName];
        if( easyRTC.webSocket) {
            
        }
        roomItem = {};
        roomItem[roomName] = {roomName:roomName};
        easyRTC.sendSignalling(null, "roomLeave", {roomLeave: roomItem}, null, null);
    }    
};

/** This function is used to set the dimensions of the local camera, usually to get HD.
 *  If called, it must be called before calling easyRTC.initMediaSource (explicitly or implicitly).
 *  assuming it is supported. If you don't pass any parameters, it will default to 720p dimensions.
 * @param {Number} width in pixels
 * @param {Number} height in pixels
 * @example
 *    easyRTC.setVideoDims(1280,720);
 * @example
 *    easyRTC.setVideoDims();
 */
easyRTC.setVideoDims = function(width, height) {
    if (!width) {
        width = 1280;
        height = 720;
    }

    easyRTC.videoFeatures = {
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
 *    easyRTC.setScreenCapture();
 */
easyRTC.setScreenCapture = function() {
    easyRTC.videoFeatures = {
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
 *      easyRTC.setApiKey('cmhslu5vo57rlocg');
 */
easyRTC.setApiKey = function(key) {
    easyRTC.credential = {apiKey: key};
};
/** Set the application name. Applications can only communicate with other applications
 * that share the sname API Key and application name. There is no predefined set of application
 * names. Maximum length is
 * @param {String} name
 * @example
 *    easyRTC.setApplicationName('simpleAudioVideo');
 */
easyRTC.setApplicationName = function(name) {
    easyRTC.applicationName = name;
};
/** Setup the JsSIP User agent.
 * 
 * @param {type} connectConfig is a dictionary that contains the following fields: { ws_servers, uri, password }
 * @returns {undefined}
 */
easyRTC.setSipConfig = function(connectConfig)
{
    easyRTC.sipConfig = connectConfig ? JSON.parse(JSON.stringify(connectConfig)) : null;
};
/** Enable or disable logging to the console. 
 * Note: if you want to control the printing of debug messages, override the
 *    easyRTC.debugPrinter variable with a function that takes a message string as it's argument.
 *    This is exactly what easyRTC.enableDebug does when it's enable argument is true.
 * @param {Boolean} enable - true to turn on debugging, false to turn off debugging. Default is false.
 * @example
 *    easyRTC.enableDebug(true);  
 */
easyRTC.enableDebug = function(enable) {
    if (enable) {
        easyRTC.debugPrinter = function(message) {
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
        easyRTC.debugPrinter = null;
    }
};
/**
 * Determines if the local browser supports WebRTC GetUserMedia (access to camera and microphone).
 * @returns {Boolean} True getUserMedia is supported.
 */
easyRTC.supportsGetUserMedia = function() {
    return !!getUserMedia;
};
/**
 * Determines if the local browser supports WebRTC Peer connections to the extent of being able to do video chats.
 * @returns {Boolean} True if Peer connections are supported.
 */
easyRTC.supportsPeerConnection = function() {
    if (!easyRTC.supportsGetUserMedia()) {
        return false;
    }
    if (!window.RTCPeerConnection) {
        return false;
    }
    try {
        easyRTC.createRTCPeerConnection({"iceServers": []}, null);
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
easyRTC.createRTCPeerConnection = function(pc_config, optionalStuff) {
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
if (easyRTC.isMozilla) {
    easyRTC.datachannelConstraints = {};
}
else {
    easyRTC.datachannelConstraints = {
        reliable: false
    };
}
/** @private */
easyRTC.haveAudioVideo = {
    audio: false,
    video: false
};
/** @private */
easyRTC.dataEnabled = false;
/** @private */
easyRTC.serverPath = null;
/** @private */
easyRTC.loggedInListener = null;
/** @private */
easyRTC.onDataChannelOpen = null;
/** @private */
easyRTC.onDataChannelClose = null;
/** @private */
easyRTC.lastLoggedInList = {};
/** @private */
easyRTC.receivePeerCB = null;
/** @private */
easyRTC.appDefinedFields = {};
/** @private */
easyRTC.updateConfigurationInfo = function() {
}; // dummy placeholder for when we aren't connected
//
//
//  easyRTC.peerConns is a map from caller names to the below object structure
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
//	  function callSuccessCB(string) - see the easyRTC.call documentation.
//        function callFailureCB(string) - see the easyRTC.call documentation.
//        function wasAcceptedCB(boolean,string) - see the easyRTC.call documentation.
//     }
//
/** @private */
easyRTC.peerConns = {};
//
// a map keeping track of whom we've requested a call with so we don't try to 
// call them a second time before they've responded.
//
/** @private */
easyRTC.acceptancePending = {};
/* 
 * the maximum length of the appDefinedFields. This is defined on the
 * server side as well, so changing it here alone is insufficient.
 */
/** @private */
var maxAppDefinedFieldsLength = 128;
/**
 * Disconnect from the easyRTC server.
 */
easyRTC.disconnect = function() {
};
/** @private
 * @param caller
 * @param helper
 */
easyRTC.acceptCheck = function(caller, helper) {
    helper(true);
};
/** @private
 * @param easyrtcid
 * @param stream
 */
easyRTC.streamAcceptor = function(easyrtcid, stream) {
};
/** @private
 * @param easyrtcid
 */
easyRTC.onStreamClosed = function(easyrtcid) {
};
/** @private
 * @param easyrtcid
 */
easyRTC.callCancelled = function(easyrtcid) {
};
/** Provide a set of application defined fields that will be part of this instances
 * configuration information. This data will get sent to other peers via the websocket
 * path. 
 * @param {type} fields just be JSON serializable to a length of not more than 128 bytes.
 * @example 
 *   easyRTC.setAppDefinedFields( { favorite_alien:'Mr Spock'});
 *   easyRTC.setLoggedInListener( function(list) {
 *      for( var i in list ) {
 *         console.log("easyrtcid=" + i + " favorite alien is " + list[i].appDefinedFields.favorite_alien);
 *      }
 *   });
 */
easyRTC.setAppDefinedFields = function(fields) {
    var fieldAsString = JSON.stringify(fields);
    if (JSON.stringify(fieldAsString).length <= 128) {
        easyRTC.appDefinedFields = JSON.parse(fieldAsString);
        easyRTC.updateConfigurationInfo();
    }
    else {
        throw "Developer error: your appDefinedFields were too big";
    }
};
/** Default error reporting function. The default implementation displays error messages
 *  in a programatically created div with the id easyRTCErrorDialog. The div has title
 *  component with a classname of easyRTCErrorDialog_title. The error messages get added to a
 *  container with the id easyRTCErrorDialog_body. Each error message is a text node inside a div
 *  with a class of easyRTCErrorDialog_element. There is an "okay" button with the className of easyRTCErrorDialog_okayButton.
 *  @param {String} messageCode An error message code
 *  @param {String} message the error message text without any markup.
 *  @example
 *      easyRTC.showError("BAD_NAME", "Invalid username");
 */
easyRTC.showError = function(messageCode, message) {
    easyRTC.onError({errCode: messageCode, errText: message});
};
/** @private 
 * @param errorObject
 */
easyRTC.onError = function(errorObject) {
    if (easyRTC.debugPrinter) {
        easyRTC.debugPrinter("saw error " + errorObject.errText);
    }
    var errorDiv = document.getElementById('easyRTCErrorDialog');
    var errorBody;
    if (!errorDiv) {
        errorDiv = document.createElement("div");
        errorDiv.id = 'easyRTCErrorDialog';
        var title = document.createElement("div");
        title.innerHTML = "Error messages";
        title.className = "easyRTCErrorDialog_title";
        errorDiv.appendChild(title);
        errorBody = document.createElement("div");
        errorBody.id = "easyRTCErrorDialog_body";
        errorDiv.appendChild(errorBody);
        var clearButton = document.createElement("button");
        clearButton.appendChild(document.createTextNode("Okay"));
        clearButton.className = "easyRTCErrorDialog_okayButton";
        clearButton.onclick = function() {
            errorBody.innerHTML = ""; // remove all inner nodes
            errorDiv.style.display = "none";
        };
        errorDiv.appendChild(clearButton);
        document.body.appendChild(errorDiv);
    }
    ;
    errorBody = document.getElementById("easyRTCErrorDialog_body");
    var messageNode = document.createElement("div");
    messageNode.className = 'easyRTCErrorDialog_element';
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
easyRTC.videoBandwidthString = "b=AS:50"; // default video band width is 50kbps

//
// easyRTC.createObjectURL builds a URL from a media stream.
// Arguments:
//     mediaStream - a media stream object.
// The video object in Chrome expects a URL.
//
/** @private 
 * @param mediaStream */
easyRTC.createObjectURL = function(mediaStream) {
    if (window.URL && window.URL.createObjectURL) {
        return window.URL.createObjectURL(mediaStream);
    }
    else if (window.webkitURL && window.webkitURL.createObjectURL) {
        return window.webkit.createObjectURL(mediaStream);
    }
    else {
        var errMessage = "Your browsers does not support URL.createObjectURL.";
        if (easyRTC.debugPrinter) {
            easyRTC.debugPrinter("saw exception " + errMessage);
        }
        throw errMessage;
    }
};
/**
 * A convenience function to ensure that a string doesn't have symbols that will be interpreted by HTML.
 * @param {String} idString
 * @return {String}
 * @example
 *     console.log( easyRTC.cleanId('&hello'));
 */
easyRTC.cleanId = function(idString) {
    var MAP = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;'
    };
    return idString.replace(/[&<>]/g, function(c) {
        return MAP[c];
    });
};
/** Set the callback that will be invoked when the list of people logged in changes.
 * The callback expects to receive a map whose ideas are easyrtcids and whose values are in turn maps
 * supplying user specific information. The inner maps have the following keys:
 *  userName, applicationName, browserFamily, browserMajor, osFamily, osMajor, deviceFamily.
 * The callback also receives a boolean that indicates whether the owner is the primary owner of a room.
 * @param {Function} listener
 * @example
 *   easyRTC.setLoggedInListener( function(list, isPrimaryOwner) {
 *      for( var i in list ) {
 *         ("easyrtcid=" + i + " belongs to user " + list[i].userName);
 *      }
 *   });
 */
easyRTC.setLoggedInListener = function(listener) {
    easyRTC.loggedInListener = listener;
};
/**
 * Sets a callback that is called when a data channel is open and ready to send data.
 * The callback will be called with an easyrtcid as it's sole argument.
 * @param {Function} listener
 * @example
 *    easyRTC.setDataChannelOpenListener( function(easyrtcid) {
 *         easyRTC.sendDataP2P(easyrtcid, "greeting", "hello");
 *    });
 */
easyRTC.setDataChannelOpenListener = function(listener) {
    easyRTC.onDataChannelOpen = listener;
};
/** Sets a callback that is called when a previously open data channel closes.
 * The callback will be called with an easyrtcid as it's sole argument.
 * @param {Function} listener
 * @example
 *    easyRTC.setDataChannelCloseListener( function(easyrtcid) {
 *            ("No longer connected to " + easyRTC.idToName(easyrtcid));       
 *    });
 */
easyRTC.setDataChannelCloseListener = function(listener) {
    easyRTC.onDataChannelClose = listener;
};
/** Returns the number of live peer connections the client has.
 * @return {Number}
 * @example
 *    ("You have " + easyRTC.getConnectionCount() + " peer connections");
 */
easyRTC.getConnectionCount = function() {
    var count = 0;
    for (var i in easyRTC.peerConns) {
        if (easyRTC.peerConns[i].startedAV) {
            count++;
        }
    }
    return count;
};
/** Sets whether audio is transmitted by the local user in any subsequent calls.
 * @param {Boolean} enabled true to include audio, false to exclude audio. The default is true.
 * @example
 *      easyRTC.enableAudio(false);
 */
easyRTC.enableAudio = function(enabled) {
    easyRTC.audioEnabled = enabled;
};
/**
 *Sets whether video is transmitted by the local user in any subsequent calls.
 * @param {Boolean} enabled - true to include video, false to exclude video. The default is true.
 * @example
 *      easyRTC.enableVideo(false);
 */
easyRTC.enableVideo = function(enabled) {
    easyRTC.videoEnabled = enabled;
};
/**
 * Sets whether webrtc data channels are used to send inter-client messages.
 * This is only the messages that applications explicitly send to other applications, not the webrtc signalling messages.
 * @param {Boolean} enabled  true to use data channels, false otherwise. The default is false.
 * @example
 *     easyRTC.enableDataChannels(true);
 */
easyRTC.enableDataChannels = function(enabled) {
    easyRTC.dataEnabled = enabled;
};
/**
 * Returns a URL for your local camera and microphone.
 *  It can be called only after easyRTC.initMediaSource has succeeded.
 *  It returns a url that can be used as a source by the chrome video element or the &lt;canvas&gt; element.
 *  @return {URL}
 *  @example
 *      document.getElementById("myVideo").src = easyRTC.getLocalStreamAsUrl();
 */
easyRTC.getLocalStreamAsUrl = function() {
    if (easyRTC.localStream === null) {
        throw "Developer error: attempt to get a mediastream without invoking easyRTC.initMediaSource successfully";
    }
    return easyRTC.createObjectURL(easyRTC.localStream);
};
/**
 * Returns a media stream for your local camera and microphone.
 *  It can be called only after easyRTC.initMediaSource has succeeded.
 *  It returns a stream that can be used as an argument to easyRTC.setVideoObjectSrc.
 * @return {MediaStream}
 * @example
 *    easyRTC.setVideoObjectSrc( document.getElementById("myVideo"), easyRTC.getLocalStream());    
 */
easyRTC.getLocalStream = function() {
    return easyRTC.localStream;
};
/** Clears the media stream on a video object.
 * 
 * @param {type} element the video object.
 * @returns {undefined}
 */
easyRTC.clearMediaStream = function(element) {
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
 *  easyRTCMirror class to the video object so it looks like a proper mirror.
 *  The easyRTCMirror class is defined in easyrtc.css, which is automatically added
 *  when you add the easyrtc.js file to an HTML file.
 *  @param {DOMObject} videoObject an HTML5 video object 
 *  @param {MediaStream} stream a media stream as returned by easyRTC.getLocalStream or your stream acceptor.
 * @example
 *    easyRTC.setVideoObjectSrc( document.getElementById("myVideo"), easyRTC.getLocalStream());    
 *     
 */
easyRTC.setVideoObjectSrc = function(videoObject, stream) {
    if (stream && stream != "") {
        videoObject.autoplay = true;
        attachMediaStream(videoObject, stream);
        videoObject.play();
    }
    else {
        easyRTC.clearMediaStream(videoObject);
    }
};
/** @private
 * @param {String} x */
easyRTC.formatError = function(x) {
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
 * If you are going to call easyRTC.enableAudio or easyRTC.enableVideo, you need to do it before
 * calling easyRTC.initMediaSource. 
 * @param {Function} successCallback - will be called when the media source is ready.
 * @param {Function} errorCallback - is called with a message string if the attempt to get media failed.
 * @example
 *       easyRTC.initMediaSource(
 *          function() { 
 *              easyRTC.setVideoObjectSrc( document.getElementById("mirrorVideo"), easyRTC.getLocalStream()); 
 *          },
 *          function() {
 *               easyRTC.showError("no-media", "Unable to get local media");
 *          });
 *          
 */
easyRTC.initMediaSource = function(successCallback, errorCallback) {

    if (easyRTC.debugPrinter) {
        easyRTC.debugPrinter("about to request local media");
    }

    if (!window.getUserMedia) {
        errorCallback("Your browser doesn't appear to support WebRTC.");
    }

    if (errorCallback === null) {
        errorCallback = function(x) {
            var message = "easyRTC.initMediaSource: " + easyRTC.formatError(x);
            if (easyRTC.debugPrinter) {
                easyRTC.debugPrinter(message);
            }
            easyRTC.showError("no-media", message);
        };
    }

    if (!successCallback) {
        alert("easyRTC.initMediaSource not supplied a successCallback");
        return;
    }



    var mode = {'audio': (easyRTC.audioEnabled ? true : false),
        'video': ((easyRTC.videoEnabled) ? (easyRTC.videoFeatures) : false)};

    /** @private
     * @param {Stream} stream
     *  */
    var onUserMediaSuccess = function(stream) {
        if (easyRTC.debugPrinter) {
            easyRTC.debugPrinter("getUserMedia success callback entered");
        }
//     console.log("getusermedia succeeded");
// the below commented out checks were for Chrome. However, Mozilla nightly started 
// implementing the getAudioTracks method as well, except their implementation appears to 
// be asychronous, the audioTracks.length are zero initially and filled later.
// 
//        if (easyRTC.audioEnabled && stream.getAudioTracks) {
//            var audioTracks = stream.getAudioTracks();
//            if (!audioTracks || audioTracks.length === 0) {
//                errorCallback("The application requested audio but the system didn't supply it");
//                return;
//            }
//        }
//        if (easyRTC.videoEnabled && stream.getVideoTracks) {
//            var videoTracks = stream.getVideoTracks();
//            if (!videoTracks || videoTracks.length === 0) {
//                errorCallback("The application requested video but the system didn't supply it");
//                return;
//            }
//        }

        if (easyRTC.debugPrinter) {
            easyRTC.debugPrinter("successfully got local media");
        }
        easyRTC.localStream = stream;
        if (easyRTC.haveAudioVideo.video) {
            var videoObj = document.createElement('video');
            videoObj.muted = true;
            var triesLeft = 30;
            var tryToGetSize = function() {
                if (videoObj.videoWidth > 0 || triesLeft < 0) {
                    easyRTC.nativeVideoWidth = videoObj.videoWidth;
                    easyRTC.nativeVideoHeight = videoObj.videoHeight;
                    if (easyRTC.videoFeatures.mandatory &&
                            easyRTC.videoFeatures.mandatory.minHeight &&
                            (easyRTC.nativeVideoHeight != easyRTC.videoFeatures.mandatory.minHeight ||
                                    easyRTC.nativeVideoWidth != easyRTC.videoFeatures.mandatory.minWidth)) {
                        easyRTC.showError(easyRTC.errCodes.MEDIA_WARNING,
                                "requested video size of " + easyRTC.videoFeatures.mandatory.minWidth + "x" + easyRTC.videoFeatures.mandatory.minHeight +
                                " but got size of " + easyRTC.nativeVideoWidth + "x" + easyRTC.nativeVideoHeight);
                    }
                    easyRTC.setVideoObjectSrc(videoObj, "");
                    if (videoObj.removeNode) {
                        videoObj.removeNode(true);
                    }
                    else {
                        var ele = document.createElement('div');
                        ele.appendChild(videoObj);
                        ele.removeChild(videoObj);
                    }

// easyRTC.updateConfigurationInfo();
                    if (successCallback) {
                        successCallback();
                    }
                }
                else {
                    triesLeft -= 1;
                    setTimeout(tryToGetSize, 100);
                }
            };
            easyRTC.setVideoObjectSrc(videoObj, stream);
            tryToGetSize();
        }
        else {
            easyRTC.updateConfigurationInfo();
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
        if (easyRTC.debugPrinter) {
            easyRTC.debugPrinter("failed to get local media");
        }
        if (errorCallback) {
            errorCallback("Failed to get access to local media. Error code was " + error.code + ".");
        }
        easyRTC.localStream = null;
        easyRTC.haveAudioVideo = {
            audio: false,
            video: false
        };
        easyRTC.updateConfigurationInfo();
    };
    if (!easyRTC.audioEnabled && !easyRTC.videoEnabled) {
        onUserMediaError("At least one of audio and video must be provided");
        return;
    }

    /** @private */
    easyRTC.haveAudioVideo = {
        audio: easyRTC.audioEnabled,
        video: easyRTC.videoEnabled
    };
    if (easyRTC.videoEnabled || easyRTC.audioEnabled) {
//
// getUserMedia usually fails the first time I call it. I suspect it's a page loading
// issue. So I'm going to try adding a 1 second delay to allow things to settle down first.
// 
        setTimeout(function() {
            try {
                getUserMedia(mode, onUserMediaSuccess, onUserMediaError);
            } catch (e) {
                errorCallback("getUserMedia failed with exception: " + e.message);
            }
        }, 1000);
    }
    else {
        onUserMediaSuccess(null);
    }
};


/**
 * easyRTC.setAcceptChecker sets the callback used to decide whether to accept or reject an incoming call.
 * @param {Function} acceptCheck takes the arguments (callerEasyrtcid, function():boolean ) {}
 * The acceptCheck callback is passed (as it's second argument) a function that should be called with either
 * a true value (accept the call) or false value( reject the call).
 * @example
 *      easyRTC.setAcceptChecker( function(easyrtcid, acceptor) {
 *           if( easyRTC.idToName(easyrtcid) === 'Fred' ) {
 *              acceptor(true);
 *           }
 *           else if( easyRTC.idToName(easyrtcid) === 'Barney' ) {
 *              setTimeout( function() {  acceptor(true)}, 10000);
 *           }
 *           else {
 *              acceptor(false);
 *           }
 *      });
 */
easyRTC.setAcceptChecker = function(acceptCheck) {
    easyRTC.acceptCheck = acceptCheck;
};
/**
 * easyRTC.setStreamAcceptor sets a callback to receive media streams from other peers, independent
 * of where the call was initiated (caller or callee).
 * @param {Function} acceptor takes arguments (caller, mediaStream)
 * @example
 *  easyRTC.setStreamAcceptor(function(easyrtcid, stream) {
 *     document.getElementById('callerName').innerHTML = easyRTC.idToName(easyrtcid);
 *     easyRTC.setVideoObjectSrc( document.getElementById("callerVideo"), stream); 
 *  });
 */
easyRTC.setStreamAcceptor = function(acceptor) {
    easyRTC.streamAcceptor = acceptor;
};
/** Sets the easyRTC.onError field to a user specified function.
 * @param {Function} errListener takes an object of the form { errCode: String, errText: String}
 * @example
 *    easyRTC.setOnError( function(errorObject) {
 *        document.getElementById("errMessageDiv").innerHTML += errorObject.errText;
 *    });
 */
easyRTC.setOnError = function(errListener) {
    easyRTC.onError = errListener;
};
/**
 * Sets the callCancelled callback. This will be called when a remote user 
 * initiates a call to you, but does a "hangup" before you have a chance to get his video stream.
 * @param {Function} callCancelled takes an easyrtcid as an argument and a boolean that indicates whether
 *  the call was explicitly cancelled remotely (true), or actually accepted by the user attempting a call to 
 *  the same party.
 * @example
 *     easyRTC.setCallCancelled( function(easyrtcid, explicitlyCancelled) {
 *        if( explicitlyCancelled ) {
 *            console..log(easyrtc.idToName(easyrtcid) + " stopped trying to reach you");
 *         }
 *         else {
 *            console.log("Implicitly called "  + easyrtc.idToName(easyrtcid));
 *         }
 *     });
 */
easyRTC.setCallCancelled = function(callCancelled) {
    easyRTC.callCancelled = callCancelled;
};
/**  Sets a callback to receive notification of a media stream closing. The usual
 *  use of this is to clear the source of your video object so you aren't left with 
 *  the last frame of the video displayed on it.
 *  @param {Function} onStreamClosed takes an easyrtcid as it's first parameter.
 *  @example
 *     easyRTC.setOnStreamClosed( function(easyrtcid) {
 *         easyRTC.setVideoObjectSrc( document.getElementById("callerVideo"), "");
 *         ( easyRTC.idToName(easyrtcid) + " went away");
 *     });
 */
easyRTC.setOnStreamClosed = function(onStreamClosed) {
    easyRTC.onStreamClosed = onStreamClosed;
};
/**
 * Sets the bandwidth for sending video data.
 * Setting the rate too low will cause connection attempts to fail. 40 is probably good lower limit.
 * The default is 50. A value of zero will remove bandwidth limits.
 * @param {Number} kbitsPerSecond is rate in kilobits per second.
 * @example
 *    easyRTC.setVideoBandwidth( 40);
 */
easyRTC.setVideoBandwidth = function(kbitsPerSecond) {
    if (easyRTC.debugPrinter) {
        easyRTC.debugPrinter("video bandwidth set to " + kbitsPerSecond + " kbps");
    }
    if (kbitsPerSecond > 0) {
        easyRTC.videoBandwidthString = "b=AS:" + kbitsPerSecond;
    }
    else {
        easyRTC.videoBandwidthString = "";
    }
};


/**
 * Sets a listener for data sent from another client (either peer to peer or via websockets).
 * @param {Function} listener has the signature (easyrtcid, msgType, data, targetting).
 *   msgType is a string. targetting is null if the message was received using WebRTC data channels, otherwise it
 *   is an object that contains one or more of the following string valued elements {targetEasyrtcid, targetGroup, targetRoom}.
 * @example
 *     easyRTC.setPeerListener( function(easyrtcid, msgType, data, targetting) {
 *         ("From " + easyRTC.idToName(easyrtcid) + 
 *             " sent the follow data " + JSON.stringify(data));
 *     });
 *     
 *     
 */
easyRTC.setPeerListener = function(listener) {
    easyRTC.receivePeerCB = listener;
};

/**
 * Sets a listener for data sent from another client (either peer to peer or via websockets).
 * @param {Function} listener has the signature (easyrtcid, msgType, data, targetting)
 * @deprecated This is now a synonym for setPeerListener.
 */
easyRTC.setDataListener = function(listener) {
    easyRTC.receivePeerCB = listener;
};
/**
 * Sets the url of the Socket server.
 * The node.js server is great as a socket server, but it doesn't have
 * all the hooks you'd like in a general web server, like PHP or Python
 * plug-ins. By setting the serverPath your application can get it's regular
 * pages from a regular webserver, but the easyRTC library can still reach the
 * socket server.
 * @param {DOMString} socketUrl
 * @example
 *     easyRTC.setSocketUrl(":8080");
 */
easyRTC.setSocketUrl = function(socketUrl) {
    if (easyRTC.debugPrinter) {
        easyRTC.debugPrinter("webrtc signaling server URL set to " + socketUrl);
    }
    easyRTC.serverPath = socketUrl;
};
/** 
 * Sets the user name associated with the connection.
 * @param {String} userName must obey standard identifier conventions.
 * @returns {Boolean} true if the call succeeded, false if the username was invalid.
 * @example
 *    if ( !easyRTC.setUserName("JohnSmith") ) {
 *        alert("bad user name);
 *    
 */
easyRTC.setUserName = function(userName) {
    if (easyRTC.isNameValid(userName)) {
        easyRTC.userName = userName;
        return true;
    }
    else {
        easyRTC.showError(easyRTC.errCodes.BAD_NAME, "Illegal username " + userName);
        return false;
    }
};
/**
 * Sets the listener for socket disconnection by external (to the API) reasons.
 * @param {Function} disconnectListener takes no arguments and is not called as a result of calling easyRTC.disconnect.
 * @example
 *    easyRTC.setDisconnectListener(function() {
 *        easyRTC.showError("SYSTEM-ERROR", "Lost our connection to the socket server");
 *    });
 */
easyRTC.setDisconnectListener = function(disconnectListener) {
    easyRTC.disconnectListener = disconnectListener;
};
/**
 * Convert an easyrtcid to a user name. This is useful for labelling buttons and messages
 * regarding peers.
 * @param {String} easyrtcid
 * @return {String}
 * @example
 *    console.log(easyrtcid + " is actually " + easyRTC.idToName(easyrtcid));
 */
easyRTC.idToName = function(easyrtcid) {
    if (easyRTC.lastLoggedInList) {
        if (easyRTC.lastLoggedInList[easyrtcid]) {
            if (easyRTC.lastLoggedInList[easyrtcid].userName) {
                return easyRTC.lastLoggedInList[easyrtcid].userName;
            }
            else {
                return easyrtcid;
            }
        }
    }
    return "--" + easyrtcid + "--";
};
/* used in easyRTC.connect */
/** @private */
easyRTC.webSocket = null;
/** @private  */
easyRTC.pc_config = {};
/** @private  */
easyRTC.closedChannel = null;
/**
 * easyRTC.connect(args) performs the connection to the server. You must connect before trying to
 * call other users.
 * @param {String} applicationName is a string that identifies the application so that different applications can have different
 *        lists of users.
 * @param {Function} successCallback (actualName, cookieOwner) - is called on successful connect. actualName is guaranteed to be unique.
 *       cookieOwner is true if the server sent back a isOwner:true field in response to a cookie.
 * @param {Function} errorCallback (msgString) - is called on unsuccessful connect. if null, an alert is called instead.
 */
easyRTC.connect = function(applicationName, successCallback, errorCallback) {
    easyRTC.pc_config = {};
    easyRTC.closedChannel = null;
    if (easyRTC.debugPrinter) {
        easyRTC.debugPrinter("attempt to connect to webrtc signalling server with application name=" + applicationName);
    }
    var mediaConstraints = {
        'mandatory': {
            'OfferToReceiveAudio': true,
            'OfferToReceiveVideo': true
        },
        'optional': [{
                RtpDataChannels: easyRTC.dataEnabled
            }]
    };
    //
    // easyRTC.disconnect performs a clean disconnection of the client from the server.
    //
    easyRTC.disconnectBody = function() {
        easyRTC.loggingOut = true;
        easyRTC.disconnecting = true;
        easyRTC.closedChannel = easyRTC.webSocket;
        if (easyRTC.webSocketConnected) {
            easyRTC.webSocket.close();
            easyRTC.webSocketConnected = false;
        }
        easyRTC.hangupAll();
        if (easyRTC.loggedInListener) {
            easyRTC.loggedInListener({}, false);
        }
        easyRTC.loggingOut = false;
        easyRTC.disconnecting = false;
        easyRTC.oldConfig = {};
    };
    easyRTC.disconnect = function() {
        if (easyRTC.debugPrinter) {
            easyRTC.debugPrinter("attempt to disconnect from webrtc signalling server");
        }


        easyRTC.disconnecting = true;
        easyRTC.hangupAll();
        easyRTC.loggingOut = true;
        // 
        // The hangupAll may try to send configuration information back to the server.
        // Collecting that information is asynchronous, we don't actually close the 
        // connection until it's had a chance to be sent. We allocate 100ms for collecting
        // the info, so 250ms should be sufficient for the disconnecting.
        // 
        setTimeout(function() {
            if (easyRTC.webSocket) {
                try {
                    easyRTC.webSocket.disconnect();
                } catch (e) {
// we don't really care if this fails. 
                }
                ;
                easyRTC.closedChannel = easyRTC.webSocket;
                easyRTC.webSocket = 0;
            }
            easyRTC.loggingOut = false;
            easyRTC.disconnecting = false;
            if (easyRTC.loggedInListener) {
                easyRTC.loggedInListener({}, false);
            }
            easyRTC.oldConfig = {};
        }, 250);
    };
    if (errorCallback === null) {
        errorCallback = function(x) {
            alert("easyRTC.connect: " + x);
        };
    }

    //
    // This function is used to send webrtc signalling messages to another client. These messages all the form:
    //   msgType: one of ["offer"/"answer"/"candidate","reject","hangup"]
    //   targetEasyrtcid: someid
    //   msgData: either null or an SDP record
    //   
    //
    function sendSignalling(destUser, instruction, data, successCallback, errorCallback) {
        if (!easyRTC.webSocket) {
            throw "Attempt to send message without a valid connection to the server."
        }
        else {
            var dataToShip = {
                msgType: instruction,
                targetEasyrtcid: destUser,
                msgData: data
            };
            if (easyRTC.debugPrinter) {
                easyRTC.debugPrinter("sending socket message " + JSON.stringify(dataToShip));
            }
            easyRTC.webSocket.json.emit("easyrtcCmd", dataToShip,
                function(ackmsg) {
                    if (ackmsg.msgType != "error") {
                        if( successCallback) {
                            successCallback(ackmsg.msgType, ackmsg.data);
                        }
                    }
                    else {
                        if( errorCallback) {
                            errorCallback(ackmsg.msgData.errorCode, ackmsg.msgData.errorText);
                        }
                        else {
                            easyRTC.showError(ackmsg.msgData.errorCode, ackmsg.msgData.errorText);
                        }
                    }
                }
            );
        }
    }

    easyRTC.sendSignalling = sendSignalling;
    /**
     *Sends data to another user using previously established data channel. This method will
     * fail if no data channel has been established yet. Unlike the easyRTC.sendWS method, 
     * you can't send a dictionary, convert dictionaries to strings using JSON.stringify first. 
     * What datatypes you can send, and how large a datatype depends on your browser.
     * @param {String} destUser (an easyrtcid)
     * @param {Object} data - an object which can be JSON'ed.
     * @example
     *     easyRTC.sendDataP2P(someEasyrtcid, "roomdata", {room:499, bldgNum:'asd'});
     */
    easyRTC.sendDataP2P = function(destUser, msgType, data) {

        var flattenedData = JSON.stringify({msgType: msgType, msgData: data});
        if (easyRTC.debugPrinter) {
            easyRTC.debugPrinter("sending p2p message to " + destUser + " with data=" + JSON.stringify(flattenedData));
        }

        if (!easyRTC.peerConns[destUser]) {
            easyRTC.showError(easyRTC.errCodes.DEVELOPER_ERR, "Attempt to send data peer to peer without a connection to " + destUser + ' first.');
        }
        else if (!easyRTC.peerConns[destUser].dataChannelS) {
            easyRTC.showError(easyRTC.errCodes.DEVELOPER_ERR, "Attempt to send data peer to peer without establishing a data channel to " + destUser + ' first.');
        }
        else if (!easyRTC.peerConns[destUser].dataChannelReady) {
            easyRTC.showError(easyRTC.errCodes.DEVELOPER_ERR, "Attempt to use data channel to " + destUser + " before it's ready to send.");
        }
        else {
            easyRTC.peerConns[destUser].dataChannelS.send(flattenedData);
        }
    };

   
    
    /** Sends data to another user using websockets. Messages are received by the other party's peerListener.
     * @param {String} destination - either a string containing the easyrtcId of the other user, or an object containing some subset of the following fields: targetEasyrtcid, targetGroup, targetRoom.
     * Specifying multiple fields restricts the scope of the destination (operates as a logical AND, not a logical OR).
     * @param {String msgType
     * @param {String} data - an object which can be JSON'ed.
     * @param {Function} ackHandler - by default, the ackhandler handles acknowledgements from the server that your message was delivered to it's destination.
     * However, application logic in the server can over-ride this. If you leave this null, a stub ackHandler will be used. The ackHandler
     * gets passed a message with the same msgType as your outgoing message, or a message type of "error" in which case
     * msgData will contain a errorCode and errorText fields.
     * @example 
     *    easyRTC.sendDataWS(someEasyrtcid, "setPostalAddress", {room:499, bldgNum:'asd'}, 
     *      function(ackmessage){
     *          console.log("saw the following acknowledgement " + JSON.stringify(ackmessage));
     *      }
     *    );
     */
    easyRTC.sendDataWS = function(destination, msgType, data, ackhandler) {
        if (easyRTC.debugPrinter) {
            easyRTC.debugPrinter("sending client message via websockets to " + destination + " with data=" + JSON.stringify(data));
        }
        if (!ackhandler) {
            ackhandler = function() {
            };
        }
        
        var outgoingMessage = {
            msgType: msgType,
            msgData: data
        };
        if( typeof destination === 'string') {
            outgoingMessage.targetEasyrtcid = destination;
        }
        else if( typeof destination === 'object') {
            if( destination.targetEasyrtcid ) {
                outgoingMessage.targetEasyrtcid = destination.targetEasyrtcid;
            }
            if( destination.targetRoom ) {
                outgoingMessage.targetRoom = destination.targetRoom;
            }
            if( destination.targetGroup ) {
                outgoingMessage.targetGroup = destination.targetGroup;
            }
        }
       
        if (easyRTC.webSocket) {
            easyRTC.webSocket.json.emit("easyrtcMsg", outgoingMessage, ackhandler);
        }
        else {
            if (easyRTC.debugPrinter) {
                easyRTC.debugPrinter("websocket failed because no connection to server");
            }
            throw "Attempt to send message without a valid connection to the server.";
        }
    };
    /** Sends data to another user. This method uses datachannels if one has been set up, or websockets otherwise.
     * @param {String} destUser (an easyrtcid)
     * @param {String} msgType
     * @param {String} data - an object which can be JSON'ed.
     * @example 
     *    easyRTC.sendData(someEasyrtcid, {room:499, bldgNum:'asd'});
     */
    easyRTC.sendData = function(destUser, msgType, data) {
        if (easyRTC.peerConns[destUser] && easyRTC.peerConns[destUser].dataChannelReady) {
            easyRTC.sendDataP2P(destUser, msgType, data);
        }
        else {
            easyRTC.sendDataWS(destUser, msgType, data);
        }
    };

    function haveTracks(easyrtcid, checkAudio) {
        var peerConnObj = easyRTC.peerConns[easyrtcid];
        if (!peerConnObj) {
            return true;
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
     * @return {boolean} 
     */
    easyRTC.haveAudioTrack = function(easyrtcid) {
        return haveTracks(easyrtcid, true);
    };
    /** Determines if a particular peer2peer connection has a video track.
     * @param easyrtcid - the id of the other caller in the connection.
     * @return {string} "yes", "no", "unknown"
     */
    easyRTC.haveVideoTrack = function(easyrtcid) {
        return haveTracks(easyrtcid, false);
    };
    /** Value returned by easyRTC.getConnectStatus if the other user isn't connected. */
    easyRTC.NOT_CONNECTED = "not connected";
    /** Value returned by easyRTC.getConnectStatus if the other user is in the process of getting connected */
    easyRTC.BECOMING_CONNECTED = "connection in progress";
    /** Value returned by easyRTC.getConnectStatus if the other user is connected. */
    easyRTC.IS_CONNECTED = "is connected";
    /**
     * Return true if the client has a peer-2-peer connection to another user.
     * The return values are text strings so you can use them in debugging output.
     *  @param {String} otherUser - the easyrtcid of the other user.
     *  @return {String} one of the following values: easyRTC.NOT_CONNECTED, easyRTC.BECOMING_CONNECTED, easyRTC.IS_CONNECTED
     *  @example
     *     if( easyRTC.getConnectStatus(otherEasyrtcid) == easyRTC.NOT_CONNECTED ) {
     *         easyRTC.connect(otherEasyrtcid, 
     *                  function() { console.log("success"); },
     *                  function() { console.log("failure"); });
     *     }
     */
    easyRTC.getConnectStatus = function(otherUser) {
        if (typeof easyRTC.peerConns[otherUser] === 'undefined') {
            return easyRTC.NOT_CONNECTED;
        }
        var peer = easyRTC.peerConns[otherUser];
        if ((peer.sharingAudio || peer.sharingVideo) && !peer.startedAV) {
            return easyRTC.BECOMING_CONNECTED;
        }
        else if (peer.sharingData && !peer.dataChannelReady) {
            return easyRTC.BECOMING_CONNECTED;
        }
        else {
            return easyRTC.IS_CONNECTED;
        }
    };
    //
    // Builds the constraints object for creating peer connections. This used to be
    // inline but it's needed by the jssip connector as well.
    //

    /**
     * @private
     */
    easyRTC.buildPeerConstraints = function() {
        var options = [];
        options.push({'DtlsSrtpKeyAgreement': 'true'}); // for interoperability

        if (easyRTC.dataEnabled) {
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
     *    easyRTC.call( otherEasyrtcid, 
     *        function(easyrtcid, mediaType) {
     *           console.log("Got mediatype " + mediaType + " from " + easyRTC.idToName(easyrtcid);
     *        },
     *        function(errMessage) {
     *           console.log("call to  " + easyRTC.idToName(otherEasyrtcid) + " failed:" + errMessage);
     *        },
     *        function(wasAccepted, easyrtcid) {
     *            if( wasAccepted ) {
     *               console.log("call accepted by " + easyRTC.idToName(easyrtcid));
     *            }
     *            else {
     *                console.log("call rejected" + easyRTC.idToName(easyrtcid));
     *            }
     *        });       
     */
    easyRTC.call = function(otherUser, callSuccessCB, callFailureCB, wasAcceptedCB) {
        if (easyRTC.debugPrinter) {
            easyRTC.debugPrinter("initiating peer to peer call to " + otherUser +
                    " audio=" + easyRTC.audioEnabled +
                    " video=" + easyRTC.videoEnabled +
                    " data=" + easyRTC.dataEnabled);
        }
        var i;
        //
        // If we are sharing audio/video and we haven't allocated the local media stream yet,
        // we'll do so, recalling ourself on success.
        //
        if (easyRTC.localStream === null && (easyRTC.audioEnabled || easyRTC.videoEnabled)) {
            easyRTC.initMediaSource(function() {
                easyRTC.call(otherUser, callSuccessCB, callFailureCB, wasAcceptedCB);
            }, callFailureCB);
            return;
        }


        if (!easyRTC.webSocket) {
            var message = "Attempt to make a call prior to connecting to service";
            if (easyRTC.debugPrinter) {
                easyRTC.debugPrinter(message);
            }
            throw message;
        }

        if (easyRTC.sipUA) {
//
// The standard sip address starts with "sip:". 
//
            for (i in easyRTC.sipProtocols) {
                if (otherUser.indexOf(easyRTC.sipProtocols[i]) === 0) {
                    easyRTC.sipCall(otherUser, callSuccessCB, callFailureCB, wasAcceptedCB);
                    return;
                }
            }
        }


//
// If B calls A, and then A calls B before accepting, then A should treat the attempt to 
// call B as a positive offer to B's offer.
//
        if (easyRTC.offersPending[otherUser]) {
            wasAcceptedCB(true);
            doAnswer(otherUser, easyRTC.offersPending[otherUser]);
            delete easyRTC.offersPending[otherUser];
            easyRTC.callCancelled(otherUser, false);
            return;
        }

// do we already have a pending call?
        if (typeof easyRTC.acceptancePending[otherUser] !== 'undefined') {
            message = "Call already pending acceptance";
            if (easyRTC.debugPrinter) {
                easyRTC.debugPrinter(message);
            }
            callFailureCB(message);
            return;
        }

        easyRTC.acceptancePending[otherUser] = true;
        var pc = buildPeerConnection(otherUser, true, callFailureCB);
        if (!pc) {
            message = "buildPeerConnection failed, call not completed";
            if (easyRTC.debugPrinter) {
                easyRTC.debugPrinter(message);
            }
            return;
        }
        easyRTC.peerConns[otherUser].callSuccessCB = callSuccessCB;
        easyRTC.peerConns[otherUser].callFailureCB = callFailureCB;
        easyRTC.peerConns[otherUser].wasAcceptedCB = wasAcceptedCB;
        var peerConnObj = easyRTC.peerConns[otherUser];
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
        if (easyRTC.videoBandwidthString !== "") {
            var pieces = sd.sdp.split('\n');
            for (var i = pieces.length - 1; i >= 0; i--) {
                if (pieces[i].indexOf("m=video") === 0) {
                    for (var j = i; j < i + 10 && pieces[j].indexOf("a=") === -1 &&
                            pieces[j].indexOf("k=") === -1; j++) {
                    }
                    pieces.splice(j, 0, (easyRTC.videoBandwidthString + "\r"));
                }
            }
            sd.sdp = pieces.join("\n");
        }
    }



    function hangupBody(otherUser) {
        if (easyRTC.debugPrinter) {
            easyRTC.debugPrinter("Hanging up on " + otherUser);
        }
        clearQueuedMessages(otherUser);
        if (easyRTC.peerConns[otherUser]) {
            if (easyRTC.peerConns[otherUser].startedAV) {
                try {
                    easyRTC.peerConns[otherUser].pc.close();
                } catch (ignoredError) {
                }

                if (easyRTC.onStreamClosed) {
                    easyRTC.onStreamClosed(otherUser);
                }
            }

            easyRTC.peerConns[otherUser].cancelled = true;
            delete easyRTC.peerConns[otherUser];
            if (easyRTC.webSocket) {
                sendSignalling(otherUser, "hangup", null, function() {
                }, function(msg) {
                    if (easyRTC.debugPrinter) {
                        debugPrinter("hangup failed:" + msg);
                    }
                });
            }
            if (easyRTC.acceptancePending[otherUser]) {
                delete easyRTC.acceptancePending[otherUser];
            }
        }
    }

    /**
     * Hang up on a particular user or all users.
     *  @param {String} otherUser - the easyrtcid of the person to hang up on.
     *  @example
     *     easyRTC.hangup(someEasyrtcid);
     */
    easyRTC.hangup = function(otherUser) {
        hangupBody(otherUser);
        easyRTC.updateConfigurationInfo();
    };
    /**
     * Hangs up on all current connections.
     * @example
     *    easyRTC.hangupAll();
     */
    easyRTC.hangupAll = function() {
        var sawAConnection = false;
        for (otherUser in easyRTC.peerConns) {
            sawAConnection = true;
            hangupBody(otherUser);
            if (easyRTC.webSocket) {
                sendSignalling(otherUser, "hangup", null, function() {
                }, function(msg) {
                    if (easyRTC.debugPrinter) {
                        easyRTC.debugPrinter("hangup failed:" + msg);
                    }
                });
            }
        }
        if (sawAConnection) {
            easyRTC.updateConfigurationInfo();
        }
    };


    var buildPeerConnection = function(otherUser, isInitiator, failureCB) {
        var pc;
        var message;

        if (easyRTC.debugPrinter) {
            easyRTC.debugPrinter("building peer connection to " + otherUser);
        }


        try {
            pc = easyRTC.createRTCPeerConnection(easyRTC.pc_config, easyRTC.buildPeerConstraints());
            if (!pc) {
                message = "Unable to create PeerConnection object, check your ice configuration(" +
                        JSON.stringify(easyRTC.pc_config) + ")";
                if (easyRTC.debugPrinter) {
                    easyRTC.debugPrinter(message);
                }
                throw(message);
            }

            //
            // turn off data channel support if the browser doesn't support it.
            //
            if (easyRTC.dataEnabled && typeof pc.createDataChannel === 'undefined') {
                easyRTC.dataEnabled = false;
            }


            pc.onconnection = function() {
                if (easyRTC.debugPrinter) {
                    easyRTC.debugPrinter("onconnection called prematurely");
                }
            };

            var newPeerConn = {
                pc: pc,
                candidatesToSend: [],
                startedAV: false,
                isInitiator: isInitiator
            };

            pc.onicecandidate = function(event) {
//                if (easyRTC.debugPrinter) {
//                    easyRTC.debugPrinter("saw ice message:\n" + event.candidate);
//                }
                if (newPeerConn.cancelled) {
                    return;
                }
                if (event.candidate && easyRTC.peerConns[otherUser]) {
                    var candidateData = {
                        type: 'candidate',
                        label: event.candidate.sdpMLineIndex,
                        id: event.candidate.sdpMid,
                        candidate: event.candidate.candidate
                    };
                    if (easyRTC.peerConns[otherUser].startedAV) {
                        
                        sendSignalling(otherUser, "candidate", candidateData, null, function(){
                            failureCB("Candidate disappeared");
                        });
                    }
                    else {
                        easyRTC.peerConns[otherUser].candidatesToSend.push(candidateData);
                    }
                }
            };

            pc.onaddstream = function(event) {
                if (easyRTC.debugPrinter) {
                    easyRTC.debugPrinter("saw incoming media stream");
                }
                if (newPeerConn.cancelled)
                    return;
                easyRTC.peerConns[otherUser].startedAV = true;
                easyRTC.peerConns[otherUser].sharingAudio = easyRTC.haveAudioVideo.audio;
                easyRTC.peerConns[otherUser].sharingVideo = easyRTC.haveAudioVideo.video;
                easyRTC.peerConns[otherUser].connectTime = new Date().getTime();
                easyRTC.peerConns[otherUser].stream = event.stream;

                if (easyRTC.peerConns[otherUser].callSuccessCB) {
                    if (easyRTC.peerConns[otherUser].sharingAudio || easyRTC.peerConns[otherUser].sharingVideo) {
                        easyRTC.peerConns[otherUser].callSuccessCB(otherUser, "audiovideo");
                    }
                }
                if (easyRTC.audioEnabled || easyRTC.videoEnabled) {
                    updateConfiguration();
                }
                if (easyRTC.streamAcceptor) {
                    easyRTC.streamAcceptor(otherUser, event.stream);
                }
            };

            pc.onremovestream = function(event) {
                if (easyRTC.debugPrinter) {
                    easyRTC.debugPrinter("saw remove on remote media stream");
                }
//                console.log("saw onremovestream ", event);
                if (easyRTC.peerConns[otherUser]) {
                    easyRTC.peerConns[otherUser].stream = null;
                    if (easyRTC.onStreamClosed) {
                        easyRTC.onStreamClosed(otherUser);
                    }
                    delete easyRTC.peerConns[otherUser];
                    easyRTC.updateConfigurationInfo();
                }

            };
            easyRTC.peerConns[otherUser] = newPeerConn;

        } catch (e) {
            if (easyRTC.debugPrinter) {
                easyRTC.debugPrinter(JSON.stringify(e));
            }
            failureCB(e.message);
            return null;
        }

        if (easyRTC.videoEnabled || easyRTC.audioEnabled) {
            if (easyRTC.localStream === null) {
                message = "Application program error: attempt to share audio or video before calling easyRTC.initMediaSource.";
                if (easyRTC.debugPrinter) {
                    easyRTC.debugPrinter(message);
                }
                alert(message);
            }
            else {
                if (easyRTC.debugPrinter) {
                    easyRTC.debugPrinter("adding local media stream to peer connection");
                }
                pc.addStream(easyRTC.localStream);
            }
        }


        function initOutGoingChannel(otherUser) {
            if (easyRTC.debugPrinter) {
                easyRTC.debugPrinter("saw initOutgoingChannel call");
            }
            var dataChannel = pc.createDataChannel(easyRTC.datachannelName, easyRTC.datachannelConstraints);
            easyRTC.peerConns[otherUser].dataChannelS = dataChannel;
            if (!easyRTC.isMozilla) {
                easyRTC.peerConns[otherUser].dataChannelR = dataChannel;
            }

            if (!easyRTC.isMozillia) {
                dataChannel.onmessage = function(event) {
                    if (easyRTC.debugPrinter) {
                        easyRTC.debugPrinter("saw dataChannel.onmessage event");
                    }
                    if (easyRTC.receivePeerCB) {
                        easyRTC.receivePeerCB(otherUser, JSON.parse(event.data), null);
                    }
                };

            }
            //   dataChannel.binaryType = "blob";

            dataChannel.onopen = function(event) {
                if (easyRTC.debugPrinter) {
                    easyRTC.debugPrinter("saw dataChannel.onopen event");
                }
                if (easyRTC.peerConns[otherUser]) {
                    easyRTC.peerConns[otherUser].dataChannelReady = true;

                    if (easyRTC.peerConns[otherUser].callSuccessCB) {
                        easyRTC.peerConns[otherUser].callSuccessCB(otherUser, "datachannel");
                    }
                    if (easyRTC.onDataChannelOpen) {
                        easyRTC.onDataChannelOpen(otherUser);
                    }
                    easyRTC.updateConfigurationInfo();
                }
            };
            dataChannel.onclose = function(event) {
                if (easyRTC.debugPrinter) {
                    easyRTC.debugPrinter("saw dataChannelS.onclose event");
                }
                if (easyRTC.peerConns[otherUser]) {
                    easyRTC.peerConns[otherUser].dataChannelReady = false;
                    delete easyRTC.peerConns[otherUser].dataChannelS;
                }
                if (easyRTC.onDataChannelClose) {
                    easyRTC.onDataChannelClose(otherUser);
                }

                easyRTC.updateConfigurationInfo();
            };
        }

        function initIncomingChannel(otherUser) {
            if (easyRTC.debugPrinter) {
                easyRTC.debugPrinter("initializing incoming channel handler for " + otherUser);
            }
            easyRTC.peerConns[otherUser].pc.ondatachannel = function(event) {
                if (easyRTC.debugPrinter) {
                    easyRTC.debugPrinter("saw incoming data channel");
                }

                var dataChannel = event.channel;
                easyRTC.peerConns[otherUser].dataChannelR = dataChannel;
                if (!easyRTC.isMozilla) {
                    easyRTC.peerConns[otherUser].dataChannelS = dataChannel;
                    easyRTC.peerConns[otherUser].dataChannelReady = true;
                }
                dataChannel.onmessage = function(event) {
                    if (easyRTC.debugPrinter) {
                        easyRTC.debugPrinter("saw dataChannel.onmessage event");
                    }
                    if (easyRTC.receivePeerCB) {
                        easyRTC.receivePeerCB(otherUser, JSON.parse(event.data), null);
                    }
                };
                dataChannel.onclose = function(event) {
                    if (easyRTC.debugPrinter) {
                        easyRTC.debugPrinter("saw dataChannelR.onclose event");
                    }
                    if (easyRTC.peerConns[otherUser]) {
                        easyRTC.peerConns[otherUser].dataChannelReady = false;
                        delete easyRTC.peerConns[otherUser].dataChannelR;
                    }
                    if (easyRTC.onDataChannelClose) {
                        easyRTC.onDataChannelClose(openUser);
                    }
                    easyRTC.updateConfigurationInfo();
                };
            };
        }


        //
        //  added for interoperability
        //
        if (easyRTC.isMozilla) {
            if (!easyRTC.dataEnabled) {
                mediaConstraints.mandatory.MozDontOfferDataChannel = true;
            }
            else {
                delete mediaConstraints.mandatory.MozDontOfferDataChannel;
            }
        }

        if (easyRTC.dataEnabled) {
            if (isInitiator || easyRTC.isMozilla) {
                try {
                    initOutGoingChannel(otherUser);
                } catch (channelErrorEvent) {
                    failureCB(easyRTC.formatError(channelErrorEvent));
                }
            }
            if (!isInitiator || easyRTC.isMozilla) {
                initIncomingChannel(otherUser);
            }
        }



        pc.onconnection = function() {
            if (easyRTC.debugPrinter) {
                easyRTC.debugPrinter("setup pc.onconnection ");
            }
        };
        return pc;

    };

    var doAnswer = function(caller, msgData) {

        console.log("doAnswer caller=", caller);
        if (!easyRTC.localStream && (easyRTC.videoEnabled || easyRTC.audioEnabled)) {
            easyRTC.initMediaSource(
                    function(s) {
                        doAnswer(caller, msgData);
                    },
                    function(err) {
                        easyRTC.showError(easyRTC.errCodes.MEDIA_ERR, "Error getting local media stream: " + err);
                    });
            return;
        }
        else if (easyRTC.dataEnabled && !easyRTC.videoEnabled && !easyRTC.audioEnabled
                && navigator.mozGetUserMedia && easyRTC.mozFakeStream === null) {
            navigator.mozGetUserMedia({
                audio: true,
                fake: true
            }, function(s) {
                if (!s) {
                    easyRTC.showError(easyRTC.errCodes.MEDIA_ERR, "Error getting fake media stream for Firefox datachannels: null stream");
                }
                easyRTC.mozFakeStream = s;
                doAnswer(caller, msgData);
            }, function(err) {
                easyRTC.showError(easyRTC.errCodes.MEDIA_ERR, "Error getting fake media stream for Firefox datachannels: " + err);
            });
            return;
        }


        var pc = buildPeerConnection(caller, false, function(message) {
            easyRTC.showError(easyRTC.errCodes.SYSTEM_ERR, message);
        });
        var newPeerConn = easyRTC.peerConns[caller];
        if (!pc) {
            if (easyRTC.debugPrinter) {
                easyRTC.debugPrinter("buildPeerConnection failed. Call not answered");
            }
            return;
        }
        var setLocalAndSendMessage1 = function(sessionDescription) {
            if (newPeerConn.cancelled)
                return;
            var sendAnswer = function() {
                if (easyRTC.debugPrinter) {
                    easyRTC.debugPrinter("sending answer");
                }
                sendSignalling(caller, "answer", sessionDescription,
                        null,
                        function(errorCode, errorText) {
                            delete easyRTC.peerConns[caller];
                            easyRTC.showError(errorCode, errorText);
                        });
                easyRTC.peerConns[caller].startedAV = true;
                if (pc.connectDataConnection) {
                    if (easyRTC.debugPrinter) {
                        easyRTC.debugPrinter("calling connectDataConnection(5002,5001)");
                    }
                    pc.connectDataConnection(5002, 5001);
                }
            };
            pc.setLocalDescription(sessionDescription, sendAnswer, function(message) {
                easyRTC.showError(easyRTC.errCodes.INTERNAL_ERR, "setLocalDescription: " + message);
            });
        };
        var sd = null;
        if (window.mozRTCSessionDescription) {
            sd = new mozRTCSessionDescription(msgData);
        }
        else {
            sd = new RTCSessionDescription(msgData);
        }
        if (easyRTC.debugPrinter) {
            easyRTC.debugPrinter("sdp ||  " + JSON.stringify(sd));
        }
        var invokeCreateAnswer = function() {
            if (newPeerConn.cancelled)
                return;
            pc.createAnswer(setLocalAndSendMessage1,
                    function(message) {
                        easyRTC.showError(easyRTC.errCodes.INTERNAL_ERR, "create-answer: " + message);
                    },
                    mediaConstraints);
        };
        if (easyRTC.debugPrinter) {
            easyRTC.debugPrinter("about to call setRemoteDescription in doAnswer");
        }
        try {
//    limitBandWidth(sd);
            pc.setRemoteDescription(sd, invokeCreateAnswer, function(message) {
                easyRTC.showError(easyRTC.errCodes.INTERNAL_ERR, "set-remote-description: " + message);
            });
        } catch (srdError) {
            if (easyRTC.debugPrinter) {
                easyRTC.debugPrinter("saw exception in setRemoteDescription");
            }
            easyRTC.showError(easyRTC.errCodes.INTERNAL_ERR, "setRemoteDescription failed: " + srdError.message);
        }
    };
    var onRemoteHangup = function(caller) {
        delete easyRTC.offersPending[caller];
        if (easyRTC.debugPrinter) {
            easyRTC.debugPrinter("Saw onremote hangup event");
        }
        if (easyRTC.peerConns[caller]) {
            easyRTC.peerConns[caller].cancelled = true;
            if (easyRTC.peerConns[caller].startedAV) {
                if (easyRTC.onStreamClosed) {
                    easyRTC.onStreamClosed(caller);
                }
            }
            else {
                if (easyRTC.callCancelled) {
                    easyRTC.callCancelled(caller, true);
                }
            }
            try {
                easyRTC.peerConns[caller].pc.close();
            } catch (anyErrors) {
            }
            ;
            delete easyRTC.peerConns[caller];
            easyRTC.updateConfigurationInfo();
        }
        else {
            if (easyRTC.callCancelled) {
                easyRTC.callCancelled(caller, true);
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
        for (var i in easyRTC.peerConns) {
            if (typeof connectedList[i] === 'undefined') {
                if (easyRTC.peerConns[i].startedAV) {
                    onRemoteHangup(i);
                    clearQueuedMessages(i);
                }
            }
        }
    }
    ;

    function processList(roomName, list) {
        var isPrimaryOwner = easyRTC.cookieOwner ? true : false;
        easyRTC.reducedList = {};
        for (id in list) {
            var item = list[id];
            if (item.isOwner &&
                    item.roomJoinTime < list[easyRTC.myEasyrtcid].roomJoinTime) {
                isPrimaryOwner = false;
            }
            if (id != easyRTC.myEasyrtcid) {
                easyRTC.reducedList[id] = list[id];
            }
        }
        processConnectedList(easyRTC.reducedList);
        if (easyRTC.loggedInListener) {
            easyRTC.loggedInListener(roomName, easyRTC.reducedList, isPrimaryOwner);
        }
    }



    var onChannelMsg = function(msg) {
        if (easyRTC.receivePeerCB) {
            var targetting = {};
            if( msg.targetEasyrtcId) {
                targetting.targetEasyrtcId =  msg.targetEasyrtcId;
            }
            if( msg.targetRoom) {
                targetting.targetRoom =  msg.targetRoom;
            }
            if( msg.targetGroup) {
                targetting.targetGroup =  msg.targetGroup;
            }
            easyRTC.receivePeerCB(msg.senderEasyrtcid, msg.msgType, msg.msgData, targetting);
        }
    };
    var onChannelCmd = function(msg, ackAcceptorFn) {
        if (easyRTC.debugPrinter) {
            easyRTC.debugPrinter("received message from socket server=" + JSON.stringify(msg));
        }

        var caller = msg.senderEasyrtcid;
        var msgType = msg.msgType;
        var msgData = msg.msgData;
        var pc;
        if (easyRTC.debugPrinter) {
            easyRTC.debugPrinter('received message of type ' + msgType);
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
            pc = easyRTC.peerConns[caller].pc;
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
                if (easyRTC.debugPrinter) {
                    easyRTC.debugPrinter("offer accept=" + wasAccepted);
                }
                delete easyRTC.offersPending[caller];
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
            if (easyRTC.acceptancePending[caller] && caller < easyRTC.myEasyrtcid) {
                delete easyRTC.acceptancePending[caller];
                if (queuedMessages[caller]) {
                    delete queuedMessages[caller];
                }
                if (easyRTC.peerConns[caller].wasAcceptedCB) {
                    easyRTC.peerConns[caller].wasAcceptedCB(true, caller);
                }
                delete easyRTC.peerConns[caller];
                helper(true);
                return;
            }

            easyRTC.offersPending[caller] = msgData;
            if (!easyRTC.acceptCheck) {
                helper(true);
            }
            else {
                easyRTC.acceptCheck(caller, helper);
            }
        };

        function processReject(caller) {
            delete easyRTC.acceptancePending[caller];
            if (queuedMessages[caller]) {
                delete queuedMessages[caller];
            }
            if (easyRTC.peerConns[caller]) {
                if (easyRTC.peerConns[caller].wasAcceptedCB) {
                    easyRTC.peerConns[caller].wasAcceptedCB(false, caller);
                }
                delete easyRTC.peerConns[caller];
            }
        }

        function processAnswer(caller, msgData) {
            delete easyRTC.acceptancePending[caller];
            if (easyRTC.peerConns[caller].wasAcceptedCB) {
                easyRTC.peerConns[caller].wasAcceptedCB(true, caller);
            }
            easyRTC.peerConns[caller].startedAV = true;
            for (var i = 0; i < easyRTC.peerConns[caller].candidatesToSend.length; i++) {
                sendSignalling(caller, "candidate", easyRTC.peerConns[caller].candidatesToSend[i],
                       null, 
                       function(errorCode, errorText) {
                            if (easyRTC.peerConns[caller]) {
                                delete easyRTC.peerConns[caller];
                            }
                            easyRTC.showError(errorCode, errorText);
                        }
                    );
            }

            pc = easyRTC.peerConns[caller].pc;
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
//            limitBandWidth(sd);
            if (easyRTC.debugPrinter) {
                easyRTC.debugPrinter("about to call initiating setRemoteDescription");
            }
            pc.setRemoteDescription(sd, function() {
                if (pc.connectDataConnection) {
                    if (easyRTC.debugPrinter) {
                        easyRTC.debugPrinter("calling connectDataConnection(5001,5002)");
                    }
                    pc.connectDataConnection(5001, 5002); // these are like ids for data channels
                }
            });
            flushCachedCandidates(caller);
        }

        function processCandidate(caller, msgData) {
            if (easyRTC.peerConns[caller] && easyRTC.peerConns[caller].startedAV) {
                processCandidate(msgData);
            }
            else {
                if (!easyRTC.peerConns[caller]) {
                    queuedMessages[caller] = {
                        candidates: []
                    };
                }
                queuedMessages[caller].candidates.push(msgData);
            }
        }


        switch (msgType) {
            case "token":
                processToken(msg);
                break;
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
                easyRTC.showError(msg.errorCode, msg.errorText);
                break;
            default:
                alert("received unknown message type from server, msgType is " + msgType);
                return;
                break;
        }
        if (ackAcceptorFn) {
            ackAcceptorFn(easyRTC.ackMessage);
        }
    };
    if (!window.io) {
        easyRTC.onError("Your HTML has not included the socket.io.js library");
    }

    function connectToWSServer() {
//        easyRTC.webSocket = io.connect(easyRTC.serverPath, {
//            'force new connection': true, 'connect timeout': 10000
//        });
        easyRTC.webSocket = io.connect(easyRTC.serverPath, {
            'connect timeout': 10000
        });
        if (!easyRTC.webSocket) {
            throw "io.connect failed";
        }

        easyRTC.webSocket.on('error', function() {
            if (easyRTC.myEasyrtcid) {
                easyRTC.showError(easyRTC.errCodes.SIGNAL_ERROR, "Miscellaneous error from signalling server. It may be ignorable.");
            }
            else {
                errorCallback("Unable to reach the easyRTC signalling server.");
            }
        });

        easyRTC.webSocket.on("connect", function(event) {

            easyRTC.webSocketConnected = true;
            if (!easyRTC.webSocket || !easyRTC.webSocket.socket || !easyRTC.webSocket.socket.sessionid) {
                easyRTC.showError(easyRTC.errCodes.CONNECT_ERR, "Socket.io connect event fired with bad websocket.");
            }

            if (easyRTC.debugPrinter) {
                easyRTC.debugPrinter("saw socketserver onconnect event");
            }
            if (easyRTC.webSocketConnected) {
                // sendAuthenticate();
                sendAuthenticate();
            }
            else {
                errorCallback("Internal communications failure.");
            }
        }
        );
        easyRTC.webSocket.on("easyrtcMsg", onChannelMsg);
        easyRTC.webSocket.on("easyrtcCmd", onChannelCmd);
        easyRTC.webSocket.on("disconnect", function(code, reason, wasClean) {
            console.log("saw disconnect event");
            easyRTC.webSocketConnected = false;
            easyRTC.updateConfigurationInfo = function() {
            };
            easyRTC.oldConfig = {};
            easyRTC.disconnectBody();
            if (easyRTC.disconnectListener) {
                easyRTC.disconnectListener();
            }
        });
    }
    connectToWSServer();

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

    easyRTC.oldConfig = {}; // used internally by updateConfiguration

    //
    // this function collects configuration info that will be sent to the server.
    // It returns that information, leaving it the responsibility of the caller to
    // do the actual sending.
    //
    easyRTC.collectConfigurationInfo = function() {
        var connectionList = {};
        for (var i in easyRTC.peerConns) {
            connectionList[i] = {
                connectTime: easyRTC.peerConns[i].connectTime,
//                sharingAudio: easyRTC.peerConns[i].sharingAudio ? true : false,
//                sharingVideo: easyRTC.peerConns[i].sharingVideo ? true : false,
//                sharingData: easyRTC.peerConns[i].dataChannelS ? true : false,
                isInitiator: easyRTC.peerConns[i].isInitiator ? true : false
            };
//
// getStats returns nothing of value at this point so commented out.
// 
//            if (easyRTC.peerConns[i].pc.getStats) {
//                var pc = easyRTC.peerConns[i].pc;
//                pc.getStats(function(dest) {
//                    return function(stats) {
//                        if (stats === {}) {
//                            dest.stats = "none";
//                        }
//                        else {
//                            dest.stats = stats.result();
//                            console.log("In stats");                            
//                        }
//                    };
//                }(connectionList[i]));
//            }
        }

        var newConfig = {
            userSettings: {
                sharingAudio: easyRTC.haveAudioVideo.audio ? true : false,
                sharingVideo: easyRTC.haveAudioVideo.video ? true : false,
                sharingData: easyRTC.dataEnabled ? true : false,
                nativeVideoWidth: easyRTC.nativeVideoWidth,
                nativeVideoHeight: easyRTC.nativeVideoHeight,
                windowWidth: window.innerWidth,
                windowHeight: window.innerHeight,
                screenWidth: window.screen.width,
                screenHeight: window.screen.height,
                cookieEnabled: navigator.cookieEnabled,
                os: navigator.oscpu,
                language: navigator.language
            },
            apiField: easyRTC.appDefinedFields,
            connectionList: connectionList,
        };



        if (easyRTC.userName) {
            newConfig.userName = easyRTC.userName;
        }
        return newConfig;
    };
    function updateConfiguration() {
        var newConfig = easyRTC.collectConfigurationInfo();
        //
        // we need to give the getStats calls a chance to fish out the data. 
        // The longest I've seen it take is 5 milliseconds so 100 should be overkill.
        //
        var sendDeltas = function() {
            var alteredData = findDeltas(easyRTC.oldConfig, newConfig);
            //
            // send all the configuration information that changes during the session
            //
            if (easyRTC.debugPrinter) {
                easyRTC.debugPrinter("cfg=" + JSON.stringify(alteredData.added));
            }
            if (easyRTC.webSocket) {
                sendSignalling(null, "setUserCfg", alteredData.added, null, null);
            }
            easyRTC.oldConfig = newConfig;
        };
        if (easyRTC.oldConfig === {}) {
            sendDeltas();
        }
        else {
            setTimeout(sendDeltas, 100);
        }
    }

    function processRoomData(roomData) {
        for (var roomname in roomData) {
            if (easyRTC.roomJoin[roomname]) {
                easyRTC.roomHasPassword = roomData[roomname].hasPassword;
                if (roomData[roomname].field && roomData[roomname].field.isOwner) {
                    easyRTC.cookieOwner = true;
                }

                if (roomData[roomname].list) {
                    easyRTC.lastLoggedInList = roomData[roomname].list;
                }
                else if (roomData[roomname].listDelta) {
                    var stuffToAdd = roomData[roomname].listDelta.updateConnection;
                    if (stuffToAdd) {
                        for (var id in stuffToAdd) {
                            easyRTC.lastLoggedInList[id] = stuffToAdd[id];
                        }
                    }
                    var stuffToRemove = roomData[roomname].listDelta.removeConnection;
                    if (stuffToRemove) {
                        for (var removeId in stuffToRemove) {
                            delete easyRTC.lastLoggedInList[removeId];
                        }
                    }

                }
                processList(roomname, easyRTC.lastLoggedInList);
            }
        }
    }


    function processToken(msg) {
        if (easyRTC.debugPrinter) {
            easyRTC.debugPrinter("entered process token");
        }
        if (msg.msgType == "token") {
            var msgData = msg.msgData;
            if (msgData.easyrtcid) {
                easyRTC.myEasyrtcid = msgData.easyrtcid;
            }
            if (msgData.iceConfig) {

                easyRTC.pc_config = {iceServers: []};
                for (var i in msgData.iceConfig.iceServers) {
                    var item = msgData.iceConfig.iceServers[i];
                    var fixedItem;
                    if (item.url.indexOf('turn:') == 0) {
                        if (item.username) {
                            fixedItem = createIceServer(item.url, item.username, item.credential);
                        }
                        else {
                            var parts = item.url.substring("turn:".length).split("@");
                            if (parts.length != 2) {
                                easyRTC.showError("badparam", "turn server url looked like " + item.url);
                            }
                            var username = parts[0];
                            var url = parts[1];
                            fixedItem = createIceServer(url, username, item.credential);
                        }
                    }
                    else { // is stun server entry
                        fixedItem = item;
                    }
                    easyRTC.pc_config.iceServers.push(fixedItem);
                }
            }
            if (msgData.roomData) {
                processRoomData(msg.msgData.roomData);
            }


            if (easyRTC.sipConfig && !easyRTC.sipAlreadyInitialized) {
                if (!easyRTC.initSipUa) {
                    console.log("SIP connection parameters provided but no sip stuff");
                }
                easyRTC.initSipUa();
                easyRTC.sipAlreadyInitialized = true;
            }

            if (successCallback) {
                successCallback(easyRTC.myEasyrtcid, easyRTC.cookieOwner);
            }
        }
        else if( msg.msgType === "error") { // authenticate error
            console.log( msg.msgType + ": " + msg.msgData.errorText);
            easyRTC.showError(msg.msgData.errorCode, msg.msgData.errorText);
        }
        else {
            alert("Unexpected response to authentication message");
        }
    }

    function sendAuthenticate() {

        //
        // find our easyrtsid
        //
        var easyrtcsid = null;
        if (easyRTC.cookieId && document.cookie) {
            var cookies = document.cookie.split("[; ]");
            var target = easyRTC.cookieId + "=";
            for (var i in cookies) {
                if (cookies[i].indexOf(target) === 0) {
                    var cookie = cookies[i].substring(target.length);
                    easyrtcsid = cookie;
                }
            }
        }

        if( !easyRTC.roomJoin) {
            easyRTC.roomJoin =  { "default":{roomName:"default"}};
        }
        
        var msgData = {
            apiVersion: easyRTC.apiVersion,
            applicationName: applicationName,
            roomJoin: easyRTC.roomJoin,
            easyrtcsid: easyrtcsid,
            credential: easyRTC.credential,
            setUserCfg: easyRTC.collectConfigurationInfo()
        };
        // easyRTC.sendServer("authenticate", msgData, processToken);
        easyRTC.webSocket.json.emit("easyrtcAuth",
                {msgType: "authenticate",
                    msgData: msgData
                },
        processToken);
    }


};
// this flag controls whether the initManaged routine adds close buttons to the caller
// video objects

/** @private */
easyRTC.autoAddCloseButtons = true;
/** By default, the initManaged routine sticks a "close" button on top of each caller
 * video object that it manages. Call this function (before calling initManaged) to disable that particular feature.
 * 
 */
easyRTC.dontAddCloseButtons = function() {
    easyRTC.autoAddCloseButtons = false;
}
/**
 * Provides a layer on top of the easyRTC.initMediaSource and easyRTC.connect, assign the local media stream to
 * the video object identified by monitorVideoId, assign remote video streams to
 * the video objects identified by videoIds, and then call onReady. One of it's
 * side effects is to add hangup buttons to the remote video objects, buttons
 * that only appear when you hover over them with the mouse cursor. This method will also add the 
 * easyRTCMirror class to the monitor video object so that it behaves like a mirror.
 *  @param {String} applicationName - name of the application.
 *  @param {String} monitorVideoId - the id of the video object used for monitoring the local stream.
 *  @param {Array} videoIds - an array of video object ids (strings)
 *  @param {Function} onReady - a callback function used on success.
 *  @param {Function} onFailure - a callbackfunction used on failure (failed to get local media or a connection of the signaling server).
 *  @example
 *     easyRTC.initManaged('multiChat', 'selfVideo', ['remote1', 'remote2', 'remote3'], 
 *              function() {
 *                  console.log("successfully connected.");
 *              });
 */
easyRTC.initManaged = function(applicationName, monitorVideoId, videoIds, onReady, onFailure) {
    var numPEOPLE = videoIds.length;
    var refreshPane = 0;
    var onCall = null, onHangup = null, gotMediaCallback = null, gotConnectionCallback = null;
    if (videoIds === null) {
        videoIds = [];
    }

// verify that video ids were not typos.    
    if (monitorVideoId && !document.getElementById(monitorVideoId)) {
        easyRTC.showError(easyRTC.errCodes.DEVELOPER_ERR, "The monitor video id passed to initManaged was bad, saw " + monitorVideoId);
        return;
    }

    document.getElementById(monitorVideoId).muted = "muted";
    for (var i in videoIds) {
        var name = videoIds[i];
        if (!document.getElementById(name)) {
            easyRTC.showError(easyRTC.errCodes.DEVELOPER_ERR, "The caller video id '" + name + "' passed to initManaged was bad.");
            return;
        }
    }
    /** Sets an event handler that gets called when the local media stream is
     *  created or not. Can only be called after calling easyRTC.initManaged.
     *  @param {Function} gotMediaCB has the signature function(gotMedia, why)
     *  @example 
     *     easyRTC.setGotMedia( function(gotMediaCB, why) {
     *         if( gotMedia ) {
     *             console.log("Got the requested user media");
     *         }
     *         else {
     *             console.log("Failed to get media because: " +  why);
     *         }
     *     });
     */
    easyRTC.setGotMedia = function(gotMediaCB) {
        gotMediaCallback = gotMediaCB;
    };
    /** Sets an event handler that gets called when a connection to the signalling
     * server has or has not been made. Can only be called after calling easyRTC.initManaged.
     * @param {Function} gotConnectionCB has the signature (gotConnection, why)
     * @example 
     *    easyRTC.setGotConnection( function(gotConnection, why) {
     *        if( gotConnection ) {
     *            console.log("Successfully connected to signalling server");
     *        }
     *        else {
     *            console.log("Failed to connect to signalling server because: " + why);
     *        }
     *    });
     */
    easyRTC.setGotConnection = function(gotConnectionCB) {
        gotConnectionCallback = gotConnectionCB;
    };
    /** Sets an event handler that gets called when a call is established.
     * It's only purpose (so far) is to support transitions on video elements.
     * This function is only defined after easyRTC.initManaged is called.
     * The slot argument is the index into the array of video ids.
     * @param {Function} cb has the signature function(easyrtcid, slot) {}
     * @example
     *   easyRTC.setOnCall( function(easyrtcid, slot) { 
     *      console.log("call with " + easyrtcid + "established");
     *   }); 
     */
    easyRTC.setOnCall = function(cb) {
        onCall = cb;
    };
    /** Sets an event handler that gets called when a call is ended.
     * it's only purpose (so far) is to support transitions on video elements.
     x     * this function is only defined after easyRTC.initManaged is called.
     * The slot is parameter is the index into the array of video ids.
     * Note: if you call easyRTC.getConnectionCount() from inside your callback
     * it's count will reflect the number of connections before the hangup started.
     * @param {Function} cb has the signature function(easyrtcid, slot) {}
     * @example
     *   easyRTC.setOnHangup( function(easyrtcid, slot) { 
     *      console.log("call with " + easyrtcid + "ended");
     *   }); 
     */
    easyRTC.setOnHangup = function(cb) {
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


    easyRTC.getIthCaller = function(i) {
        if (i < 0 || i > videoIds.length) {
            return null;
        }
        return getIthVideo(i).caller;
    };
    easyRTC.getSlotOfCaller = function(easyrtcid) {
        for (var i = 0; i < numPEOPLE; i++) {
            if (easyRTC.getIthCaller(i) === easyrtcid) {
                return i;
            }
        }
        return -1; // caller not connected
    };
    easyRTC.setOnStreamClosed(function(caller) {
        for (var i = 0; i < numPEOPLE; i++) {
            var video = getIthVideo(i);
            if (video.caller === caller) {
                easyRTC.setVideoObjectSrc(video, "");
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
    easyRTC.setAcceptChecker(function(caller, helper) {
        for (var i = 0; i < numPEOPLE; i++) {
            var video = getIthVideo(i);
            if (video.caller === "") {
                helper(true);
                return;
            }
        }
        helper(false);
    });
    easyRTC.setStreamAcceptor(function(caller, stream) {
        if (easyRTC.debugPrinter) {
            easyRTC.debugPrinter("stream acceptor called");
        }
        var i, video;
        if (refreshPane && refreshPane.caller === "") {
            easyRTC.setVideoObjectSrc(video, stream);
            if (onCall) {
                onCall(caller);
            }
            refreshPane = null;
            return;
        }
        for (i = 0; i < numPEOPLE; i++) {
            video = getIthVideo(i);
            if (video.caller === caller) {
                easyRTC.setVideoObjectSrc(video, stream);
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
                easyRTC.setVideoObjectSrc(video, stream);
                return;
            }
        }
//
// no empty slots, so drop whatever caller we have in the first slot and use that one.
//
        video = getIthVideo(0);
        if (video) {
            easyRTC.hangup(video.caller);
            easyRTC.setVideoObjectSrc(video, stream);
            if (onCall) {
                onCall(caller, 0);
            }
        }
        video.caller = caller;
    });
    if (easyRTC.autoAddCloseButtons) {
        var addControls = function(video) {
            var parentDiv = video.parentNode;
            video.caller = "";
            var closeButton = document.createElement("div");
            closeButton.className = "closeButton";
            closeButton.onclick = function() {
                if (video.caller) {
                    easyRTC.hangup(video.caller);
                    easyRTC.setVideoObjectSrc(video, "");
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
    if (easyRTC.videoEnabled && monitorVideoId !== null) {
        monitorVideo = document.getElementById(monitorVideoId);
        if (!monitorVideo) {
            alert("Programmer error: no object called " + monitorVideoId);
            return;
        }
        monitorVideo.muted = "muted";
        monitorVideo.defaultMuted = true;
    }


    var nextInitializationStep;
    if (easyRTC.debugPrinter) {
        easyRTC.debugPrinter("No sip initialization ");
    }
    nextInitializationStep = function(token, isOwner) {
        if (gotConnectionCallback) {
            gotConnectionCallback(true, "");
        }
        onReady(easyRTC.myEasyrtcid, easyRTC.cookieOwner);
    };
    easyRTC.initMediaSource(
            function() {
                if (gotMediaCallback) {
                    gotMediaCallback(true, null);
                }
                if (monitorVideo !== null) {
                    easyRTC.setVideoObjectSrc(monitorVideo, easyRTC.getLocalStream());
                }
                function connectError(why) {
                    if (gotConnectionCallback) {
                        gotConnectionCallback(false, why);
                    }
                    else {
                        easyRTC.showError(easyRTC.errCodes.CONNECT_ERR, why);
                    }
                    if (onFailure) {
                        onFailure(why);
                    }
                }
                easyRTC.connect(applicationName, nextInitializationStep, connectError);
            },
            function(errmesg) {
                if (gotMediaCallback) {
                    gotMediaCallback(false, errmesg);
                }
                else {
                    easyRTC.showError(easyRTC.errCodes.MEDIA_ERR, errmesg);
                }
                if (onFailure) {
                    onFailure(why);
                }
            }
    );
};

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
