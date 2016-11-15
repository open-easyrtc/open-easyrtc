var selfEasyrtcid = "";


function connect() {
    easyrtc.setVideoDims(640,480);
    easyrtc.setRoomOccupantListener(convertListToButtons);
    easyrtc.easyApp("easyrtc.audioVideoSimple", "selfVideo", ["callerVideo"], loginSuccess, loginFailure);
    easyrtc.setOnCall( function(easyrtcid){
       DoStatsLoop(easyrtcid);
    });
 }


function DoStatsLoop(easyrtcid) {
    let status = easyrtc.getConnectStatus(easyrtcid);    
    if( status === easyrtc.NOT_CONNECTED ) {
        return;
    }
    if( status === easyrtc.IS_CONNECTED ) {
       easyrtc.getPeerStatistics(easyrtcid, 
           function(peerId, stats){
             document.getElementById("statsArea").innerHTML = 
                JSON.stringify(stats).replace(/,/g, "<br>").replace(/"/g, "");
           }, 
           easyrtc.standardStatsFilter); 
    }
    setTimeout( function() { DoStatsLoop(easyrtcid); } , 1000);
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
