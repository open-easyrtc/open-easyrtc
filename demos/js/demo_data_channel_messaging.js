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
var connectList = {};

function addToConversation(who, content) {
    // Escape html special characters, then add linefeeds.
    content = content.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    content = content.replace(/\n/g, '<br />');
    document.getElementById('conversation').innerHTML += 
    "<b>" + who + ":</b>&nbsp;" + content + "<br />";
}


function connect() {
    easyRTC.enableDebug(true);
    easyRTC.enableDataChannels(true);
    easyRTC.enableVideo(false);
    easyRTC.enableAudio(false);

    easyRTC.setDataListener(addToConversation);
    easyRTC.setLoggedInListener(loggedInListener);
    easyRTC.connect("data_channel_im", loginSuccess, loginFailure);
}


function loggedInListener (data) {
    connectList = data;
    convertListToButtons(connectList);
}


function convertListToButtons (connectList) {

    otherClientDiv = document.getElementById('otherClients');
    while (otherClientDiv.hasChildNodes()) {
        otherClientDiv.removeChild(otherClientDiv.lastChild);
    }
    
    var label, button;
    for(var i in connectList) {
        var rowGroup = document.createElement("span");
        var rowLabel = document.createTextNode(easyRTC.idToName(i));
        rowGroup.appendChild(rowLabel);

        button = document.createElement('button');
        button.onclick = function(easyrtcid) {        
            return function() {
                startCall(easyrtcid);
            }
        }(i);
        label = document.createTextNode("Connect");
        button.appendChild(label);
        rowGroup.appendChild(button);

        button = document.createElement('button');
        button.onclick = function(easyrtcid) {        
            return function() {
                sendStuffP2P(easyrtcid);
            }
        }(i);
        label = document.createTextNode("Send Message");
        button.appendChild(label);
        rowGroup.appendChild(button);

        otherClientDiv.appendChild(rowGroup);        
    }
    if( !otherClientDiv.hasChildNodes() ) {
        otherClientDiv.innerHTML = "<em>Nobody else logged in to talk to...</em>";
    }
}



function startCall(otherEasyrtcid) {
    if( easyRTC.getConnectStatus(otherEasyrtcid) == easyRTC.NOT_CONNECTED) {
        easyRTC.call(otherEasyrtcid, 
            function(caller, media) { // success callback
                if( media == 'datachannel') {
                    console.log("made call succesfully");
                    connectList[otherEasyrtcid] = true;
                }
            }, 
            function(errText) {
                connectList[otherEasyrtcid] = false;
                easyRTC.showError("CALL-FAILURE", errText);
            }, 
            function(wasAccepted) {
                console.log("was accepted=" + wasAccepted);
            }
            );
    }
    else {
        easyRTC.showError("ALREADY-CONNECTED", "already connected to " + easyRTC.idToName(otherEasyrtcid));
    }
}

function sendStuffP2P(otherEasyrtcid) {    
    var text = document.getElementById('sendMessageText').value;    
    if(text.replace(/\s/g, "").length == 0) { // Don't send just whitespace
        return;
    }
    if( easyRTC.getConnectStatus(otherEasyrtcid) == easyRTC.IS_CONNECTED) {
        easyRTC.sendDataP2P(otherEasyrtcid, text);                
    }
    else {
        easyRTC.showError("NOT-CONNECTED", "not connected to " + easyRTC.idToName(otherEasyrtcid) + " yet.");
    }
    addToConversation("Me", text);
    document.getElementById('sendMessageText').value = "";        
}
 
 
function loginSuccess(easyRTCId) {
    selfEasyrtcid = easyRTCId;
    document.getElementById("iam").innerHTML = "I am " + easyRTCId;
}


function loginFailure(message) {
    easyRTC.showError("LOGIN-FAILURE", "failure to login");
}
