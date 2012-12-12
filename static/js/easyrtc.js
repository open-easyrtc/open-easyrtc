//
//Copyright (c) 2012, Priologic Software Inc.
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
easyRTC.audioEnabled = true;
easyRTC.videoEnabled = true;
easyRTC.loggedInListener = null; 
easyRTC.lastLoggedInList = {};
easyRTC.receiveDataCB = null;

//
//  easyRTC.peerConns is a map from caller names to the below object structure
//     {  started: boolean,
//        pc: RTCPeerConnection,
//		  function callSuccessCB(string) - see the easyRTC.call documentation.
//        function callFailureCB(string) - see the easyRTC.call documentation.
//        function wasAcceptedCB(boolean,string) - see the easyRTC.call documentation.
//     }
//
easyRTC.peerConns = {};

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
easyRTC.onError = function(message) {
    alert(message);
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
        throw "Your browsers does not support URL.createObjectURL.";
    }
};


//
// easyRTC.cleanId is a convenience function to ensure that ids are
// 
easyRTC.cleanId = function(idString) {
    var MAP = { '&': '&amp;',
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
// easyRTC.getConnectionCount returns the number of live connections.
// Arguments: none
//
easyRTC.getConnectionCount = function() {
    var count = 0;
    for(var i in easyRTC.peerConns ) {
        if( easyRTC.peerConns[i].started ) {
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
    if( errorCallback == null) {
        errorCallback = function(x) {
            alert("easyRTC.initMediaSource: " + x);
        };
    }
    
    if( !successCallback) {
        alert("easyRTC.initMediaSource not supplied a successCallback");
        return;
    }
    
    function callGetUserMedia(mode, successfunc, errorFunc) {
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
        easyRTC.localStream = stream;       
        if( successCallback) {
            successCallback();
        }
    };

    
    var onUserMediaError = function(error) { 
        if( errorCallback ) {
            errorCallback("Failed to get access to local media. Error code was " + error.code + ".");
        }
        easyRTC.localStream = null;
    };

    
    if( !easyRTC.audioEnabled && !easyRTC.videoEnabled ) {
        onUserMediaError("At least one of audio and video must be provided");
        return;
    }
	
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
            errorCallback("getUserMedia failed with exception: " + e.message);
        }
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
//  easyRTC.setStreamClosed sets a callback to receive notification of a media stream closing
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
    
	
    var mediaConstraints = {
        'mandatory': {
            'OfferToReceiveAudio':true, 
            'OfferToReceiveVideo':true
        } 
    };

    //
    // easyRTC.disconnect performs a clean disconnection of the client from the server.
    //
    easyRTC.disconnect = function() {
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
    
    var sendMessage = function(destUser, instruction, data, successCallback, errorCallback) { 
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
        channel.json.emit("easyRTCcmd", dataToShip);
    };
    
    
    //
    // easyrTC.sendData sends data to another user.
    // Arguments:
    //     senderId
    //     data - an object which can be JSON'ed.
    //
    easyRTC.sendData = function(destUser, data ) {
        channel.json.emit("message", {
            senderId:me,
            targetId: destUser,
            msgData:data
        });
    };
	
	
    // easyRTC.getLoggedInList fetches a list of the people logged onto the server.
    // Arguments:
    //     function successCallback(data, textStatus, jqXHR) {}.
    //     errorCallback - called on server error.
    // The data argument passed to the successCallback has the form [ {easyrtcid:'id1'}, {easyrtcid:'id2'}, ...]
    easyRTC.getLoggedInList = function(successCallback, errorCallback) {
        successCallback(easyRTC.lastLoggedInList, null);			
    };

	
    //
    // easyRTC.call initiates a call to another user.
    // Arguments:
    //    otherUser - the name of the other user.
    //    function callSuccessCB(otherCaller) - is called when a media stream is received from 
    //         the other end of call. 
    //    function callFailureCB(errMessage) - is called if there was a system error 
    //         interfering with the call.
    //    function wasAcceptedCB(wasAccepted:boolean,otherUser:string) - is called when a call 
    //         is accepted or rejected by another party. It can be left null.
    // If it succeeds, the streamAcceptor callback (provided by easyRTC.connect) will be called.
    //
    easyRTC.call = function(otherUser, callSuccessCB, callFailureCB, wasAcceptedCB) {
	    
        var pc = buildPeerConnection(otherUser, callFailureCB);
		
        easyRTC.peerConns[otherUser].callSuccessCB = callSuccessCB;
        easyRTC.peerConns[otherUser].callFailureCB = callFailureCB;
        easyRTC.peerConns[otherUser].wasAcceptedCB = wasAcceptedCB;
		
        var setLocalAndSendMessage = function(sessionDescription) {		    
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
    
    
    //
    // easyRTC.hangup hang up on a particular user or all users.
    // Arguments: 
    //    otherUser - name of the person to hang up on.
    //
    easyRTC.hangup = function(otherUser) {
        clearQueuedMessages(otherUser);
        if( easyRTC.peerConns[otherUser] ) {
            if( easyRTC.peerConns[otherUser].started ) {
                easyRTC.peerConns[otherUser].pc.close();
                if( easyRTC.onStreamClosed ) {
                    easyRTC.onStreamClosed(otherUser);
                }
            }
            delete easyRTC.peerConns[otherUser];
        }
        sendMessage(otherUser, "hangup", {}, function() {
            console.log("sent hangup");
        }, function(msg) {
            console.log("hangup failed:" + msg);
        });
    };
	
    
    //
    // easyRTC.hangupAll hangs up on all current connections.
    // Arguments: none
    //
    easyRTC.hangupAll = function() {
        for( i in easyRTC.peerConns ) {
            if( easyRTC.peerConns[i].started ) {
                easyRTC.peerConns[i].pc.close();
                sendMessage(i, "hangup", {}, function() {}, function() {});
                if( easyRTC.onStreamClosed ) {
                    easyRTC.onStreamClosed(i);
                }

            }			 
        }
        easyRTC.peerConns = {};	
    };
    
  
    var createRTCPeerConnection = function(pc_config) {
        if( window.mozRTCPeerConnection) {
            return new mozRTCPeerConnection(pc_config);
        }
        else if (window.webkitRTCPeerConnection) {
            return new webkitRTCPeerConnection(pc_config);
        }
        else if( window.RTCPeerConnection) {
            return new RTCPeerConnection(pc_config);
        }
        else {
            throw "Your browsers doesn't support webRTC (RTCPeerConnection)";
        }
    };
  
  
    var buildPeerConnection = function(otherUser, failureCB) {
        var pc;
        try {
            pc = createRTCPeerConnection(pc_config);
 
            pc.onicecandidate = function(event) {
                if (event.candidate && easyRTC.peerConns[otherUser]) {
                    var candidateData = {
                        type: 'candidate',
                        label: event.candidate.sdpMLineIndex,
                        id: event.candidate.sdpMid,
                        candidate: event.candidate.candidate
                    };
                    if( easyRTC.peerConns[otherUser].started ) {
                        sendMessage(otherUser, "candidate",candidateData);
                        console.log("sending candidate immediately");
                    }
                    else {
                        console.log("queing up candidate to send");
                        easyRTC.peerConns[otherUser].candidatesToSend.push(candidateData);
                    }
                } 
            }  
            pc.onaddstream = function(event) {
                easyRTC.peerConns[otherUser].started = true;
                if( easyRTC.peerConns[otherUser].callSuccessCB ) {
                    easyRTC.peerConns[otherUser].callSuccessCB(otherUser);
                }
                if( easyRTC.streamAcceptor ) {
                    easyRTC.streamAcceptor(otherUser, event.stream);
                }
            }
			
            pc.onremovestream = function(event) {
                if( easyRTC.peerConns[otherUser] ) {				
                    if( easyRTC.onStreamClosed ) {			    
                        easyRTC.onStreamClosed(otherUser);
                    }
                    delete easyRTC.peerConns[otherUser];
                }
            }
            easyRTC.peerConns[otherUser] = {
                pc:pc,
                candidatesToSend:[],
                started: false
            };
        } catch (e) {           
            failureCB(e.message);
            return null;
        }
        pc.addStream(easyRTC.localStream);
        return pc;
    };
  

    var doAnswer = function(caller, msg) {
        var pc = buildPeerConnection(caller);
        var setLocalAndSendMessage = function(sessionDescription) {
            var sendAnswer = function() {
                sendMessage(caller, "answer", sessionDescription, function() {}, easyRTC.onError);			
                easyRTC.peerConns[caller].started = true;
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
            console.log("about to createAnswer");
            pc.createAnswer(setLocalAndSendMessage, easyRTC.onError, mediaConstraints);		
        };
        try {
            limitBandWidth(sd); 
            pc.setRemoteDescription(sd, invokeCreateAnswer, easyRTC.onError);
        } catch(srdError ) {
            console.log("saw exception  in setRemoteDescription");
            easyRTC.onError("setRemoteDescription failed: " + srdError.message);
        }
    };
    

    var onRemoteHangup = function(caller) {
        if( easyRTC.peerConns[caller]) {
            if(  easyRTC.onStreamClosed ) {
                easyRTC.onStreamClosed(caller);
            }
            try {
                easyRTC.peerConns[caller].pc.close();
            } catch( anyErrors) {
            };
            delete easyRTC.peerConns[caller];
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
        var caller = msg.senderId;
        var msgType = msg.msgType;		
        var actualData = msg.msgData;
        var pc;

		 
        if( typeof queuedMessages[caller] == "undefined" ) {
            clearQueuedMessages(caller);
        }

        var processConnectedList = function(connectedList) {
            for(var i in easyRTC.peerConns) {
                if( typeof connectedList[i] == 'undefined' ) {
                    if( easyRTC.peerConns[i].started ) {
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
            console.log("channel opened");
            if( successCallback) {
                successCallback(me);
            }
        }
        else if( msgType == 'list' ) {
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
            if( easyRTC.peerConns[caller].wasAcceptedCB ) {
                easyRTC.peerConns[caller].wasAcceptedCB(true, caller);
            }
            easyRTC.peerConns[caller].started = true;
            for(var i = 0; i < easyRTC.peerConns[caller].candidatesToSend.length ; i++ ) {
                console.log("sending queued up candidate");
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
            limitBandWidth(sd);
			
            pc.setRemoteDescription(sd);
            flushCachedCandidates(caller);
        }
        else if( msgType == 'candidate') {
            console.log('saw candidate come in');
            if( easyRTC.peerConns[caller] && easyRTC.peerConns[caller].started ) {
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
        console.log("saw channel error");
        easyRTC.onError("Saw channel error.");
    }
    
    
    if( !window.io ) {
        easyRTC.onError("Your HTML has not include the socket.io.js library");
    }

    channel = io.connect();
    channel.on("message", onChannelMessage);	
    channel.on("easyRTCcmd", onChannelCmd);	
    channel.on("disconnect", function(code, reason, wasClean) {
        if( !easyRTC.disconnecting ) {
            easyRTC.disconnect();
        }
    });

    
    channel.on("connect", function(event) {    
        channel.json.emit("easyRTCcmd", 
            { msgType:'setUserCfg',
              msgData:{applicationName:applicationName}
            });
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
        alert("failure to connect");
    }
  
  
    easyRTC.setStreamAcceptor( function(caller, stream) {
        if( refreshPane && refreshPane.caller == "") {
            easyRTC.setVideoObjectSrc(video, stream);
            refreshPane = null;
            return;
        }
        for(var i = 0; i <numPEOPLE; i++ ) {
            var video = getIthVideo(i);
            if( video.caller == caller ) {
                easyRTC.setVideoObjectSrc(video, stream);
                return;
            }
        }	
        
        for(var i = 0; i <numPEOPLE; i++ ) {
            var video = getIthVideo(i);
            if(  video.caller == "" ) {
                video.caller = caller;
                easyRTC.setVideoObjectSrc(video, stream);
                break;
            }
        }	
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
            console.log("setting video object");
            easyRTC.connect(applicationName, onReady, connectFailure);
        },
        
        function(errmesg) {
            alert(errmesg);
        }
    );
    
}
