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


function connect() {
    console.log("Initializing.");
    
    var userName = document.getElementById('userName').value;
    if( !easyRTC.isNameValid(userName)) {
        easyRTC.showError("BAD-USER-NAME", "illegal user name");
        return;
    }
    
    easyRTC.setUserName(userName);
    if( window.localStorage ) {
        window.localStorage.easyrtcUserName = document.getElementById('userName').value;
    }   
    
    
    easyRTC.enableAudio(document.getElementById('shareAudio').checked);
    easyRTC.enableVideo(false);
    easyRTC.setLoggedInListener(convertListToButtons);
    easyRTC.connect("screenshare", loginSuccess, loginFailure);

}


function hangup() {
    easyRTC.hangupAll();
    disable('hangupButton');
}



//
// this method actually just removes old buttons.
// The adding of buttons is done with the data listener.
//
function convertListToButtons(data){    
    console.log("saw data list of " + JSON.stringify(data));
    var otherClientDiv = document.getElementById('otherClients');
    var i, nextChild;
    
    for( i = otherClientDiv.childNodes[0]; i; i = nextChild ){
        nextChild = i.nextSibling;
        var buttonId = i.id;
        if( !data[buttonId]){
            console.log("  removing button with id " + buttonId);
            otherClientDiv.removeChild(i);
        }
    }
}





function requestFullScreen() {
    var elem = document.getElementById('videos');
    elem.className = 'bigBox';
    if (elem.requestFullscreen) {
        elem.requestFullscreen();
    } else if (elem.mozRequestFullScreen) {
        elem.mozRequestFullScreen();
    } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen();
    }  
    var hideBox = document.getElementById('shrinkBox');
    hideBox.className = 'yesShrink'
    hideBox.onclick = function() {
        hideBox.className = 'noShrink';
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
        else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        }
        else if (document.webkitCancelFullScreen) {
            document.webkitCancelFullScreen();
        }
        elem.className = 'smallBox';
    }
    
}


easyRTC.setDataListener(function(peer, data){
    var otherClientDiv = document.getElementById('otherClients');
    var button = document.createElement('button');
    button.onclick = function(easyrtcid) {
        return function() {
            performCall(peer);
        }
    }(peer);
    button.id = "callbutton_" +peer;
    console.log("adding button for id =" + peer);
    var label = document.createTextNode("Get screen of " + easyRTC.idToName(peer));
    button.appendChild(label);
    otherClientDiv.appendChild(button);
});


function performCall(otherEasyrtcid) {
    easyRTC.hangupAll();
    var acceptedCB = function(accepted, caller) {
        if( !accepted ) {
            easyRTC.showError("CALL-REJECTED", "Sorry, your call to " + easyRTC.idToName(caller) + " was rejected");
            enable('otherClients');
        }
    }
    
    var successCB = function() {
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
    enable("disconnectButton");
    enable('otherClients');
    document.getElementById("iam").innerHTML = "Connected";
    selfEasyrtcid = easyRTCId;
}


function loginFailure(message) {
    easyRTC.showError("LOGIN-FAILURE", "failure to login");
}


function disconnect() {
    document.getElementById("iam").innerHTML = "logged out";
    easyRTC.disconnect();
    console.log("disconnecting from server");
    enable("connectButton");
    disable("disconnectButton");
}


easyRTC.setStreamAcceptor( function(caller, stream) {
    var video = document.getElementById('callerVideo');
    easyRTC.setVideoObjectSrc(video,stream);
    console.log("saw video from " + caller);
    enable("hangupButton");
});



easyRTC.setOnStreamClosed( function (caller) {
    easyRTC.setVideoObjectSrc(document.getElementById('callerVideo'), "");
    document.cancelFullScreen();
    disable("hangupButton");
});


var callerPending = null;

easyRTC.setCallCancelled( function(caller){
    if( caller == callerPending) {
        document.getElementById('acceptCallBox').style.display = "none";
        callerPending = false;
    }
});
