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
var peers = {};

function buildPeerBlockName(easyrtcid) {
    return "peerzone_" + easyrtcid;
}

function buildDragNDropName(easyrtcid) {
    return "dragndrop_" + easyrtcid;
}

function buildReceiveAreaName(easyrtcid) {
    return "receivearea_" + easyrtcid;
}


function connect() {
    var otherClientsDiv = document.getElementById('otherClients');

    easyrtc.enableDataChannels(true);
    easyrtc.enableVideo(false);
    easyrtc.enableAudio(false);
    easyrtc.setRoomOccupantListener(convertListToButtons);

    easyrtc.setAcceptChecker(function(easyrtcid, responsefn) {
        responsefn(true);
        document.getElementById("connectbutton_" + easyrtcid).style.visibility = "hidden";
    });

    easyrtc.setDataChannelOpenListener(function(easyrtcid, usesPeer) {
        var obj = document.getElementById(buildDragNDropName(easyrtcid));
        if (!obj) {
            console.log("no such object ");
        }
        jQuery(obj).addClass("connected");
        jQuery(obj).removeClass("notConnected");
    });

    easyrtc.setDataChannelCloseListener(function(easyrtcid) {
        jQuery(buildDragNDropName(easyrtcid)).addClass("notConnected");
        jQuery(buildDragNDropName(easyrtcid)).removeClass("connected");
    });

    easyrtc.connect("easyrtc.dataFileTransfer", loginSuccess, loginFailure);
}


function removeIfPresent(parent, childname) {
    var item = document.getElementById(childname);
    if (item) {
        parent.removeChild(item);
    }
    else {
        console.log("didn't see item " + childname + " for delete eh");
    }
}



function convertListToButtons(roomName, occupants, isPrimary) {
    var peerZone = document.getElementById('peerZone');
    for (var oldPeer in  peers) {
        if (!occupants[oldPeer]) {
            removeIfPresent(peerZone, buildPeerBlockName(oldPeer));
            delete peers[oldPeer];
        }
    }


    function buildDropDiv(easyrtcid) {
        var statusDiv = document.createElement("div");
        statusDiv.className = "dragndropStatus";

        var fileInput = document.createElement("input");
        fileInput.className = "fileInput";
        fileInput.type = "file";

        var dropArea = document.createElement("div");
        var connectButton = document.createElement("button");
        connectButton.appendChild(document.createTextNode("Connect"));
        connectButton.className = "connectButton";
        connectButton.id = "connectbutton_" + easyrtcid;
        connectButton.onclick = function() {
            statusDiv.innerHTML = "Waiting for connection to be established";
            easyrtc.call(easyrtcid,
                    function(caller, mediatype) {
                        statusDiv.innerHTML = "Connection established";
                        dropArea.className = "dragndrop connected";
                        connectButton.style.visibility = "hidden";
                    },
                    function(errorCode, errorText) {
                        dropArea.className = "dragndrop connected";
                        statusDiv.innerHTML = "Connection failed";
                        connectButton.style.visibility = "hidden";
                        noDCs[easyrtcid] = true;
                    },
                    function wasAccepted(yup) {
                    }
            );
        }

        dropArea.id = buildDragNDropName(easyrtcid);
        dropArea.className = "dragndrop notConnected";
        var dropAreaBox = document.createElement("p");
        dropAreaBox.innerHTML = "Drop or choose file";
        dropArea.appendChild(dropAreaBox);
        dropArea.appendChild(fileInput);


        function updateStatusDiv(state) {
            switch (state.status) {
                case "waiting":
                    statusDiv.innerHTML = "waiting for other party<br\>to accept transmission";
                    break;
                case "started_file":
                    statusDiv.innerHTML = "started file: " + state.name;
                    break;
                case "working":
                    statusDiv.innerHTML = state.name + ":" + state.position + "/" + state.size + "(" + state.numFiles + " files)";
                    break;
                case "rejected":
                    statusDiv.innerHTML = "cancelled";
                    setTimeout(function() {
                        statusDiv.innerHTML = "";
                    }, 2000);
                    break;
                case "done":
                    statusDiv.innerHTML = "done";
                    setTimeout(function() {
                        statusDiv.innerHTML = "";
                    }, 3000);
                    break;
            }
            return true;
        }


        var noDCs = {}; // which users don't support data channels

        var fileSender = null;
        function filesHandler(files) {
            // if we haven't eastablished a connection to the other party yet, do so now,
            // and on completion, send the files. Otherwise send the files now.
            var timer = null;
            if (easyrtc.getConnectStatus(easyrtcid) === easyrtc.NOT_CONNECTED && noDCs[easyrtcid] === undefined) {
                //
                // calls between firefrox and chrome ( version 30) have problems one way if you
                // use data channels.
                //

            }
            else if (easyrtc.getConnectStatus(easyrtcid) === easyrtc.IS_CONNECTED || noDCs[easyrtcid]) {
                if (!fileSender) {
                    fileSender = easyrtc_ft.buildFileSender(easyrtcid, updateStatusDiv);
                }
                fileSender(files, true /* assume binary */);
            }
            else {
                easyrtc.showError("user-error", "Wait for the connection to complete before adding more files!");
            }
        }
        easyrtc_ft.buildDragNDropRegion(dropArea, filesHandler);
        fileInput.addEventListener('change', function () {
            filesHandler(fileInput.files);
        });

        var container = document.createElement("div");
        container.appendChild(connectButton);
        container.appendChild(dropArea);
        container.appendChild(statusDiv);
        return container;
    }


    function buildReceiveDiv(i) {
        var div = document.createElement("div");
        div.id = buildReceiveAreaName(i);
        div.className = "receiveBlock";
        div.style.display = "none";
        return div;
    }


    for (var easyrtcid in occupants) {
        if (!peers[easyrtcid]) {
            var peerBlock = document.createElement("div");
            peerBlock.id = buildPeerBlockName(easyrtcid);
            peerBlock.className = "peerblock";
            peerBlock.appendChild(document.createTextNode(" For peer " + easyrtcid));
            peerBlock.appendChild(document.createElement("br"));
            peerBlock.appendChild(buildDropDiv(easyrtcid));
            peerBlock.appendChild(buildReceiveDiv(easyrtcid));
            peerZone.appendChild(peerBlock);
            peers[easyrtcid] = true;
        }
    }
}



function acceptRejectCB(otherGuy, fileNameList, wasAccepted) {

    var receiveBlock = document.getElementById(buildReceiveAreaName(otherGuy));
    jQuery(receiveBlock).empty();
    receiveBlock.style.display = "inline-block";

    //
    // list the files being offered
    //
    receiveBlock.appendChild(document.createTextNode("Files offered"));
    receiveBlock.appendChild(document.createElement("br"));
    for (var i = 0; i < fileNameList.length; i++) {
        receiveBlock.appendChild(
                document.createTextNode("  " + fileNameList[i].name + "(" + fileNameList[i].size + " bytes)"));
        receiveBlock.appendChild(document.createElement("br"));
    }
    //
    // provide accept/reject buttons
    //
    var button = document.createElement("button");
    button.appendChild(document.createTextNode("Accept"));
    button.onclick = function() {
        jQuery(receiveBlock).empty();
        wasAccepted(true);
    };
    receiveBlock.appendChild(button);

    button = document.createElement("button");
    button.appendChild(document.createTextNode("Reject"));
    button.onclick = function() {
        wasAccepted(false);
        receiveBlock.style.display = "none";
    };
    receiveBlock.appendChild(button);
}


function receiveStatusCB(otherGuy, msg) {
    var receiveBlock = document.getElementById(buildReceiveAreaName(otherGuy));
    if( !receiveBlock) return;

    switch (msg.status) {
        case "started":
            break;
        case "eof":
            receiveBlock.innerHTML = "Finished file";
            break;
        case "done":
            receiveBlock.innerHTML = "Stopped because " +msg.reason;
            setTimeout(function() {
                receiveBlock.style.display = "none";
            }, 1000);
            break;
        case "started_file":
            receiveBlock.innerHTML = "Beginning receive of " + msg.name;
            break;
        case "progress":
            receiveBlock.innerHTML = msg.name + " " + msg.received + "/" + msg.size;
            break;
        default:
            console.log("strange file receive cb message = ", JSON.stringify(msg));
    }
    return true;
}

function blobAcceptor(otherGuy, blob, filename) {
    easyrtc_ft.saveAs(blob, filename);
}

function loginSuccess(easyrtcid) {
    selfEasyrtcid = easyrtcid;
    document.getElementById("iam").innerHTML = "I am " + easyrtcid;
    easyrtc_ft.buildFileReceiver(acceptRejectCB, blobAcceptor, receiveStatusCB);
}


function loginFailure(errorCode, message) {
    easyrtc.showError(errorCode, message);
}
