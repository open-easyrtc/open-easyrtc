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
var peerDivs = {};
var noCallersDiv;


function connect() {
    //easyRTC.enableDebug(true);
    noCallersDiv = document.createElement("div");
    noCallersDiv.innerHTML = "<em>Nobody else logged in yet</em>";
    var otherClientsDiv = document.getElementById('otherClients');
    otherClientsDiv.appendChild(noCallersDiv);
    
    easyRTC.enableDataChannels(true);
    easyRTC.enableVideo(false);
    easyRTC.enableAudio(false);
    easyRTC.setLoggedInListener(convertListToButtons);
    easyRTC.setAcceptChecker( function(easyrtcid, responsefn) {
        peerDivs[easyrtcid].className ="dragndrop connecting";
        responsefn(true);
    });
    easyRTC.setDataChannelOpenListener(function(easyrtcid) {
        peerDivs[easyrtcid].className ="dragndrop connected";
    });
    easyRTC.setDataChannelCloseListener(function(easyrtcid) {
        if( peerDivs[easyrtcid]) {
            peerDivs[easyrtcid].className ="dragndrop notconnected";
        }
    });
    var fileDescriptions = {};
    
    easyRTC.setDataListener(function(easyrtcid, data){
            fileobj = JSON.parse(data);
            saveFile(fileobj);
        console.log("received data from " + easyRTC.idToName(easyrtcid));
    });
    easyRTC.connect("fileShare", loginSuccess, loginFailure);
}

   
function showMessage(message) { 
    document.getElementById('conversation').appendChild(document.createTextNode(message));
}


function saveFile(fileobj) {
    //  saveAs(body, fileInfo.name);
    var conversation = document.getElementById('conversation'); 
    var div = document.createElement('div');
    div.innerHTML = "Received file " + fileobj.name + ". Click here to save it";
    div.className = "receivedFile";
    div.onclick = function() {
          var blob = new Blob([fileobj.binaryContents], {type:fileobj.type});
          saveAs(blob, fileobj.name);
//        var url = URL.createObjectURL(fileobj.dataurl);
//        window.open(fileobj.dataurl, '_blank', '');
//        conversation.removeChild(div);
//        setTimeout( function() { 
//            URL.revokeObjectURL(url);
//        }, 30000);
    };
    conversation.appendChild(div);   
}


function convertListToButtons (data) {
    var otherClientsDiv = document.getElementById('otherClients');
    for(var oldPeer in  peerDivs) {
        if( !data[oldPeer] ) {
            otherClientsDiv.removeChild(peerDivs[oldPeer]);
            delete peerDivs[oldPeer];
        } 
    }
    
    for(var i in data) {
        if( !peerDivs[i]) {
            var div = document.createElement("div");
            div.className = "dragndrop notConnected";
            div.innerHTML = "File drop area for <br>" + easyRTC.idToName(i);
            initDropSupport(div, i);
            otherClientsDiv.appendChild(div);    
            peerDivs[i] = div;
        }
    }
    noCallersDiv.style.display = (peerDivs == {})?"block":"none";
}


function initDropSupport(target, destUser) {
    var ignore = function(e) {
        e.stopPropagation();
        e.preventDefault();
        return false;
    }

    var drop = function(e) {
        e.stopPropagation();
        e.preventDefault();
        var dt = e.dataTransfer;
        var files = dt.files;
        if( dt.files.length >0) {
            sendFiles(target, destUser, files);
        }
        return false;
    }
    
    target.addEventListener("drop", drop, false);
    target.addEventListener("dragenter", ignore, false);
    target.addEventListener("dragover", ignore, false);
}

 
function sendFile( destUser, file) {
    var reader = new FileReader();

      // Closure to capture the file information.
      reader.onload = function(e) {
            var txData = {
                name: file.name,
                type: file.type,
                size: file.size, 
                binaryContents: e.target.result
            };
            //
            // can't send an object, only a primitive type
            //
            easyRTC.sendDataP2P(destUser, JSON.stringify(txData));
        };

      // Read in the image file as a data URL.
      reader.readAsBinaryString(file);

 }


 
function sendFiles(div, destUser, files) {
    var i;
    var fileSizeLIMIT = 30000; // approximate message size limit for firefox.
    
    switch( easyRTC.getConnectStatus(destUser)) {
        case easyRTC.IS_CONNECTED:
            for(i = 0; i < files.length; i++) {
           //     if( files[i].size > fileSizeLIMIT ) {
           //         showMessage('File ' + files[i].name +
           //             ' is too big too send (' + files[i].size + ' bytes)');
           //         continue;
           //     }
                sendFile(destUser, files[i]);
             }       
            break;
            
        case easyRTC.NOT_CONNECTED:
            div.className = "dragndrop connecting";
            easyRTC.call(destUser, 
                function(caller, media) { // success callback                    
                    div.className = "dragndrop connected";
                    sendFiles(div, caller, files);
                }, 
                function(errText) {
                    showMessage(errText);
                }, 
                function(wasAccepted) {}
                );
            break;
            
        case BECOMING_CONNECTED:
            showMessage("Wait for connection to finish before adding more files");
            break;
    }
}
      

function loginSuccess(easyRTCId) {
    selfEasyrtcid = easyRTCId;
    document.getElementById("iam").innerHTML = "I am " + easyRTCId;
}


function loginFailure(message) {
    easyRTC.showError("LOGIN-FAILURE", message);
}
