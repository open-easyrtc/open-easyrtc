//
//Copyright (c) 2014, Priologic Software Inc.
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
var otherEasyrtcid = null;


function disable(domId) {
    console.log("about to try disabling "  +domId);
    document.getElementById(domId).disabled = "disabled";
}


function enable(domId) {
    console.log("about to try enabling "  +domId);
    document.getElementById(domId).disabled = "";
}


function createLabelledButton(buttonLabel) {
    var button = document.createElement("button");
    button.appendChild(document.createTextNode(buttonLabel));
    document.getElementById("videoSrcBlk").appendChild(button);
    return button;
}

function createLocalVideo(stream) {
    var video = document.createElement("video");
    document.getElementById("localVideos").appendChild(video);
    video.autoplay = true;
    video.muted = true;
    easyrtc.setVideoObjectSrc(video, stream);
}

function addSrcButton(buttonLabel, videoId) {
    var button = createLabelledButton(buttonLabel);
    button.onclick = function() {
        easyrtc.setVideoSource(videoId);
        easyrtc.initMediaSource(
                function(stream) {
                    createLocalVideo(stream);
                    if( otherEasyrtcid) {
                        easyrtc.addStreamToCall(otherEasyrtcid, buttonLabel);
                    }
                },
                function(errCode, errText) {
                    easyrtc.showError(errCode, errText);
                }, buttonLabel);
    };
}

function connect() {
    console.log("Initializing.");
    easyrtc.setRoomOccupantListener(convertListToButtons);
    easyrtc.connect("easyrtc.audioVideo", loginSuccess, loginFailure);
    easyrtc.getVideoSourceList(function(videoSrcList) {
        for (var i = 0; i < videoSrcList.length; i++) {
            addSrcButton("video src_" + i, videoSrcList[i].id);
        }
        //
        // add an extra button for screen sharing
        //
        var screenShareButton = createLabelledButton("Screen capture/share");
        screenShareButton.onclick = function() {
            easyrtc.setScreenCapture(true);
            easyrtc.initMediaSource(
                    function(stream) {
                        createLocalVideo(stream);
                        if( otherEasyrtcid) {
                            easyrtc.addStreamToCall(otherEasyrtcid, "screen");
                        }
                    },
                    function(errCode, errText) {
                        easyrtc.showError(errCode, errText);
                    }, "screen");
        };
        if (location.protocol !== "https:") {
            screenShareButton.disabled = true;
        }
    });
}


function hangup() {
    easyrtc.hangupAll();
    disable('hangupButton');
}


function clearConnectList() {
    var otherClientDiv = document.getElementById('otherClients');
    while (otherClientDiv.hasChildNodes()) {
        otherClientDiv.removeChild(otherClientDiv.lastChild);
    }
}


function convertListToButtons(roomName, occupants, isPrimary) {
    clearConnectList();
    var otherClientDiv = document.getElementById('otherClients');
    for (var easyrtcid in occupants) {
        var button = document.createElement('button');
        button.onclick = function(easyrtcid) {
            return function() {
                performCall(easyrtcid);
            };
        }(easyrtcid);

        var label = document.createTextNode("Call " + easyrtc.idToName(easyrtcid));
        button.appendChild(label);
        otherClientDiv.appendChild(button);
    }
}


function performCall(otherEasyrtcid) {
    easyrtc.hangupAll();
    var acceptedCB = function(accepted, easyrtcid) {
        if (!accepted) {
            easyrtc.showError("CALL-REJECTED", "Sorry, your call to " + easyrtc.idToName(easyrtcid) + " was rejected");
            enable('otherClients');
        }
    };

    var successCB = function() {
        otherEasyrtcid = easyrtcid;
        enable('hangupButton');
    };
    var failureCB = function() {
        enable('otherClients');
    };
    var keys = easyrtc.getLocalMediaIds();

    easyrtc.call(otherEasyrtcid, successCB, failureCB, acceptedCB, keys);
    enable('hangupButton');
}


function loginSuccess(easyrtcid) {
    disable("connectButton");
    //  enable("disconnectButton");
    enable('otherClients');
    selfEasyrtcid = easyrtcid;
    document.getElementById("iam").innerHTML = "I am " + easyrtc.cleanId(easyrtcid);
}


function loginFailure(errorCode, message) {
    easyrtc.showError(errorCode, message);
}


function disconnect() {
    document.getElementById("iam").innerHTML = "logged out";
    easyrtc.disconnect();
    enable("connectButton");
//    disable("disconnectButton");
    clearConnectList();
    easyrtc.setVideoObjectSrc(document.getElementById('selfVideo'), "");
}


easyrtc.setStreamAcceptor(function(easyrtcid, stream) {
    var video = document.createElement("video");
    document.getElementById("remoteVideos").appendChild(video);
    video.autoplay = true;
    video.muted = true;
    easyrtc.setVideoSource(video, stream);

    console.log("saw video from " + easyrtcid);
    enable("hangupButton");
});



easyrtc.setOnStreamClosed(function(easyrtcid) {
    disable("hangupButton");
});


var callerPending = null;

easyrtc.setCallCancelled(function(easyrtcid) {
    if (easyrtcid === callerPending) {
        document.getElementById('acceptCallBox').style.display = "none";
        callerPending = false;
    }
});


easyrtc.setAcceptChecker(function(easyrtcid, callback) {
    document.getElementById('acceptCallBox').style.display = "block";
    callerPending = easyrtcid;
    if (easyrtc.getConnectionCount() > 0) {
        document.getElementById('acceptCallLabel').innerHTML = "Drop current call and accept new from " + easyrtc.idToName(easyrtcid) + " ?";
    }
    else {
        document.getElementById('acceptCallLabel').innerHTML = "Accept incoming call from " + easyrtc.idToName(easyrtcid) + " ?";
    }
    var acceptTheCall = function(wasAccepted) {
        document.getElementById('acceptCallBox').style.display = "none";
        if (wasAccepted && easyrtc.getConnectionCount() > 0) {
            easyrtc.hangupAll();
        }
        callback(wasAccepted);
        callerPending = null;
    };
    document.getElementById("callAcceptButton").onclick = function() {
        acceptTheCall(true);
        otherEasyrtcid = easyrtcid;
    };
    document.getElementById("callRejectButton").onclick = function() {
        acceptTheCall(false);
    };
});