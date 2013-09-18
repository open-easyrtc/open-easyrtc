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
var haveSelfVideo = false;

function disable(id) {
    console.log("about to try disabling "  +id);
    document.getElementById(id).disabled = "disabled";
}


function enable(id) {
    console.log("about to try enabling "  +id);
    document.getElementById(id).disabled = "";
}


function connect() {
    console.log("Initializing.");
    easyRTC.enableAudio(document.getElementById('shareAudio').checked);
    easyRTC.enableVideo(document.getElementById('shareVideo').checked);
    easyRTC.setLoggedInListener(convertListToButtons);
    easyRTC.connect("audioVideo", loginSuccess, loginFailure);

}


function hangup() {
    easyRTC.hangupAll();
    disable('hangupButton');
}


function clearConnectList() {
    otherClientDiv = document.getElementById('otherClients');
    while (otherClientDiv.hasChildNodes()) {
        otherClientDiv.removeChild(otherClientDiv.lastChild);
    }
}


function convertListToButtons (data) {
    clearConnectList();
    otherClientDiv = document.getElementById('otherClients');
    for(var i in data) {
        var button = document.createElement('button');
        button.onclick = function(easyrtcid) {
            return function() {
                performCall(easyrtcid);
            }
        }(i);

        label = document.createTextNode("Call " + easyRTC.idToName(i));
        button.appendChild(label);
        otherClientDiv.appendChild(button);
    }
}


function setUpMirror() {
    if( !haveSelfVideo) {
        var selfVideo = document.getElementById("selfVideo");
        easyRTC.setVideoObjectSrc(selfVideo, easyRTC.getLocalStream());
        selfVideo.muted = true;
        haveSelfVideo = true;
    }    
}

function performCall(otherEasyrtcid) {
    easyRTC.hangupAll();
    var acceptedCB = function(accepted, caller) {
        if( !accepted ) {
            easyRTC.showError("CALL-REJECTEd", "Sorry, your call to " + easyRTC.idToName(caller) + " was rejected");
            enable('otherClients');
        }
    }
    
    var successCB = function() {
        setUpMirror();
        enable('hangupButton');
    }
    var failureCB = function() {
        enable('otherClients');
    }
    easyRTC.call(otherEasyrtcid, successCB, failureCB, acceptedCB);
    enable('hangupButton');
}


function loginSuccess(easyRTCId) {
    disable("connectButton");
  //  enable("disconnectButton");
    enable('otherClients');
    selfEasyrtcid = easyRTCId;
    document.getElementById("iam").innerHTML = "I am " + easyRTC.cleanId(easyRTCId);
}


function loginFailure(message) {
    easyRTC.showError("LOGIN-FAILURE", message);
}


function disconnect() {
    document.getElementById("iam").innerHTML = "logged out";
    easyRTC.disconnect();
    enable("connectButton");
//    disable("disconnectButton");
    clearConnectList();
    easyRTC.setVideoObjectSrc(document.getElementById('selfVideo'), "");
}


easyRTC.setStreamAcceptor( function(caller, stream) {
    setUpMirror();
    var video = document.getElementById('callerVideo');
    easyRTC.setVideoObjectSrc(video,stream);
    console.log("saw video from " + caller);
    enable("hangupButton");
});



easyRTC.setOnStreamClosed( function (caller) {
    easyRTC.setVideoObjectSrc(document.getElementById('callerVideo'), "");
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
    if( easyRTC.getConnectionCount() > 0 ) {
        document.getElementById('acceptCallLabel').innerHTML = "Drop current call and accept new from " + easyRTC.idToName(caller) + " ?";
    }
    else {
        document.getElementById('acceptCallLabel').innerHTML = "Accept incoming call from " + easyRTC.idToName(caller) + " ?";
    }
    var acceptTheCall = function(wasAccepted) {
        document.getElementById('acceptCallBox').style.display = "none";
        if( wasAccepted && easyRTC.getConnectionCount() > 0 ) {
            easyRTC.hangupAll();
        }
        cb(wasAccepted);
        callerPending = null;
    }
    document.getElementById("callAcceptButton").onclick = function() {
        acceptTheCall(true);
    };
    document.getElementById("callRejectButton").onclick =function() {
        acceptTheCall(false);
    };
} );