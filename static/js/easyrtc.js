//
//Copyright (c) 2013, Priologic Software Inc.
//All rights reserved.
//
//Redistribution and use in source and binary forms, with or without
//modification, are permitted provided that the following conditions are met:
//
//    * Redistributions of source code must retain the above copyright notice,
//      this list of conditions and the following disclaimer.
//    * Redistributions in binary form must reproduce the above copyright
//      notice, this list of conditions and the following disclaimer in the
//      documentation and/or other materials provided with the distribution.
//
//THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
//AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
//IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
//ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
//LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
//CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
//SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
//INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
//CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
//ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
//POSSIBILITY OF SUCH DAMAGE.
//

//
// This file provides client side support for the easyRTC framework.
// Please see the easyrtc_client_api.md and easyrtc_client_tutorial.md
// for more details.
//


var easyRTC = {};
easyRTC.loggingOut = false;
easyRTC.disconnecting = false;
easyRTC.localStream = null;
easyRTC.mozFakeStream = null; // used for setting up datachannels with firefox
easyRTC.audioEnabled = true;
easyRTC.videoEnabled = true;
easyRTC.localVideoWidth = 0;
easyRTC.localVideoHeight = 0;
easyRTC.datachannelName = "dc";
easyRTC.debugPrinter = null;

//
// easyRTC.enableDebug
// Arguments:
//     enable - true to turn on debugging, false to turn off debugging. Default is false.
// Note: if you want to control the printing debug messages, override the
//    easyRTC.debugPrinter variable with a function that takes a message string as it's argument.
//    This is exactly what easyRTC.enableDebug does when it's enable argument is true.
//  
easyRTC.enableDebug = function(enable) {
    if( enable) {
        easyRTC.debugPrinter = function(message) {
            var stackFrameStrings = new Error().stack.split('\n');
            var srcLine = "";
            if( stackFrameStrings.length >= 3) {
                srcLine = stackFrameStrings[2];
            }
            console.log("debug: " + message + " [" + srcLine + "]");
        }        
    }
    else {
        easyRTC.debugPrinter = null;
    }
}



//
// 
//
if( navigator.mozGetUserMedia) {
    easyRTC.datachannelConstraints = {};
}
else {
    easyRTC.datachannelConstraints = {
        reliable:false
    };    
}
easyRTC.haveAudioVideo = {
    audio:false, 
    video:false
};

easyRTC.dataEnabled = false;
easyRTC.serverPath = null;
easyRTC.loggedInListener = null;
easyRTC.onDataChannelOpen = null;
easyRTC.onDataChannelClose = null;
easyRTC.lastLoggedInList = {};
easyRTC.receiveDataCB = null;
easyRTC.updateConfigurationInfo = function() {};  // dummy placeholder for when we aren't connected
//
//
//  easyRTC.peerConns is a map from caller names to the below object structure
//     {  startedAV: boolean,  -- true if we have traded audio/video streams
//        dataChannel: RTPDataChannel if present
//        pc: RTCPeerConnection,
//		  function callSuccessCB(string) - see the easyRTC.call documentation.
//        function callFailureCB(string) - see the easyRTC.call documentation.
//        function wasAcceptedCB(boolean,string) - see the easyRTC.call documentation.
//     }
//
easyRTC.peerConns = {};
//
// a map keeping track of whom we've requested a call with so we don't try to 
// call them a second time before they've responded.
//
easyRTC.acceptancePending = {};
//
// easyRTC.disconnect is the compliment to easyRTC.connect.
// The remaining fields below get set by corresponding setter functions.
//
easyRTC.disconnect = function() {};
easyRTC.acceptCheck = function(caller, helper) {
    helper(true);
};
easyRTC.streamAcceptor = null;
easyRTC.onStreamClosed = null;
easyRTC.callCancelled = null;

easyRTC.onError = function(message) {
    if(easyRTC.debugPrinter) {
        easyRTC.debugPrinter("saw error " + message);
    }
    alert("Error:" + message);
};

easyRTC.videoBandwidthString = "b=AS:50"; // default video band width is 50kbps

//
// easyRTC.createObjectURL builds a URL from a media stream.
// Arguments:
//     mediaStream - a media stream object.
// The video object in Chrome expects a URL.
//
easyRTC.createObjectURL = function(mediaStream) {
    if( window.URL && window.URL.createObjectURL ) {
        return window.URL.createObjectURL(mediaStream);
    }
    else if( window.webkitURL && window.webkitURL.createObjectURL ) {
        return window.webkit.createObjectURL(mediaStream);
    }
    else {
        var errMessage = "Your browsers does not support URL.createObjectURL.";    
        if(easyRTC.debugPrinter) {
            easyRTC.debugPrinter("saw exception " + errMessage);
        }
        throw errMessage;
    }
};


//
// easyRTC.cleanId is a convenience function to ensure that ids are
//
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


//
// easyRTC.setLoggedInListener supplies a callback that will be invoked when the
// list of people logged in changes.
// Arguments:
//    function listener( {id1:{easyrtcid:id1, clientConnectTime:timeString},
//                        id2:{easyrtcid:id2, clientConnectTime:timeString}}) {}
// The default is null, in which case no listener is alerted.
//
easyRTC.setLoggedInListener = function(listener) {
    easyRTC.loggedInListener = listener;
};

//
// easyRTC.setDataChannelOpenListener supplies a callback that is called when a 
// data channel is open and ready to send data.
// Arguments:
//     function listener( easyrtcid)
//
easyRTC.setDataChannelOpenListener = function(listener) {
    easyRTC.onDataChannelOpen = listener;
};


//
// easyRTC.setDataChannelCloseListener supplies a callback that is called when a 
// previously open data channel closes.
// Arguments:
//     function listener( easyrtcid)
//
easyRTC.setDataChannelCloseListener = function(listener) {
    easyRTC.onDataChannelClose = listener;
};

//
// easyRTC.getConnectionCount returns the number of live connections.
// Arguments: none
//
easyRTC.getConnectionCount = function() {
    var count = 0;
    for(var i in easyRTC.peerConns ) {
        if( easyRTC.peerConns[i].startedAV ) {
            count++;
        }
    }
    return count;
};


//
// easyRTC.enableAudio sets whether audio is transmitted by the local user in any subsequent
// calls.
// Arguments:
//    enabled - true to include audio, false to exclude audio. The default is true.
//
easyRTC.enableAudio = function(enabled) {
    easyRTC.audioEnabled = enabled;
};


//
// easyRTC.enableVideo sets whether video is transmitted by the local user in any subsequent
// calls.
// Arguments:
//    enabled - true to include video, false to exclude video. The default is true.
//
easyRTC.enableVideo = function(enabled) {
    easyRTC.videoEnabled = enabled;
};


//
// easyRTC.enableDataChannels sets whether webrtc data channels are used to send inter-client messages.
// This is only the messages that applications explicitly send to other applications, not the webrtc signalling messages.
// Arguments:
//    enabled - true to use data channels, false otherwise. The default is false.
//
easyRTC.enableDataChannels = function(enabled) {
    easyRTC.dataEnabled = enabled;
}

//
//  easyRTC.getLocalStreamAsUrl() returns a URL for your local camera and microphone.
//  It can be called only after easyRTC.initMediaSource has succeeded.
//  It returns a url that can be used as a source by the chrome <video> element or the <canvas> element.
//
easyRTC.getLocalStreamAsUrl = function() {
    if( easyRTC.localStream == null) {
        alert("Attempt to get a mediastream without invoking easyRTC.initMediaSource successfully");
    }
    return easyRTC.createObjectURL(easyRTC.localStream);
};


//
//  easyRTC.getLocalStream() returns a media stream for your local camera and microphone.
//  It can be called only after easyRTC.initMediaSource has succeeded.
//  It returns a stream that can be used as an argument to easyRTC.setVideoObjectSrc.
//
easyRTC.getLocalStream = function() {
    return easyRTC.localStream;
};


//
//  easyRTC.setVideoObjectSrc sets a video object from a media stream.
//  Arguments:
//     videoObject - a document object of type <video>.
//     stream - a media stream as returned by easyRTC.getLocalStream or your stream acceptor.
//  Chrome uses the src attribute and expects a URL, while firefox
//  uses the mozSrcObject and expects a stream. This procedure hides
//  that from you.
//
easyRTC.setVideoObjectSrc = function(videoObject, stream) {
    if( typeof videoObject.mozSrcObject != "undefined" ) {
        videoObject.mozSrcObject = (stream=="")?null:stream;
    }
    else {
        videoObject.src = (stream=="")?"":easyRTC.createObjectURL(stream);
    }
    if( stream ) {
        videoObject.play();
    }
};

//
// This is an internally used function.
//
easyRTC.formatError = function( errorEvent) {
    if( x === null || typeof x === 'undefined') {
        message = "null";
    }
    if( typeof x === 'string') {
        return x;
    }
    else {
        return JSON.stringify(x)
    }    
}




//
// easyRTC.initMediaSource initializes your access to a local camera and microphone.
// Arguments:
//    function successCallback() - will be called when the media source is ready.
//    function errorCallback(msgStr) - is called if the attempt to get media failed.
// Failure could be caused a browser that didn't support webrtc, or by the user
// not granting permission.
// If you are going to call easyRTC.enableAudio or easyRTC.enableVideo, you need to do it before
// calling easyRTC.initMediaSource .
//
easyRTC.initMediaSource = function(successCallback, errorCallback) {
       
    if(easyRTC.debugPrinter) {
        easyRTC.debugPrinter("about to request local media");
    }
        
    if( errorCallback == null) {
        errorCallback = function(x) {
            var message = "easyRTC.initMediaSource: " + easyRTC.formatError(x);
	    if(easyRTC.debugPrinter) {
        	easyRTC.debugPrinter(message);
	    }
            alert(message);
        };
    }

    if( !successCallback) {
        alert("easyRTC.initMediaSource not supplied a successCallback");
        return;
    }

    function callGetUserMedia(mode, successfunc, errorFunc) {
        if(easyRTC.debugPrinter) {
            easyRTC.debugPrinter("about to request local media = " + JSON.stringify(mode));
        }
        if( navigator.getUserMedia ) {
            navigator.getUserMedia(mode, successfunc, errorFunc);
        }
        else if( navigator.webkitGetUserMedia ) {
            navigator.webkitGetUserMedia(mode, successfunc, errorFunc);
        }
        else if( navigator.mozGetUserMedia ) {
            navigator.mozGetUserMedia(mode, successfunc, errorFunc);
        }
        else {
            errorCallback("Your browser doesn't appear to support WebRTC.");
        }
    }


    var onUserMediaSuccess = function(stream) {
           
        if(easyRTC.debugPrinter) {
            easyRTC.debugPrinter("successfully got local media");
        }
        easyRTC.localStream = stream;
        if( successCallback) {
            successCallback();
        }
        if( easyRTC.haveAudioVideo.video) {
            var videoObj = document.createElement('video');
            var triesLeft = 30;
            var tryToGetSize = function() {
                if( videoObj.videoWidth > 0|| triesLeft < 0) {
                    easyRTC.nativeVideoWidth = videoObj.videoWidth;
                    easyRTC.nativeVideoHeight = videoObj.videoHeight;
                    easyRTC.updateConfigurationInfo();
                }
                else {
                    triesLeft -= 1;
                    setTimeout(tryToGetSize, 1000);
                }
            }
            tryToGetSize();
            easyRTC.setVideoObjectSrc(videoObj, stream);
        }
        else {
            easyRTC.updateConfigurationInfo();
        }
    };


    var onUserMediaError = function(error) {
        if(easyRTC.debugPrinter) {
            easyRTC.debugPrinter("failed to get local media");
        }
        if( errorCallback ) {
            errorCallback("Failed to get access to local media. Error code was " + error.code + ".");
        }
        easyRTC.localStream = null;
        easyRTC.haveAudioVideo = {
            audio:false, 
            video: false
        };        
        easyRTC.updateConfigurationInfo();
    };


    if( !easyRTC.audioEnabled && !easyRTC.videoEnabled ) {
        onUserMediaError("At least one of audio and video must be provided");
        return;
    }

    easyRTC.haveAudioVideo = {
        audio:easyRTC.audioEnabled,
        video: easyRTC.videoEnabled
    };
    
    
                          
    if( easyRTC.videoEnabled || easyRTC.audioEnabled) {
        try {
            callGetUserMedia({
                'audio': easyRTC.audioEnabled?true:false,
                'video': easyRTC.videoEnabled?true:false
            }, onUserMediaSuccess,
            onUserMediaError);
        } catch (e) {
            try {

                callGetUserMedia("video,audio", onUserMediaSuccess,
                    onUserMediaError);
            } catch (e) {
                document.body.removeChild(getUserMediaDiv);
                errorCallback("getUserMedia failed with exception: " + e.message);
            }
        }
    }
    else {
        onUserMediaSuccess(null);
    }
};


//
// easyRTC.setAcceptChecker sets the callback used to decide whether to accept or reject an incoming call.
// Arguments:
//     function acceptCheck(callerEasyrtcid, function():boolean ) {}
// The acceptCheck function is passed (as it's second argument) a function that should be called with either
// a true value (accept the call) or false value( reject the call).
//
easyRTC.setAcceptChecker = function(acceptCheck) {
    easyRTC.acceptCheck = acceptCheck;
};


//
//  easyRTC.setStreamAcceptor sets a callback to receive media streams from other peers, independent
//  of where the call was initiated (caller or callee).
//  Arguments:
//      function acceptor(caller, mediaStream) {}
//
easyRTC.setStreamAcceptor = function(acceptor) {
    easyRTC.streamAcceptor = acceptor;
};


//
// easyRTC.setOnError sets the error listener. This will be called when errors conditions occur.
// The default is to present an alert.
// Arguments:
//     function errListener(errMessage) {}
//
easyRTC.setOnError = function(errListener) {
    easyRTC.onError = errListener;
};


//
// easyRTC.setCallCalled sets the callCancelled event handler. This will be called when a remote user 
// initiates a call to you, but does a "hangup" before you have a chance to get his video stream.
//
easyRTC.setCallCancelled = function( callCancelled) {
    easyRTC.callCancelled = callCancelled;
}

//
//  easyRTC.setOnStreamClosed sets a callback to receive notification of a media stream closing
//  Arguments:
//     function onStreamClose(callerName) {}
//
easyRTC.setOnStreamClosed = function(onStreamClosed) {
    easyRTC.onStreamClosed = onStreamClosed;
};


//
// easyRTC.setVideoBandwidth sets the bandwidth for sending video data.
// Arguments:
//    rate: in kps per second.
// Setting the rate too low will cause connection attempts to fail. 40 is probably good lower limit.
// The default is 50. A value of zero will remove bandwidth limits.
//
easyRTC.setVideoBandwidth = function(kbitsPerSecond) {
    if(easyRTC.debugPrinter) {
        easyRTC.debugPrinter("video bandwidth set to " + kbitsPerSecond + " kbps");
    }
    if( kbitsPerSecond > 0 ) {
        easyRTC.videoBandwidthString = "b=AS:" + kbitsPerSecond;
    }
    else {
        easyRTC.videoBandwidthString = "";
    }
};


//
// easyRTC.setDataListener sets a listener for data sent from another
// client.
// Arguments:
//     function listener(senderId, data)
//
easyRTC.setDataListener = function(listener) {
    easyRTC.receiveDataCB = listener;
};



//
// easyRTC.setSocketUrl sets the url of the Socket server.
// Arguments:
//     socketURL: DOMString
// The node.js server is great as a socket server, but it doesn't have
// all the hooks you'd like in a general web server, like PHP or Python
// plug-ins. By setting the serverPath your application can get it's regular
// pages from a regular webserver, but the easyRTC library can still reach the
// socket server.
//
easyRTC.setSocketUrl = function(socketUrl) {
    if(easyRTC.debugPrinter) {
        easyRTC.debugPrinter("webrtc signaling server URL set to " + socketUrl);
    }
    easyRTC.serverPath  = socketUrl;
}

//
// easyRTC.connect(args) performs the connection to the server. You must connect before trying to
// call other users. You must successfully call easyRTC.initMediaSource before easyRTC.connect.
// Arguments:
//     applicationName is a string that identifies the application so that different applications can have different
//        lists of users.
//     function successCallback(actualName) - is called on successful connect. actualName is guaranteed to be unique.
//     function errorCallback(msgString) - is called on unsuccessful connect. if null, an alert is called instead.
//
easyRTC.connect = function(applicationName, successCallback, errorCallback) {
    var channel = null;
    var servers = null;
    var pc_config = {};
    var me = "";

    if(easyRTC.debugPrinter) {
        easyRTC.debugPrinter("attempt to connect to webrtc signalling server with application name=" + applicationName);
    }
    var mediaConstraints = {
        'mandatory': {
            'OfferToReceiveAudio':true,
            'OfferToReceiveVideo':true
        },
        'optional': [{
            RtpDataChannels: easyRTC.dataEnabled
        }]
    };

    //
    // easyRTC.disconnect performs a clean disconnection of the client from the server.
    //
    easyRTC.disconnect = function() {
        if(easyRTC.debugPrinter) {
            easyRTC.debugPrinter("attempt to disconnect from webrtc signalling server");
        }
        easyRTC.disconnecting = true;
        easyRTC.hangupAll();
        easyRTC.loggingOut = true;
        if(channel) {
            channel.disconnect();
            channel = 0;
        }
        easyRTC.loggingOut = false;
        easyRTC.disconnecting = false;
    };


    if( errorCallback == null) {
        errorCallback = function(x) {
            alert("easyRTC.connect: " + x);
        };
    }

    var sendMessage = function(destUser, instruction, data, successCallback, errorCallback){

        if( !channel ) {
            throw "Attempt to send message without a valid connection to the server."
        }
        else {
            var dataToShip = {
                msgType:instruction,
                senderId: me,
                targetId: destUser,
                msgData:{
                    from:me,
                    type:instruction,
                    actualData:data
                }
            }
            
            if(easyRTC.debugPrinter) {
                easyRTC.debugPrinter("sending socket message " + JSON.stringify(dataToShip));
            }
            channel.json.emit("easyRTCcmd", dataToShip);
        }
    };



//easyRTC.sendDataP2P
//-------------------
//Sends data to another user using previously established data channel. This method will
//fail if no data channel has been established yet. Unlike the easyRTC.sendWS method, 
//you can't send a dictionary, convert dictionaries to strings using JSON.stringify first. 
//What datatypes you can send, and how large a datatype depends on your browser.
//
//Arguments:
//
//+ destEasyrtcid
//+ data - an object which can be JSON'ed.
//
//This is a specialized version of easyRTC.sendData.
//
    easyRTC.sendDataP2P = function(destUser, data) {
        if(easyRTC.debugPrinter) {
            easyRTC.debugPrinter("sending p2p message to " + destUser + " with data=" + JSON.stringify(data));
        }
        //        if( easyRTC.peerConns[destUser] && easyRTC.peerConns[destUser].dataChannelReady) {
        if(  easyRTC.peerConns[destUser] && easyRTC.peerConns[destUser].dataChannel ) {
            easyRTC.peerConns[destUser].dataChannel.send(data);
        }
        else {
            easyRTC.onError("Attempt to send data peer to peer without establishing a connection to " + destUser + ' first.');
        }
    }



//    easyRTC.sendDataWS
//------------------
//Sends data to another user using websockets.
//
//Arguments:
//
//+ destEasyrtcid
//+ data - an object which can be JSON'ed.
//
//This is a specialized version of easyRTC.sendData.

    easyRTC.sendDataWS = function(destUser, data) {
        if(easyRTC.debugPrinter) {
            easyRTC.debugPrinter("sending client message via websockets to " + destUser + " with data=" + JSON.stringify(data));
        }
        if( channel ) {
            channel.json.emit("message", {
                senderId:me,
                targetId: destUser,
                msgData:data
            });
        }
        else {
            if(easyRTC.debugPrinter) {
                easyRTC.debugPrinter("websocket failed because no connection to server");
            }
            throw "Attempt to send message without a valid connection to the server.";
        }
    }
    
    
    //
    // easyrTC.sendData sends data to another user.
    // Arguments:
    //     senderId
    //     data - an object which can be JSON'ed.
    //
    //  Note: at some point we may want to change the below code so that it first tries
    //  the peer to peer method (if a connection exists) and if it doesn't get an ack back
    //  from the other side, it does the web socket approach.
    //
    easyRTC.sendData = function(destUser, data ) {
        if( easyRTC.peerConns[destUser] && easyRTC.peerConns[destUser].dataChannelReady) {
            easyRTC.sendDataP2P( destUser, data);
        }
        else {
            easyRTC.sendDataWS( destUser, data);
        }
    };



    //
    // easyRTC.getConnectStatus return true if the client has a connection to another user.
    // Arguments: 
    //    otherUser - the name of the other user.
    // Returns one of the following values:
    //    easyRTC.NOT_CONNECTED;
    //    easyRTC.BECOMING_CONNECTED;
    //    easyRTC.IS_CONNECTED;
    // The return values are text strings so you can use them in debugging output.
    //
    easyRTC.NOT_CONNECTED = "not connected";
    easyRTC.BECOMING_CONNECTED = "connection in progress";
    easyRTC.IS_CONNECTED = "is connected";
    
    easyRTC.getConnectStatus = function(otherUser){
        if( typeof easyRTC.peerConns[otherUser] == 'undefined' ) {
            return easyRTC.NOT_CONNECTED;
        }
        var peer = easyRTC.peerConns[otherUser];
        if( (peer.sharingAudio || peer.sharingVideo) && !peer.startedAV) {
            return easyRTC.BECOMING_CONNECTED;            
        }
        else if( peer.sharingData && !peer.dataChannelReady) {
            return easyRTC.BECOMING_CONNECTED;            
        }    
        else {
            return easyRTC.IS_CONNECTED;
        }
    }

    //
    // easyRTC.call initiates a call to another user.
    // Arguments:
    //    otherUser - the name of the other user.
    //    function callSuccessCB(otherCaller, mediaType) - is called when the datachannel is established or the mediastream is established
    //             mediaType will have a value of "audiovideo" or "datachannel"
    //    function callFailureCB(errMessage) - is called if there was a system error
    //         interfering with the call.
    //    function wasAcceptedCB(wasAccepted:boolean,otherUser:string) - is called when a call
    //         is accepted or rejected by another party. It can be left null.
    // If it succeeds, the streamAcceptor callback (provided by easyRTC.connect) will be called.
    //
    easyRTC.call = function(otherUser, callSuccessCB, callFailureCB, wasAcceptedCB) {
        if(easyRTC.debugPrinter) {
            easyRTC.debugPrinter("initiating peer to peer call to " + otherUser + 
                " audio=" + easyRTC.audioEnabled + 
                " video=" + easyRTC.videoEnabled + 
                " data=" + easyRTC.dataEnabled );
        }

        if( !channel) {
            var message = "Attempt to make a call prior to connecting to service";
            if(easyRTC.debugPrinter) {
                easyRTC.debugPrinter(message);
            }
            throw message;
        }
        
        //
        // Mozilla currently requires a media stream to set up data channels.
        // The below code attempts to create a fake data stream if a real data stream isn't being shared.
        // After the fake stream is created, the callback relaunches the easyRTC.call with the original
        // arguments.
        //
        if( navigator.mozGetUserMedia && easyRTC.dataEnabled && easyRTC.videoEnabled == false 
            && easyRTC.audioEnabled == false && easyRTC.mozFakeStream == null ) {
            navigator.mozGetUserMedia({
                audio:true, 
                fake:true
            }, function(s) {
                if( !s) {
                    var message = "Error getting fake media stream for Firefox datachannels: null stream";
                    if(easyRTC.debugPrinter) {
                        easyRTC.debugPrinter(message);
                    }
                    callFailureCB(message);
                }
                easyRTC.mozFakeStream = s;
                easyRTC.call( otherUser, callSuccessCB, callFailureCB, wasAcceptedCB);
            }, function(err) {
                var message = "Error getting fake media stream for Firefox datachannels: " + err;
                if(easyRTC.debugPrinter) {
                    easyRTC.debugPrinter(message);
                }   
                callFailureCB(message);
            }); 
            return;
        }
        
        
        // do we already have a pending call?
        if( typeof easyRTC.acceptancePending[otherUser] !== 'undefined' ) {
            message = "Call already pending acceptance";
            if(easyRTC.debugPrinter) {
                easyRTC.debugPrinter(message);
            }
            callFailureCB(message);
            return;
        }

        easyRTC.acceptancePending[otherUser] = true;
        
        var pc = buildPeerConnection(otherUser, true, callFailureCB);
        if( !pc ) {
            message = "buildPeerConnection failed, call not completed";
            if(easyRTC.debugPrinter) {
                easyRTC.debugPrinter(message);
            }
            return;
        }
        easyRTC.peerConns[otherUser].callSuccessCB = callSuccessCB;
        easyRTC.peerConns[otherUser].callFailureCB = callFailureCB;
        easyRTC.peerConns[otherUser].wasAcceptedCB = wasAcceptedCB;
        
        var peerConnObj = easyRTC.peerConns[otherUser];

        var setLocalAndSendMessage = function(sessionDescription) {
            if( peerConnObj.cancelled) return;
            var sendOffer = function(successCB, errorCB) {
                sendMessage(otherUser, "offer", sessionDescription, successCB, callFailureCB);
            }

            pc.setLocalDescription(sessionDescription, sendOffer, callFailureCB);
        };

        pc.createOffer(setLocalAndSendMessage, null, mediaConstraints);
    };


    
    function limitBandWidth(sd) {
        if( easyRTC.videoBandwidthString != "" ) {
            var pieces = sd.sdp.split('\n');
            for(var i = pieces.length -1; i >= 0; i-- ) {
                if( pieces[i].indexOf("m=video") == 0 ) {
                    for(var j = i;  j < i+10 && pieces[j].indexOf("a=") == -1 &&
                        pieces[j].indexOf("k=") == -1; j++ ) {
                    }
                    pieces.splice(j, 0, (easyRTC.videoBandwidthString + "\r"));
                }
            }
            sd.sdp = pieces.join("\n");
        }
    };


    function hangupBody(otherUser) {
        if(easyRTC.debugPrinter) {
            easyRTC.debugPrinter("Hanging up on " + otherUser);
        }
        clearQueuedMessages(otherUser);
        if( easyRTC.peerConns[otherUser] ) {
            if( easyRTC.peerConns[otherUser].startedAV ) {
                try {
                    easyRTC.peerConns[otherUser].pc.close();
                } catch(ignoredError) {}
                
                if( easyRTC.onStreamClosed ) {
                    easyRTC.onStreamClosed(otherUser);
                }
            }
            
            easyRTC.peerConns[otherUser].cancelled = true;
            
            delete easyRTC.peerConns[otherUser];
            if( channel) {
                sendMessage(otherUser, "hangup", {}, function() {
                    }, function(msg) {
                        if( easyRTC.debugPrinter) { 
                            debugPrinter("hangup failed:" + msg);
                        }
                    });
            }
            if( easyRTC.acceptancePending[otherUser]) {
                delete easyRTC.acceptancePending[otherUser];
            }
        }        
    }
    
    //
    // easyRTC.hangup hang up on a particular user or all users.
    // Arguments:
    //    otherUser - name of the person to hang up on.
    //
    easyRTC.hangup = function(otherUser) {
        hangupBody(otherUser);
        easyRTC.updateConfigurationInfo();
    };


    //
    // easyRTC.hangupAll hangs up on all current connections.
    // Arguments: none
    //
    easyRTC.hangupAll = function() {
        for( otherUser in easyRTC.peerConns ) {
            hangupBody(otherUser);
            if( channel) {
                sendMessage(otherUser, "hangup", {}, function() {
                    }, function(msg) {
                        if( easyRTC.debugPrinter) {
                            easyRTC.debugPrinter("hangup failed:" + msg);
                        }
                    });                
            }            
        }       
        easyRTC.updateConfigurationInfo();
    };


    var createRTCPeerConnection = function(pc_config, optionalStuff) {

        if( window.mozRTCPeerConnection) {
            return new mozRTCPeerConnection(pc_config, optionalStuff);
        }
        else if (window.webkitRTCPeerConnection) {
            return new webkitRTCPeerConnection(pc_config, optionalStuff);
        }
        else if( window.RTCPeerConnection) {
            return new RTCPeerConnection(pc_config, optionalStuff);
        }
        else {
            throw "Your browser doesn't support webRTC (RTCPeerConnection)";
        }
    };


    var buildPeerConnection = function(otherUser, isInitiator, failureCB) {
        var pc;
        var message;
        
        var optionalStuff = null;
        if(easyRTC.debugPrinter) {
            easyRTC.debugPrinter("building peer connection to " + otherUser);
        }
        
        if( easyRTC.dataEnabled) {
            optionalStuff = {
                optional: [{
                    RtpDataChannels: true
                }]
            }            
        }
        
        try {
            pc = createRTCPeerConnection(pc_config, optionalStuff);
            if( !pc) {
                message = "Unable to create PeerConnection object, check your ice configuration(" + 
                JSON.stringify(pc_config) + ")";
                if(easyRTC.debugPrinter) {
                    easyRTC.debugPrinter(message);
                }                
                throw(message);
            }


            pc.onconnection = function() {
                if(easyRTC.debugPrinter) {
                    easyRTC.debugPrinter("onconnection called prematurely");
                }                
            }
            var newPeerConn = {
                pc:pc,
                candidatesToSend:[],
                startedAV: false
            };

            pc.onicecandidate = function(event) {
                if( newPeerConn.cancelled) return;
                if (event.candidate && easyRTC.peerConns[otherUser]) {
                    var candidateData = {
                        type: 'candidate',
                        label: event.candidate.sdpMLineIndex,
                        id: event.candidate.sdpMid,
                        candidate: event.candidate.candidate
                    };
                    if( easyRTC.peerConns[otherUser].startedAV ) {
                        sendMessage(otherUser, "candidate",candidateData);
                    }
                    else {
                        easyRTC.peerConns[otherUser].candidatesToSend.push(candidateData);
                    }
                }
            }

            pc.onaddstream = function(event) {
                if(easyRTC.debugPrinter) {
                    easyRTC.debugPrinter("saw incoming media stream");
                }                
                if( newPeerConn.cancelled) return;
                easyRTC.peerConns[otherUser].startedAV = true;
                easyRTC.peerConns[otherUser].sharingAudio = easyRTC.haveAudioVideo.audio;
                easyRTC.peerConns[otherUser].sharingVideo = easyRTC.haveAudioVideo.video;
                easyRTC.peerConns[otherUser].connectTime = new Date().getTime();

                if( easyRTC.peerConns[otherUser].callSuccessCB ) {
                    if( easyRTC.peerConns[otherUser].sharingAudio || easyRTC.peerConns[otherUser].sharingVideo ) {
                        easyRTC.peerConns[otherUser].callSuccessCB(otherUser, "audiovideo");
                    }
                }
                if( easyRTC.audioEnabled || easyRTC.videoEnabled) { // might be a fake audio stream for mozilla data channels
                    updateConfiguration();
                }
                if( easyRTC.streamAcceptor ) {
                    easyRTC.streamAcceptor(otherUser, event.stream);
                }
            }
            
            pc.onremovestream = function(event) {
                if(easyRTC.debugPrinter) {
                    easyRTC.debugPrinter("saw remove on remote media stream");
                }                

                if( easyRTC.peerConns[otherUser] ) {
                    if( easyRTC.onStreamClosed ) {
                        easyRTC.onStreamClosed(otherUser);
                    }
                    delete easyRTC.peerConns[otherUser];
                    easyRTC.updateConfigurationInfo();
                }
            }
            easyRTC.peerConns[otherUser] = newPeerConn;
            
        } catch (e) {
            if( easyRTC.debugPrinter) {
                easyRTC.debugPrinter(JSON.stringify(e));
            }
            failureCB(e.message);
            return null;
        }
        
        if( easyRTC.videoEnabled || easyRTC.audioEnabled) {
            if( easyRTC.localStream == null) {
                message = "Application program error: attempt to share audio or video before calling easyRTC.initMediaSource."
                if(easyRTC.debugPrinter) {
                    easyRTC.debugPrinter(message);
                }
                alert(message)
            }
            else {
                if(easyRTC.debugPrinter) {
                    easyRTC.debugPrinter("adding local media stream to peer connection");
                }
                pc.addStream(easyRTC.localStream);
            }
        }
        else if( easyRTC.dataEnabled && navigator.mozGetUserMedia) { // mozilla needs a fake data stream for channels currently.
            if(easyRTC.debugPrinter) {
                easyRTC.debugPrinter("added fake stream to peer connection");
            }
            pc.addStream(easyRTC.mozFakeStream);
        }
        
        if( easyRTC.dataEnabled ) {
           
            function setupChannel(channel) {
                
                if(easyRTC.debugPrinter) {
                    easyRTC.debugPrinter("saw setupChannel call");
                }
                easyRTC.peerConns[otherUser].dataChannel = channel;
                
                //channel.binaryType = "blob";
                
                channel.onmessage = function(event) {
                    if(easyRTC.debugPrinter) {
                        easyRTC.debugPrinter("saw channel.onmessage event");
                    }
                    if( easyRTC.receiveDataCB ) {
                        easyRTC.receiveDataCB(otherUser, event.data);
                    }                    
                };
                channel.onopen = function(event) {
                    if(easyRTC.debugPrinter) {
                        easyRTC.debugPrinter("saw channel.onopen event");
                    }
                    if(easyRTC.peerConns[otherUser]) {
                        easyRTC.peerConns[otherUser].dataChannelReady = true;                        
                    
                        if( easyRTC.peerConns[otherUser].callSuccessCB ) {
                            easyRTC.peerConns[otherUser].callSuccessCB(otherUser, "datachannel");
                        }
                        if( easyRTC.onDataChannelOpen ) {
                            easyRTC.onDataChannelOpen(otherUser);
                        }
                        easyRTC.updateConfigurationInfo();
                    }
                };
                channel.onclose = function(event) {
                    if(easyRTC.debugPrinter) {
                        easyRTC.debugPrinter("saw channel.onclose event");
                    }
                    if(easyRTC.peerConns[otherUser]) {
                        easyRTC.peerConns[otherUser].dataChannelReady = false;
                        delete easyRTC.peerConns[otherUser].dataChannel;
                    }
                    if( easyRTC.onDataChannelClose ) {
                        easyRTC.onDataChannelClose(openUser);
                    }

                    easyRTC.updateConfigurationInfo();
                };
            }
            

            if(isInitiator) {
                function initiateDataChannel() {
                    if(easyRTC.debugPrinter) {
                        easyRTC.debugPrinter("called initiateDataChannel");                        
                    }
                    try {
                        var channel = pc.createDataChannel(easyRTC.datachannelName, easyRTC.datachannelConstraints);            
                        setupChannel(channel);                
                    } catch(channelErrorEvent) {
                        failureCB( JSON.stringify(channelErrorEvent));
                    }                    
                }
                
                if( navigator.mozGetUserMedia ) {
                    if(easyRTC.debugPrinter) {
                        easyRTC.debugPrinter("setup pc.onconnection callback for initiator");
                    }
                    pc.onconnection = initiateDataChannel;
                }
                else {
                    initiateDataChannel();
                }
            }
            else {
                pc.onconnection = function(){
                    if(easyRTC.debugPrinter) {
                        easyRTC.debugPrinter("callee onconnection event seen");
                    }
                };
                pc.ondatachannel = function(event) {
                    // Chrome passes down an event with channel attribute,
                    // whereas Mozilla passes down the channel itself.
                    if( event.channel) {
                        setupChannel(event.channel);
                    }
                    else {
                        setupChannel(event);
                    }
                    if(easyRTC.debugPrinter) {
                        easyRTC.debugPrinter("received data channel");
                    }
                    easyRTC.peerConns[otherUser].dataChannelReady = true;
                };
            }
        }
        return pc;
    };


    var doAnswer = function(caller, msg) {
        
        if( easyRTC.dataEnabled && !easyRTC.videoEnabled && !easyRTC.audioEnabled 
            && navigator.mozGetUserMedia && easyRTC.mozFakeStream == null ) {
            navigator.mozGetUserMedia({
                audio:true, 
                fake:true
            }, function(s) {
                if( !s) {
                    callFailureCB("Error getting fake media stream for Firefox datachannels: null stream");
                }
                easyRTC.mozFakeStream = s;
                doAnswer(caller, msg);
            }, function(err) {
                callFailureCB("Error getting fake media stream for Firefox datachannels: " + err);
            });   
            return;
        }
        var pc = buildPeerConnection(caller, false, easyRTC.onError);
        var newPeerConn = easyRTC.peerConns[caller];
        
        if( !pc) {
            if(easyRTC.debugPrinter) {
                easyRTC.debugPrinter("buildPeerConnection failed. Call not answered");
            }
            return;
        }
        var setLocalAndSendMessage = function(sessionDescription) {
            if( newPeerConn.cancelled) return;
            
            var sendAnswer = function() {
                if(easyRTC.debugPrinter) {
                    easyRTC.debugPrinter("sending answer");
                }
                sendMessage(caller, "answer", sessionDescription, function() {}, easyRTC.onError);
                easyRTC.peerConns[caller].startedAV = true;
                if( pc.connectDataConnection) {
                    if( easyRTC.debugPrinter) {
                        easyRTC.debugPrinter("calling connectDataConnection(5002,5001)");
                    }
                    pc.connectDataConnection(5002,5001); 
                }
            };
            pc.setLocalDescription(sessionDescription, sendAnswer, easyRTC.onError);

        };
        var sd = null;

        if( window.mozRTCSessionDescription ) {
            sd = msg.actualData;
        }
        else {
            sd = new RTCSessionDescription(msg.actualData);
        }
        var invokeCreateAnswer = function() {
            if( newPeerConn.cancelled) return;
            pc.createAnswer(setLocalAndSendMessage, easyRTC.onError, mediaConstraints);
        };
        if(easyRTC.debugPrinter) {
            easyRTC.debugPrinter("about to call setRemoteDescription in doAnswer");            
        }
        try {
            //    limitBandWidth(sd);
            pc.setRemoteDescription(sd, invokeCreateAnswer, easyRTC.onError);
        } catch(srdError ) {
            if( easyRTC.debugPrinter) {
                easyRTC.debugPrinter("saw exception in setRemoteDescription");
            }
            easyRTC.onError("setRemoteDescription failed: " + srdError.message);
        }
    };


    var onRemoteHangup = function(caller) {
        if(easyRTC.debugPrinter) {
            easyRTC.debugPrinter("Saw onremote hangup event");
        }
        if( easyRTC.peerConns[caller]) {
            easyRTC.peerConns[caller].cancelled = true;
            if( easyRTC.peerConns[caller].startedAV) {
                if(  easyRTC.onStreamClosed  ) {
                    easyRTC.onStreamClosed(caller);
                }
            }
            else {
                if(easyRTC.callCancelled ){
                    easyRTC.callCancelled(caller);
                }                
            }
            try {
                easyRTC.peerConns[caller].pc.close();
            } catch( anyErrors) {
            };
            delete easyRTC.peerConns[caller];
            easyRTC.updateConfigurationInfo();
        }
        else {
            if(easyRTC.callCancelled ){
                easyRTC.callCancelled(caller);
            }                            
        }
    };


    //
    // The app engine has many machines running in parallel. This means when
    //  a client sends a sequence of messages to another client via the server,
    //  one at a time, they don't necessarily arrive in the same order in which
    // they were sent. In particular, candidates arriving before an offer can throw
    // a wrench in the gears. So we queue the messages up until we are ready for them.
    //
    var queuedMessages = {};

    var clearQueuedMessages = function(caller ) {
        queuedMessages[caller] = {
            candidates:[]
        };
    };


    var onChannelMessage = function(msg) {

        if( easyRTC.receiveDataCB ) {
            easyRTC.receiveDataCB(msg.senderId, msg.msgData);
        }
    };


    var onChannelCmd = function(msg) {
        if(easyRTC.debugPrinter) {
            easyRTC.debugPrinter("received message from socket server=" + JSON.stringify(msg));
        }
        
        var caller = msg.senderId;
        var msgType = msg.msgType;
        var actualData = msg.msgData;
        var pc;

        if( easyRTC.debugPrinter) {
            easyRTC.debugPrinter('received message of type ' + msgType);
        }

        if( typeof queuedMessages[caller] == "undefined" ) {
            clearQueuedMessages(caller);
        }

        var processConnectedList = function(connectedList) {
            for(var i in easyRTC.peerConns) {
                if( typeof connectedList[i] == 'undefined' ) {
                    if( easyRTC.peerConns[i].startedAV ) {
                        onRemoteHangup(i);
                        clearQueuedMessages(i);
                    }
                }
            }
        };


        var processCandidate = function(actualData) {
            var candidate = null;
            if( window.mozRTCIceCandidate ) {
                candidate = new mozRTCIceCandidate({
                    sdpMLineIndex:actualData.label,
                    candidate:actualData.candidate
                });
            }
            else {
                candidate = new RTCIceCandidate({
                    sdpMLineIndex:actualData.label,
                    candidate:actualData.candidate
                });
            }
            pc = easyRTC.peerConns[caller].pc;
            pc.addIceCandidate(candidate);
        };


        var flushCachedCandidates = function(caller) {
            if( queuedMessages[caller] ) {
                for(var i = 0; i < queuedMessages[caller].candidates.length; i++ ) {
                    processCandidate(queuedMessages[caller].candidates[i]);
                }
                delete queuedMessages[caller];
            }
        };


        var processOffer = function(caller, actualData) {

            var helper = function(wasAccepted) {
                if(easyRTC.debugPrinter) {
                    easyRTC.debugPrinter("offer accept=" + wasAccepted);
                }
                
                if( wasAccepted) {
                    doAnswer(caller, actualData);
                    flushCachedCandidates(caller);
                }
                else {
                    sendMessage(caller, "reject", {
                        rejected:true
                    }, function() {}, function() {});
                    clearQueuedMessages(caller);
                }
            }

            if( !easyRTC.acceptCheck ) {
                helper(true);
            }
            else {
                easyRTC.acceptCheck(caller, helper);
            }
        };


        if( msgType == 'token' ) {
            me = msg.easyrtcid;
            pc_config = msg.iceConfig;
            if( successCallback) {
                successCallback(me);
            }
        }
        else if( msgType == 'updateInfo') {
            easyRTC.updateConfigurationInfo();
        }
        else if( msgType == 'list' ) {
            if( actualData.connections[me] &&
                actualData.connections[me].applicationName != applicationName) {
                return;
            }
            delete actualData.connections[me];
            easyRTC.lastLoggedInList = actualData.connections;
            processConnectedList(actualData.connections);
            if( easyRTC.loggedInListener ) {
                easyRTC.loggedInListener(actualData.connections);
            }
        }
        else if( msgType == 'offer' ) {
            processOffer(caller, actualData);
        }
        else if( msgType == 'reject' ) {
            delete easyRTC.acceptancePending[caller];
            if( queuedMessages[caller] ) {
                delete queuedMessages[caller];
            }
            if( easyRTC.peerConns[caller]) {
                if( easyRTC.peerConns[caller].wasAcceptedCB ) {
                    easyRTC.peerConns[caller].wasAcceptedCB(false, caller);
                }
                delete easyRTC.peerConns[caller];
            }
        }
        else if (msgType == 'answer' ) {
            delete easyRTC.acceptancePending[caller];
            if( easyRTC.peerConns[caller].wasAcceptedCB ) {
                easyRTC.peerConns[caller].wasAcceptedCB(true, caller);
            }
            easyRTC.peerConns[caller].startedAV = true;
            for(var i = 0; i < easyRTC.peerConns[caller].candidatesToSend.length ; i++ ) {
                sendMessage(caller, "candidate",easyRTC.peerConns[caller].candidatesToSend[i]);
            }

            pc = easyRTC.peerConns[caller].pc;
            var sd = null;
            if( window.mozRTCSessionDescription ) {
                sd = new mozRTCSessionDescription(actualData.actualData);
            }
            else {
                sd = new RTCSessionDescription(actualData.actualData);
            }
            if( !sd ) {
                throw "Could not create the RTCSessionDescription";
            }
            //            limitBandWidth(sd);
            if( easyRTC.debugPrinter ) {
                easyRTC.debugPrinter("about to call initiating setRemoteDescription");
            }
            pc.setRemoteDescription(sd, function() {
                if( pc.connectDataConnection ) {
                    if( easyRTC.debugPrinter) {
                        easyRTC.debugPrinter("calling connectDataConnection(5001,5002)");
                    }
                    pc.connectDataConnection(5001,5002); // these are like ids for data channels
                }
            });
            flushCachedCandidates(caller);
        }
        else if( msgType == 'candidate') {
            if( easyRTC.peerConns[caller] && easyRTC.peerConns[caller].startedAV ) {
                processCandidate(actualData.actualData);
            }
            else {
                if( !easyRTC.peerConns[caller] ) {
                    queuedMessages[caller] = {
                        candidates:[]
                    };
                }
                queuedMessages[caller].candidates.push(actualData.actualData);
            }
        }
        else if (msgType == 'hangup') {
            onRemoteHangup(caller);
            clearQueuedMessages(caller);
        }
    };


    var onChannelError = function() {
        if( easyRTC.debugPrinter) {
            easyRTC.debugPrinter("saw channel error");
        }
        easyRTC.onError("Saw channel error.");
    }


    if( !window.io ) {
        easyRTC.onError("Your HTML has not included the socket.io.js library");
    }


    channel = io.connect(easyRTC.serverPath, {
        'force new connection':true
    });
    if( !channel) {
        throw "io.connect failed";
    }
    channel.on("message", onChannelMessage);
    channel.on("easyRTCcmd", onChannelCmd);
    channel.on("disconnect", function(code, reason, wasClean) {
        easyRTC.updateConfigurationInfo = function() {};
        if( !easyRTC.disconnecting ) {
            easyRTC.disconnect();
        }
    });


    function  getStatistics(pc, track, results) {
        var successcb = function(stats) {
            for(var i in stats) {
                results[i] = stats[i];
            }
        }
        var failurecb = function(event) {
            results.error = event;
        }
        pc.getStats(track, successcb, failurecb);
    }


    function DeltaRecord(added, deleted, modified) {
        function objectNotEmpty(obj) {
            for(var i in obj) {
                return true;
            }
            return false;
        }
        
        var result = {};
        if( objectNotEmpty(added)) {
            result.added = added;
        }
            
        if( objectNotEmpty(deleted)) {
            result.deleted = deleted;
        }
                    
        if( objectNotEmpty(result)) {
            return result;
        }
        else {
            return null;
        }        
    }
    
    function findDeltas(oldVersion, newVersion) {
        var i;
        var added = {}, deleted = {};
        
        for( i in newVersion) {
            if( oldVersion == null || typeof oldVersion[i] == 'undefined') {
                added[i] = newVersion[i];
            }
            else if( typeof newVersion[i] == 'object') {
                var subPart = findDeltas(oldVersion[i], newVersion[i]);
                if( subPart != null ) {
                    added[i] = newVersion[i];
                }
            }
            else if( newVersion[i] != oldVersion[i]) {
                added[i] = newVersion[i];

            }
        }
        for( i in oldVersion) {
            if( typeof newVersion[i] == 'undefined') {
                deleted = oldVersion[i];
            }
        }
        
        return  new DeltaRecord(added, deleted);
    }
    
    var oldConfig = {}; // used internally by updateConfiguration
    
    function updateConfiguration() {
        var connectionList = {};
        for(var i in easyRTC.peerConns ) {
            connectionList[i] = {
                connectTime: easyRTC.peerConns[i].connectTime,
                sharingAudio: easyRTC.peerConns[i].sharingAudio?true:false,
                sharingVideo: easyRTC.peerConns[i].sharingVideo?true:false,
                sharingData: easyRTC.peerConns[i].dataChannel?true:false
            };

            if( easyRTC.peerConns[i].pc.getStats) {
                var pc = easyRTC.peerConns[i].pc;
                pc.getStats( function(dest) {                    
                    return function(stats) {  
                        if( stats === {}) {
                            dest.stats = "none";
                        }
                        else {
                            dest.stats = stats.result();
                        }
                    }                    
                }( connectionList[i]));                
            }
        }
                
        var newConfig = {
            sharingAudio: easyRTC.haveAudioVideo.audio?true:false,
            sharingVideo: easyRTC.haveAudioVideo.video?true:false,
            sharingData: easyRTC.dataEnabled?true:false,
            nativeVideoWidth: easyRTC.nativeVideoWidth,
            nativeVideoHeight: easyRTC.nativeVideoHeight,
            windowWidth: window.innerWidth,
            windowHeight: window.innerHeight,
            connectionList: connectionList,
            applicationName:applicationName,
            screenWidth: window.screen.width,
            screenHeight: window.screen.height,
            browserUserAgent: navigator.userAgent,
            cookieEnabled : navigator.cookieEnabled,
            os: navigator.oscpu,
            language: navigator.language
        };
        
        //
        // we need to give the getStats calls a chance to fish out the data. 
        // The longest I've seen it take is 5 milliseconds so 100 should be overkill.
        //
        setTimeout( function() {
        
            var alteredData = findDeltas(oldConfig, newConfig);
            
            //
            // send all the configuration information that changes during the session
            //
            if( easyRTC.debugPrinter) {
                easyRTC.debugPrinter("cfg=" + JSON.stringify(alteredData.added));
            }
            channel.json.emit("easyRTCcmd",
            {
                msgType:'setUserCfg',
                msgData: alteredData.added
            }
            );
            oldConfig = newConfig;
        }, 100);
    }
    
    
    channel.on("connect", function(event) {
        if(easyRTC.debugPrinter) {
            easyRTC.debugPrinter("saw socketserver onconnect event");
        }
        if( channel) {            
            easyRTC.updateConfigurationInfo = updateConfiguration;
            updateConfiguration();
        }
        else {
            errorCallback("Internal communications failure.")
        }
    }
    );
}

//
// easyRTC.initManaged provides a layer on top of easyRTC.init. It will call
// easyRTC.initMediaSource and easyRTC.connect, assign the local media stream to
// the video object identified by monitorVideoId, assign remote video streams to
// the video objects identified by videoIds, and then call onReady. One of it's
// side effects is to add refresh and stop buttons to the remote video objects, buttons
// that only appear when you hover over them with the mouse cursor.
// Arguments:
//    applicationName - name of the application.
//    monitorVideoId - the id of the video object used for monitoring the local stream.
//    videoIds - an array of video object ids (strings)
//    onReady - a callback function used on success. On failure, an alert is thrown.
//
easyRTC.initManaged = function(applicationName, monitorVideoId, videoIds, onReady) {
    var numPEOPLE = videoIds.length;
    var refreshPane = 0;

    function getIthVideo(i) {
        return document.getElementById(videoIds[i]);
    }


    easyRTC.setOnStreamClosed( function (caller) {
        for( var i = 0; i < numPEOPLE; i++ ) {
            var video = getIthVideo(i);
            if( video.caller == caller) {
                easyRTC.setVideoObjectSrc(video, "");
                video.caller = "";
            }
        }
    });



    function connectFailure(message) {
        if(easyRTC.debugPrinter) {
            easyRTC.debugPrinter("socket server connect failed: "  + message);
        }
        alert("failure to connect");
    }

    //
    // Only accept incoming calls if we have a free video object to display
    // them in. 
    //
    easyRTC.setAcceptChecker( function(caller, helper) {
        for( var i = 0; i < numPEOPLE; i++) {
            var video = getIthVideo(i);
            if( video.caller == "") {
                helper(true);       
                return;
            }
        }
        helper(false);
    });

    easyRTC.setStreamAcceptor( function(caller, stream) {
        if(easyRTC.debugPrinter) {
            easyRTC.debugPrinter("stream acceptor called");
        }
        var i, video;
        if( refreshPane && refreshPane.caller == "") {
            easyRTC.setVideoObjectSrc(video, stream);
            refreshPane = null;
            return;
        }
        for( i = 0; i <numPEOPLE; i++ ) {
            video = getIthVideo(i);
            if( video.caller == caller ) {
                easyRTC.setVideoObjectSrc(video, stream);
                return;
            }
        }

        for( i = 0; i <numPEOPLE; i++ ) {
            video = getIthVideo(i);
            if( video.caller == null || video.caller == "" ) {
                video.caller = caller;
                easyRTC.setVideoObjectSrc(video, stream);
                return;
            }
        }
        //
        // no empty slots, so drop whatever caller we have in the first slot and use that one.
        //
        video = getIthVideo(0);
        easyRTC.hangup(video.caller);
        easyRTC.setVideoObjectSrc(video, stream)
        video.caller = caller;
    });


    var addControls = function(video) {
        var parentDiv = video.parentNode;
        video.caller = "";
        var closeButton = document.createElement("button");
        closeButton.className = "closeButton";
        closeButton.onclick = function() {
            if( video.caller) {
                easyRTC.hangup(video.caller);
                easyRTC.setVideoObjectSrc(video, "");
                video.caller = "";
            }
        };
        parentDiv.appendChild(closeButton);
    }


    for( var i = 0; i < numPEOPLE; i++ ) {
        addControls(getIthVideo(i));
    }

    easyRTC.initMediaSource(
        function() {
            var monitorVideo = document.getElementById(monitorVideoId);
            easyRTC.setVideoObjectSrc(monitorVideo, easyRTC.getLocalStream());
            easyRTC.connect(applicationName, onReady, connectFailure);
        },

        function(errmesg) {
            alert(errmesg);
        }
        );
}
