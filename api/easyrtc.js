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

    //
    // better version detection for gecko based browsers provided by
    // KÃ©vin Poulet.
    //
    var matches = navigator.userAgent.match(/\srv:([0-9]+)\./);
    if (matches !== null && matches.length > 1) {
        webrtcDetectedVersion = parseInt(matches[1]);
    }

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
        var turn_url_parts;
        if (url_parts[0].indexOf('stun') === 0) {
            // Create iceServer with stun url.
            iceServer = {'url': url};
        } else if (url_parts[0].indexOf('turn') === 0 &&
                (url.indexOf('transport=udp') !== -1 ||
                        url.indexOf('?transport') === -1)) {
            // Create iceServer with turn url.
            // Ignore the transport parameter from TURN url.
            turn_url_parts = url.split("?");
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
        var url_turn_parts;
        var url_parts = url.split(':');
        if (url_parts[0].indexOf('stun') === 0) {
// Create iceServer with stun url.
            iceServer = {'url': url};
        } else if (url_parts[0].indexOf('turn') === 0) {
            if (webrtcDetectedVersion < 28) {
// For pre-M28 chrome versions use old TURN format.
                url_turn_parts = url.split("turn:");
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
//} else if( window.ActiveXObject ){ // appears to IE so check for the wrapper.
//    var head = document.getElementsByTagName('head')[0];
//    var i;
//    var adapterAddress;
//    var wrapperPresent = false;
//
//    //
//    // we look for the adapter as well as the wrapper because if we don't find the
//    // wrapper, we'll look for it in the same directory as the adapter was found.
//    //
//    for( i = 0; i < head.childNodes.length; i++) {
//        var child = head.childNodes[i];
//        if( /\/adapter.js$/.test(child.src)) {
//            adapterAddress = child.src;
//        }
//        else if( /\/rtcplugin.js$/.test(child.src)) {
//            wrapperPresent = true;
//        }
//    }
//
//
//    if( wrapperPresent) {
//        addIEDeclarations();
//    }
//    else if( adapterAddress) {
//        var script = document.createElement('script');
//        script.type = 'text/javascript';
//        script.src = adapterAddress.replace(/\/adapter.js$/, "/rtcplugin.js");
//        src.onload = addIEDeclarations;
//        src.onerror = function () {
//            alert("Developer error: this page requires the Priologic IE Webrtc plugin wrapper (rtcplugin.js) to run when using Internet Explorer, which the developer has not supplied.");
//            throw new Error("No rtcplugin.js found. It should be in the same folder as your adapter.js or you can include it yourself before the adapter.js");
//        }
//        head.appendChild(script);
//    }
} else {
    console.log("Browser does not appear to be WebRTC-capable");
}

if (!window.createIceServer) {
    window.createIceServer = function(url, username, credential) {
        return {'url': url, 'credential': credential, 'username': username};
    };
}/** @class
 *@version 1.0.13
 *<p>
 * Provides client side support for the EasyRTC framework.
 * Please see the easyrtc_client_api.md and easyrtc_client_tutorial.md
 * for more details.</p>
 *
 *<p>
 *copyright Copyright (c) 2014, Priologic Software Inc.
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

var Easyrtc = function() {
    var self = this;
    var isFirefox = (webrtcDetectedBrowser === "firefox");
    var autoInitUserMedia = true;
    var sdpLocalFilter = null,
            sdpRemoteFilter = null;
    var iceCandidateFilter = null;
    
    var connectionOptions =  {
                'connect timeout': 10000,
                'force new connection': true
            };
   
    /**
     * Sets functions which filter sdp records before calling setLocalDescription or setRemoteDescription.
     * This is advanced functionality which can break things, easily. See the easyrtc_rates.js file for a
     * filter builder.
     * @param {Function} localFilter a function that takes an sdp string and returns an sdp string.
     * @param {Function} remoteFilter a function that takes an sdp string and returns an sdp string.
     */
    this.setSdpFilters = function(localFilter, remoteFilter) {
        sdpLocalFilter = localFilter;
        sdpRemoteFilter = remoteFilter;
    };

   /**
    * Sets a function which filters IceCandidate records being sent or received.
    *
    * Candidate records can be received while they are being generated locally (before being 
    * sent to a peer), and after they are received by the peer. The filter receives two arguments, the candidate record and a boolean 
    * flag that is true for a candidate being received from another peer,  
    * and false for a candidate that was generated locally. The candidate record has the form:
    *  {type: 'candidate', label: sdpMLineIndex, id: sdpMid, candidate: candidateString}
    * The function should return one of the following: the input candidate record, a modified candidate record, or null (indicating that the
    * candidate should be discarded).
    * @param {Function} filter
    * @param {String} isIncoming 
    * @return an ice candidate record or null.
    */
   this.setIceCandidateFilter = function(filter) {
      iceCandidateFilter = filter;
   }

    /**
     * Controls whether a default local media stream should be acquired automatically during calls and accepts
     * if a list of streamNames is not supplied. The default is true, which mimicks the behaviour of earlier releases
     * that didn't support multiple streams. This function should be called before easyrtc.call or before entering an 
     * accept  callback.
     * @param {Boolean} flag true to allocate a default local media stream.
     */
    this.setAutoInitUserMedia = function(flag) {
        autoInitUserMedia = !!flag;
    }
    /**
     * This function performs a printf like formatting. It actually takes an unlimited
     * number of arguments, the declared arguments arg1, arg2, arg3 are present just for
     * documentation purposes.
     * @param {String} format A string like "abcd{1}efg{2}hij{1}."
     * @param {String} arg1 The value that replaces {1}
     * @param {String} arg2 The value that replaces {2}
     * @param {String} arg3 The value that replaces {3}
     * @returns {String} the formatted string.
     */
    this.format = function(format, arg1, arg2, arg3) {
        var formatted = arguments[0];
        for (var i = 1; i < arguments.length; i++) {
            var regexp = new RegExp('\\{' + (i - 1) + '\\}', 'gi');
            formatted = formatted.replace(regexp, arguments[i]);
        }
        return formatted;
    };
    /** @private */
    var haveAudioVideo = {audio: false, video: false};
//
// Maps a key to a language specific string using the easyrtc_constantStrings map.
// Defaults to the key if the key can not be found, but outputs a warning in that case.
// This function is only used internally by easyrtc.js 
//
    /**
     * @private
     * @param {String} key
     */
    this.getConstantString = function(key) {
        if (easyrtc_constantStrings[key]) {
            return easyrtc_constantStrings[key];
        }
        else {
            console.warn("Could not find key='" + key + "' in easyrtc_constantStrings");
            return key;
        }
    };
    //
    // this is a list of the events supported by the generalized event listener.
    //
    var allowedEvents = {
        roomOccupant: true,  // this receives the list of everybody in any room you belong to
        roomOccupants: true  // this receives a {roomName:..., occupants:...} value for a specific room
    };
    //
    // A map of eventListeners. The key is the event type.
    var eventListeners = {};
    /** This function checks if an attempt was made to add an event listener or 
     * or emit an unlisted event, since such is typically a typo. 
     * @private
     * @param {String} eventName
     * @param {String} callingFunction the name of the calling function.
     */
    function event(eventName, callingFunction) {
        if (typeof eventName !== 'string') {
            self.showError(self.errCodes.DEVELOPER_ERR, src + " called without a string as the first argument");
            throw "developer error";
        }
        if (!allowedEvents[eventName]) {
            self.showError(self.errCodes.DEVELOPER_ERR, src + " called with a bad event name = " + eventName);
            throw "developer error";
        }
    }

    /**
     * Adds an event listener for a particular type of event.
     * Currently the only eventName supported is "roomOccupant".
     * @param {String} eventName the type of the event
     * @param {Function} eventListener the function that expects the event. 
     * The eventListener gets called with the eventName as it's first argument, and the event
     * data as it's second argument.
     * @returns {void}
     */
    this.addEventListener = function(eventName, eventListener) {
        event(eventName, "addEventListener");
        if (typeof eventListener !== 'function') {
            self.showError(self.errCodes.DEVELOPER_ERR, "addEventListener called with a non-function for second argument");
            throw "developer error";
        }
        //
        // remove the event listener if it's already present so we don't end up with two copies
        //
        self.removeEventListener(eventName, eventListener);
        if (!eventListeners[eventName]) {
            eventListeners[eventName] = [];
        }
        eventListeners[eventName][eventListeners[eventName].length] = eventListener;
    };
    /**
     * Removes an event listener. 
     * @param {String} eventName
     * @param {Function} eventListener
     */
    this.removeEventListener = function(eventName, eventListener) {
        event(eventName, "removeEventListener");
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
    /**
     * Emits an event, or in otherwords, calls all the eventListeners for a 
     * particular event.
     * @param {String} eventName
     * @param {Object} eventData
     */
    this.emitEvent = function(eventName, eventData) {
        event(eventName, "emitEvent");
        var listeners = eventListeners[eventName];
        var i = 0;
        if (listeners) {
            for (i = 0; i < listeners.length; i++) {
                listeners[i](eventName, eventData);
            }
        }
    };
    /** Error codes that the EasyRTC will use in the errorCode field of error object passed
     *  to error handler set by easyrtc.setOnError. The error codes are short printable strings.
     * @type Object
     */
    this.errCodes = {
        BAD_NAME: "BAD_NAME", // a user name wasn't of the desired form
        CALL_ERR: "CALL_ERR", // something went wrong creating the peer connection
        DEVELOPER_ERR: "DEVELOPER_ERR", // the developer using the EasyRTC library made a mistake
        SYSTEM_ERR: "SYSTEM_ERR", // probably an error related to the network
        CONNECT_ERR: "CONNECT_ERR", // error occurred when trying to create a connection
        MEDIA_ERR: "MEDIA_ERR", // unable to get the local media
        MEDIA_WARNING: "MEDIA_WARNING", // didn't get the desired resolution
        INTERNAL_ERR: "INTERNAL_ERR",
        PEER_GONE: "PEER_GONE", // peer doesn't exist
        ALREADY_CONNECTED: "ALREADY_CONNECTED",
        BAD_CREDENTIAL: "BAD_CREDENTIAL",
        ICECANDIDATE_ERR: "ICECANDIDATE_ERROR"
    };
    this.apiVersion = "1.0.13";
    /** Most basic message acknowledgment object */
    this.ackMessage = {msgType: "ack"};
    /** Regular expression pattern for user ids. This will need modification to support non US character sets */
    this.usernameRegExp = /^(.){1,64}$/;
    /** @private */
    var cookieId = "easyrtcsid";
    /** @private */
    var username = null;
    /** @private */
    var loggingOut = false;
    /** @private */
    var disconnecting = false;
    //
    // A map of ids to local media streams.
    //
    var namedLocalMediaStreams = {};
    var sessionFields = [];
    var receivedMediaContraints = {
        'mandatory': {
            'OfferToReceiveAudio': true,
            'OfferToReceiveVideo': true
        }
    };
    /**
     * Control whether the client requests audio from a peer during a call.
     * Must be called before the call to have an effect.
     * @param value - true to receive audio, false otherwise. The default is true.
     */
    this.enableAudioReceive = function(value) {
        receivedMediaContraints.mandatory.OfferToReceiveAudio = value;
    };
    /**
     * Control whether the client requests video from a peer during a call.
     * Must be called before the call to have an effect.
     * @param value - true to receive video, false otherwise. The default is true.
     */
    this.enableVideoReceive = function(value) {
        receivedMediaContraints.mandatory.OfferToReceiveVideo = value;
    };

    function getSourceList(callback, sourceType) {
        if (MediaStreamTrack.getSources) {
            MediaStreamTrack.getSources(function(sources) {
                var results = [];
                for (var i = 0; i < sources.length; i++) {
                    var source = sources[i];
                    if (source.kind == sourceType) {
                        results.push(source);
                    }
                }
                callback(results);
            });
        }
        else {
            callback([]);
        }
    }

    /**
     * Gets a list of the available audio sources (ie, cameras)
     * @param {Function} callback receives list of {label:String, id:String, kind:"audio"}
     * Note: the label string always seems to be the empty string if you aren't using https.
     * Note: not supported by Firefox. 
     * @example  easyrtc.getAudioSourceList( function(list) {
     *               var i;
     *               for( i = 0; i < list.length; i++ ) {
     *                   console.log("label=" + list[i].label + ", id= " + list[i].id);
     *               }
     *          });
     */
    this.getAudioSourceList = function(callback){
       getSourceList(callback, "audio");
    }

    /**
     * Gets a list of the available video sources (ie, cameras)
     * @param {Function} callback receives list of {facing:String, label:String, id:String, kind:"video"}
     * Note: the label string always seems to be the empty string if you aren't using https.
     * Note: not supported by Firefox. 
     * @example  easyrtc.getVideoSourceList( function(list) {
     *               var i;
     *               for( i = 0; i < list.length; i++ ) {
     *                   console.log("label=" + list[i].label + ", id= " + list[i].id);
     *               }
     *          });
     */
    this.getVideoSourceList = function(callback) {
       getSourceList(callback, "video");
    }

    /** @private */
    var audioEnabled = true;
    /** @private */
    var videoEnabled = true;
    /** @private */
    var dataChannelName = "dc";
    /** @private */
    this.debugPrinter = null;
    /** Your easyrtcid */
    this.myEasyrtcid = "";
    /** @private */
    var oldConfig = {};
    /** @private */
    var offersPending = {};
    /** @private */
    var selfRoomJoinTime = 0;
    /** The height of the local media stream video in pixels. This field is set an indeterminate period
     * of time after easyrtc.initMediaSource succeeds. Note: in actuality, the dimensions of a video stream
     * change dynamically in response to external factors, you should check the videoWidth and videoHeight attributes
     * of your video objects before you use them for pixel specific operations.
     */
    this.nativeVideoHeight = 0;
    /** The width of the local media stream video in pixels. This field is set an indeterminate period
     * of time after easyrtc.initMediaSource succeeds.  Note: in actuality, the dimensions of a video stream
     * change dynamically in response to external factors, you should check the videoWidth and videoHeight attributes
     * of your video objects before you use them for pixel specific operations.
     */
    this.nativeVideoWidth = 0;
    /** @private */
    var credential = null;
    /** The rooms the user is in. This only applies to room oriented applications and is set at the same
     * time a token is received. 
     */
    this.roomJoin = {};
    /** Checks if the supplied string is a valid user name (standard identifier rules)
     * @param {String} name
     * @return {Boolean} true for a valid user name
     * @example
     *    var name = document.getElementById('nameField').value;
     *    if( !easyrtc.isNameValid(name)){
     *        console.error("Bad user name");
     *    }
     */
    this.isNameValid = function(name) {
        return self.usernameRegExp.test(name);
    };
    /**
     * This function sets the name of the cookie that client side library will look for
     * and transmit back to the server as it's easyrtcsid in the first message.
     * @param {String} cookieId
     */
    this.setCookieId = function(cookieId) {
        self.cookieId = cookieId;
    };
    /**
     * This method allows you to join a single room. It may be called multiple times to be in
     * multiple rooms simultaneously. It may be called before or after connecting to the server.
     * Note: the successCB and failureDB will only be called if you are already connected to the server.
     * @param {String} roomName the room to be joined.
     * @param {String} roomParameters application specific parameters, can be null.
     * @param {Function} successCB called once, with a roomName as it's argument, once the room is joined.
     * @param {Function} failureCB called if the room can not be joined. The arguments of failureCB are errorCode, errorText, roomName.
     */
    this.joinRoom = function(roomName, roomParameters, successCB, failureCB) {
        if (self.roomJoin[roomName]) {
            console.error("Developer error: attempt to join room " + roomName + " which you are already in.");
            return;
        }

        var newRoomData = {roomName: roomName};
        if (roomParameters) {
            try {
                JSON.stringify(roomParameters);
            } catch (error) {
                self.showError(self.errCodes.DEVELOPER_ERR, "non-jsonable parameter to easyrtc.joinRoom");
                throw "Developer error, see application error messages";
            }
            var parameters = {};
            for (var key in roomParameters) {
                if (roomParameters.hasOwnProperty(key)) {
                    parameters[key] = roomParameters[key];
                }
            }
            newRoomData.roomParameter = parameters;
        }
        var msgData = {
            roomJoin: {}
        };
        var roomData;
        var signallingSuccess, signallingFailure;
        if (self.webSocket) {

            msgData.roomJoin[roomName] = newRoomData;
            signallingSuccess = function(msgType, msgData) {

                roomData = msgData.roomData;
                self.roomJoin[roomName] = newRoomData;
                if (successCB) {
                    successCB(roomName);
                }

                processRoomData(roomData);
            };
            signallingFailure = function(errorCode, errorText) {
                if (failureCB) {
                    failureCB(errorCode, errorText, roomName);
                }
                else {
                    self.showError(errorCode, self.format(self.getConstantString("unableToEnterRoom"), roomName, errorText));
                }
            };
            sendSignalling(null, "roomJoin", msgData, signallingSuccess, signallingFailure);
        }
        else {
            self.roomJoin[roomName] = newRoomData;
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
     *    easyrtc.leaveRoom("freds_room", function(roomName){ console.log("left the room")},
     *                       function(errorCode, errorText, roomName){ console.log("left the room")});
     */
    this.leaveRoom = function(roomName, successCallback, failureCallback) {
        var roomItem;
        if (self.roomJoin[roomName]) {
            if (!self.webSocket) {
                delete self.roomJoin[roomName];
            }
            else {
                roomItem = {};
                roomItem[roomName] = {roomName: roomName};
                sendSignalling(null, "roomLeave", {roomLeave: roomItem},
                function(msgType, msgData) {
                    var roomData = msgData.roomData;
                    processRoomData(roomData);
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
    /** @private */
    this._desiredVideoProperties = {}; // default camera


    /**
     * Specify particular video source. Call this before you call easyrtc.initMediaSource().
     * Note: this function isn't supported by Firefox.
     * @param {String} videoSrcId is a id value from one of the entries fetched by getVideoSourceList. null for default.
     * @example easyrtc.setVideoSrc( videoSrcId);
     */
    this.setVideoSource = function(videoSrcId) {
        self._desiredVideoProperties.videoSrcId = videoSrcId;
        delete self._desiredVideoProperties.screenCapture;
    };
    /**
     * Temporary alias for easyrtc.setVideoSource
     */
    this.setVideoSrc = this.setVideoSource;
    delete this._desiredVideoProperties.screenCapture;
    /** This function is used to set the dimensions of the local camera, usually to get HD.
     *  If called, it must be called before calling easyrtc.initMediaSource (explicitly or implicitly).
     *  assuming it is supported. If you don't pass any parameters, it will default to 720p dimensions.
     * @param {Number} width in pixels
     * @param {Number} height in pixels
     * @param {number} frameRate is optional
     * @example
     *    easyrtc.setVideoDims(1280,720);
     * @example
     *    easyrtc.setVideoDims();
     */
    this.setVideoDims = function(width, height, frameRate) {
        if (!width) {
            width = 1280;
            height = 720;
        }
        self._desiredVideoProperties.width = width;
        self._desiredVideoProperties.height = height;
        if (frameRate !== undefined) {
            self._desiredVideoProperties.frameRate = frameRate;
        }
    };
    /** This function requests that screen capturing be used to provide the local media source
     * rather than a webcam. If you have multiple screens, they are composited side by side.
     * Note: this functionality is not supported by Firefox, has to be called before calling initMediaSource (or easyApp), we don't currently supply a way to 
     * turn it off (once it's on), only works if the website is hosted SSL (https), and the image quality is rather 
     * poor going across a network because it tries to transmit so much data. In short, screen sharing
     * through WebRTC isn't worth using at this point, but it is provided here so people can try it out.
     * @example
     *    easyrtc.setScreenCapture();
     * @deprecated: use easyrtc.initScreenCapture (same parameters as easyrtc.initMediaSource.
     */
    this.setScreenCapture = function(enableScreenCapture) {
        self._desiredVideoProperties.screenCapture = (enableScreenCapture !== false);
    };
    /**
     * Builds the constraint object passed to getUserMedia.
     * @returns {Object} mediaConstraints
     */
    self.getUserMediaConstraints = function() {
        var constraints = {};
        //
        // _presetMediaConstraints allow you to provide your own contraints to be used
        // with initMediaSource.
        //
        if (self._presetMediaConstraints) {
            constraints = self._presetMediaConstraints;
            delete self._presetMediaConstraints;
            return constraints;
        }
        else if (self._desiredVideoProperties.screenCapture) {
            return {
                video: {
                    mandatory: {
                        chromeMediaSource: 'screen',
                        maxWidth: screen.width,
                        maxHeight: screen.height,
                        minWidth: screen.width,
                        minHeight: screen.height,
                        minFrameRate: 1,
                        maxFrameRate: 5},
                    optional: []
                },
                audio: false
            };
        }
        else if (!videoEnabled) {
            constraints.video = false;
        }
        else {
            constraints.video = {mandatory: {}, optional: []};
            if (self._desiredVideoProperties.width) {
                constraints.video.mandatory.maxWidth = self._desiredVideoProperties.width;
                constraints.video.mandatory.minWidth = self._desiredVideoProperties.width;
            }
            if (self._desiredVideoProperties.width) {
                constraints.video.mandatory.maxHeight = self._desiredVideoProperties.height;
                constraints.video.mandatory.minHeight = self._desiredVideoProperties.height;
            }
            if (self._desiredVideoProperties.frameRate) {
                constraints.video.mandatory.maxFrameRate = self._desiredVideoProperties.frameRate;
            }
            if (self._desiredVideoProperties.videoSrcId) {
                constraints.video.optional.push({sourceId: self._desiredVideoProperties.videoSrcId});
            }
            // hack for opera
            if (constraints.video.mandatory.length === 0 && constraints.video.optional.length === 0) {
                constraints.video = true;
            }
        }
        constraints.audio = audioEnabled;
        return constraints;
    };
    /** Set the application name. Applications can only communicate with other applications
     * that share the same API Key and application name. There is no predefined set of application
     * names. Maximum length is
     * @param {String} name
     * @example
     *    easyrtc.setApplicationName('simpleAudioVideo');
     */
    this.setApplicationName = function(name) {
        self.applicationName = name;
    };
    /** Enable or disable logging to the console.
     * Note: if you want to control the printing of debug messages, override the
     *    easyrtc.debugPrinter variable with a function that takes a message string as it's argument.
     *    This is exactly what easyrtc.enableDebug does when it's enable argument is true.
     * @param {Boolean} enable - true to turn on debugging, false to turn off debugging. Default is false.
     * @example
     *    easyrtc.enableDebug(true);
     */
    this.enableDebug = function(enable) {
        if (enable) {
            self.debugPrinter = function(message) {
                var stackString = new Error().stack;
                var srcLine = "location unknown";
                if (stackString) {
                    var stackFrameStrings = stackString.split('\n');
                    srcLine = "";
                    if (stackFrameStrings.length >= 3) {
                        srcLine = stackFrameStrings[2];
                    }
                }
                console.log("debug " + (new Date()).toISOString() + " : " + message + " [" + srcLine + "]");
            };
        }
        else {
            self.debugPrinter = null;
        }
    };
//
// this is a temporary version used until we connect to the server.
//
    this.updatePresence = function(state, statusText) {
        self.presenceShow = state;
        self.presenceStatus = statusText;
    };
    /**
     * Determines if the local browser supports WebRTC GetUserMedia (access to camera and microphone).
     * @returns {Boolean} True getUserMedia is supported.
     */
    this.supportsGetUserMedia = function() {
        return !!getUserMedia;
    };
    /**
     * Determines if the local browser supports WebRTC Peer connections to the extent of being able to do video chats.
     * @returns {Boolean} True if Peer connections are supported.
     */
    this.supportsPeerConnections = function() {
        if (!self.supportsGetUserMedia()) {
            return false;
        }
        if (!window.RTCPeerConnection) {
            return false;
        }
        try {
            self.createRTCPeerConnection({"iceServers": []}, null);
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
    this.createRTCPeerConnection = function(pc_config, optionalStuff) {
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
    this.getDatachannelConstraints = function() {
        if (webrtcDetectedBrowser === "chrome" && webrtcDetectedVersion < 31) {
            return {reliable: false};
        }
        else {
            return {reliable: true};
        }
    };
    /** @private */
    haveAudioVideo = {
        audio: false,
        video: false
    };
    /** @private */
    var dataEnabled = false;
    /** @private */
    var serverPath = null;
    /** @private */
    var roomOccupantListener = null;
    /** @private */
    var onDataChannelOpen = null;
    /** @private */
    var onDataChannelClose = null;
    /** @private */
    var lastLoggedInList = {};
    /** @private */
    var receivePeer = {msgTypes: {}};
    /** @private */
    var receiveServerCB = null;
    /** @private */
    var updateConfigurationInfo = function() {

    }; // dummy placeholder for when we aren't connected
//
//
//  peerConns is a map from caller names to the below object structure
//     {  startedAV: boolean,  -- true if we have traded audio/video streams
//        dataChannelS: RTPDataChannel for outgoing messages if present
//        dataChannelR: RTPDataChannel for incoming messages if present
//        dataChannelReady: true if the data channel can be used for sending yet
//        connectTime: timestamp when the connection was started
//        sharingAudio: true if audio is being shared
//        sharingVideo: true if video is being shared
//        cancelled: temporarily true if a connection was cancelled by the peer asking to initiate it
//        candidatesToSend: SDP candidates temporarily queued
//        streamsAddedAcks: ack callbacks waiting for stream received messages
//        pc: RTCPeerConnection
//        mediaStream: mediaStream
//     function callSuccessCB(string) - see the easyrtc.call documentation.
//        function callFailureCB(errorCode, string) - see the easyrtc.call documentation.
//        function wasAcceptedCB(boolean,string) - see the easyrtc.call documentation.
//     }
//
    /** @private */
    var peerConns = {};
//
// a map keeping track of whom we've requested a call with so we don't try to
// call them a second time before they've responded.
//
    /** @private */
    var acceptancePending = {};
    /**
     * Disconnect from the EasyRTC server.
     * @example
     *    easyrtc.disconnect();
     */
    this.disconnect = function() {
    };
    /** @private
     * @param caller
     * @param helper
     */
    this.acceptCheck = function(caller, helper) {
        helper(true);
    };
    /** @private
     * @param easyrtcid
     * @param stream
     */
    this.streamAcceptor = function(easyrtcid, stream) {
    };
    /** @private
     * @param easyrtcid
     */
    this.onStreamClosed = function(easyrtcid) {
    };
    /** @private
     * @param easyrtcid
     */
    this.callCancelled = function(easyrtcid) {
    };
    /**
     * This function gets the statistics for a particular peer connection.
     * @param {String} peerId
     * @param {Function} callback gets the peerid and a map of {userDefinedKey: value}. If there is no peer connection to peerId, then the map will
     *  have a value of {connected:false}. 
     * @param {Object} filter depends on whether Chrome or Firefox is used. See the default filters for guidance.
     * It is still experimental.
     */
    this.getPeerStatistics = function(peerId, callback, filter) {
        if (isFirefox) {
            self.getFirefoxPeerStatistics(peerId, callback, filter);
        }
        else {
            self.getChromePeerStatistics(peerId, callback, filter);
        }
    };
    this.getFirefoxPeerStatistics = function(peerId, callback, filter) {


        if (!peerConns[peerId]) {
            callback(peerId, {"connected": false});
        }
        else if (peerConns[peerId].pc.getStats) {
            peerConns[peerId].pc.getStats(null, function(stats) {
                var items = {};
                var candidates = {};
                var activeId = null;
                var srcKey;
                //
                // the stats objects has a group of entries. Each entry is either an rtcp, rtp entry
                // or a candidate entry. 
                //
                stats.forEach(function(entry) {
                    var majorKey;
                    var subKey;
                    if (entry.type.match(/boundrtp/)) {
                        if (entry.id.match(/audio/)) {
                            majorKey = entry.type + "_audio";
                        }
                        else if (entry.id.match(/video/)) {
                            majorKey = entry.type + "_video";
                        }
                        else {
                            return;
                        }
                        for (subKey in entry) {
                            if (entry.hasOwnProperty(subKey)) {
                                items[majorKey + "." + subKey] = entry[subKey];
                            }
                        }
                    }
                    else {
                        if( entry.hasOwnProperty("ipAddress") && entry.hasOwnProperty("id")) {
                            candidates[entry.id] = entry.ipAddress + ":" + 
                                  entry.portNumber;
                        }
                        else if( entry.hasOwnProperty("selected") && 
                                 entry.hasOwnProperty("remoteCandidateId") && 
                                 entry.selected ) {
                            activeId =  entry.remoteCandidateId;
                        } 
                    }
                });

                if( activeId ) {
                    items["firefoxRemoteAddress"] = candidates[activeId];
                }
                if (!filter) {
                    callback(peerId, items);
                }
                else {
                    var filteredItems = {};
                    for (srcKey in filter) {
                        if (filter.hasOwnProperty(srcKey) && items.hasOwnProperty(srcKey)) {
                            filteredItems[ filter[srcKey]] = items[srcKey];
                        }
                    }
                    callback(peerId, filteredItems);
                }
            },
                    function(error) {
                        console.log("unable to get statistics");
                    });
        }
        else {
            callback(peerId, {"statistics": self.getConstantString("statsNotSupported")});
        }
    };
    this.getChromePeerStatistics = function(peerId, callback, filter) {

        if (!peerConns[peerId]) {
            callback(peerId, {"connected": false});
        }
        else if (peerConns[peerId].pc.getStats) {

            peerConns[peerId].pc.getStats(function(stats) {

                var localStats = {};
                var part, parts = stats.result();
                var i, j;
                var itemKeys;
                var itemKey;
                var names;
                var userKey;
                var partNames = [];
                var partList;
                var bestBytes = 0;
                var bestI;
                var turnAddress = null;
                var hasActive, curReceived;
                var localAddress, remoteAddress;
                if (!filter) {
                    for (i = 0; i < parts.length; i++) {
                        names = parts[i].names();
                        for (j = 0; j < names.length; j++) {
                            itemKey = names[j];
                            localStats[parts[i].id + "." + itemKey] = parts[i].local.stat(itemKey);
                        }
                    }
                }
                else {
                    for (i = 0; i < parts.length; i++) {
                        partNames[i] = {};
                        //
                        // convert the names into a dictionary
                        //
                        names = parts[i].names();
                        for (j = 0; j < names.length; j++) {
                            partNames[i][names[j]] = true;
                        }

                        //
                        // a chrome-firefox connection results in several activeConnections. 
                        // we only want one, so we look for the one with the most data being received on it.
                        //
                        if (partNames[i].googRemoteAddress && partNames[i].googActiveConnection) {
                            hasActive = parts[i].local.stat("googActiveConnection");
                            if (hasActive === true || hasActive === "true") {
                                curReceived = parseInt(parts[i].local.stat("bytesReceived")) +
                                        parseInt(parts[i].local.stat("bytesSent"));
                                if (curReceived > bestBytes) {
                                    bestI = i;
                                    bestBytes = curReceived;
                                }
                            }
                        }
                    }

                    for (i = 0; i < parts.length; i++) {
                        //
                        // discard info from any inactive connection.
                        //
                        if (partNames[i].googActiveConnection) {
                            if (i !== bestI) {
                                partNames[i] = {};
                            }
                            else {
                                localAddress = parts[i].local.stat("googLocalAddress").split(":")[0];
                                remoteAddress = parts[i].local.stat("googRemoteAddress").split(":")[0];
                                if (self.isTurnServer(localAddress)) {
                                    turnAddress = localAddress;
                                }
                                else if (self.isTurnServer(remoteAddress)) {
                                    turnAddress = remoteAddress;
                                }
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
                                if (itemKeys.hasOwnProperty(itemKey) && !partNames[j][itemKey]) {
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
                                        if (itemKeys.hasOwnProperty(itemKey)) {
                                            userKey = itemKeys[itemKey];
                                            localStats[userKey] = part.local.stat(itemKey);
                                        }
                                    }
                                }
                            }
                        }
                        else if (partList.length > 1) {
                            for (itemKey in itemKeys) {
                                if (itemKeys.hasOwnProperty(itemKey)) {
                                    localStats[itemKeys[itemKey]] = [];
                                }
                            }
                            for (j = 0; j < partList.length; j++) {
                                part = partList[j];
                                if (part.local) {
                                    for (itemKey in itemKeys) {
                                        if (itemKeys.hasOwnProperty(itemKey)) {
                                            userKey = itemKeys[itemKey];
                                            localStats[userKey].push(part.local.stat(itemKey));
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                if (localStats.remoteAddress && turnAddress) {
                    localStats.remoteAddress = turnAddress;
                }
                callback(peerId, localStats);
            });
        }
        else {
            callback(peerId, {"statistics": self.getConstantString("statsNotSupported")});
        }
    };
    this.chromeStatsFilter = [
        {
            "googTransmitBitrate": "transmitBitRate",
            "googActualEncBitrate": "encodeRate",
            "googAvailableSendBandwidth": "availableSendRate"
        },
        {
            "googCodecName": "audioCodec",
            "googTypingNoiseState": "typingNoise",
            "packetsSent": "audioPacketsSent",
            "bytesSent": "audioBytesSent"
        },
        {
            "googCodecName": "videoCodec",
            "googFrameRateSent": "outFrameRate",
            "packetsSent": "videoPacketsSent",
            "bytesSent": "videoBytesSent"
        },
        {
            "packetsLost": "videoPacketsLost",
            "packetsReceived": "videoPacketsReceived",
            "bytesReceived": "videoBytesReceived",
            "googFrameRateOutput": "frameRateOut"
        },
        {
            "packetsLost": "audioPacketsLost",
            "packetsReceived": "audioPacketsReceived",
            "bytesReceived": "audioBytesReceived",
            "audioOutputLevel": "audioOutputLevel"
        },
        {
            "googRemoteAddress": "remoteAddress",
            "googActiveConnection": "activeConnection"
        },
        {
            "audioInputLevel": "audioInputLevel"
        }
    ];
    this.firefoxStatsFilter = {
        "outboundrtp_audio.bytesSent": "audioBytesSent",
        "outboundrtp_video.bytesSent": "videoBytesSent",
        "inboundrtp_video.bytesReceived": "videoBytesReceived",
        "inboundrtp_audio.bytesReceived": "audioBytesReceived",
        "outboundrtp_audio.packetsSent": "audioPacketsSent",
        "outboundrtp_video.packetsSent": "videoPacketsSent",
        "inboundrtp_video.packetsReceived": "videoPacketsReceived",
        "inboundrtp_audio.packetsReceived": "audioPacketsReceived",
        "inboundrtp_video.packetsLost": "videoPacketsLost",
        "inboundrtp_audio.packetsLost": "audioPacketsLost",
        "firefoxRemoteAddress": "remoteAddress"
    };
    this.standardStatsFilter = isFirefox ? self.firefoxStatsFilter : self.chromeStatsFilter;
    /** Provide a set of application defined fields that will be part of this instances
     * configuration information. This data will get sent to other peers via the websocket
     * path.
     * @param {String} roomName - the room the field is attached to.
     * @param {String} fieldName - the name of the field.
     * @param {Object} fieldValue - the value of the field.
     * @example
     *   easyrtc.setRoomApiField("trekkieRoom",  "favorite_alien", "Mr Spock");
     *   easyrtc.setRoomOccupantListener( function(roomName, list){
     *      for( var i in list ){
     *         console.log("easyrtcid=" + i + " favorite alien is " + list[i].apiFields.favorite_alien);
     *      }
     *   });
     */
    this.setRoomApiField = function(roomName, fieldName, fieldValue) {
        //
        // if we're not connected yet, we'll just cache the fields until we are.
        //
        if (!self._roomApiFields) {
            self._roomApiFields = {};
        }
        if (!fieldName && !fieldValue) {
            delete self._roomApiFields[roomName];
            return;
        }

        if (!self._roomApiFields[roomName]) {
            self._roomApiFields[roomName] = {};
        }
        if (fieldValue !== undefined && fieldValue !== null) {
            if (typeof fieldValue === "object") {
                try {
                    JSON.stringify(fieldValue);
                }
                catch (jsonError) {
                    self.showError(self.errCodes.DEVELOPER_ERR, "easyrtc.setRoomApiField passed bad object ");
                    return;
                }
            }
            self._roomApiFields[roomName][fieldName] = {fieldName: fieldName, fieldValue: fieldValue};
        }
        else {
            delete self._roomApiFields[roomName][fieldName];
        }
        if (self.webSocketConnected) {
            _enqueueSendRoomApi(roomName);
        }
    };
    var roomApiFieldTimer = null;
    /** @private
     * @param {String} roomName
     */
    function _enqueueSendRoomApi(roomName) {
//
// Rather than issue the send request immediately, we set a timer so we can accumulate other
// calls
//
        if (roomApiFieldTimer) {
            clearTimeout(roomApiFieldTimer);
        }
        roomApiFieldTimer = setTimeout(function() {
            _sendRoomApiFields(roomName, self._roomApiFields[roomName]);
            roomApiFieldTimer = null;
        }, 10);
    }
    ;
    /**
     *  @private
     *  @param roomName
     * @param fields
     */
    function _sendRoomApiFields(roomName, fields) {
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
        self.webSocket.json.emit("easyrtcCmd", dataToShip,
                function(ackMsg) {
                    if (ackMsg.msgType === "error") {
                        self.showError(ackMsg.msgData.errorCode, ackMsg.msgData.errorText);
                    }
                }
        );
    }
    ;
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
    this.showError = function(messageCode, message) {
        self.onError({errorCode: messageCode, errorText: message});
    };
    /** @private
     * @param errorObject
     */
    this.onError = function(errorObject) {
        if (self.debugPrinter) {
            self.debugPrinter("saw error " + errorObject.errorText);
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

        errorBody = document.getElementById("easyrtcErrorDialog_body");
        var messageNode = document.createElement("div");
        messageNode.className = 'easyrtcErrorDialog_element';
        messageNode.appendChild(document.createTextNode(errorObject.errorText));
        errorBody.appendChild(messageNode);
        errorDiv.style.display = "block";
    };
//
// easyrtc.createObjectURL builds a URL from a media stream.
// Arguments:
//     mediaStream - a media stream object.
// The video object in Chrome expects a URL.
//
    /** @private
     * @param mediaStream */
    this.createObjectURL = function(mediaStream) {
        var errMessage;
        if (window.URL && window.URL.createObjectURL) {
            return window.URL.createObjectURL(mediaStream);
        }
        else if (window.webkitURL && window.webkitURL.createObjectURL) {
            return window.webkit.createObjectURL(mediaStream);
        }
        else {
            errMessage = "Your browsers does not support URL.createObjectURL.";
            if (self.debugPrinter) {
                self.debugPrinter("saw exception " + errMessage);
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
    this.cleanId = function(idString) {
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
     *   easyrtc.setRoomEntryListener(function(entry, roomName){
     *       if( entry ){
     *           console.log("entering room " + roomName);
     *       }
     *       else{
     *           console.log("leaving room " + roomName);
     *       }
     *   });
     */
    self.setRoomEntryListener = function(handler) {
        self.roomEntryListener = handler;
    };
    /** Set the callback that will be invoked when the list of people logged in changes.
     * The callback expects to receive a room name argument, and
     *  a map whose ideas are easyrtcids and whose values are in turn maps
     * supplying user specific information. The inner maps have the following keys:
     *  username, applicationName, browserFamily, browserMajor, osFamily, osMajor, deviceFamily.
     *  The third argument is the listener is the innerMap for the connections own data (not needed by most applications).
     * @param {Function} listener
     * @example
     *   easyrtc.setRoomOccupantListener( function(roomName, list, selfInfo){
     *      for( var i in list ){
     *         ("easyrtcid=" + i + " belongs to user " + list[i].username);
     *      }
     *   });
     */
    self.setRoomOccupantListener = function(listener) {
        roomOccupantListener = listener;
    };
    /**
     * Sets a callback that is called when a data channel is open and ready to send data.
     * The callback will be called with an easyrtcid as it's sole argument.
     * @param {Function} listener
     * @example
     *    easyrtc.setDataChannelOpenListener( function(easyrtcid){
     *         easyrtc.sendDataP2P(easyrtcid, "greeting", "hello");
     *    });
     */
    this.setDataChannelOpenListener = function(listener) {
        onDataChannelOpen = listener;
    };
    /** Sets a callback that is called when a previously open data channel closes.
     * The callback will be called with an easyrtcid as it's sole argument.
     * @param {Function} listener
     * @example
     *    easyrtc.setDataChannelCloseListener( function(easyrtcid){
     *            ("No longer connected to " + easyrtc.idToName(easyrtcid));
     *    });
     */
    this.setDataChannelCloseListener = function(listener) {
        onDataChannelClose = listener;
    };
    /** Returns the number of live peer connections the client has.
     * @return {Number}
     * @example
     *    ("You have " + easyrtc.getConnectionCount() + " peer connections");
     */
    this.getConnectionCount = function() {
        var count = 0;
        var i;
        for (i in peerConns) {
            if (peerConns.hasOwnProperty(i)) {
                if (self.getConnectStatus(i) === self.IS_CONNECTED) {
                    count++;
                }
            }
        }
        return count;
    };
    /** Sets whether audio is transmitted by the local user in any subsequent calls.
     * @param {Boolean} enabled true to include audio, false to exclude audio. The default is true.
     * @example
     *      easyrtc.enableAudio(false);
     */
    this.enableAudio = function(enabled) {
        audioEnabled = enabled;
    };
    /**
     *Sets whether video is transmitted by the local user in any subsequent calls.
     * @param {Boolean} enabled - true to include video, false to exclude video. The default is true.
     * @example
     *      easyrtc.enableVideo(false);
     */
    this.enableVideo = function(enabled) {
        videoEnabled = enabled;
    };
    /**
     * Sets whether WebRTC data channels are used to send inter-client messages.
     * This is only the messages that applications explicitly send to other applications, not the WebRTC signaling messages.
     * @param {Boolean} enabled  true to use data channels, false otherwise. The default is false.
     * @example
     *     easyrtc.enableDataChannels(true);
     */
    this.enableDataChannels = function(enabled) {
        dataEnabled = enabled;
    };
    /**
     * @private
     * @param {Boolean} enable
     * @param {Array} tracks - an array of MediaStreamTrack
     */
    function enableMediaTracks(enable, tracks) {
        var i;
        if (tracks) {
            for (i = 0; i < tracks.length; i++) {
                var track = tracks[i];
                track.enabled = enable;
            }
        }
    }


    //
    // fetches a stream by name. Treat a null/undefined streamName as "default".
    //
    function getLocalMediaStreamByName(streamName) {
        if (!streamName) {
            streamName = "default";
        }
        if (namedLocalMediaStreams.hasOwnProperty(streamName)) {
            return namedLocalMediaStreams[streamName];
        }
        else {
            return null;
        }
    }

    /**
     * Returns the user assigned id's of currently active local media streams.
     * @return {Array}
     */
    this.getLocalMediaIds = function() {
        return Object.keys(namedLocalMediaStreams);
    }

    function buildMediaIds() {
        var mediaMap = {};
        var streamName;
        for (streamName in namedLocalMediaStreams) {
            mediaMap[streamName] = namedLocalMediaStreams[streamName].id || "default";
        }
        return mediaMap;
    }


    function registerLocalMediaStreamByName(stream, streamName) {
        var roomName;
        if (!streamName) {
            streamName = "default";
        }
        stream.streamName = streamName;
        namedLocalMediaStreams[streamName] = stream;
        if (streamName !== "default") {
            var mediaIds = buildMediaIds();
            for (roomName in self.roomData) {
                self.setRoomApiField(roomName, "mediaIds", mediaIds);
            }
        }
    }

    /**
      * Allow an externally created mediastream (ie, created by another 
      * library) to be used within easyrtc. Tracking when it closes
      * must be done by the supplying party.
      */
    this.register3rdPartyLocalMediaStream = function(stream, streamName) {
       return registerLocalMediaStreamByName(stream, streamName);
    };
    //
    // look up a stream's name from the stream.id
    //
    function getNameOfRemoteStream(easyrtcId, webrtcstreamId) {
        var roomName;
        var mediaIds;
        var streamName;
        if (!webrtcstreamId) {
            webrtcstreamId = "default";
        }
        if (peerConns[easyrtcId]) {
            streamName = peerConns[easyrtcId].remoteStreamIdToName[webrtcstreamId];
            if (streamName) {
                return streamName;
            }
        }

        for (roomName in self.roomData) {
            mediaIds = self.getRoomApiField(roomName, easyrtcId, "mediaIds");
            if (!mediaIds) {
                continue;
            }
            for (streamName in mediaIds) {
                if (mediaIds.hasOwnProperty(streamName) &&
                        mediaIds[streamName] === webrtcstreamId) {
                    return streamName;
                }
            }
            //
            // a stream from chrome to firefox will be missing it's id/label.
            // there is no correct solution. 
            //
            if( isFirefox ) {
               // if there is a stream called default, return it in preference
               if( mediaIds["default"] ) {
                   return "default"; 
               }
               //
               // otherwise return the first name we find. If there is more than
               // one, complain to Mozilla.
               //
               for( var anyName in mediaIds ) {
                   return anyName;
               }
            }
        }
        return undefined;
    }

    this.getNameOfRemoteStream = function(easyrtcId, webrtcStream){
        if(typeof webrtcStream == "string") {
            return getNameOfRemoteStream(easyrtcId, webrtcStream);
        }
        else if( webrtcStream.id) {
            return getNameOfRemoteStream(easyrtcId, webrtcStream.id);
        }
    }

    function closeLocalMediaStreamByName(streamName) {
        if (!streamName) {
            streamName = "default";
        }
        var stream = self.getLocalStream(streamName);
        if (!stream) {
            return;
        }
        var streamId = stream.id || "default";
        if (namedLocalMediaStreams[streamName]) {


            for (id in peerConns) {
                if (peerConns.hasOwnProperty(id)) {
                    try {
                        peerConns[id].pc.removeStream(stream);
                    } catch (err) {
                    }
                    self.sendPeerMessage(id, "__closingMediaStream", {streamId: streamId, streamName: streamName});
                }
            }
            try {
                namedLocalMediaStreams[streamName].stop();
            } catch (err) {
                // not worth reporting an error at this location
                // since we didn't want the media stream anyhow.
            }
            delete namedLocalMediaStreams[streamName];
            if (streamName !== "default") {
                var mediaIds = buildMediaIds();
                for (roomName in self.roomData) {
                    self.setRoomApiField(roomName, "mediaIds", mediaIds);
                }
            }
        }
    }
    /**
     * Close the local media stream. You usually need to close the existing media stream
     * of a camera before reacquring it at a different resolution.
     * @param {String} streamName - an option stream name.
     */
    this.closeLocalMediaStream = function(streamName) {
        return closeLocalMediaStreamByName(streamName);
    }

    /**
     * Alias for closeLocalMediaStream
     */
    this.closeLocalStream = this.closeLocalMediaStream;
    /**
     * This function is used to enable and disable the local camera. If you disable the
     * camera, video objects display it will "freeze" until the camera is re-enabled. *
     * By default, a camera is enabled.
     * @param {Boolean} enable - true to enable the camera, false to disable it.
     * @param {String} streamName - the name of the stream, optional.
     */
    this.enableCamera = function(enable, streamName) {
        var stream = getLocalMediaStreamByName(streamName);
        if (stream && stream.getVideoTracks) {
            enableMediaTracks(enable, stream.getVideoTracks());
        }
    };
    /**
     * This function is used to enable and disable the local microphone. If you disable
     * the microphone, sounds stops being transmitted to your peers. By default, the microphone
     * is enabled.
     * @param {Boolean} enable - true to enable the microphone, false to disable it.
     * @param {String} streamName - an optional streamName
     */
    this.enableMicrophone = function(enable, streamName) {
        var stream = getLocalMediaStreamByName(streamName);
        if (stream && stream.getAudioTracks) {
            enableMediaTracks(enable, stream.getAudioTracks());
        }
    };
    /**
     * Mute a video object.
     * @param {String} videoObjectName - A DOMObject or the id of the DOMObject.
     * @param {Boolean} mute - true to mute the video object, false to unmute it.
     */
    self.muteVideoObject = function(videoObjectName, mute) {
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
     *  @param {String} streamName - an option stream name.
     *  @return {URL}
     *  @example
     *      document.getElementById("myVideo").src = easyrtc.getLocalStreamAsUrl();
     */
    self.getLocalStreamAsUrl = function(streamName) {
        var stream = getLocalMediaStreamByName(streamName);
        if (stream === null) {
            throw "Developer error: attempt to get a MediaStream without invoking easyrtc.initMediaSource successfully";
        }
        return self.createObjectURL(stream);
    };
    /**
     * Returns a media stream for your local camera and microphone.
     *  It can be called only after easyrtc.initMediaSource has succeeded.
     *  It returns a stream that can be used as an argument to easyrtc.setVideoObjectSrc.
     *  Returns null if there is no local media stream acquired yet.
     * @return {MediaStream}
     * @example
     *    easyrtc.setVideoObjectSrc( document.getElementById("myVideo"), easyrtc.getLocalStream());
     */
    this.getLocalStream = function(streamName) {
        return getLocalMediaStreamByName(streamName) || null;
    };
    /** Clears the media stream on a video object.
     *
     * @param {Object} element the video object.
     * @example
     *    easyrtc.clearMediaStream( document.getElementById('selfVideo'));
     *
     */
    this.clearMediaStream = function(element) {
        if (typeof element.srcObject !== 'undefined') {
            element.srcObject = null;
        } else if (typeof element.mozSrcObject !== 'undefined') {
            element.mozSrcObject = null;
        } else if (typeof element.src !== 'undefined') {
            //noinspection JSUndefinedPropertyAssignment
            element.src = "";
        }
    };
    /**
     *  Sets a video or audio object from a media stream.
     *  Chrome uses the src attribute and expects a URL, while firefox
     *  uses the mozSrcObject and expects a stream. This procedure hides
     *  that from you.
     *  If the media stream is from a local webcam, you may want to add the
     *  easyrtcMirror class to the video object so it looks like a proper mirror.
     *  The easyrtcMirror class is defined in this.css.
     *  Which is could be added using the same path of easyrtc.js file to an HTML file
     *  @param {Object} videoObject an HTML5 video object
     *  @param {MediaStream|String} stream a media stream as returned by easyrtc.getLocalStream or your stream acceptor.
     * @example
     *    easyrtc.setVideoObjectSrc( document.getElementById("myVideo"), easyrtc.getLocalStream());
     *
     */
    this.setVideoObjectSrc = function(videoObject, stream) {
        if (stream && stream !== "") {
            videoObject.autoplay = true;
            attachMediaStream(videoObject, stream);
            videoObject.play();
        }
        else {
            self.clearMediaStream(videoObject);
        }
    };


    /**
     * This function builds a new named local media stream from a set of existing audio and video tracks from other media streams.
     * @param {String} streamName is the name of the new media stream.
     * @param {Array} audioTracks is an array of MediaStreamTracks
     * @param {Array} videoTracks is an array of MediaStreamTracks
     * @returns {MediaStream} the track created.
     * @example
     *    easyrtc.buildLocalMediaStream("myComposedStream",
     *             easyrtc.getLocalStream("camera1").getVideoTracks(),
     *             easyrtc.getLocalStream("camera2").getAudioTracks());
     */
    this.buildLocalMediaStream = function(streamName, audioTracks, videoTracks) {
        var i;
        if (typeof streamName !== 'string') {
            easyrtc.showError(this.errCodes.DEVELOPER_ERR, 
               "easyrtc.buildLocalMediaStream not supplied a stream name");
            return null;
        }

         var streamToClone = null;
         for(var key in namedLocalMediaStreams ) {
            if( namedLocalMediaStreams.hasOwnProperty(key)) {
              streamToClone = namedLocalMediaStreams[key];
              if(streamToClone) break;
            }
         }
         if( !streamToClone ) {
            for(key in peerConns) {
                var remoteStreams = peerConns[key].pc.getRemoteStreams();
                if( remoteStreams && remoteStreams.length > 1 ) {
                    streamToClone = remoteStreams[0];
                }
            }
         }
         if( !streamToClone ){
            self.showError(self.errCodes.DEVELOPER_ERR, 
             "Attempt to create a mediastream without one to clone from");
            return null;
         }

         //
         // clone whatever mediastream we found, and remove any of it's 
         // tracks.
         //
         var mediaClone = streamToClone.clone();
         var i;
         var oldTracks = mediaClone.getTracks();

        if (audioTracks) {
            for (i = 0; i < audioTracks.length; i++) {
                mediaClone.addTrack(audioTracks[i].clone());
            }
        }

        if (videoTracks) {
            for (i = 0; i < videoTracks.length; i++) {
                mediaClone.addTrack(videoTracks[i].clone());
            }
        }

        for( i = 0; i < oldTracks.length; i++ ) {
            mediaClone.removeTrack(oldTracks[i]);
        }

        registerLocalMediaStreamByName(mediaClone, streamName);
        return mediaClone;
    };

    /* @private*/
    /** Load Easyrtc Stylesheet.
     *   Easyrtc Stylesheet define easyrtcMirror class and some basic css class for using easyrtc.js.
     *   That way, developers can override it or use it's own css file minified css or package.
     * @example
     *       easyrtc.loadStylesheet();
     *
     */
    this.loadStylesheet = function() {

        //
        // check to see if we already have an easyrtc.css file loaded
        // if we do, we can exit immediately.
        //
        var links = document.getElementsByTagName("link");
        var cssIndex, css;
        for (cssIndex in links) {
            if (links.hasOwnProperty(cssIndex)) {
                css = links[cssIndex];
                if (css.href && (css.href.match(/\/easyrtc.css/))) {
                    return;
                }
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
    };
    /** @private
     * @param {String} x */
    this.formatError = function(x) {
        var name, result;
        if (x === null || typeof x === 'undefined') {
            return "null";
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
                result = "{";
                for (name in x) {
                    if (x.hasOwnProperty(name)) {
                        if (typeof x[name] === 'string') {
                            result = result + name + "='" + x[name] + "' ";
                        }
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
     * @param {function(Object)} successCallback - will be called with localmedia stream on success. 
     * @param {function(String,String)} errorCallback - is called with an error code and error description.
     * @param {String} streamName - an optional name for the media source so you can use multiple cameras and screen share simultaneously.
     * @example
     *       easyrtc.initMediaSource(
     *          function(mediastream){
     *              easyrtc.setVideoObjectSrc( document.getElementById("mirrorVideo"), mediastream);
     *          },
     *          function(errorCode, errorText){
     *               easyrtc.showError(errorCode, errorText);
     *          });
     *
     */
    this.initMediaSource = function(successCallback, errorCallback, streamName) {

        if (self.debugPrinter) {
            self.debugPrinter("about to request local media");
        }

        if (!streamName) {
            streamName = "default";
        }

        haveAudioVideo = {
            audio: audioEnabled,
            video: videoEnabled
        };
        if (!errorCallback) {
            errorCallback = function(errorCode, errorText) {
                var message = "easyrtc.initMediaSource: " + self.formatError(errorText);
                if (self.debugPrinter) {
                    self.debugPrinter(message);
                }
                self.showError(self.errCodes.MEDIA_ERR, message);
            };
        }

        if (!self.supportsGetUserMedia()) {
            errorCallback(self.errCodes.MEDIA_ERR, self.getConstantString("noWebrtcSupport"));
            return;
        }


        if (!successCallback) {
            self.showError(self.errCodes.DEVELOPER_ERR,
                    "easyrtc.initMediaSource not supplied a successCallback");
            return;
        }


        var mode = self.getUserMediaConstraints();
        /** @private
         * @param {Object} stream - A mediaStream object.
         *  */
        var onUserMediaSuccess = function(stream) {
            if (self.debugPrinter) {
                self.debugPrinter("getUserMedia success callback entered");
            }

            if (self.debugPrinter) {
                self.debugPrinter("successfully got local media");
            }

            stream.streamName = streamName;
            registerLocalMediaStreamByName(stream, streamName);
            var videoObj, triesLeft, tryToGetSize, ele;
            if (haveAudioVideo.video) {
                videoObj = document.createElement('video');
                videoObj.muted = true;
                triesLeft = 30;
                tryToGetSize = function() {
                    if (videoObj.videoWidth > 0 || triesLeft < 0) {
                        self.nativeVideoWidth = videoObj.videoWidth;
                        self.nativeVideoHeight = videoObj.videoHeight;
                        if (self._desiredVideoProperties.height &&
                                (self.nativeVideoHeight !== self._desiredVideoProperties.height ||
                                        self.nativeVideoWidth !== self._desiredVideoProperties.width)) {
                            self.showError(self.errCodes.MEDIA_WARNING,
                                    self.format(self.getConstantString("resolutionWarning"),
                                    self._desiredVideoProperties.width, self._desiredVideoProperties.height,
                                    self.nativeVideoWidth, self.nativeVideoHeight));
                        }
                        self.setVideoObjectSrc(videoObj, "");
                        if (videoObj.removeNode) {
                            videoObj.removeNode(true);
                        }
                        else {
                            ele = document.createElement('div');
                            ele.appendChild(videoObj);
                            ele.removeChild(videoObj);
                        }

                        updateConfigurationInfo();
                        if (successCallback) {
                            successCallback(stream);
                        }
                    }
                    else {
                        triesLeft -= 1;
                        setTimeout(tryToGetSize, 300);
                    }
                };
                self.setVideoObjectSrc(videoObj, stream);
                tryToGetSize();
            }
            else {
                updateConfigurationInfo();
                if (successCallback) {
                    successCallback(stream);
                }
            }
        };
        /** @private
         * @param {String} error
         */
        var onUserMediaError = function(error) {
            console.log("getusermedia failed");
            if (self.debugPrinter) {
                self.debugPrinter("failed to get local media");
            }
            var errText;
            if (typeof error === 'string') {
                errText = error;
            }
            else if (error.name) {
                errText = error.name;
            }
            else {
                errText = "Unknown";
            }
            if (errorCallback) {
                console.log("invoking error callback", errText);
                errorCallback(self.errCodes.MEDIA_ERR, self.format(self.getConstantString("gumFailed"), errText));
            }
            closeLocalMediaStreamByName(streamName);
            haveAudioVideo = {
                audio: false,
                video: false
            };
            updateConfigurationInfo();
        };
        if (!audioEnabled && !videoEnabled) {
            onUserMediaError(self.getConstantString("requireAudioOrVideo"));
            return;
        }

        function getCurrentTime() {
            return (new Date()).getTime();
        }

        var firstCallTime;
        function tryAgain(error) {
            var currentTime = getCurrentTime();
            if (currentTime < firstCallTime + 1000) {
                console.log("Trying getUserMedia a second time");
                setTimeout(function() {
                    getUserMedia(mode, onUserMediaSuccess, onUserMediaError);
                }, 3000);
            }
            else {
                onUserMediaError(error);
            }
        }

        if (videoEnabled || audioEnabled) {
            //
            // getUserMedia sometimes fails the first time I call it. I suspect it's a page loading
            // issue. So I'm going to try adding a 3 second delay to allow things to settle down first.
            // In addition, I'm going to try again after 3 seconds.
            //


            setTimeout(function() {
                try {
                    firstCallTime = getCurrentTime();
                    getUserMedia(mode, onUserMediaSuccess, tryAgain);
                } catch (e) {
                    tryAgain(e);
                }
            }, 1000);
        }
        else {
            onUserMediaSuccess(null);
        }
    };
    /**
     * Sets the callback used to decide whether to accept or reject an incoming call.
     * @param {Function} acceptCheck takes the arguments (callerEasyrtcid, acceptor).     
     * The acceptCheck callback is passed an easyrtcid and an aceptor function. The acceptor function should be called with either
     * a true value (accept the call) or false value( reject the call) as it's first argument, and optionally,
     * an array of local media streamNames as a second argument.
     * @example
     *      easyrtc.setAcceptChecker( function(easyrtcid, acceptor){
     *           if( easyrtc.idToName(easyrtcid) === 'Fred' ){
     *              acceptor(true);
     *           }
     *           else if( easyrtc.idToName(easyrtcid) === 'Barney' ){
     *              setTimeout( function(){ 
     acceptor(true, ['myOtherCam']); // myOtherCam presumed to a streamName
     }, 10000);
     *           }
     *           else{
     *              acceptor(false);
     *           }
     *      });
     */
    this.setAcceptChecker = function(acceptCheck) {
        self.acceptCheck = acceptCheck;
    };
    /**
     * easyrtc.setStreamAcceptor sets a callback to receive media streams from other peers, independent
     * of where the call was initiated (caller or callee).
     * @param {Function} acceptor takes arguments (caller, mediaStream, mediaStreamName)
     * @example
     *  easyrtc.setStreamAcceptor(function(easyrtcid, stream, streamName){
     *     document.getElementById('callerName').innerHTML = easyrtc.idToName(easyrtcid);
     *     easyrtc.setVideoObjectSrc( document.getElementById("callerVideo"), stream);
     *  });
     */
    this.setStreamAcceptor = function(acceptor) {
        self.streamAcceptor = acceptor;
    };
    /** Sets the easyrtc.onError field to a user specified function.
     * @param {Function} errListener takes an object of the form {errorCode: String, errorText: String}
     * @example
     *    easyrtc.setOnError( function(errorObject){
     *        document.getElementById("errMessageDiv").innerHTML += errorObject.errorText;
     *    });
     */
    self.setOnError = function(errListener) {
        self.onError = errListener;
    };
    /**
     * Sets the callCancelled callback. This will be called when a remote user
     * initiates a call to you, but does a "hangup" before you have a chance to get his video stream.
     * @param {Function} callCancelled takes an easyrtcid as an argument and a boolean that indicates whether
     *  the call was explicitly cancelled remotely (true), or actually accepted by the user attempting a call to
     *  the same party.
     * @example
     *     easyrtc.setCallCancelled( function(easyrtcid, explicitlyCancelled){
     *        if( explicitlyCancelled ){
     *            console.log(easyrtc.idToName(easyrtcid) + " stopped trying to reach you");
     *         }
     *         else{
     *            console.log("Implicitly called "  + easyrtc.idToName(easyrtcid));
     *         }
     *     });
     */
    this.setCallCancelled = function(callCancelled) {
        self.callCancelled = callCancelled;
    };
    /**  Sets a callback to receive notification of a media stream closing. The usual
     *  use of this is to clear the source of your video object so you aren't left with
     *  the last frame of the video displayed on it.
     *  @param {Function} onStreamClosed takes an easyrtcid as it's first parameter, the stream as it's second argument, and name of the video stream as it's third.
     *  @example
     *     easyrtc.setOnStreamClosed( function(easyrtcid, stream, streamName){
     *         easyrtc.setVideoObjectSrc( document.getElementById("callerVideo"), "");
     *         ( easyrtc.idToName(easyrtcid) + " closed stream " + stream.id + " " + streamName);
     *     });
     */
    this.setOnStreamClosed = function(onStreamClosed) {
        self.onStreamClosed = onStreamClosed;
    };
    /** @deprecated No longer supported by Google.
     * Sets the bandwidth for sending video data.
     * Setting the rate too low will cause connection attempts to fail. 40 is probably good lower limit.
     * The default is 50. A value of zero will remove bandwidth limits.
     * @param {Number} kbitsPerSecond is rate in kilobits per second.
     * @example
     *    easyrtc.setVideoBandwidth( 40);
     */
    this.setVideoBandwidth = function(kbitsPerSecond) {
        self.showError("easyrtc.setVideoBandwidth is deprecated, it no longer has an effect.");
    };
    /** Determines whether the current browser supports the new data channels.
     * EasyRTC will not open up connections with the old data channels.
     * @returns {Boolean}
     */
    this.supportsDataChannels = function() {
        if (navigator.userAgent.match(/android/i)) {
            return webrtcDetectedVersion >= 34;
        }
        else {
            return (webrtcDetectedBrowser === "firefox" || webrtcDetectedVersion >= 32);
        }
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
     *     easyrtc.setPeerListener( function(easyrtcid, msgType, msgData, targeting){
     *         console.log("From " + easyrtc.idToName(easyrtcid) +
     *             " sent the following data " + JSON.stringify(msgData));
     *     });
     *     easyrtc.setPeerListener( function(easyrtcid, msgType, msgData, targeting){
     *         console.log("From " + easyrtc.idToName(easyrtcid) +
     *             " sent the following data " + JSON.stringify(msgData));
     *     }, 'food', 'dkdjdekj44--');
     *     easyrtc.setPeerListener( function(easyrtcid, msgType, msgData, targeting){
     *         console.log("From " + easyrtcid +
     *             " sent the following data " + JSON.stringify(msgData));
     *     }, 'drink');
     *
     *
     */
    this.setPeerListener = function(listener, msgType, source) {
        if (!msgType) {
            receivePeer.cb = listener;
        }
        else {
            if (!receivePeer.msgTypes[msgType]) {
                receivePeer.msgTypes[msgType] = {sources: {}};
            }
            if (!source) {
                receivePeer.msgTypes[msgType].cb = listener;
            }
            else {
                receivePeer.msgTypes[msgType].sources[source] = {cb: listener};
            }
        }
    };
    /* This function serves to distribute peer messages to the various peer listeners */
    /** @private
     * @param {String} easyrtcid
     * @param {Object} msg - needs to contain a msgType and a msgData field.
     * @param {Object} targeting
     */
    this.receivePeerDistribute = function(easyrtcid, msg, targeting) {
        var msgType = msg.msgType;
        var msgData = msg.msgData;
        if (!msgType) {
            console.log("received peer message without msgType", msg);
            return;
        }

        if (receivePeer.msgTypes[msgType]) {
            if (receivePeer.msgTypes[msgType].sources[easyrtcid] &&
                    receivePeer.msgTypes[msgType].sources[easyrtcid].cb) {
                receivePeer.msgTypes[msgType].sources[easyrtcid].cb(easyrtcid, msgType, msgData, targeting);
                return;
            }
            if (receivePeer.msgTypes[msgType].cb) {
                receivePeer.msgTypes[msgType].cb(easyrtcid, msgType, msgData, targeting);
                return;
            }
        }
        if (receivePeer.cb) {
            receivePeer.cb(easyrtcid, msgType, msgData, targeting);
        }
    };
    /**
     * Sets a listener for messages from the server.
     * @param {Function} listener has the signature (msgType, msgData, targeting)
     * @example
     *     easyrtc.setServerListener( function(msgType, msgData, targeting){
     *         ("The Server sent the following message " + JSON.stringify(msgData));
     *     });
     */
    this.setServerListener = function(listener) {
        receiveServerCB = listener;
    };
    /**
     * Sets the url of the Socket server.
     * The node.js server is great as a socket server, but it doesn't have
     * all the hooks you'd like in a general web server, like PHP or Python
     * plug-ins. By setting the serverPath your application can get it's regular
     * pages from a regular web server, but the EasyRTC library can still reach the
     * socket server.
     * @param {String} socketUrl
     * @param {Object} options an optional dictionary of options for socket.io's connect method. 
     * The default is {'connect timeout': 10000,'force new connection': true }
     * @example
     *     easyrtc.setSocketUrl(":8080", options);
     */
    this.setSocketUrl = function(socketUrl, options) {
        if (self.debugPrinter) {
            self.debugPrinter("WebRTC signaling server URL set to " + socketUrl);
        }
        serverPath = socketUrl;
        if( options ) {
            connectionOptions = options;
        }
    };
    /**
     * Sets the user name associated with the connection.
     * @param {String} username must obey standard identifier conventions.
     * @returns {Boolean} true if the call succeeded, false if the username was invalid.
     * @example
     *    if( !easyrtc.setUsername("JohnSmith") ){
     *        console.error("bad user name);
     *
     */
    this.setUsername = function(username) {
        if( self.myEasyrtcid ) {
            easyrtc.showError(easyrtc.errCodes.DEVELOPER_ERR, "easyrtc.setUsername called after authentication");
            return false;
        }
        else if (self.isNameValid(username)) {
            self.username = username;
            return true;
        }
        else {
            self.showError(self.errCodes.BAD_NAME, self.format(self.getConstantString("badUserName"), username));
            return false;
        }
    };
    /**
     * Get an array of easyrtcids that are using a particular username
     * @param {String} username - the username of interest.
     * @param {String} room - an optional room name argument limiting results to a particular room.
     * @returns {Array} an array of {easyrtcid:id, roomName: roomName}.
     */
    this.usernameToIds = function(username, room) {
        var results = [];
        var id, roomName;
        for (roomName in lastLoggedInList) {
            if (!lastLoggedInList.hasOwnProperty(roomName)) {
                continue;
            }
            if (room && roomName !== room) {
                continue;
            }
            for (id in lastLoggedInList[roomName]) {
                if (!lastLoggedInList[roomName].hasOwnProperty(id)) {
                    continue;
                }
                if (lastLoggedInList[roomName][id].username === username) {
                    results.push({
                        easyrtcid: id,
                        roomName: roomName
                    });
                }
            }
        }
        return results;
    };
    /**
     * Returns another peers API field, if it exists.
     * @param {type} roomName
     * @param {type} easyrtcid
     * @param {type} fieldName
     * @returns {Object}  Undefined if the attribute does not exist, its value otherwise.
     */
    this.getRoomApiField = function(roomName, easyrtcid, fieldName) {
        if (lastLoggedInList[roomName] &&
                lastLoggedInList[roomName][easyrtcid] &&
                lastLoggedInList[roomName][easyrtcid].apiField &&
                lastLoggedInList[roomName][easyrtcid].apiField[fieldName]) {
            return lastLoggedInList[roomName][easyrtcid].apiField[fieldName].fieldValue;
        }
        else {
            return undefined;
        }
    };
    /**
     * Set the authentication credential if needed.
     * @param {Object} credentialParm - a JSONable object.
     */
    this.setCredential = function(credentialParm) {
        try {
            JSON.stringify(credentialParm);
            credential = credentialParm;
            return true;
        }
        catch (oops) {
            self.showError(self.errCodes.BAD_CREDENTIAL, "easyrtc.setCredential passed a non-JSON-able object");
            throw "easyrtc.setCredential passed a non-JSON-able object";
        }
    };
    /**
     * Sets the listener for socket disconnection by external (to the API) reasons.
     * @param {Function} disconnectListener takes no arguments and is not called as a result of calling easyrtc.disconnect.
     * @example
     *    easyrtc.setDisconnectListener(function(){
     *        easyrtc.showError("SYSTEM-ERROR", "Lost our connection to the socket server");
     *    });
     */
    this.setDisconnectListener = function(disconnectListener) {
        self.disconnectListener = disconnectListener;
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
    this.idToName = function(easyrtcid) {
        var roomName;
        for (roomName in lastLoggedInList) {
            if (!lastLoggedInList.hasOwnProperty(roomName)) {
                continue;
            }
            if (lastLoggedInList[roomName][easyrtcid]) {
                if (lastLoggedInList[roomName][easyrtcid].username) {
                    return lastLoggedInList[roomName][easyrtcid].username;
                }
            }
        }
        return easyrtcid;
    };
    /* used in easyrtc.connect */
    /** @private */
    this.webSocket = null;
    var pc_config = {};
    var pc_config_to_use = null;
    var use_fresh_ice_each_peer = false;
    /**
     * Determines whether fresh ice server configuration should be requested from the server for each peer connection.
     * @param {Boolean} value the default is false.
     */
    this.setUseFreshIceEachPeerConnection = function(value) {
        use_fresh_ice_each_peer = value;
    };
    /**
     * Returns the last ice config supplied by the EasyRTC server. This function is not normally used, it is provided
     * for people who want to try filtering ice server configuration on the client.
     * @return {Object} which has the form {iceServers:[ice_server_entry, ice_server_entry, ...]}
     */
    this.getServerIce = function() {
        return pc_config;
    };
    /**
     * Sets the ice server configuration that will be used in subsequent calls. You only need this function if you are filtering
     * the ice server configuration on the client or if you are using TURN certificates that have a very short lifespan.
     * @param {Object} ice An object with iceServers element containing an array of ice server entries.
     * @example
     *     easyrtc.setIceUsedInCalls( {"iceServers": [
     *      {
     *			"url": "stun:stun.sipgate.net"
     *		},
     *      {
     *         "url": "stun:217.10.68.152"
     *      },
     *      {
     *         "url": "stun:stun.sipgate.net:10000"
     *      }
     *      ]});
     *      easyrtc.call(...);
     */
    this.setIceUsedInCalls = function(ice) {
        if (!ice.iceServers) {
            easyrtc.showError(easyrtc.errCodes.DEVELOPER_ERR, "Bad ice configuration passed to easyrtc.setIceUsedInCalls");
        }
        else {
            pc_config_to_use = ice;
        }
    };
    var closedChannel = null;
    /** @private
     * @param easyrtcid
     * @param checkAudio
     */
    function _haveTracks(easyrtcid, checkAudio, streamName) {
        var stream, peerConnObj;
        if (!easyrtcid) {
            stream = getLocalMediaStreamByName(streamName);
        }
        else {
            peerConnObj = peerConns[easyrtcid];
            if (!peerConnObj) {
                console.error("Developer error: haveTracks called about a peer you don't have a connection to");
                return false;
            }
            stream = peerConnObj.getRemoteStreamByName(streamName);
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
    }
    ;
    /** Determines if a particular peer2peer connection has an audio track.
     * @param {String} easyrtcid - the id of the other caller in the connection. If easyrtcid is not supplied, checks the local media.
     * @param {String} streamName - an optional stream id.
     * @return {Boolean} true if there is an audio track or the browser can't tell us.
     */
    this.haveAudioTrack = function(easyrtcid, streamName) {
        return _haveTracks(easyrtcid, true, streamName);
    };
    /** Determines if a particular peer2peer connection has a video track.
     * @param {String} easyrtcid - the id of the other caller in the connection. If easyrtcid is not supplied, checks the local media.
     * @param {String} streamName - an optional stream id.     *
     * @return {Boolean} true if there is an video track or the browser can't tell us.
     */
    this.haveVideoTrack = function(easyrtcid, streamName) {
        return _haveTracks(easyrtcid, false, streamName);
    };
    /**
     * Gets a data field associated with a room.
     * @param {String} roomName - the name of the room.
     * @param {String} fieldName - the name of the field.
     * @return {Object} dataValue - the value of the field if present, undefined if not present.
     */
    this.getRoomField = function(roomName, fieldName) {
        var fields = self.getRoomFields(roomName);
        if (!fields || !fields[fieldName])
            return undefined;
        return fields[fieldName].fieldValue;
    };
//
// Experimental function to determine if statistics gathering is supported.
//
    this.supportsStatistics = function() {
        var peer;
        try {
            peer = new RTCPeerConnection({iceServers: []}, {});
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
     *        lists of users. Note that the server configuration specifies a regular expression that is used to check application names
     *        for validity. The default pattern is that of an identifier, spaces are not allowed.
     * @param {Function} successCallback (easyrtcId, roomOwner) - is called on successful connect. easyrtcId is the
     *   unique name that the client is known to the server by. A client usually only needs it's own easyrtcId for debugging purposes.
     *       roomOwner is true if the user is the owner of a room. It's value is random if the user is in multiple rooms.
     * @param {Function} errorCallback (errorCode, errorText) - is called on unsuccessful connect. if null, an alert is called instead.
     *  The errorCode takes it's value from easyrtc.errCodes.
     * @example
     *   easyrtc.connect("mychat_app",
     *                   function(easyrtcid, roomOwner){
     *                       if( roomOwner){ console.log("I'm the room owner"); }
     *                       console.log("my id is " + easyrtcid);
     *                   },
     *                   function(errorText){
     *                       console.log("failed to connect ", erFrText);
     *                   });
     */

    var fields = null;
    function isEmptyObj(obj) {
        if (obj === null || obj === undefined) {
            return true;
        }
        var key;
        for (key in obj) {
            if (obj.hasOwnProperty(key)) {
                return false;
            }
        }
        return true;
    }

    //
// easyrtc.disconnect performs a clean disconnection of the client from the server.
//
    function disconnectBody() {
        var key;
        self.loggingOut = true;
        offersPending = {};
        acceptancePending = {};
        self.disconnecting = true;
        closedChannel = self.webSocket;
        if (self.webSocketConnected) {
            if (!preallocatedSocketIo) {
                self.webSocket.close();
            }
            self.webSocketConnected = false;
        }
        self.hangupAll();
        if (roomOccupantListener) {
            for (key in lastLoggedInList) {
                if (lastLoggedInList.hasOwnProperty(key)) {
                    roomOccupantListener(key, {}, false);
                }
            }
        }
        lastLoggedInList = {};
        self.emitEvent("roomOccupant", {});
        self.roomData = {};
        self.roomJoin = {};
        self.loggingOut = false;
        self.myEasyrtcid = null;
        self.disconnecting = false;
        oldConfig = {};
    }
    ;
    this.disconnect = function() {

        if (self.debugPrinter) {
            self.debugPrinter("attempt to disconnect from WebRTC signalling server");
        }

        self.disconnecting = true;
        self.hangupAll();
        self.loggingOut = true;
        //
        // The hangupAll may try to send configuration information back to the server.
        // Collecting that information is asynchronous, we don't actually close the
        // connection until it's had a chance to be sent. We allocate 100ms for collecting
        // the info, so 250ms should be sufficient for the disconnecting.
        //
        setTimeout(function() {
            if (self.webSocket) {
                try {
                    self.webSocket.disconnect();
                } catch (e) {
                    // we don't really care if this fails.
                }

                closedChannel = self.webSocket;
                self.webSocket = 0;
            }
            self.loggingOut = false;
            self.disconnecting = false;
            if (roomOccupantListener) {
                roomOccupantListener(null, {}, false);
            }
            self.emitEvent("roomOccupant", {});
            oldConfig = {};
        }, 250);
    };
    //
    // This function is used to send WebRTC signaling messages to another client. These messages all the form:
    //   destUser: some id or null
    //   msgType: one of ["offer"/"answer"/"candidate","reject","hangup", "getRoomList"]
    //   msgData: either null or an SDP record
    //   successCallback: a function with the signature  function(msgType, wholeMsg);
    //   errorCallback: a function with signature function(errorCode, errorText)
    //
    function sendSignalling(destUser, msgType, msgData, successCallback, errorCallback) {
        if (!self.webSocket) {
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

            if (self.debugPrinter) {
                self.debugPrinter("sending socket message " + JSON.stringify(dataToShip));
            }
            self.webSocket.json.emit("easyrtcCmd", dataToShip,
                    function(ackMsg) {
                        if (ackMsg.msgType !== "error") {
                            if (!ackMsg.hasOwnProperty("msgData")) {
                                ackMsg.msgData = null;
                            }
                            if (successCallback) {
                                successCallback(ackMsg.msgType, ackMsg.msgData);
                            }
                        }
                        else {
                            if (errorCallback) {
                                errorCallback(ackMsg.msgData.errorCode, ackMsg.msgData.errorText);
                            }
                            else {
                                self.showError(ackMsg.msgData.errorCode, ackMsg.msgData.errorText);
                            }
                        }
                    }
            );
        }
    }


    /**
     *Sends data to another user using previously established data channel. This method will
     * fail if no data channel has been established yet. Unlike the easyrtc.sendWS method,
     * you can't send a dictionary, convert dictionaries to strings using JSON.stringify first.
     * What data types you can send, and how large a data type depends on your browser.
     * @param {String} destUser (an easyrtcid)
     * @param {String} msgType - the type of message being sent (application specific).
     * @param {Object} msgData - a JSONable object.
     * @example
     *     easyrtc.sendDataP2P(someEasyrtcid, "roomData", {room:499, bldgNum:'asd'});
     */
    this.sendDataP2P = function(destUser, msgType, msgData) {

        var flattenedData = JSON.stringify({msgType: msgType, msgData: msgData});
        if (self.debugPrinter) {
            self.debugPrinter("sending p2p message to " + destUser + " with data=" + JSON.stringify(flattenedData));
        }

        if (!peerConns[destUser]) {
            self.showError(self.errCodes.DEVELOPER_ERR, "Attempt to send data peer to peer without a connection to " + destUser + ' first.');
        }
        else if (!peerConns[destUser].dataChannelS) {
            self.showError(self.errCodes.DEVELOPER_ERR, "Attempt to send data peer to peer without establishing a data channel to " + destUser + ' first.');
        }
        else if (!peerConns[destUser].dataChannelReady) {
            self.showError(self.errCodes.DEVELOPER_ERR, "Attempt to use data channel to " + destUser + " before it's ready to send.");
        }
        else {
            try {
                peerConns[destUser].dataChannelS.send(flattenedData);
            } catch (oops) {
                console.log("error=", oops);
                throw oops;
            }
        }
    };
    /** Sends data to another user using websockets. The easyrtc.sendServerMessage or easyrtc.sendPeerMessage methods
     * are wrappers for this method; application code should use them instead.
     * @param {String} destination - either a string containing the easyrtcId of the other user, or an object containing some subset of the following fields: targetEasyrtcid, targetGroup, targetRoom.
     * Specifying multiple fields restricts the scope of the destination (operates as a logical AND, not a logical OR).
     * @param {String} msgType -the type of message being sent (application specific).
     * @param {Object} msgData - a JSONable object.
     * @param {Function} ackhandler - by default, the ackhandler handles acknowledgments from the server that your message was delivered to it's destination.
     * However, application logic in the server can over-ride this. If you leave this null, a stub ackHandler will be used. The ackHandler
     * gets passed a message with the same msgType as your outgoing message, or a message type of "error" in which case
     * msgData will contain a errorCode and errorText fields.
     * @example
     *    easyrtc.sendDataWS(someEasyrtcid, "setPostalAddress", {room:499, bldgNum:'asd'},
     *      function(ackMsg){
     *          console.log("saw the following acknowledgment " + JSON.stringify(ackMsg));
     *      }
     *    );
     */
    this.sendDataWS = function(destination, msgType, msgData, ackhandler) {
        if (self.debugPrinter) {
            self.debugPrinter("sending client message via websockets to " + destination + " with data=" + JSON.stringify(msgData));
        }
        if (!ackhandler) {
            ackhandler = function(msg) {
                if (msg.msgType === "error") {
                    self.showError(msg.msgData.errorCode, msg.msgData.errorText);
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


        if (self.webSocket) {
            self.webSocket.json.emit("easyrtcMsg", outgoingMessage, ackhandler);
        }
        else {
            if (self.debugPrinter) {
                self.debugPrinter("websocket failed because no connection to server");
            }
            throw "Attempt to send message without a valid connection to the server.";
        }
    };
    /** Sends data to another user. This method uses data channels if one has been set up, or websockets otherwise.
     * @param {String} destUser - a string containing the easyrtcId of the other user.
     * Specifying multiple fields restricts the scope of the destination (operates as a logical AND, not a logical OR).
     * @param {String} msgType -the type of message being sent (application specific).
     * @param {Object} msgData - a JSONable object.
     * @param {Function} ackHandler - a function which receives acknowledgments. May only be invoked in
     *  the websocket case.
     * @example
     *    easyrtc.sendData(someEasyrtcid, "roomData",  {room:499, bldgNum:'asd'},
     *       function ackHandler(msgType, msgData);
     *    );
     */
    this.sendData = function(destUser, msgType, msgData, ackHandler) {
        if (peerConns[destUser] && peerConns[destUser].dataChannelReady) {
            self.sendDataP2P(destUser, msgType, msgData);
        }
        else {
            self.sendDataWS(destUser, msgType, msgData, ackHandler);
        }
    };
    /**
     * Sends a message to another peer on the easyrtcMsg channel.
     * @param {String} destination - either a string containing the easyrtcId of the other user, or an object containing some subset of the following fields: targetEasyrtcid, targetGroup, targetRoom.
     * Specifying multiple fields restricts the scope of the destination (operates as a logical AND, not a logical OR).
     * @param {String} msgType - the type of message being sent (application specific).
     * @param {Object} msgData - a JSONable object with the message contents.
     * @param {function(String, Object)} successCB - a callback function with results from the server.
     * @param {function(String, String)} failureCB - a callback function to handle errors.
     * @example
     *     easyrtc.sendPeerMessage(otherUser, 'offer_candy', {candy_name:'mars'},
     *             function(msgType, msgBody ){
     *                console.log("message was sent");
     *             },
     *             function(errorCode, errorText){
     *                console.log("error was " + errorText);
     *             });
     */
    this.sendPeerMessage = function(destination, msgType, msgData, successCB, failureCB) {
        if (!destination) {
            console.error("Developer error, destination was null in sendPeerMessage");
        }

        if (self.debugPrinter) {
            self.debugPrinter("sending peer message " + JSON.stringify(msgData));
        }
        function ackHandler(response) {
            if (response.msgType === "error") {
                if (failureCB) {
                    failureCB(response.msgData.errorCode, response.msgData.errorText);
                }
            }
            else {
                if (successCB) {
                    // firefox complains if you pass an undefined as an parameter.
                    successCB(response.msgType, response.msgData ? response.msgData : null);
                }
            }
        }

        self.sendDataWS(destination, msgType, msgData, ackHandler);
    };
    /**
     * Sends a message to the application code in the server (ie, on the easyrtcMsg channel).
     * @param {String} msgType - the type of message being sent (application specific).
     * @param {Object} msgData - a JSONable object with the message contents.
     * @param {function(String, Object)} successCB - a callback function with results from the server.
     * @param {function(String, String)} failureCB - a callback function to handle errors.
     * @example
     *     easyrtc.sendServerMessage('get_candy', {candy_name:'mars'},
     *             function(msgType, msgData ){
     *                console.log("got candy count of " + msgData.barCount);
     *             },
     *             function(errorCode, errorText){
     *                console.log("error was " + errorText);
     *             });
     */
    this.sendServerMessage = function(msgType, msgData, successCB, failureCB) {
        if (self.debugPrinter) {
            var dataToShip = {msgType: msgType, msgData: msgData};
            self.debugPrinter("sending server message " + JSON.stringify(dataToShip));
        }
        function ackhandler(response) {
            if (response.msgType === "error") {
                if (failureCB) {
                    failureCB(response.msgData.errorCode, response.msgData.errorText);
                }
            }
            else {
                if (successCB) {
                    successCB(response.msgType, response.msgData ? response.msgData : null);
                }
            }
        }

        self.sendDataWS(null, msgType, msgData, ackhandler);
    };
    /** Sends the server a request for the list of rooms the user can see.
     * You must have already be connected to use this function.
     * @param {function(Object)} callback - on success, this function is called with a map of the form  { roomName:{"roomName":String, "numberClients": Number}}.
     * The roomName appears as both the key to the map, and as the value of the "roomName" field.
     * @param {function(String, String)} errorCallback   is called on failure. It gets an errorCode and errorText as it's too arguments.
     * @example
     *    easyrtc.getRoomList(
     *        function(roomList){
     *           for(roomName in roomList){
     *              console.log("saw room " + roomName);
     *           }
     *         },
     *         function(errorCode, errorText){
     *            easyrtc.showError(errorCode, errorText);
     *         }
     *    );
     */
    this.getRoomList = function(callback, errorCallback) {
        sendSignalling(null, "getRoomList", null,
                function(msgType, msgData) {
                    callback(msgData.roomList);
                },
                function(errorCode, errorText) {
                    if (errorCallback) {
                        errorCallback(errorCode, errorText);
                    }
                    else {
                        self.showError(errorCode, errorText);
                    }
                }
        );
    };
    /** Value returned by easyrtc.getConnectStatus if the other user isn't connected to us. */
    this.NOT_CONNECTED = "not connected";
    /** Value returned by easyrtc.getConnectStatus if the other user is in the process of getting connected */
    this.BECOMING_CONNECTED = "connection in progress to us.";
    /** Value returned by easyrtc.getConnectStatus if the other user is connected to us. */
    this.IS_CONNECTED = "is connected";
    /**
     * Check if the client has a peer-2-peer connection to another user.
     * The return values are text strings so you can use them in debugging output.
     *  @param {String} otherUser - the easyrtcid of the other user.
     *  @return {String} one of the following values: easyrtc.NOT_CONNECTED, easyrtc.BECOMING_CONNECTED, easyrtc.IS_CONNECTED
     *  @example
     *     if( easyrtc.getConnectStatus(otherEasyrtcid) == easyrtc.NOT_CONNECTED ){
     *         easyrtc.call(otherEasyrtcid,
     *                  function(){ console.log("success"); },
     *                  function(){ console.log("failure"); });
     *     }
     */
    this.getConnectStatus = function(otherUser) {
        if (!peerConns.hasOwnProperty(otherUser)) {
            return self.NOT_CONNECTED;
        }
        var peer = peerConns[otherUser];
        if ((peer.sharingAudio || peer.sharingVideo) && !peer.startedAV) {
            return self.BECOMING_CONNECTED;
        }
        else if (peer.sharingData && !peer.dataChannelReady) {
            return self.BECOMING_CONNECTED;
        }
        else {
            return self.IS_CONNECTED;
        }
    };
    /**
     * @private
     */
    function buildPeerConstraints() {
        var options = [];
        options.push({'DtlsSrtpKeyAgreement': 'true'}); // for interoperability
        return {optional: options};
    }


    /**
     *  Initiates a call to another user. If it succeeds, the streamAcceptor callback will be called.
     * @param {String} otherUser - the easyrtcid of the peer being called.
     * @param {Function} callSuccessCB (otherCaller, mediaType) - is called when the datachannel is established or the MediaStream is established. mediaType will have a value of "audiovideo" or "datachannel"
     * @param {Function} callFailureCB (errorCode, errMessage) - is called if there was a system error interfering with the call.
     * @param {Function} wasAcceptedCB (wasAccepted:boolean,otherUser:string) - is called when a call is accepted or rejected by another party. It can be left null.
     * @param {Array} streamNames - optional array of streamNames.
     * @example
     *    easyrtc.call( otherEasyrtcid,
     *        function(easyrtcid, mediaType){
     *           console.log("Got mediaType " + mediaType + " from " + easyrtc.idToName(easyrtcid));
     *        },
     *        function(errorCode, errMessage){
     *           console.log("call to  " + easyrtc.idToName(otherEasyrtcid) + " failed:" + errMessage);
     *        },
     *        function(wasAccepted, easyrtcid){
     *            if( wasAccepted ){
     *               console.log("call accepted by " + easyrtc.idToName(easyrtcid));
     *            }
     *            else{
     *                console.log("call rejected" + easyrtc.idToName(easyrtcid));
     *            }
     *        });
     */
    this.call = function(otherUser, callSuccessCB, callFailureCB, wasAcceptedCB, streamNames) {

        if (streamNames) {
            if (typeof streamNames === "string") { // accept a string argument if passed.
                streamNames = [streamNames];
            }
            else if (streamNames.length === undefined) {
                easyrtc.showError(self.errCodes.DEVELOPER_ERR, "easyrtc.call passed bad streamNames");
                return;
            }
        }

        if (self.debugPrinter) {
            self.debugPrinter("initiating peer to peer call to " + otherUser +
                    " audio=" + audioEnabled +
                    " video=" + videoEnabled +
                    " data=" + dataEnabled);
        }

        if (!self.supportsPeerConnections()) {
            callFailureCB(self.errCodes.CALL_ERR, self.getConstantString("noWebrtcSupport"));
            return;
        }

        var message;
        //
        // If we are sharing audio/video and we haven't allocated the local media stream yet,
        // we'll do so, recalling ourself on success.
        //
        if (!streamNames && autoInitUserMedia) {
            var stream = self.getLocalStream();
            if (!stream && (audioEnabled || videoEnabled)) {
                self.initMediaSource(function() {
                    self.call(otherUser, callSuccessCB, callFailureCB, wasAcceptedCB);
                }, callFailureCB);
                return;
            }
        }

        if (!self.webSocket) {
            message = "Attempt to make a call prior to connecting to service";
            if (self.debugPrinter) {
                self.debugPrinter(message);
            }
            throw message;
        }

        //
        // If B calls A, and then A calls B before accepting, then A should treat the attempt to
        // call B as a positive offer to B's offer.
        //
        if (offersPending[otherUser]) {
            wasAcceptedCB(true);
            doAnswer(otherUser, offersPending[otherUser], streamNames);
            delete offersPending[otherUser];
            self.callCancelled(otherUser, false);
            return;
        }

        // do we already have a pending call?
        if (typeof acceptancePending[otherUser] !== 'undefined') {
            message = "Call already pending acceptance";
            if (self.debugPrinter) {
                self.debugPrinter(message);
            }
            callFailureCB(self.errCodes.ALREADY_CONNECTED, message);
            return;
        }

        if (use_fresh_ice_each_peer) {
            self.getFreshIceConfig(function(succeeded) {
                if (succeeded) {
                    callBody(otherUser, callSuccessCB, callFailureCB, wasAcceptedCB, streamNames);
                }
                else {
                    callFailureCB(self.errCodes.CALL_ERR, "Attempt to get fresh ice configuration failed");
                }
            });
        }
        else {
            callBody(otherUser, callSuccessCB, callFailureCB, wasAcceptedCB, streamNames);
        }
    };
    function callBody(otherUser, callSuccessCB, callFailureCB, wasAcceptedCB, streamNames) {
        acceptancePending[otherUser] = true;
        var pc = buildPeerConnection(otherUser, true, callFailureCB, streamNames);
        if (!pc) {
            message = "buildPeerConnection failed, call not completed";
            if (self.debugPrinter) {
                self.debugPrinter(message);
            }
            throw message;
        }

        peerConns[otherUser].callSuccessCB = callSuccessCB;
        peerConns[otherUser].callFailureCB = callFailureCB;
        peerConns[otherUser].wasAcceptedCB = wasAcceptedCB;
        var peerConnObj = peerConns[otherUser];
        var setLocalAndSendMessage0 = function(sessionDescription) {
            if (peerConnObj.cancelled) {
                return;
            }
            var sendOffer = function() {

                sendSignalling(otherUser, "offer", sessionDescription, null, callFailureCB);
            };
            if (sdpLocalFilter) {
                sessionDescription.sdp = sdpLocalFilter(sessionDescription.sdp);
            }
            pc.setLocalDescription(sessionDescription, sendOffer,
                    function(errorText) {
                        callFailureCB(self.errCodes.CALL_ERR, errorText);
                    });
        };
        setTimeout(function() {
            //
            // if the call was cancelled, we don't want to continue getting the offer.
            // we can tell the call was cancelled because there won't be a peerConn object
            // for it.
            //
            if( !peerConns[otherUser]) {
                return;
            }
            pc.createOffer(setLocalAndSendMessage0, function(errorObj) {
                callFailureCB(self.errCodes.CALL_ERR, JSON.stringify(errorObj));
            },
                    receivedMediaContraints);
        }, 100);
    }
    ;
    function hangupBody(otherUser) {
        var i;
        if (self.debugPrinter) {
            self.debugPrinter("Hanging up on " + otherUser);
        }
        clearQueuedMessages(otherUser);
        if (peerConns[otherUser]) {
            if (peerConns[otherUser].pc) {
                var remoteStreams = peerConns[otherUser].pc.getRemoteStreams();
                for (i = 0; i < remoteStreams.length; i++) {
                    if( !remoteStreams[i].ended ) {
                        emitOnStreamClosed(otherUser, remoteStreams[i]);
                        try {
                            remoteStreams[i].close();
                        } catch (err) {
                        }
                    }
                }
                //
                // todo: may need to add a few lines here for closing the data channels
                //
                try {
                    peerConns[otherUser].pc.close();
                } catch (err) {
                }
            }

            peerConns[otherUser].cancelled = true;
            delete peerConns[otherUser];
            if (self.webSocket) {
                sendSignalling(otherUser, "hangup", null, function() {
                }, function(errorCode, errorText) {
                    if (self.debugPrinter) {
                        self.debugPrinter("hangup failed:" + errorText);
                    }
                });
            }
            if (acceptancePending[otherUser]) {
                delete acceptancePending[otherUser];
            }
        }
    }

    /**
     * Hang up on a particular user or all users.
     *  @param {String} otherUser - the easyrtcid of the person to hang up on.
     *  @example
     *     easyrtc.hangup(someEasyrtcid);
     */
    this.hangup = function(otherUser) {
        hangupBody(otherUser);
        updateConfigurationInfo();
    };
    /**
     * Hangs up on all current connections.
     * @example
     *    easyrtc.hangupAll();
     */
    this.hangupAll = function() {

        var sawAConnection = false,
                onHangupSuccess = function() {
        },
                onHangupFailure = function(errorCode, errorText) {
            if (self.debugPrinter) {
                self.debugPrinter("hangup failed:" + errorText);
            }
        };
        for (var otherUser in peerConns) {
            if (!peerConns.hasOwnProperty(otherUser)) {
                continue;
            }
            sawAConnection = true;
            hangupBody(otherUser);
        }

        if (sawAConnection) {
            updateConfigurationInfo();
        }
    };
    /** Checks to see if data channels work between two peers.
     * @param {String} otherUser - the other peer.
     * @returns {Boolean} true if data channels work and are ready to be used
     *   between the two peers.
     */
    this.doesDataChannelWork = function(otherUser) {
        if (!peerConns[otherUser]) {
            return false;
        }
        return !!peerConns[otherUser].dataChannelReady;
    };
    /**
     * Return the media stream shared by a particular peer. This is needed when you
     * add a stream in the middle of a call.
     * @param {String} easyrtcid the peer.
     * @param {String} remotestreamName an optional argument supplying the streamName.
     * @returns {Object} A mediaStream.
     */
    this.getRemoteStream = function(easyrtcid, remotestreamName) {
        if (!peerConns[easyrtcid]) {
            self.showError(self.errCodes.DEVELOPER_ERR, "attempt to get stream of uncalled party");
            throw "Developer err: no such stream";
        }
        else {
            return peerConns[easyrtcid].getRemoteStreamByName(remotestreamName);
        }
    }
    /**
     * Assign a local streamName to a remote stream so that it can be forwarded to other callers.
     * @param {String} easyrtcid the peer supplying the remote stream
     * @param {String} remotestreamName the streamName supplied by the peer.
     * @param {String} localstreamName streamName used when passing the stream to other peers.
     * @example
     *    easyrtc.makeLocalStreamFromRemoteStream(sourcePeer, "default", "forwardedStream");
     *    easyrtc.call(nextPeer, callSuccessCB, callFailureCB, wasAcceptedCB, ["forwardedStream"]);
     */
    this.makeLocalStreamFromRemoteStream = function(easyrtcid, remotestreamName, localstreamName) {
        if (!streamName) {
            streamName = "default";
        }
        var remoteStream;
        if (peerConns[easyrtcid].pc) {
            remoteStream = peerConns[easyrtcid].getRemoteStreamByName(remotestreamName);
            if (remoteStream) {
                registerLocalMediaStreamByName(remoteStream, localstreamName);
            }
            else {
                throw "Developer err: no such stream";
            }
        }
        else {
            throw "Developer err: no such peer ";
        }
    }

    /**
     * Add a named local stream to a call.
     * @param {String} easyrtcId The id of client receiving the stream.
     * @param {String} streamName The name of the stream.
     * @param {Function} receiptHandler is a function that gets called when the other side sends a message
     *   that the stream has been received. The receiptHandler gets called with an easyrtcid and a stream name. This
     *   argument is optional.
     */
    this.addStreamToCall = function(easyrtcId, streamName, receiptHandler) {
        if( !streamName) {
            streamName = "default";
        }
        var stream = getLocalMediaStreamByName(streamName);
        if (!stream) {
            console.log("attempt to add nonexistent stream " + streamName);
        }
        else if (!peerConns[easyrtcId] || !peerConns[easyrtcId].pc) {
            console.log("Can't add stream before a call has started.");
        }
        else {
            var pc = peerConns[easyrtcId].pc;
            peerConns[easyrtcId].enableNegotiateListener = true;
            pc.addStream(stream);
            if( receiptHandler ) {
                peerConns[easyrtcId].streamsAddedAcks[streamName] = receiptHandler;
            }
        }
    }

    //
    // these three listeners support the ability to add/remove additional mediastreams on the fly.
    //
    this.setPeerListener(function(easyrtcid, msgType, msgData) {
        if (!peerConns[easyrtcid] || !peerConns[easyrtcid].pc) {
            easyrtc.showError(self.errCodes.DEVELOPER_ERR, 
                  "Attempt to add additional stream before establishing the base call.");
        }
        else {
            var sdp = msgData.sdp;
            var pc = peerConns[easyrtcid].pc;

            var setLocalAndSendMessage1 = function(sessionDescription) {
                var sendAnswer = function() {
                   if (self.debugPrinter) {
                       self.debugPrinter("sending answer");
                   }
                   function onSignalSuccess() {
                   }
   
                   function onSignalFailure(errorCode, errorText) {
                       delete peerConns[easyrtcid];
                       self.showError(errorCode, errorText);
                   }
   
                   sendSignalling(easyrtcid, "answer", sessionDescription,
                           onSignalSuccess, onSignalFailure);
                   peerConns[easyrtcid].connectionAccepted = true;
                   sendQueuedCandidates(easyrtcid, onSignalSuccess, onSignalFailure);
               };

               if (sdpLocalFilter) {
                   sessionDescription.sdp = sdpLocalFilter(sessionDescription.sdp);
               }
               pc.setLocalDescription(sessionDescription, sendAnswer, function(message) {
                   self.showError(self.errCodes.INTERNAL_ERR, "setLocalDescription: " + msgData);
               });
            };

            var invokeCreateAnswer = function() {
               pc.createAnswer(setLocalAndSendMessage1,
                    function(message) {
                        self.showError(self.errCodes.INTERNAL_ERR, "create-answer: " + message);
                    },
                    receivedMediaContraints);
               self.sendPeerMessage(easyrtcid, "__gotAddedMediaStream", {sdp: sdp});
            };

            if (self.debugPrinter) {
                self.debugPrinter("about to call setRemoteDescription in doAnswer");
            }
            try {

                if (sdpRemoteFilter) {
                    sdp.sdp = sdpRemoteFilter(sdp.sdp);
                }
                pc.setRemoteDescription(new RTCSessionDescription(sdp), 
                   invokeCreateAnswer, function(message) {
                    self.showError(self.errCodes.INTERNAL_ERR, "set-remote-description: " + message);
                });
            } catch (srdError) {
                console.log("set remote description failed");
                if (self.debugPrinter) {
                    self.debugPrinter("saw exception in setRemoteDescription");
                }
                self.showError(self.errCodes.INTERNAL_ERR, "setRemoteDescription failed: " + srdError.message);
            }
        }
    }, "__addedMediaStream");
    this.setPeerListener(function(easyrtcid, msgType, msgData) {
        if (!peerConns[easyrtcid] || !peerConns[easyrtcid].pc) {
        }
        else {
            var sdp = msgData.sdp;
            if (sdpRemoteFilter) {
                sdp.sdp = sdpRemoteFilter(sdp.sdp);
            }
            var pc = peerConns[easyrtcid].pc;
            pc.setRemoteDescription(new RTCSessionDescription(sdp), function(){}, 
                    function(message) {
                       self.showError(self.errCodes.INTERNAL_ERR, "set-remote-description: " + message);
                    });
        }

    }, "__gotAddedMediaStream");
    this.setPeerListener(function(easyrtcid, msgType, msgData) {
        if (!peerConns[easyrtcid] || !peerConns[easyrtcid].pc) {
        }
        else {
            var stream = peerConns[easyrtcid].getRemoteStreamByName(msgData.streamName);
            if (stream) {
                onRemoveStreamHelper(easyrtcid, stream, msgData.streamName);
                stream.ended = true;
            }
        }

    }, "__closingMediaStream");
    function onRemoveStreamHelper(easyrtcid, stream) {
        if (peerConns[easyrtcid]) {
            emitOnStreamClosed(easyrtcid, stream);
            updateConfigurationInfo();
            if( peerConns[easyrtcid].pc ) {
                 try {
                    peerConns[easyrtcid].pc.removeStream(stream);
                 } catch( err) {}
            }
           
        }
    }


    this.dumpPeerConnectionInfo = function() {
        for (var peer in peerConns) {
            console.log("For peer " + peer);
            var pc = peerConns[peer].pc;
            var remotes = pc.getRemoteStreams();
            var remoteIds = [];
            for (var i = 0; i < remotes.length; i++) {
                remoteIds.push(remotes[i].id);
            }
            var locals = pc.getLocalStreams();
            var localIds = [];
            for (var i = 0; i < locals.length; i++) {
                localIds.push(locals[i].id);
            }
            console.log("    " + JSON.stringify({local: localIds, remote: remoteIds}));
        }
    }


    var buildPeerConnection = function(otherUser, isInitiator, failureCB, streamNames) {
        var pc;
        var message;
        var newPeerConn;
        var iceConfig = pc_config_to_use ? pc_config_to_use : pc_config;
        if (self.debugPrinter) {
            self.debugPrinter("building peer connection to " + otherUser);
        }

        //
        // we don't support data channels on chrome versions < 31
        //
        try {
            pc = self.createRTCPeerConnection(iceConfig, buildPeerConstraints());
            if (!pc) {
                message = "Unable to create PeerConnection object, check your ice configuration(" +
                        JSON.stringify(ice_config) + ")";
                if (self.debugPrinter) {
                    self.debugPrinter(message);
                }
                throw(message);
            }

            //
            // turn off data channel support if the browser doesn't support it.
            //
            if (dataEnabled && typeof pc.createDataChannel === 'undefined') {
                dataEnabled = false;
            }
            pc.onnegotiationneeded = function(event) {
                if( peerConns[otherUser].enableNegotiateListener ) {
                    pc.createOffer(function(sdp) {
                        if (sdpLocalFilter) {
                            sdp.sdp = sdpLocalFilter(sdp.sdp);
                        }
                        pc.setLocalDescription(sdp, function() {
                            self.sendPeerMessage(otherUser, "__addedMediaStream", {sdp: sdp});
                        }, function() {
                        });
                    }, function(errorObj) {
                        console.log("unexpected error in creating offer");
                    });
                }
            }

            pc.onconnection = function() {
                if (self.debugPrinter) {
                    self.debugPrinter("onconnection called prematurely");
                }
            };
            newPeerConn = {
                pc: pc,
                candidatesToSend: [],
                startedAV: false,
                connectionAccepted: false,
                isInitiator: isInitiator,
                remoteStreamIdToName: {},
                streamsAddedAcks: {},
                liveRemoteStreams: {},
                getRemoteStreamByName: function(streamName) {
                    var remoteStreams = pc.getRemoteStreams();
                    var i = 0;
                    var keyToMatch = null;
                    var roomName;
                    if (!streamName) {
                        streamName = "default";
                    }

                    if (streamName === "default") {
                        if (remoteStreams.length > 0) {
                            return remoteStreams[0];
                        }
                        else {
                            return null;
                        }
                    }
                    for (roomName in self.roomData) {
                        var mediaIds = self.getRoomApiField(roomName, otherUser, "mediaIds");
                        keyToMatch = mediaIds ? mediaIds[streamName] : null;
                        if (keyToMatch) {
                            break;
                        }
                    }
                    if (!keyToMatch) {
                        self.showError(self.errCodes.DEVELOPER_ERR, "remote peer does not have media stream called " + streamName);
                    }

                    for (i = 0; i < remoteStreams.length; i++) {
                        var remoteId;
                        if (remoteStreams[i].hasOwnProperty("id")) {
                            remoteId = remoteStreams[i].id;
                        }
                        else {
                            remoteId = "default";
                        }

                        if (!keyToMatch || remoteId === keyToMatch) {
                            return remoteStreams[i];
                        }

                    }
                    return null;
                }
                //                var remoteStreams = peerConns[i].pc.getRemoteStreams();
            };
            pc.onicecandidate = function(event) {
                if (newPeerConn.cancelled) {
                    return;
                }
                var candidateData;
                if (event.candidate && peerConns[otherUser]) {
                    candidateData = {
                        type: 'candidate',
                        label: event.candidate.sdpMLineIndex,
                        id: event.candidate.sdpMid,
                        candidate: event.candidate.candidate
                    };

                    if( iceCandidateFilter ) {
                       candidateData = iceCandidateFilter(candidateData, false);
                       if( !candidateData ) {
                          return;
                       }
                    } 
                    //
                    // some candidates include ip addresses of turn servers. we'll want those 
                    // later so we can see if our actual connection uses a turn server.
                    // The keyword "relay" in the candidate identifies it as referencing a 
                    // turn server. The \d symbol in the regular expression matches a number.
                    // 
                    if (event.candidate.candidate.indexOf("typ relay") > 0) {
                        var ipAddress = event.candidate.candidate.match(/(udp|tcp) \d+ (\d+\.\d+\.\d+\.\d+)/i)[2];
                        self._turnServers[ipAddress] = true;
                    }

                    if (peerConns[otherUser].connectionAccepted) {
                        sendSignalling(otherUser, "candidate", candidateData, null, function() {
                            failureCB(self.errCodes.PEER_GONE, "Candidate disappeared");
                        });
                    }
                    else {
                        peerConns[otherUser].candidatesToSend.push(candidateData);
                    }
                }
            };
            pc.onaddstream = function(event) {
                if (self.debugPrinter) {
                    self.debugPrinter("saw incoming media stream");
                }
                if (newPeerConn.cancelled)
                    return;
                if (!peerConns[otherUser].startedAV) {
                    peerConns[otherUser].startedAV = true;
                    peerConns[otherUser].sharingAudio = haveAudioVideo.audio;
                    peerConns[otherUser].sharingVideo = haveAudioVideo.video;
                    peerConns[otherUser].connectTime = new Date().getTime();
                    if (peerConns[otherUser].callSuccessCB) {
                        if (peerConns[otherUser].sharingAudio || peerConns[otherUser].sharingVideo) {
                            peerConns[otherUser].callSuccessCB(otherUser, "audiovideo");
                        }
                    }
                    if (audioEnabled || videoEnabled) {
                        updateConfiguration();
                    }
                }
                var remoteName = getNameOfRemoteStream(otherUser, event.stream.id || "default");
                if (!remoteName) {
                    remoteName = "default";
                }
                peerConns[otherUser].remoteStreamIdToName[event.stream.id || "default"] = remoteName;
                peerConns[otherUser].liveRemoteStreams[remoteName] = true;
                event.stream.streamName = remoteName;
                if (self.streamAcceptor) {
                    self.streamAcceptor(otherUser, event.stream, remoteName);
                    //
                    // Inform the other user that the stream they provided has been received.
                    // This should be moved into signalling at some point
                    //
                    self.sendDataWS(otherUser, "easyrtc_streamReceived", {streamName:remoteName},function(){});
                }
            };
            pc.onremovestream = function(event) {
                if (self.debugPrinter) {
                    self.debugPrinter("saw remove on remote media stream");
                }
                onRemoveStreamHelper(otherUser, event.stream, event.stream.id || "default");
            };
            peerConns[otherUser] = newPeerConn;
        } catch (e) {
            if (self.debugPrinter) {
                self.debugPrinter(JSON.stringify(e));
            }
            failureCB(self.errCodes.SYSTEM_ERR, e.message);
            return null;
        }

        var i, stream;
        if (streamNames) {
            for (i = 0; i < streamNames.length; i++) {
                stream = getLocalMediaStreamByName(streamNames[i]);
                if (stream) {
                    pc.addStream(stream);
                }
                else {
                    console.log("Developer error, attempt to access unknown local media stream " + streamNames[i]);
                }
            }
        }
        else if (autoInitUserMedia && (videoEnabled || audioEnabled)) {
            stream = self.getLocalStream();
            pc.addStream(stream);
        }

        //
        // This function handles data channel message events.
        //
        function dataChannelMessageHandler(event) {
            if (self.debugPrinter) {
                self.debugPrinter("saw dataChannel.onmessage event: " + JSON.stringify(event.data));
            }

            if (event.data === "dataChannelPrimed") {
                self.sendDataWS(otherUser, "dataChannelPrimed", "");
            }
            else {
                //
                // Chrome and Firefox Interop is passing a event with a strange data="", perhaps
                // as it's own form of priming message. Comparing the data against "" doesn't
                // work, so I'm going with parsing and trapping the parse error.
                // 
                try {
                    var msg = JSON.parse(event.data);
                    if (msg) {
                        self.receivePeerDistribute(otherUser, msg, null);
                    }
                }
                catch (err) {
                }
            }
        }

        function initOutGoingChannel(otherUser) {
            if (self.debugPrinter) {
                self.debugPrinter("saw initOutgoingChannel call");
            }
            var dataChannel = pc.createDataChannel(dataChannelName, self.getDatachannelConstraints());
            peerConns[otherUser].dataChannelS = dataChannel;
            peerConns[otherUser].dataChannelR = dataChannel;
            dataChannel.onmessage = dataChannelMessageHandler;
            dataChannel.onopen = function(event) {
                if (self.debugPrinter) {
                    self.debugPrinter("saw dataChannel.onopen event");
                }
                if (peerConns[otherUser]) {
                    dataChannel.send("dataChannelPrimed");
                }
            };
            dataChannel.onclose = function(event) {
                if (self.debugPrinter) {
                    self.debugPrinter("saw dataChannelS.onclose event");
                }
                if (peerConns[otherUser]) {
                    peerConns[otherUser].dataChannelReady = false;
                    delete peerConns[otherUser].dataChannelS;
                }
                if (onDataChannelClose) {
                    onDataChannelClose(otherUser);
                }

                updateConfigurationInfo();
            };
        }

        function initIncomingChannel(otherUser) {
            if (self.debugPrinter) {
                self.debugPrinter("initializing incoming channel handler for " + otherUser);
            }

            peerConns[otherUser].pc.ondatachannel = function(event) {

                if (self.debugPrinter) {
                    self.debugPrinter("saw incoming data channel");
                }

                var dataChannel = event.channel;
                peerConns[otherUser].dataChannelR = dataChannel;
                peerConns[otherUser].dataChannelS = dataChannel;
                peerConns[otherUser].dataChannelReady = true;
                dataChannel.onmessage = dataChannelMessageHandler;
                dataChannel.onclose = function(event) {
                    if (self.debugPrinter) {
                        self.debugPrinter("saw dataChannelR.onclose event");
                    }
                    if (peerConns[otherUser]) {
                        peerConns[otherUser].dataChannelReady = false;
                        delete peerConns[otherUser].dataChannelR;
                    }
                    if (onDataChannelClose) {
                        onDataChannelClose(otherUser);
                    }

                    updateConfigurationInfo();
                };
                dataChannel.onopen = function(event) {
                    if (self.debugPrinter) {
                        self.debugPrinter("saw dataChannel.onopen event");
                    }
                    if (peerConns[otherUser]) {
                        dataChannel.send("dataChannelPrimed");
                    }
                };
            };
        }

        //
        //  added for interoperability
        //
        var doDataChannels = dataEnabled;
        if (doDataChannels) {

            // check if both sides have the same browser and versions 
        }

        if (doDataChannels) {
            self.setPeerListener(function() {
                peerConns[otherUser].dataChannelReady = true;
                if (peerConns[otherUser].callSuccessCB) {
                    peerConns[otherUser].callSuccessCB(otherUser, "datachannel");
                }
                if (onDataChannelOpen) {
                    onDataChannelOpen(otherUser, true);
                }
                updateConfigurationInfo();
            }, "dataChannelPrimed", otherUser);
            if (isInitiator) {
                try {

                    initOutGoingChannel(otherUser);
                } catch (channelErrorEvent) {
                    console.log("failed to init outgoing channel");
                    failureCB(self.errCodes.SYSTEM_ERR,
                            self.formatError(channelErrorEvent));
                }
            }
            if (!isInitiator) {
                initIncomingChannel(otherUser);
            }
        }

        pc.onconnection = function() {
            if (self.debugPrinter) {
                self.debugPrinter("setup pc.onconnection ");
            }
        };

        //
        // Temporary support for responding to acknowledgements of about streams being added.
        //
        self.setPeerListener(function(easyrtcid, msgType, msgData, targeting){
             if( newPeerConn.streamsAddedAcks[msgData.streamName]) {
                 (newPeerConn.streamsAddedAcks[msgData.streamName])(easyrtcid, msgData.streamName);
                 delete newPeerConn.streamsAddedAcks[msgData.streamName];
             }
        }, "easyrtc_streamReceived", otherUser);
        return pc;
    };
    var doAnswer = function(caller, msgData, streamNames) {
        if (!streamNames && autoInitUserMedia) {
            var localStream = self.getLocalStream();
            if (!localStream && (videoEnabled || audioEnabled)) {
                self.initMediaSource(
                        function() {
                            doAnswer(caller, msgData);
                        },
                        function(errorCode, errorObj) {
                            self.showError(self.errCodes.MEDIA_ERR, self.format(self.getConstantString("localMediaError")));
                        });
                return;
            }
        }
        if (use_fresh_ice_each_peer) {
            self.getFreshIceConfig(function(succeeded) {
                if (succeeded) {
                    doAnswerBody(caller, msgData, streamNames);
                }
                else {
                    self.showError(self.errCodes.CALL_ERR, "Failed to get fresh ice config");
                }
            });
        }
        else {
            doAnswerBody(caller, msgData, streamNames);
        }
    }


    var doAnswerBody = function(caller, msgData, streamNames) {
        var pc = buildPeerConnection(caller, false, function(message) {
            self.showError(self.errCodes.SYSTEM_ERR, message);
        }, streamNames);
        var newPeerConn = peerConns[caller];
        if (!pc) {
            if (self.debugPrinter) {
                self.debugPrinter("buildPeerConnection failed. Call not answered");
            }
            return;
        }
        var setLocalAndSendMessage1 = function(sessionDescription) {
            if (newPeerConn.cancelled)
                return;
            var sendAnswer = function() {
                if (self.debugPrinter) {
                    self.debugPrinter("sending answer");
                }
                function onSignalSuccess() {
                }

                function onSignalFailure(errorCode, errorText) {
                    delete peerConns[caller];
                    self.showError(errorCode, errorText);
                }

                sendSignalling(caller, "answer", sessionDescription,
                        onSignalSuccess, onSignalFailure);
                peerConns[caller].connectionAccepted = true;
                sendQueuedCandidates(caller, onSignalSuccess, onSignalFailure);
                if (pc.connectDataConnection) {
                    if (self.debugPrinter) {
                        self.debugPrinter("calling connectDataConnection(5002,5001)");
                    }
                    pc.connectDataConnection(5002, 5001);
                }
            };
            if (sdpLocalFilter) {
                sessionDescription.sdp = sdpLocalFilter(sessionDescription.sdp);
            }
            pc.setLocalDescription(sessionDescription, sendAnswer, function(message) {
                self.showError(self.errCodes.INTERNAL_ERR, "setLocalDescription: " + message);
            });
        };
        var sd = null;
        if (window.mozRTCSessionDescription) {
            sd = new mozRTCSessionDescription(msgData);
        }
        else {
            sd = new RTCSessionDescription(msgData);
        }
        if (self.debugPrinter) {
            self.debugPrinter("sdp ||  " + JSON.stringify(sd));
        }
        var invokeCreateAnswer = function() {
            if (newPeerConn.cancelled)
                return;
            pc.createAnswer(setLocalAndSendMessage1,
                    function(message) {
                        self.showError(self.errCodes.INTERNAL_ERR, "create-answer: " + message);
                    },
                    receivedMediaContraints);
        };
        if (self.debugPrinter) {
            self.debugPrinter("about to call setRemoteDescription in doAnswer");
        }
        try {

            if (sdpRemoteFilter) {
                sd.sdp = sdpRemoteFilter(sd.sdp);
            }
            pc.setRemoteDescription(sd, invokeCreateAnswer, function(message) {
                self.showError(self.errCodes.INTERNAL_ERR, "set-remote-description: " + message);
            });
        } catch (srdError) {
            console.log("set remote description failed");
            if (self.debugPrinter) {
                self.debugPrinter("saw exception in setRemoteDescription");
            }
            self.showError(self.errCodes.INTERNAL_ERR, "setRemoteDescription failed: " + srdError.message);
        }
    };
    //
    // This function calls the users onStreamClosed handler, passing it the easyrtcid of the peer, the stream itself,
    // and the name of the stream.
    //
    function emitOnStreamClosed(easyrtcid, stream) {
        if (!peerConns[easyrtcid]) {
            return;
        }
        var streamName;
        var id;
        if (stream.hasOwnProperty("id")) {
            id = stream.id;
        }
        else {
            id = "default";
        }
        streamName = peerConns[easyrtcid].remoteStreamIdToName[id] || "default";
        if (peerConns[easyrtcid].liveRemoteStreams[streamName] &&
            self.onStreamClosed) {
            delete peerConns[easyrtcid].liveRemoteStreams[streamName];
            self.onStreamClosed(easyrtcid, stream, streamName);
        }
        delete peerConns[easyrtcid].remoteStreamIdToName[id];
    }

    var onRemoteHangup = function(caller) {
        delete offersPending[caller];
        if (self.debugPrinter) {
            self.debugPrinter("Saw onRemote hangup event");
        }
        if (peerConns[caller]) {
            peerConns[caller].cancelled = true;
            if (peerConns[caller].pc) {
                //
                // close any remote streams.
                //
                var remoteStreams = peerConns[caller].pc.getRemoteStreams();
                if (remoteStreams) {
                    var i;
                    for (i = 0; i < remoteStreams.length; i++) {
                        emitOnStreamClosed(caller, remoteStreams[i]);
                        try {
                            remoteStreams[i].stop();
                        } catch (err) {
                        }
                        ;
                    }
                }

                try {
                    peerConns[caller].pc.close();
                } catch (anyErrors) {
                }
            }
            else {
                if (self.callCancelled) {
                    self.callCancelled(caller, true);
                }
            }
            delete peerConns[caller];
            updateConfigurationInfo();
        }
        else {
            if (self.callCancelled) {
                self.callCancelled(caller, true);
            }
        }
    };
    var queuedMessages = {};
    var clearQueuedMessages = function(caller) {
        queuedMessages[caller] = {
            candidates: []
        };
    };
    //
    // checks to see if a particular peer is in any room at all.
    //
    function isPeerInAnyRoom(id) {
        var roomName;
        for (roomName in lastLoggedInList) {
            if (!lastLoggedInList.hasOwnProperty(roomName)) {
                continue;
            }
            if (lastLoggedInList[roomName][id]) {
                return true;
            }
        }
        return false;
    }

    /**
      * Checks to see if a particular peer is present in any room.
      * If it isn't, we assume it's logged out. 
      * @param easyrtcid the easyrtcId of the peer.
      */
    this.isPeerInAnyRoom = function(easyrtcId) {
         return isPeerInAnyRoom(easyrtcId);
    }

    //
    //
    //
    function processLostPeers(peersInRoom) {
        var id;
        //
        // check to see the person is still in at least one room. If not, we'll hangup
        // on them. This isn't the correct behavior, but it's the best we can do without
        // changes to the server.
        //
        for (id in peerConns) {
            if (peerConns.hasOwnProperty(id) &&
                    typeof peersInRoom[id] === 'undefined') {
                if (!isPeerInAnyRoom(id)) {
                    if (peerConns[id].pc || peerConns[id].isInitiator) {
                        onRemoteHangup(id);
                    }
                    delete offersPending[id];
                    delete acceptancePending[id];
                    clearQueuedMessages(id);
                }
            }
        }

        for (id in offersPending) {
            if (offersPending.hasOwnProperty(id) && !isPeerInAnyRoom(id)) {
                onRemoteHangup(id);
                clearQueuedMessages(id);
                delete offersPending[id];
                delete acceptancePending[id];
            }
        }

        for (id in acceptancePending) {
            if (acceptancePending.hasOwnProperty(id) && !isPeerInAnyRoom(id)) {
                onRemoteHangup(id);
                clearQueuedMessages(id);
                delete acceptancePending[id];
            }
        }

    }

    /**
     * The idea of aggregating timers is that there are events that convey state and these can fire more frequently
    * than desired. Aggregating timers allow a bunch of events to be collapsed into one by only firing the last
    * event.
     * @private
    */
    var aggregatingTimers = {};

    /**
     * This function sets a timeout for a function to be called with the feature that if another
     * invocation comes along within a particular interval (with the same key), the second invocation
     * replaces the first. To prevent a continuous stream of events from preventing a callback from ever
     * firing, we'll collapse no more than 20 events.
     * @param {String} key A key used to identify callbacks that should be aggregated.
     * @param {Function} callback The callback to invoke.
     * @param {Number} period The aggregating period in milliseconds.
     * @private
     */
    function addAggregatingTimer(key, callback, period) {
        if( !period) {
            period = 100; // 0.1 second
        }
        var counter = 0;
        if( aggregatingTimers[key]) {
            clearTimeout(aggregatingTimers[key].timer);
            counter = aggregatingTimers[key].counter;
        }
        if( counter > 20) {
            delete aggregatingTimers[key];
            callback();
        }
        else {
            aggregatingTimers[key] = {counter: counter +1};
            aggregatingTimers[key].timer = setTimeout(function () {
                delete aggregatingTimers[key];
                callback();
            }, period);
        }
    }

    //
    // this function gets called for each room when there is a room update.
    //
    function processOccupantList(roomName, occupantList) {
        var myInfo = null;
        self.reducedList = {};
        var id;
        for (id in occupantList) {
            if (occupantList.hasOwnProperty(id)) {
                if (id === self.myEasyrtcid) {
                    myInfo = occupantList[id];
                }
                else {
                    self.reducedList[id] = occupantList[id];
                }
            }
        }
        //
        // processLostPeers detects peers that have gone away and performs
        // house keeping accordingly.
        //
        processLostPeers(self.reducedList);
        //
        //
        //
        addAggregatingTimer("roomOccupants&" + roomName, function(){
            if (roomOccupantListener) {
                roomOccupantListener(roomName, self.reducedList, myInfo);
            }
            self.emitEvent("roomOccupants", {roomName:roomName, occupants:lastLoggedInList});
        }, 100);

    }

    function sendQueuedCandidates(peer, onSignalSuccess, onSignalFailure) {
        var i;
        for (i = 0; i < peerConns[peer].candidatesToSend.length; i++) {
            sendSignalling(
                    peer,
                    "candidate",
                    peerConns[peer].candidatesToSend[i],
                    onSignalSuccess,
                    onSignalFailure
                    );
        }
    }

    var onChannelMsg = function(msg, ackAcceptorFunc) {

        var targeting = {};
        if (ackAcceptorFunc) {
            ackAcceptorFunc(self.ackMessage);
        }
        if (msg.targetEasyrtcid) {
            targeting.targetEasyrtcid = msg.targetEasyrtcid;
        }
        if (msg.targetRoom) {
            targeting.targetRoom = msg.targetRoom;
        }
        if (msg.targetGroup) {
            targeting.targetGroup = msg.targetGroup;
        }
        if (msg.senderEasyrtcid) {
            self.receivePeerDistribute(msg.senderEasyrtcid, msg, targeting);
        }
        else {
            if (receiveServerCB) {
                receiveServerCB(msg.msgType, msg.msgData, targeting);
            }
            else {
                console.log("Unhandled server message " + JSON.stringify(msg));
            }
        }
    };
    var onChannelCmd = function(msg, ackAcceptorFn) {

        var caller = msg.senderEasyrtcid;
        var msgType = msg.msgType;
        var msgData = msg.msgData;
        var pc;
        if (self.debugPrinter) {
            self.debugPrinter('received message of type ' + msgType);
        }

        if (typeof queuedMessages[caller] === "undefined") {
            clearQueuedMessages(caller);
        }

        var processCandidateBody = function(caller, msgData) {
            var candidate = null;

            if( iceCandidateFilter ) {
               msgData = iceCandidateFilter(msgData, true);
               if( !msgData ) {
                  return;
               }
            } 

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
            pc = peerConns[caller].pc;

            function iceAddSuccess() {}
            function iceAddFailure(domError) {
                easyrtc.showError(self.errCodes.ICECANDIDATE_ERR, "bad ice candidate (" + domError.name + "): " + 
                    JSON.stringify(candidate));
            }
            pc.addIceCandidate(candidate, iceAddSuccess, iceAddFailure);

            if (msgData.candidate.indexOf("typ relay") > 0) {
                var ipAddress = msgData.candidate.match(/(udp|tcp) \d+ (\d+\.\d+\.\d+\.\d+)/i)[1];
                self._turnServers[ipAddress] = true;
            }
        };
        var flushCachedCandidates = function(caller) {
            var i;
            if (queuedMessages[caller]) {
                for (i = 0; i < queuedMessages[caller].candidates.length; i++) {
                    processCandidateBody(caller, queuedMessages[caller].candidates[i]);
                }
                delete queuedMessages[caller];
            }
        };
        var processOffer = function(caller, msgData) {

            var helper = function(wasAccepted, streamNames) {

                if (streamNames) {
                    if (typeof streamNames === "string") {
                        streamNames = [streamNames];
                    }
                    else if (streamNames.length === undefined) {
                        easyrtc.showError(self.errCodes.DEVELOPER_ERR, "accept callback passed invalid streamNames");
                        return;
                    }
                }
                if (self.debugPrinter) {
                    self.debugPrinter("offer accept=" + wasAccepted);
                }
                delete offersPending[caller];
                if (!self.supportsPeerConnections()) {
                    callFailureCB(self.errCodes.CALL_ERR, self.getConstantString("noWebrtcSupport"));
                    return;
                }

                if (wasAccepted) {
                    doAnswer(caller, msgData, streamNames);
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
            if (acceptancePending[caller] && caller < self.myEasyrtcid) {
                delete acceptancePending[caller];
                if (queuedMessages[caller]) {
                    delete queuedMessages[caller];
                }
                if (peerConns[caller].wasAcceptedCB) {
                    peerConns[caller].wasAcceptedCB(true, caller);
                }
                delete peerConns[caller];
                helper(true);
                return;
            }

            offersPending[caller] = msgData;
            if (!self.acceptCheck) {
                helper(true);
            }
            else {
                self.acceptCheck(caller, helper);
            }
        };
        function processReject(caller) {
            delete acceptancePending[caller];
            if (queuedMessages[caller]) {
                delete queuedMessages[caller];
            }
            if (peerConns[caller]) {
                if (peerConns[caller].wasAcceptedCB) {
                    peerConns[caller].wasAcceptedCB(false, caller);
                }
                delete peerConns[caller];
            }
        }

        function processAnswer(caller, msgData) {



            delete acceptancePending[caller];

            //
            // if we've discarded the peer connection, ignore the answer.
            //
            if (!peerConns[caller]) {
                return;
            }
            peerConns[caller].connectionAccepted = true;



            if (peerConns[caller].wasAcceptedCB) {
                peerConns[caller].wasAcceptedCB(true, caller);
            }

            var onSignalSuccess = function() {

            };
            var onSignalFailure = function(errorCode, errorText) {
                if (peerConns[caller]) {
                    delete peerConns[caller];
                }
                self.showError(errorCode, errorText);
            };
            var i;
            // peerConns[caller].startedAV = true;
            sendQueuedCandidates(caller, onSignalSuccess, onSignalFailure);
            pc = peerConns[caller].pc;
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

            if (self.debugPrinter) {
                self.debugPrinter("about to call initiating setRemoteDescription");
            }
            try {
                if (sdpRemoteFilter) {
                    sd.sdp = sdpRemoteFilter(sd.sdp);
                }
                pc.setRemoteDescription(sd, function() {
                    if (pc.connectDataConnection) {
                        if (self.debugPrinter) {
                            self.debugPrinter("calling connectDataConnection(5001,5002)");
                        }
                        pc.connectDataConnection(5001, 5002); // these are like ids for data channels
                    }
                }, function(message){
                     console.log("setRemoteDescription failed ", message);
                 });
            } catch (smdException) {
                console.log("setRemoteDescription failed ", smdException);
            }
            flushCachedCandidates(caller);
        }

        function processCandidateQueue(caller, msgData) {

            if (peerConns[caller] && peerConns[caller].pc) {
                processCandidateBody(caller, msgData);
            }
            else {
                if (!peerConns[caller]) {
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
                processCandidateQueue(caller, msgData);
                break;
            case "hangup":
                onRemoteHangup(caller);
                clearQueuedMessages(caller);
                break;
            case "error":
                self.showError(msg.errorCode, msg.errorText);
                break;
            default:
                console.error("received unknown message type from server, msgType is " + msgType);
                return;
        }

        if (ackAcceptorFn) {
            ackAcceptorFn(self.ackMessage);
        }
    };
    function connectToWSServer(successCallback, errorCallback) {
        var i;
        if (preallocatedSocketIo) {
            self.webSocket = preallocatedSocketIo;
        }
        else if (!self.webSocket) {
            try {
               self.webSocket = io.connect(serverPath, connectionOptions);
            } catch(socketErr) {
               errorCallback( self.errCodes.SYSTEM_ERROR, 
                     socketError.toString());
               return;
            }
            if (!self.webSocket) {
                throw "io.connect failed";
            }
        }
        else {
            for (i in self.websocketListeners) {
                if (!self.websocketListeners.hasOwnProperty(i)) {
                    continue;
                }
                self.webSocket.removeEventListener(self.websocketListeners[i].event,
                        self.websocketListeners[i].handler);
            }
        }
        self.websocketListeners = [];
        function addSocketListener(event, handler) {
            self.webSocket.on(event, handler);
            self.websocketListeners.push({event: event, handler: handler});
        }

        addSocketListener("close", function(event) {
            console.log("the web socket closed");
        });
        addSocketListener('error', function(event) {
            function handleErrorEvent() {
                if (self.myEasyrtcid) {
                    //
                    // socket.io version 1 got rid of the socket member, moving everything up one level.
                    //
                    if (self.webSocket.connected || (self.webSocket.socket && self.webSocket.socket.connected)) {
                        self.showError(self.errCodes.SIGNAL_ERROR, self.getConstantString("miscSignalError"));
                    }
                    else {
                        /* socket server went down. this will generate a 'disconnect' event as well, so skip this event */
                        errorCallback(self.errCodes.CONNECT_ERR, self.getConstantString("noServer"));
                    }
                }
                else {
                    errorCallback(self.errCodes.CONNECT_ERR, self.getConstantString("noServer"));
                }
            }
            handleErrorEvent();
        });
        function connectHandler(event) {
            self.webSocketConnected = true;
            if (!self.webSocket) {
                self.showError(self.errCodes.CONNECT_ERR, self.getConstantString("badsocket"));
            }

            if (self.debugPrinter) {
                self.debugPrinter("saw socketserver onconnect event");
            }
            if (self.webSocketConnected) {
                sendAuthenticate(successCallback, errorCallback);
            }
            else {
                errorCallback(self.errCodes.SIGNAL_ERROR, self.getConstantString("icf"));
            }
        }
        if (preallocatedSocketIo && preallocatedSocketIo.socket.connected) {
            connectHandler(null);
        }
        else {
            addSocketListener("connect", connectHandler);
        }
        addSocketListener("easyrtcMsg", onChannelMsg);
        addSocketListener("easyrtcCmd", onChannelCmd);
        addSocketListener("disconnect", function(/* code, reason, wasClean */) {
            self.webSocketConnected = false;
            updateConfigurationInfo = function() {
            }; // dummy update function
            oldConfig = {};
            disconnectBody();
            if (self.disconnectListener) {
                self.disconnectListener();
            }
        });
    }


    function buildDeltaRecord(added, deleted, modified) {
        function objectNotEmpty(obj) {
            var i;
            for (i in obj) {
                if (obj.hasOwnProperty(i)) {
                    return true;
                }
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
        var subPart;
        for (i in newVersion) {
            if (!newVersion.hasOwnProperty(i)) {
                // do nothing
            }
            else if (oldVersion === null || typeof oldVersion[i] === 'undefined') {
                added[i] = newVersion[i];
            }
            else if (typeof newVersion[i] === 'object') {
                subPart = findDeltas(oldVersion[i], newVersion[i]);
                if (subPart !== null) {
                    added[i] = newVersion[i];
                }
            }
            else if (newVersion[i] !== oldVersion[i]) {
                added[i] = newVersion[i];
            }
        }
        for (i in oldVersion) {
            if (!newVersion.hasOwnProperty(i)) {
                // do nothing
            }
            else if (typeof newVersion[i] === 'undefined') {
                deleted = oldVersion[i];
            }
        }

        return buildDeltaRecord(added, deleted);
    }

//
// this function collects configuration info that will be sent to the server.
// It returns that information, leaving it the responsibility of the caller to
// do the actual sending.
//
    function collectConfigurationInfo(/* forAuthentication */) {
        var p2pList = {};
        var i;
        for (i in peerConns) {
            if (!peerConns.hasOwnProperty(i)) {
                continue;
            }
            p2pList[i] = {
                connectTime: peerConns[i].connectTime,
                isInitiator: !!peerConns[i].isInitiator
            };
        }

        var newConfig = {
            userSettings: {
                sharingAudio: !!haveAudioVideo.audio,
                sharingVideo: !!haveAudioVideo.video,
                sharingData: !!dataEnabled,
                nativeVideoWidth: self.nativeVideoWidth,
                nativeVideoHeight: self.nativeVideoHeight,
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
    }
    ;
    function updateConfiguration() {

        var newConfig = collectConfigurationInfo(false);
        //
        // we need to give the getStats calls a chance to fish out the data.
        // The longest I've seen it take is 5 milliseconds so 100 should be overkill.
        //
        var sendDeltas = function() {
            var alteredData = findDeltas(oldConfig, newConfig);
            //
            // send all the configuration information that changes during the session
            //
            if (alteredData) {
                if (self.debugPrinter) {
                    self.debugPrinter("cfg=" + JSON.stringify(alteredData.added));
                }
                if (self.webSocket) {
                    sendSignalling(null, "setUserCfg", {setUserCfg: alteredData.added}, null, null);
                }
            }
            oldConfig = newConfig;
        };
        if (oldConfig === {}) {
            sendDeltas();
        }
        else {
            setTimeout(sendDeltas, 100);
        }
    }

    updateConfigurationInfo = function() {
        updateConfiguration();
    };
    /**
     * Sets the presence state on the server.
     * @param {String} state - one of 'away','chat','dnd','xa'
     * @param {String} statusText - User configurable status string. May be length limited.
     * @example   easyrtc.updatePresence('dnd', 'sleeping');
     */
    this.updatePresence = function(state, statusText) {
        self.presenceShow = state;
        self.presenceStatus = statusText;
        if (self.webSocketConnected) {
            sendSignalling(null, 'setPresence', {setPresence: {'show': state, 'status': statusText}}, null);
        }
    };
    /**
     * Fetch the collection of session fields as a map. The map has the structure:
     *  {key1: {"fieldName": key1, "fieldValue": value1}, ...,
     *   key2: {"fieldName": key2, "fieldValue": value2}
     *  }
     * @returns {Object}
     */
    this.getSessionFields = function() {
        return sessionFields;
    };
    /**
     * Fetch the value of a session field by name.
     * @param {String} name - name of the session field to be fetched.
     * @returns the field value (which can be anything). Returns undefined if the field does not exist.
     */
    this.getSessionField = function(name) {
        if (sessionFields[name]) {
            return sessionFields[name].fieldValue;
        }
        else {
            return undefined;
        }
    };
    function processSessionData(sessionData) {
        if (sessionData) {
            if (sessionData.easyrtcsid) {
                self.easyrtcsid = sessionData.easyrtcsid;
            }
            if (sessionData.field) {
                sessionFields = sessionData.field;
            }
        }
    }


    function processRoomData(roomData) {
        self.roomData = roomData;
        var roomName;
        var stuffToRemove;
        var stuffToAdd;
        var id, removeId;
        for (roomName in self.roomData) {
            if (!self.roomData.hasOwnProperty(roomName)) {
                continue;
            }
            if (roomData[roomName].roomStatus === "join") {
                if (!(self.roomJoin[roomName])) {
                    self.roomJoin[roomName] = roomData[roomName];
                }
                var mediaIds = buildMediaIds();
                if (mediaIds !== {}) {
                    self.setRoomApiField(roomName, "mediaIds", mediaIds);
                }
            }
            else if (roomData[roomName].roomStatus === "leave") {
                if (self.roomEntryListener) {
                    self.roomEntryListener(false, roomName);
                }
                delete self.roomJoin[roomName];
                delete lastLoggedInList[roomName];
                continue;
            }

            if (roomData[roomName].clientList) {
                lastLoggedInList[roomName] = roomData[roomName].clientList;
            }
            else if (roomData[roomName].clientListDelta) {
                stuffToAdd = roomData[roomName].clientListDelta.updateClient;
                if (stuffToAdd) {
                    for (id in stuffToAdd) {
                        if (!stuffToAdd.hasOwnProperty(id)) {
                            continue;
                        }
                        if (!lastLoggedInList[roomName]) {
                            lastLoggedInList[roomName] = [];
                        }
                        lastLoggedInList[roomName][id] = stuffToAdd[id];
                    }
                }
                stuffToRemove = roomData[roomName].clientListDelta.removeClient;
                if (stuffToRemove && lastLoggedInList[roomName]) {
                    for (removeId in stuffToRemove) {
                        if (stuffToRemove.hasOwnProperty(removeId)) {
                            delete lastLoggedInList[roomName][removeId];
                        }
                    }
                }
            }
            if (self.roomJoin[roomName] && roomData[roomName].field) {
                fields.rooms[roomName] = roomData[roomName].field;
            }
            if (roomData[roomName].roomStatus === "join") {
                if (self.roomEntryListener) {
                    self.roomEntryListener(true, roomName);
                }
            }
            processOccupantList(roomName, lastLoggedInList[roomName]);
        }
        self.emitEvent("roomOccupant", lastLoggedInList);
    }

    /**
     * Returns an array of easyrtcid's of peers in a particular room.
     * @param roomName
     * @returns {Array} of easyrtcids or null if the client is not in the room.
     * @example
     *     var occupants = easyrtc.getRoomOccupants("default");
     *     var i;
     *     for( i = 0; i < occupants.length; i++ ) {
     *         console.log( occupants[i] + " is in the room");
     *     }
     */
    this.getRoomOccupantsAsArray = function(roomName) {
        if (!lastLoggedInList[roomName]) {
            return null;
        }
        else {
            return Object.keys(lastLoggedInList[roomName]);
        }
    }

    /**
     * Returns a map of easyrtcid's of peers in a particular room. You should only test elements in the map to see if they are
     * null; their actual values are not guaranteed to be the same in different releases.
     * @param roomName
     * @returns {Object} of easyrtcids or null if the client is not in the room.
     * @example
     *      if( easyrtc.getRoomOccupantsAsMap("default")[some_easyrtcid]) {
     *          console.log("yep, " + some_easyrtcid + " is in the room");
     *      }
     */
    this.getRoomOccupantsAsMap = function(roomName) {
        return lastLoggedInList[roomName];
    }

    /**
     * Returns true if the ipAddress parameter was the address of a turn server. This is done by checking against information
     * collected during peer to peer calls. Don't expect it to work before the first call, or to identify turn servers that aren't
     * in the ice config.
     * @param ipAddress
     * @returns {boolean} true if ip address is known to be that of a turn server, false otherwise.
     */
    this.isTurnServer = function(ipAddress) {
        return !!self._turnServers[ipAddress];
    };
    function processIceConfig(iceConfig) {
        pc_config = {iceServers: []};
        self._turnServers = {};
        var i;
        var item, fixedItem, username, ipAddress;
        if (!window.createIceServer) {
            return;
        }
        for (i = 0; i < iceConfig.iceServers.length; i++) {
            item = iceConfig.iceServers[i];
            if (item.url.indexOf('turn:') === 0) {
                if (item.username) {
                    fixedItem = createIceServer(item.url, item.username, item.credential);
                }
                else {
                    self.showError("Developer error", "Iceserver entry doesn't have a username: " + JSON.stringify(item));
                }
                ipAddress = item.url.split(/[@:&]/g)[1];
                self._turnServers[ipAddress] = true;
            }
            else { // is stun server entry
                fixedItem = item;
            }
            if (fixedItem) {
                pc_config.iceServers.push(fixedItem);
            }
        }
    }

    /**
     * Request fresh ice config information from the server.
     * This should be done periodically by long running applications.
     * @param {Function} callback is called with a value of true on success, false on failure.
     */
    this.getFreshIceConfig = function(callback) {
        var dataToShip = {
            msgType: "getIceConfig",
            msgData: {}
        };
        if (!callback) {
            callback = function() {
            };
        }
        self.webSocket.json.emit("easyrtcCmd", dataToShip,
                function(ackMsg) {
                    if (ackMsg.msgType === "iceConfig") {
                        processIceConfig(ackMsg.msgData.iceConfig);
                        callback(true);
                    }
                    else {
                        self.showError(ackMsg.msgData.errorCode, ackMsg.msgData.errorText);
                        callback(false);
                    }
                }
        );
    };
    function processToken(msg) {
        if (self.debugPrinter) {
            self.debugPrinter("entered process token");
        }
        var msgData = msg.msgData;
        if (msgData.easyrtcid) {
            self.myEasyrtcid = msgData.easyrtcid;
        }
        if (msgData.field) {
            fields.connection = msgData.field;
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
            fields.application = msgData.application.field;
        }

    }

    function sendAuthenticate(successCallback, errorCallback) {
        //
        // find our easyrtcsid
        //  
        var cookies, target, i;
        var easyrtcsid = null;
        if (self.cookieId && document.cookie) {
            cookies = document.cookie.split(/[; ]/g);
            target = self.cookieId + "=";
            for (i = 0; i < cookies.length; i++) {
                if (cookies[i].indexOf(target) === 0) {
                    easyrtcsid = cookies[i].substring(target.length);
                }
            }
        }

        if (!self.roomJoin) {
            self.roomJoin = {};
        }

        var msgData = {
            apiVersion: self.apiVersion,
            applicationName: self.applicationName,
            setUserCfg: collectConfigurationInfo(true)
        };
        if (self.presenceShow) {
            msgData.setPresence = {show: self.presenceShow, status: self.presenceStatus};
        }
        if (self.username) {
            msgData.username = self.username;
        }
        if (self.roomJoin && !isEmptyObj(self.roomJoin)) {
            msgData.roomJoin = self.roomJoin;
        }
        if (easyrtcsid) {
            msgData.easyrtcsid = easyrtcsid;
        }
        if (credential) {
            msgData.credential = credential;
        }

        self.webSocket.json.emit("easyrtcAuth",
                {msgType: "authenticate",
                    msgData: msgData
                },
        function(msg) {
            var room;
            if (msg.msgType === "error") {
                errorCallback(msg.msgData.errorCode, msg.msgData.errorText);
                self.roomJoin = {};
            }
            else {
                processToken(msg);
                if (self._roomApiFields) {
                    for (room in self._roomApiFields) {
                        if (self._roomApiFields.hasOwnProperty(room)) {
                            _enqueueSendRoomApi(room, self._roomApiFields[room]);
                        }
                    }
                }

                if (successCallback) {
                    successCallback(self.myEasyrtcid);
                }
            }
        }
        );
    }

    /** Get a list of the rooms you are in. You must be connected to call this function.
     * @returns {Object} A map whose keys are the room names
     */
    this.getRoomsJoined = function() {
        var roomsIn = {};
        var key;
        for (key in self.roomJoin) {
            if (self.roomJoin.hasOwnProperty(key)) {
                roomsIn[key] = true;
            }
        }
        return roomsIn;
    };
    /** Get server defined fields associated with a particular room. Only valid
     * after a connection has been made.
     * @param {String} roomName - the name of the room you want the fields for.
     * @returns {Object} A dictionary containing entries of the form {key:{'fieldName':key, 'fieldValue':value1}} or undefined
     * if you are not connected to the room.
     */
    this.getRoomFields = function(roomName) {
        if (!fields || !fields.rooms || !fields.rooms[roomName])
            return undefined;
        return fields.rooms[roomName];
    };
    /** Get server defined fields associated with the current application. Only valid
     * after a connection has been made.
     * @returns {Object} A dictionary containing entries of the form {key:{'fieldName':key, 'fieldValue':value1}}
     */
    this.getApplicationFields = function() {
        return fields.application;
    };
    /** Get server defined fields associated with the connection. Only valid
     * after a connection has been made.
     * @returns {Object} A dictionary containing entries of the form {key:{'fieldName':key, 'fieldValue':value1}}
     */
    this.getConnectionFields = function() {
        return fields.connection;
    };
// this flag controls whether the easyApp routine adds close buttons to the caller
// video objects

    /** @private */
    var autoAddCloseButtons = true;
    /** By default, the easyApp routine sticks a "close" button on top of each caller
     * video object that it manages. Call this function(before calling easyApp) to disable that particular feature.
     * @example
     *    easyrtc.dontAddCloseButtons();
     */
    this.dontAddCloseButtons = function() {
        autoAddCloseButtons = false;
    };
    /**
     * Validates that the video ids correspond to dom objects.
     * @param {String} monitorVideoId
     * @param {Array} videoIds
     * @returns {Boolean}
     * @private
     */
    function _validateVideoIds(monitorVideoId, videoIds) {
        var i;
        // verify that video ids were not typos.
        if (monitorVideoId && !document.getElementById(monitorVideoId)) {
            self.showError(self.errCodes.DEVELOPER_ERR, "The monitor video id passed to easyApp was bad, saw " + monitorVideoId);
            return false;
        }

        for (i in videoIds) {
            if (!videoIds.hasOwnProperty(i)) {
                continue;
            }
            var name = videoIds[i];
            if (!document.getElementById(name)) {
                self.showError(self.errCodes.DEVELOPER_ERR, "The caller video id '" + name + "' passed to easyApp was bad.");
                return false;
            }
        }
        return true;
    }
    ;
    /**
     * This is a helper function for the easyApp method. It manages the assignment of video streams
     * to video objects. It assumes
     * @param {String} monitorVideoId is the id of the mirror video tag.
     * @param {Array} videoIds is an array of ids of the caller video tags.
     * @private
     */
    function easyAppBody(monitorVideoId, videoIds) {
        var numPEOPLE = videoIds.length;
        var videoIdsP = videoIds;
        var refreshPane = 0;
        var onCall = null, onHangup = null;

        if (!videoIdsP) {
            videoIdsP = [];
        }

        easyrtc.addEventListener("roomOccupants", 
            function(eventName, eventData) {
                for (i = 0; i < numPEOPLE; i++) {
                    var video = getIthVideo(i);
                    if (!videoIsFree(video)) {
		        if( !easyrtc.isPeerInAnyRoom(video.dataset.caller)){
                           if( onHangup ) {
                               onHangup(i, easyrtc.dataset.caller);
                           }
                           easyrtc.dataset.caller = null;
                        }
                    }
                }
            }
        );

        function videoIsFree(obj) {
            return (obj.dataset.caller === "" || obj.dataset.caller === null || obj.dataset.caller === undefined);
        }

        if (!_validateVideoIds(monitorVideoId, videoIdsP)) {
            throw "bad video element id";
        }

        if (monitorVideoId) {
            document.getElementById(monitorVideoId).muted = "muted";
        }

        /** Sets an event handler that gets called when an incoming MediaStream is assigned 
         * to a video object. The name is poorly chosen and reflects a simpler era when you could
         * only have one media stream per peer connection.
         * @param {Function} cb has the signature function(easyrtcid, slot){}
         * @example
         *   easyrtc.setOnCall( function(easyrtcid, slot){
         *      console.log("call with " + easyrtcid + "established");
         *   });
         */
        self.setOnCall = function(cb) {
            onCall = cb;
        };
        /** Sets an event handler that gets called when a call is ended.
         * it's only purpose (so far) is to support transitions on video elements.
         x     * this function is only defined after easyrtc.easyApp is called.
         * The slot is parameter is the index into the array of video ids.
         * Note: if you call easyrtc.getConnectionCount() from inside your callback
         * it's count will reflect the number of connections before the hangup started.
         * @param {Function} cb has the signature function(easyrtcid, slot){}
         * @example
         *   easyrtc.setOnHangup( function(easyrtcid, slot){
         *      console.log("call with " + easyrtcid + "ended");
         *   });
         */
        self.setOnHangup = function(cb) {
            onHangup = cb;
        };

        function getIthVideo(i) {
            if (videoIdsP[i]) {
                return document.getElementById(videoIdsP[i]);
            }
            else {
                return null;
            }
        }


        self.getIthCaller = function(i) {
            if (i < 0 || i > videoIdsP.length) {
                return null;
            }
            var vid = getIthVideo(i);
            return vid.dataset.caller;
        };

        self.getSlotOfCaller = function(easyrtcid) {
            var i;
            for (i = 0; i < numPEOPLE; i++) {
                if (self.getIthCaller(i) === easyrtcid) {
                    return i;
                }
            }
            return -1; // caller not connected
        };
        function hideVideo(video) {
            self.setVideoObjectSrc(video, "");
            video.style.visibility = "hidden";
        }

        self.setOnStreamClosed(function(caller) {
            var i;
            for (i = 0; i < numPEOPLE; i++) {
                var video = getIthVideo(i);
                if (video.dataset.caller === caller) {
                    hideVideo(video);
                    video.dataset.caller = "";
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
        self.setAcceptChecker(function(caller, helper) {
            var i;
            for (i = 0; i < numPEOPLE; i++) {
                var video = getIthVideo(i);
                if (videoIsFree(video)) {
                    helper(true);
                    return;
                }
            }
            helper(false);
        });
        self.setStreamAcceptor(function(caller, stream) {
            var i;
            if (self.debugPrinter) {
                self.debugPrinter("stream acceptor called");
            }
            function showVideo(video, stream) {
                self.setVideoObjectSrc(video, stream);
                if (video.style.visibility) {
                    video.style.visibility = 'visible';
                }
            }

            var video;
            if (refreshPane && videoIsFree(refreshPane)) {
                showVideo(refreshPane, stream);
                if (onCall) {
                    onCall(caller, refreshPane);
                }
                refreshPane = null;
                return;
            }
            for (i = 0; i < numPEOPLE; i++) {
                video = getIthVideo(i);
                if (video.dataset.caller === caller) {
                    showVideo(video, stream);
                    if (onCall) {
                        onCall(caller, i);
                    }
                    return;
                }
            }

            for (i = 0; i < numPEOPLE; i++) {
                video = getIthVideo(i);
                if (!video.dataset.caller || videoIsFree(video)) {
                    video.dataset.caller = caller;
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
                self.hangup(video.dataset.caller);
                showVideo(video, stream);
                if (onCall) {
                    onCall(caller, 0);
                }
            }
            video.dataset.caller = caller;
        });
        (function() {
            var addControls, parentDiv, closeButton, i;
            if (autoAddCloseButtons) {

                addControls = function(video) {
                    parentDiv = video.parentNode;
                    video.dataset.caller = "";
                    closeButton = document.createElement("div");
                    closeButton.className = "easyrtc_closeButton";
                    closeButton.onclick = function() {
                        if (video.dataset.caller) {
                            self.hangup(video.dataset.caller);
                            hideVideo(video);
                            video.dataset.caller = "";
                        }
                    };
                    parentDiv.appendChild(closeButton);
                };
                for (i = 0; i < numPEOPLE; i++) {
                    addControls(getIthVideo(i));
                }
            }
        })();
        var monitorVideo = null;
        if (videoEnabled && monitorVideoId !== null) {
            monitorVideo = document.getElementById(monitorVideoId);
            if (!monitorVideo) {
                console.error("Programmer error: no object called " + monitorVideoId);
                return;
            }
            monitorVideo.muted = "muted";
            monitorVideo.defaultMuted = true;
        }


    }
    ;
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
     *  @param {Function} onReady - a callback function used on success. It is called with the easyrtcId this peer is known to the server as.
     *  @param {Function} onFailure - a callback function used on failure (failed to get local media or a connection of the signaling server).
     *  @example
     *     easyrtc.easyApp('multiChat', 'selfVideo', ['remote1', 'remote2', 'remote3'],
     *              function(easyrtcId){
     *                  console.log("successfully connected, I am " + easyrtcId);
     *              },
     *              function(errorCode, errorText){
     *                  console.log(errorText);
     *              );
     */
    this.easyApp = function(applicationName, monitorVideoId, videoIds, onReady, onFailure) {
        var gotMediaCallback = null,
                gotConnectionCallback = null;
        easyAppBody(monitorVideoId, videoIds);
        self.setGotMedia = function(gotMediaCB) {
            gotMediaCallback = gotMediaCB;
        };
        /** Sets an event handler that gets called when a connection to the signaling
         * server has or has not been made. Can only be called after calling easyrtc.easyApp.
         * @param {Function} gotConnectionCB has the signature (gotConnection, errorText)
         * @example
         *    easyrtc.setGotConnection( function(gotConnection, errorText){
         *        if( gotConnection ){
         *            console.log("Successfully connected to signaling server");
         *        }
         *        else{
         *            console.log("Failed to connect to signaling server because: " + errorText);
         *        }
         *    });
         */
        self.setGotConnection = function(gotConnectionCB) {
            gotConnectionCallback = gotConnectionCB;
        };
        var nextInitializationStep;
        nextInitializationStep = function(/* token */) {
            if (gotConnectionCallback) {
                gotConnectionCallback(true, "");
            }
            onReady(self.myEasyrtcid);
        };
        function postGetUserMedia() {
            if (gotMediaCallback) {
                gotMediaCallback(true, null);
            }
            if (monitorVideoId !== null) {
                self.setVideoObjectSrc(document.getElementById(monitorVideoId), self.getLocalStream());
            }
            function connectError(errorCode, errorText) {
                if (gotConnectionCallback) {
                    gotConnectionCallback(false, errorText);
                }
                else if (onFailure) {
                    onFailure(self.errCodes.CONNECT_ERR, errorText);
                }
                else {
                    self.showError(self.errCodes.CONNECT_ERR, errorText);
                }
            }

            self.connect(applicationName, nextInitializationStep, connectError);
        }

        var stream = getLocalMediaStreamByName(null);
        if (stream) {
            postGetUserMedia();
        }
        else {
            self.initMediaSource(
                    postGetUserMedia,
                    function(errorCode, errorText) {
                        if (gotMediaCallback) {
                            gotMediaCallback(false, errorText);
                        }
                        else if (onFailure) {
                            onFailure(self.errCodes.MEDIA_ERR, errorText);
                        }
                        else {
                            self.showError(self.errCodes.MEDIA_ERR, errorText);
                        }
                    },
                    null // default stream
                    );
        }
    };
    /**
     *
     * @deprecated now called easyrtc.easyApp.
     */
    this.initManaged = this.easyApp;
    var preallocatedSocketIo = null;
    /**
     * Supply a socket.io connection that will be used instead of allocating a new socket.
     * The expected usage is that you allocate a websocket, assign options to it, call
     * easyrtc.useThisSocketConnection, followed by easyrtc.connect or easyrtc.easyApp. Easyrtc will not attempt to
     * close sockets that were supplied with easyrtc.useThisSocketConnection.
     * @param {Object} alreadyAllocatedSocketIo A value allocated with the connect method of socket.io.
     */
    this.useThisSocketConnection = function(alreadyAllocatedSocketIo) {
        preallocatedSocketIo = alreadyAllocatedSocketIo;
    }
    /**
     * Connect to the easyrtc signaling server.
     * @param applicationName
     * @param successCallback
     * @param errorCallback
     */
    this.connect = function(applicationName, successCallback, errorCallback) {

        if (!window.io) {
            self.showError("Developer error", "Your HTML has not included the socket.io.js library");
        }

        if (!preallocatedSocketIo && self.webSocket) {
            console.error("Developer error: attempt to connect when already connected to socket server");
            return;
        }
        pc_config = {};
        closedChannel = null;
        oldConfig = {}; // used internally by updateConfiguration
        queuedMessages = {};
        self.applicationName = applicationName;
        fields = {
            rooms: {},
            application: {},
            connection: {}
        };
        if (self.debugPrinter) {
            self.debugPrinter("attempt to connect to WebRTC signalling server with application name=" + applicationName);
        }

        if (errorCallback === null) {
            errorCallback = function(errorCode, errorText) {
                console.error("easyrtc.connect: " + errorText);
            };
        }

        connectToWSServer(successCallback, errorCallback);
    };
};
window.easyrtc = new Easyrtc();

var easyrtc_constantStrings = {
  "unableToEnterRoom":"Unable to enter room {0} because {1}" ,
  "resolutionWarning": "Requested video size of {0}x{1} but got size of {2}x{3}",
  "badUserName": "Illegal username {0}",
  "localMediaError": "Error getting local media stream: {0}",
  "miscSignalError": "Miscellaneous error from signalling server. It may be ignorable.",
  "noServer": "Unable to reach the EasyRTC signalling server.",
  "badsocket": "Socket.io connect event fired with bad websocket.",
  "icf": "Internal communications failure",
  "statsNotSupported":"call statistics not supported by this browser, try Chrome.",
   "noWebrtcSupport":"Your browser doesn't appear to support WebRTC.",
   "gumFailed":"Failed to get access to local media. Error code was {0}.",
   "requireAudioOrVideo":"At least one of audio and video must be provided"   
};