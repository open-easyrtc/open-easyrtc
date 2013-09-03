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
            "<b>" + who + " sent " + targettingStr + ":</b>&nbsp;" + content + "<br />";
}

function genRoomDivName(roomName) {
    return "roomblock_" + roomName;
}

function genRoomOccupantName(roomName) {
    return "roomOccupant_" + roomName;
}

function addRoom(roomName) {
    if (!roomName) {
        roomName = document.getElementById("roomToAdd").value;
    }

    var roomButtonHolder = document.getElementById('rooms');
    var roomdiv = document.createElement("div");
    roomdiv.id = genRoomDivName(roomName);
    roomdiv.className = "roomDiv"
    
    var roomButton = document.createElement("button");
    roomButton.onclick = function() {
        sendMessage(null, roomName);
    };
    var roomLabel = (document.createTextNode(roomName));
    roomButton.appendChild(roomLabel);
    roomdiv.appendChild(roomButton);
    roomButtonHolder.appendChild(roomdiv);
    var roomOccupants = document.createElement("div");
    roomOccupants.id = genRoomOccupantName(roomName);
    roomOccupants.className = "roomOccupants"
    roomdiv.appendChild(roomOccupants);
    $(roomdiv).append(" -<a href=\"javascript:\leaveRoom('" + roomName + "')\">leave</a>");

    easyRTC.joinRoom(roomName, null, function() {
        roomButtonHolder.removeChild(roomButton);
    });
}


function leaveRoom(roomName) {
    if (!roomName) {
        roomName = document.getElementById("roomToAdd").value;
    }
    var entry = document.getElementById(genRoomDivName(roomName));
    var roomButtonHolder = document.getElementById('rooms');
    easyRTC.leaveRoom(roomName, null);
    roomButtonHolder.removeChild(entry);
}


function connect() {
    easyRTC.setPeerListener(addToConversation);
    easyRTC.setLoggedInListener(convertListToButtons);
    easyRTC.connect("easyrtc.instantMessaging", loginSuccess, loginFailure);
}


function convertListToButtons(roomName, data) {
    var otherClientDiv = document.getElementById(genRoomOccupantName(roomName));

    $(otherClientDiv).empty();
    
    for (var i in data) {
        var button = document.createElement("button");
        button.onclick =(function(roomname, user) {
            return function() {
                sendMessage(user, roomName); 
            };
        })(roomName, i);
        
        var label = document.createTextNode(i );
        button.appendChild(label);
        otherClientDiv.appendChild(button);
    }
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


function sendMessage(destTargetId, destRoom) {
    var text = document.getElementById('sendMessageText').value;
    if (text.replace(/\s/g, "").length == 0) { // Don't send just whitespace
        return;
    }
    var dest;
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