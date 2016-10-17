//
//Copyright (c) 2016, Skedans Systems, Inc.
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
    console.log("about to try disabling " + domId);
    document.getElementById(domId).disabled = "disabled";
}


function enable(domId) {
    console.log("about to try enabling " + domId);
    document.getElementById(domId).disabled = "";
}


function createLabelledButton(buttonLabel) {
    var button = document.createElement("button");
    button.appendChild(document.createTextNode(buttonLabel));
    document.getElementById("videoSrcBlk").appendChild(button);
    return button;
}


function addMediaStreamToDiv(divId, stream, streamName, isLocal)
{
    var container = document.createElement("div");
    container.style.marginBottom = "10px";
    var formattedName = streamName.replace("(", "<br>").replace(")", "");
    var labelBlock = document.createElement("div");
    labelBlock.style.width = "220px";
    labelBlock.style.cssFloat = "left";
    labelBlock.innerHTML = "<pre>" + formattedName + "</pre><br>";
    container.appendChild(labelBlock);
    var video = document.createElement("video");
    video.width = 320;
    video.height = 240;
    video.muted = isLocal;
    video.style.verticalAlign = "middle";
    container.appendChild(video);
    document.getElementById(divId).appendChild(container);
    video.autoplay = true;
    easyrtc.setVideoObjectSrc(video, stream);
    return labelBlock;
}



function createLocalVideo(stream, streamName) {
    var labelBlock = addMediaStreamToDiv("localVideos", stream, streamName, true);
    var closeButton = createLabelledButton("close");
    closeButton.onclick = function() {
        easyrtc.closeLocalStream(streamName);
        labelBlock.parentNode.parentNode.removeChild(labelBlock.parentNode);
    }
    labelBlock.appendChild(closeButton);
}

function addSrcButton(buttonLabel, videoId) {
    var button = createLabelledButton(buttonLabel);
    button.onclick = function() {
        easyrtc.setVideoSource(videoId);
        easyrtc.initMediaSource(
                function(stream) {
                    createLocalVideo(stream, buttonLabel);
                    if (otherEasyrtcid) {
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
    easyrtc.connect("easyrtc.multistream", loginSuccess, loginFailure);
    easyrtc.setAutoInitUserMedia(false);

    easyrtc.getVideoSourceList(function(videoSrcList) {
        for (var i = 0; i < videoSrcList.length; i++) {
            var videoEle = videoSrcList[i];
            var videoLabel = (videoSrcList[i].label && videoSrcList[i].label.length > 0) ?
                    (videoSrcList[i].label) : ("src_" + i);
            addSrcButton(videoLabel, videoSrcList[i].deviceId);
        }
    });
    //
    // add an extra button for screen sharing
    //
    var screenShareButton = createLabelledButton("Desktop capture/share");
    var numScreens = 0;

    screenShareButton.onclick = function() {
        numScreens++;
        var streamName = "screen" + numScreens;
        easyrtc.initDesktopStream(
                function(stream) {
                    createLocalVideo(stream, streamName);
                    if (otherEasyrtcid) {
                        easyrtc.addStreamToCall(otherEasyrtcid, streamName);
                    }
                },
                function(errCode, errText) {
                    easyrtc.showError(errCode, errText);
                },
                streamName);
    };

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


function performCall(targetEasyrtcId) {
    var acceptedCB = function(accepted, easyrtcid) {
        if (!accepted) {
            easyrtc.showError("CALL-REJECTED", "Sorry, your call to " + easyrtc.idToName(easyrtcid) + " was rejected");
            enable('otherClients');
        }
        else {
            otherEasyrtcid = targetEasyrtcId;
        }
    };

    var successCB = function() {
        enable('hangupButton');
    };
    var failureCB = function() {
        enable('otherClients');
    };
    var keys = easyrtc.getLocalMediaIds();

    easyrtc.call(targetEasyrtcId, successCB, failureCB, acceptedCB, keys);
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

easyrtc.setStreamAcceptor(function(easyrtcid, stream, streamName) {
    var labelBlock = addMediaStreamToDiv("remoteVideos", stream, streamName, false);
    labelBlock.parentNode.id = "remoteBlock" + easyrtcid + streamName;

    console.log("accepted incoming stream with name " + stream.streamName);
    console.log("checking incoming " + easyrtc.getNameOfRemoteStream(easyrtcid, stream));

});



easyrtc.setOnStreamClosed(function(easyrtcid, stream, streamName) {
    var item = document.getElementById("remoteBlock" + easyrtcid + streamName);
    item.parentNode.removeChild(item);
});


var callerPending = null;

easyrtc.setCallCancelled(function(easyrtcid) {
    if (easyrtcid === callerPending) {
        document.getElementById('acceptCallBox').style.display = "none";
        callerPending = false;
    }
});

easyrtc.setAcceptChecker(function(easyrtcid, callback) {
    otherEasyrtcid = easyrtcid;
    if (easyrtc.getConnectionCount() > 0) {
        easyrtc.hangupAll();
    }
    callback(true, easyrtc.getLocalMediaIds());
});

var mypluginId = "tawk-desktop-capture/bemabaogbdfpbkkganibcmhbgjogabfj";

setTimeout(
     function() {
         document.getElementById("pluginstatus").innerHTML = easyrtc.isDesktopCaptureInstalled()
             ?"Desktop capture ready"
             :"Desktop capture not installed";
     }, 3000);

document.getElementById("installPluginButton").onclick = function() {
chrome.webstore.install();
};
