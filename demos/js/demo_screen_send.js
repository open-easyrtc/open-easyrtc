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
var selfEasyrtcid = "";

function initApp() {
    if( window.localStorage && window.localStorage.easyrtcUserName ) {
        document.getElementById('userName').value = window.localStorage.easyrtcUserName;
    }    
}


function disable(id) {
    document.getElementById(id).disabled = "disabled";
}


function enable(id) {
    document.getElementById(id).disabled = "";
}

var contactedListeners = {};
var nameToIdMap = {};

function connect() {
    easyRTC.enableDebug(false);
    var tempName = document.getElementById('userName').value;
    if(  !easyRTC.isNameValid(tempName)) {
        easyRTC.showError("BAD-USER-NAME", "illegal user name");
        return;
    }
    easyRTC.setUserName(tempName);
    if( window.localStorage && window.localStorage.easyrtcUserName ) {
        window.localStorage.easyrtcUserName = tempName;        
    }  
    console.log("Initializing with username " + tempName);
    easyRTC.setScreenCapture();
    easyRTC.enableAudio(document.getElementById("shareAudio").checked);
    easyRTC.setLoggedInListener(function (roomName, otherPeers){
        var peer;
        for(peer in otherPeers ) {
            if( !contactedListeners[peer]) {
                easyRTC.sendDataWS(peer, {
                    sender:true
                });
            }        
        }
        contactedListeners = otherPeers;
    });
    
    easyRTC.setDataListener(function(peer, data){});
    
    easyRTC.connect("easyrtc.videoScreen", loginSuccess, loginFailure);
}


function hangup() {
    easyRTC.hangupAll();
    disable('hangupButton');
}


function loginSuccess(easyRTCId) {
    disable("connectButton");
    disable("shareAudio");
    enable("disconnectButton");
    selfEasyrtcid = easyRTCId;
    document.getElementById("iam").innerHTML = "Connected";
}


function loginFailure(message) {
    easyRTC.showError("LOGIN-FAILURE", message);
}


function disconnect() {
    document.getElementById("iam").innerHTML = "logged out";
    easyRTC.disconnect();
    enable("shareAudio");
    console.log("disconnecting from server");
    enable("connectButton");
    disable("disconnectButton");
    easyRTC.setVideoObjectSrc(document.getElementById('callerAudio'), "");
}


easyRTC.setStreamAcceptor( function(caller, stream) {
    var audio = document.getElementById('callerAudio');
    easyRTC.setVideoObjectSrc(audio,stream);
    console.log("got audio from " + easyRTC.idToName(caller));
    enable("hangupButton");
});



easyRTC.setOnStreamClosed( function (caller) {
    easyRTC.setVideoObjectSrc(document.getElementById('callerAudio'), "");
    disable("hangupButton");
});


var callerPending = null;

easyRTC.setCallCancelled( function(caller){
    if( caller == callerPending) {
        document.getElementById('acceptCallBox').style.display = "none";
        callerPending = false;
    }
});


easyRTC.setAcceptChecker(function(caller, cb) {
    document.getElementById('acceptCallBox').style.display = "block";
    callerPending = caller;

   document.getElementById('acceptCallLabel').innerHTML = "Accept incoming call from " + easyRTC.idToName(caller) + " ?";

    var acceptTheCall = function(wasAccepted) {
        document.getElementById('acceptCallBox').style.display = "none";
        cb(wasAccepted);
        callerPending = null;
    }
    document.getElementById("callAcceptButton").onclick = function() {
        console.log("accepted the call");
        acceptTheCall(true);
    };
    document.getElementById("callRejectButton").onclick =function() {
        console.log("rejected the call");
        acceptTheCall(false);
    };
} );