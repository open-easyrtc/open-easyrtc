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



function initApp() {
    console.log("Initializing.");
    easyrtc.enableVideo(false);
    easyrtc.enableAudio(false);
    connect();
}

function connect() {
    easyrtc.connect("easyrtc.reconnect", loginSuccess, loginFailure);
}

function disconnect() {
    easyrtc.disconnect();
}

easyrtc.enableDebug(true);

easyrtc.setDisconnectListener(function() {
   easyrtc.showError("xx", "saw disconnect");
});


function sendDummy() {
    easyrtc.getRoomList( 
      function() { 
         easyrtc.showError("xx", "got fresh roomlist");
      }, 
      function(){ 
         easyrtc.showError("xx", "failed on fresh roomlist");
      });
}

function loginSuccess(easyrtcid) {
    document.getElementById("stateLabel").innerHTML = " connected as " + easyrtcid;
    easyrtc.showError("xx", "login success");
}


function loginFailure(errorCode, message) {
    document.getElementById("stateLabel").innerHTML = "disconnected";
    easyrtc.showError("xx", "login failure");
}


