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

function disable(id) {
    document.getElementById(id).disabled = "disabled";
}


function enable(id) {
    document.getElementById(id).disabled = "";
}


function connect() {
    console.log("Initializing.");
    easyrtc.enableVideo(false);
    easyrtc.setRoomOccupantListener(convertListToButtons);
    easyrtc.initMediaSource(
        function(){        // success callback
            easyrtc.connect("easyrtc.audioOnly", loginSuccess, loginFailure);
        },
        function(errmesg){
            easyrtc.showError("MEDIA-ERROR", errmesg);
        }  // failure callback
        );
}


function terminatePage() {
    easyrtc.disconnect();
}


function hangup() {
    easyrtc.hangupAll();
    disable('hangupButton');
}


function clearConnectList() {
    otherClientDiv = document.getElementById('otherClients');
    while (otherClientDiv.hasChildNodes()) {
        otherClientDiv.removeChild(otherClientDiv.lastChild);
    }

}


function convertListToButtons (roomName, data, isPrimary) {
    clearConnectList();
    otherClientDiv = document.getElementById('otherClients');
    for(var i in data) {
        var button = document.createElement('button');
        button.onclick = function(easyrtcid) {
            return function() {
                performCall(easyrtcid);
            };
        }(i);
            
        label = document.createElement('text');
        label.innerHTML = easyrtc.idToName(i);
        button.appendChild(label);
        otherClientDiv.appendChild(button);
    }
}


function performCall(otherEasyrtcid) {
    easyrtc.hangupAll();
    var acceptedCB = function(accepted, caller) {
        if( !accepted ) {
            easyrtc.showError("CALL-REJECTED", "Sorry, your call to " + easyrtc.idToName(caller) + " was rejected");
            enable('otherClients');
        }
    };
    var successCB = function() {
        enable('hangupButton');
    };
    var failureCB = function() {
        enable('otherClients');
    };
    easyrtc.call(otherEasyrtcid, successCB, failureCB, acceptedCB);
}


function loginSuccess(easyRTCId) {
    disable("connectButton");
    // enable("disconnectButton");
    enable('otherClients');
    selfEasyrtcid = easyRTCId;
    document.getElementById("iam").innerHTML = "I am " + easyRTCId;
}


function loginFailure(message) {
    easyrtc.showError("LOGIN-FAILURE", message);
}


function disconnect() {
    document.getElementById("iam").innerHTML = "logged out";
    easyrtc.disconnect();
    console.log("disconnecting from server");
    enable("connectButton");
    // disable("disconnectButton");
    clearConnectList();
}


easyrtc.setStreamAcceptor( function(caller, stream) {
    var audio = document.getElementById('callerAudio');
    easyrtc.setVideoObjectSrc(audio,stream);
    enable("hangupButton");
});


easyrtc.setOnStreamClosed( function (caller) {
    easyrtc.setVideoObjectSrc(document.getElementById('callerAudio'), "");
    disable("hangupButton");
});


easyrtc.setAcceptChecker(function(caller, cb) {
    document.getElementById('acceptCallBox').style.display = "block";
    if( easyrtc.getConnectionCount() > 0 ) {
        document.getElementById('acceptCallLabel').textContent = "Drop current call and accept new from " + caller + " ?";
    }
    else {
        document.getElementById('acceptCallLabel').textContent = "Accept incoming call from " + caller + " ?";
    }
    var acceptTheCall = function(wasAccepted) {
        document.getElementById('acceptCallBox').style.display = "none";
        if( wasAccepted && easyrtc.getConnectionCount() > 0 ) {
            easyrtc.hangupAll();    
        }
        cb(wasAccepted);
    };
    document.getElementById("callAcceptButton").onclick = function() {
        acceptTheCall(true);
    };
    document.getElementById("callRejectButton").onclick =function() {
        acceptTheCall(false);
    };    
} );
