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
var waitingForRoomList = true;
var isConnected = false;

function initApp() {
    document.getElementById("main").className = "notconnected";
}

function addToConversation(who, msgType, content, targeting) {
    // Escape html special characters, then add linefeeds.
    if( !content) {
        content = "**no body**";
    }
    content = content.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    content = content.replace(/\n/g, '<br />');
    var targetingStr = "";
    if (targeting) {
        if (targeting.targetEasyrtcid) {
            targetingStr += "user=" + targeting.targetEasyrtcid;
        }
        if (targeting.targetRoom) {
            targetingStr += " room=" + targeting.targetRoom;
        }
        if (targeting.targetGroup) {
            targetingStr += " group=" + targeting.targetGroup;
        }
    }
    document.getElementById('conversation').innerHTML +=
            "<b>" + who + " sent " + targetingStr + ":</b>&nbsp;" + content + "<br />";
}

function genRoomDivName(roomName) {
    return "roomblock_" + roomName;
}

function genRoomOccupantName(roomName) {
    return "roomOccupant_" + roomName;
}

function setCredential(event, value) {
    if (event.keyCode === 13) {
        easyrtc.setCredential(value);
    }
}


function addRoom(roomName, parmString, userAdded) {
    if (!roomName) {
        roomName = document.getElementById("roomToAdd").value;
        parmString = document.getElementById("optRoomParms").value;
    }
    var roomid = genRoomDivName(roomName);
    if (document.getElementById(roomid)) {
        return;
    }
    function addRoomButton() {

        var roomButtonHolder = document.getElementById('rooms');
        var roomdiv = document.createElement("div");
        roomdiv.id = roomid;
        roomdiv.className = "roomDiv";

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
        roomOccupants.className = "roomOccupants";
        roomdiv.appendChild(roomOccupants);
        $(roomdiv).append(" -<a href=\"javascript:\leaveRoom('" + roomName + "')\">leave</a>");
    }

    var roomParms = null;
    if (parmString && parmString !== "") {
        try {
            roomParms = JSON.parse(parmString);
        } catch (error) {
            roomParms = null;
            easyrtc.showError(easyrtc.errCodes.DEVELOPER_ERR, "Room Parameters must be an object containing key/value pairs. eg: {\"fruit\":\"banana\",\"color\":\"yellow\"}");
            return;
        }
    }
    if (!isConnected || !userAdded) {
        addRoomButton();
        console.log("adding gui for room " + roomName);
    }
    else {
        console.log("not adding gui for room " + roomName + " because already connected and it's a user action");
    }
    if (userAdded) {
        console.log("calling joinRoom(" + roomName + ") because it was a user action ");

        easyrtc.joinRoom(roomName, roomParms,
                function() {
                   /* we'll geta room entry event for the room we were actually added to */
                },
                function(errorCode, errorText, roomName) {
                    easyrtc.showError(errorCode, errorText + ": room name was(" + roomName + ")");
                });
    }
}


function leaveRoom(roomName) {
    if (!roomName) {
        roomName = document.getElementById("roomToAdd").value;
    }
    var entry = document.getElementById(genRoomDivName(roomName));
    var roomButtonHolder = document.getElementById('rooms');
    easyrtc.leaveRoom(roomName, null);
    roomButtonHolder.removeChild(entry);
}


function roomEntryListener(entered, roomName) {
    if (entered) { // entered a room
        console.log("saw add of room " + roomName);
        addRoom(roomName, null, false);
    }
    else {
        var roomNode = document.getElementById(genRoomDivName(roomName));
        if (roomNode) {
            document.getElementById('#rooms').removeChildNode(roomNode);
        }
    }
    refreshRoomList();
}


function refreshRoomList() {
    if( isConnected) {
        easyrtc.getRoomList(addQuickJoinButtons, null);
    }
}


function peerListener(who, msgType, content, targeting) {
    addToConversation(who, msgType, content, targeting);
}

function connect() {
    easyrtc.setPeerListener(peerListener);
    easyrtc.setRoomOccupantListener(occupantListener);
    easyrtc.setRoomEntryListener(roomEntryListener);
    easyrtc.setDisconnectListener(function() {
        jQuery('#rooms').empty();
        document.getElementById("main").className = "notconnected";
        console.log("disconnect listener fired");
    });
    updatePresence();
    var username = document.getElementById("userNameField").value;
    var password = document.getElementById("credentialField").value;
    if (username) {
        easyrtc.setUsername(username);
    }
    if (password) {
        easyrtc.setCredential({password: password});
    }
    easyrtc.connect("easyrtc.instantMessaging", loginSuccess, loginFailure);
}

function disconnect() {
    easyrtc.disconnect();
}

function addQuickJoinButtons(roomList) {
    var quickJoinBlock = document.getElementById("quickJoinBlock");
    var n = quickJoinBlock.childNodes.length;
    for (var i = n - 1; i >= 0; i--) {
        quickJoinBlock.removeChild(quickJoinBlock.childNodes[i]);
    }
    function addQuickJoinButton(roomname, numberClients) {
        var checkid = "roomblock_" + roomname;
        if (document.getElementById(checkid)) {
            return; // already present so don't add again
        }
        var id = "quickjoin_" + roomname;
        var div = document.createElement("div");
        div.id = id;
        div.className = "quickJoin";
        var parmsField = document.getElementById("optRoomParms");
        var button = document.createElement("button");
        button.onclick = function() {
            addRoom(roomname, parmsField.value, true);
            refreshRoomList();
        };
        button.appendChild(document.createTextNode("Join " + roomname + "(" + numberClients + ")"));
        div.appendChild(button);
        quickJoinBlock.appendChild(div);

    }
    if( !roomList.room1) {
        roomList.room1 = { numberClients:0};
    }
    if( !roomList.room2) {
        roomList.room2 = { numberClients:0};
    }
    if( !roomList.room3) {
        roomList.room3 = { numberClients:0};
    }
    for (var roomName in roomList) {
        addQuickJoinButton(roomName, roomList[roomName].numberClients);
    }
}



function occupantListener(roomName, occupants, isPrimary) {
    if (roomName === null) {
        return;
    }
    var roomId = genRoomOccupantName(roomName);
    var roomDiv = document.getElementById(roomId);
    if (!roomDiv) {
        addRoom(roomName, "", false);
        roomDiv = document.getElementById(roomId);
    }
    else {
        jQuery(roomDiv).empty();
    }
    for (var easyrtcid in occupants) {
        var button = document.createElement("button");
        button.onclick = (function(roomname, easyrtcid) {
            return function() {
                sendMessage(easyrtcid, roomName);
            };
        })(roomName, easyrtcid);
        var presenceText = "";
        if (occupants[easyrtcid].presence) {
            presenceText += "(";
            if (occupants[easyrtcid].presence.show) {
                presenceText += "show=" + occupants[easyrtcid].presence.show + " ";
            }
            if (occupants[easyrtcid].presence.status) {
                presenceText += "status=" + occupants[easyrtcid].presence.status;
            }
            presenceText += ")";
        }
        var label = document.createTextNode(easyrtc.idToName(easyrtcid) + presenceText);
        button.appendChild(label);
        roomDiv.appendChild(button);
    }
    refreshRoomList();
}



function getGroupId() {
        return null;
}


function sendMessage(destTargetId, destRoom) {
    var text = document.getElementById('sendMessageText').value;
    if (text.replace(/\s/g, "").length === 0) { // Don't send just whitespace
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
        easyrtc.showError("user error", "no destination selected");
        return;
    }

    if( text === "empty") {
         easyrtc.sendPeerMessage(dest, "message");
    }
    else {
    easyrtc.sendDataWS(dest, "message", text, function(reply) {
        if (reply.msgType === "error") {
            easyrtc.showError(reply.msgData.errorCode, reply.msgData.errorText);
        }
    });
    }
    addToConversation("Me", "message", text);
    document.getElementById('sendMessageText').value = "";
}


function loginSuccess(easyrtcid) {
    selfEasyrtcid = easyrtcid;
    document.getElementById("iam").innerHTML = "I am " + easyrtcid;
    refreshRoomList();
    isConnected = true;
    displayFields();
    document.getElementById("main").className = "connected";
}


function displayFields() {

    var outstr = "Application fields<div style='margin-left:1em'>";
    outstr += JSON.stringify(easyrtc.getApplicationFields());
    outstr += "</div><br>";

    outstr += "Session fields<div style='margin-left:1em'>";
    outstr += JSON.stringify(easyrtc.getSessionFields());
    outstr += "</div><br>";

    outstr += "Connection fields<div style='margin-left:1em'>";
    outstr += JSON.stringify(easyrtc.getConnectionFields());
    outstr += "</div><br>";

    var roomlist = easyrtc.getRoomsJoined();
    for (var roomname in roomlist) {
        var roomfields = easyrtc.getRoomFields(roomname);
        if (roomfields != null) {
            outstr += "Room " + roomname + " fields<div style='margin-left:1em'>";
            outstr += JSON.stringify(roomfields);
            outstr += "</div><br>";
        }
    }
    document.getElementById('fields').innerHTML = outstr;
}




function loginFailure(errorCode, message) {
    easyrtc.showError("LOGIN-FAILURE", message);
    document.getElementById('connectButton').disabled = false;
    jQuery('#rooms').empty();
}

var currentShowState = 'chat';
var currentShowText = '';

function setPresence(value) {
    currentShowState = value;
    updatePresence();
}

function updatePresenceStatus(value) {
    currentShowText = value;
    updatePresence();
}

function updatePresence()
{
    easyrtc.updatePresence(currentShowState, currentShowText);
}

function queryRoomNames() {
    var roomName = document.getElementById("queryRoom").value;
    if( !roomName ) {
        roomName = "default";
    }
    if( roomName ) {
        console.log("getRoomOccupantsAsArray("+ roomName + ")=" + JSON.stringify(easyrtc.getRoomOccupantsAsArray(roomName)));
        console.log("getRoomOccupantsAsMap(" + roomName + ")=" + JSON.stringify(easyrtc.getRoomOccupantsAsMap(roomName)));
    }
}
function addApiField() {
    var roomName = document.getElementById("apiroomname").value;
    var fieldname = document.getElementById("apifieldname").value;
    var fieldvaluetext = document.getElementById("apifieldvalue").value;
    var fieldvalue;
    if(fieldvaluetext.indexOf("{") >= 0) {
        fieldvalue = JSON.parse(fieldvaluetext);
    }
    else {
        fieldvalue = fieldvaluetext;
    }
    easyrtc.setRoomApiField(roomName, fieldname, fieldvalue);
}


function getIdsOfName() {
   var name = document.getElementById("targetName").value;
   var ids = easyrtc.usernameToIds(name);
   document.getElementById("foundIds").innerHTML = JSON.stringify(ids);
}
