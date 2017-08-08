var selfEasyrtcid = "";


function connect() {
    easyrtc.setRoomOccupantListener(convertListToButtons);
    easyrtc.easyApp("easyrtc.lowbandwidth", "selfVideo", ["callerVideo"], loginSuccess, loginFailure);
}


function triggerIceRestart() {
   var caller = easyrtc.getIthCaller(0);
   if( caller ) {
      easyrtc.renegotiate(caller);
   }
}


function useLowBandwidth(){
    var localFilter = easyrtc.buildLocalSdpFilter( {
        audioRecvBitrate:20, videoRecvBitrate:30
    });
    var remoteFilter = easyrtc.buildRemoteSdpFilter({
        audioSendBitrate: 20, videoSendBitrate:30
    });
    easyrtc.setSdpFilters(localFilter, remoteFilter);
    triggerIceRestart();
}


function useHighBandwidth() {
    var localFilter = easyrtc.buildLocalSdpFilter( {
        audioRecvBitrate:50, videoRecvBitrate:500
    });
    var remoteFilter = easyrtc.buildRemoteSdpFilter({
        audioSendBitrate: 50, videoSendBitrate:500
    });
    easyrtc.setSdpFilters(localFilter, remoteFilter);
    triggerIceRestart();
}


function clearConnectList() {
    var otherClientDiv = document.getElementById('otherClients');
    while (otherClientDiv.hasChildNodes()) {
        otherClientDiv.removeChild(otherClientDiv.lastChild);
    }
}


function convertListToButtons (roomName, data, isPrimary) {
    clearConnectList();
    var otherClientDiv = document.getElementById('otherClients');
    for(var easyrtcid in data) {
        var button = document.createElement('button');
        button.onclick = function(easyrtcid) {
            return function() {
                performCall(easyrtcid);
            };
        }(easyrtcid);

        var label = document.createTextNode(easyrtc.idToName(easyrtcid));
        button.appendChild(label);
        otherClientDiv.appendChild(button);
    }
}


function performCall(otherEasyrtcid) {
    easyrtc.hangupAll();

    var successCB = function() {};
    var failureCB = function() {};
    easyrtc.call(otherEasyrtcid, successCB, failureCB);
}


function loginSuccess(easyrtcid) {
    selfEasyrtcid = easyrtcid;
    document.getElementById("iam").innerHTML = "I am " + easyrtc.cleanId(easyrtcid);
}


function loginFailure(errorCode, message) {
    easyrtc.showError(errorCode, message);
}
