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
easyRTC.enableDebug(true);


function addToConversation(who, msgType, content, targetting) {
    // Escape html special characters, then add linefeeds.
    content = content.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    content = content.replace(/\n/g, '<br />');
    var targettingStr = "";
    if (targetting) {
        if (targetting.targetEasyrtcid) {
            targettingStr += "user=" + targetting.targetEasyrtcid;
        }
        if (targetting.targetRoom) {
            targettingStr += " room=" + targetting.targetRoom;
        }
        if (targetting.targetGroup) {
            targettingStr += " group=" + targetting.targetGroup;
        }
    }
    document.getElementById('conversation').innerHTML +=
            "<b>" + who + " sent to " + targettingStr + ":</b>&nbsp;" + content + "<br />";
}

function addRoom(roomName) {
    if (!roomName) {
        roomName = document.getElementById("roomToAdd").value;
    }

    var roomButtonHolder = document.getElementById('rooms');
    var roomButton = document.createElement("input");
    var roomLabel = document.createElement("label");
    roomLabel.appendChild(document.createTextNode(roomName));
    roomButton.type = "checkbox";
    roomButton.id = "roombutton_" + roomName;
    roomButton.roomName = roomName;
    roomLabel.id = "roomlabel_" + roomName;
    roomLabel.htmlFor = roomButton.id;
    roomButtonHolder.appendChild(roomButton);
    roomButtonHolder.appendChild(roomLabel);
    easyRTC.joinRoom(roomName, null, function() {
        roomButtonHolder.removeChild(roomButton);
    });
}


function leaveRoom() {
    var roomName = document.getElementById("roomToAdd").value;
    var roomButtonHolder = document.getElementById('rooms');
    easyRTC.leaveRoom(roomName, null);
    var button = document.getElementById("roombutton_" + roomName);
    var label = document.getElementById("roomlabel_" + roomName);
    if (button) {
        roomButtonHolder.removeChild(button);
        roomButtonHolder.removeChild(label);
    }
}


function connect() {
    easyRTC.setPeerListener(addToConversation);
    easyRTC.setLoggedInListener(convertListToButtons);
    easyRTC.connect("easyrtc.instantMessaging", loginSuccess, loginFailure);
}


function convertListToButtons(roomName, data) {
    var otherClientDiv = document.getElementById('peers');

    /** get rid of any buttons for the same room */
    var traverseAgain = true;
    while (traverseAgain) {
        traverseAgain = false;
        var n = otherClientDiv.childNodes.length;
        for (var j = 0; j < n; j++) {
            var childnode = otherClientDiv.childNodes[j];
            if (childnode.roomName == roomName) {
                otherClientDiv.removeChild(childnode);
                traverseAgain = true;
                break;
            }
        }
    }
    while (otherClientDiv.hasChildNodes()) {
        otherClientDiv.removeChild(otherClientDiv.lastChild);
    }

    for (var i in data) {
        var button = document.createElement("input");
        button.type = "checkbox";
        button.easyrtcid = i;
        button.id = "button_" + roomName + "_" + i;
        button.roomName = roomName;
        var label = document.createTextNode(i + " in room " + roomName);
        label.id = "button_" + roomName + "_" + i;
        label.htmlFor = button.id;
        otherClientDiv.appendChild(button);
        otherClientDiv.appendChild(label);
    }
}

function getTargetId() {
    var otherClientDiv = document.getElementById('peers');
    var n = otherClientDiv.childNodes.length;

    for (var j = 0; j < n; j++) {
        var childnode = otherClientDiv.childNodes[j];
        if (childnode.checked) {
            return childnode.easyrtcid;
        }
    }
    return null;
}


function getRoomId() {
    var roomButtonHolder = document.getElementById('rooms');
    var n = roomButtonHolder.childNodes.length;
    for (var i = 0; i < n; i++) {
        var roomButton = roomButtonHolder.childNodes[i];
        if (roomButton.checked) {
            return roomButton.roomName;
        }
    }
    return null;
}


function getGroupId() {
    var id = document.getElementById('groupName').value;
    if (id) {
        id = id.trim();
    }
    if (id && id != "") {
        return id;
    }
    else {
        return null;
    }
}


function sendMessage(otherEasyrtcid) {
    var text = document.getElementById('sendMessageText').value;
    if (text.replace(/\s/g, "").length == 0) { // Don't send just whitespace
        return;
    }
    var dest;
    var destTargetId = getTargetId();
    var destRoom = getRoomId();
    var destGroup = getGroupId();
    if (destRoom || destGroup) {
        dest = {};
        if (destRoom) {
            dest.targetRoom = destRoom;
        }
        if (destGroup) {
            dest.targetGroup = destGroup;
        }
        if (destTargetId) {
            dest.targetEasyrtcid = destTargetId;
        }
    }
    else if (destTargetId) {
        dest = destTargetId;
    }
    else {
        easyRTC.showError("user error", "no destination selected");
        return;
    }

    easyRTC.sendDataWS(dest, "message", text);
    addToConversation("Me", "message", text);
    document.getElementById('sendMessageText').value = "";
}


function loginSuccess(easyRTCId) {
    selfEasyrtcid = easyRTCId;
    document.getElementById("iam").innerHTML = "I am " + easyRTCId;
    document.getElementById("connectButton").disabled = "disabled";
}


function loginFailure(message) {
    easyRTC.showError("LOGIN-FAILURE", message);
}