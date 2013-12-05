var selfEasyrtcid = "";


function connect() {
    easyrtc.setRoomOccupantListener(convertListToButtons);

    easyrtc.easyApp("easyrtc.audioVideo", "selfVideo", ["callerVideo"], loginSuccess, loginFailure);
 }


function clearConnectList() {
    otherClientDiv = document.getElementById('otherClients');
    while (otherClientDiv.hasChildNodes()) {
        otherClientDiv.removeChild(otherClientDiv.lastChild);
    }
}


function convertListToButtons (roomName, data, isPrimary) {
    clearConnectList();
    otherClientDiv = document.getElementById('otherClients');
    for(var i in data) {
        var button = document.createElement('button');
        button.onclick = function(easyrtcid) {
            return function() {
                performCall(easyrtcid);
            };
        }(i);

        label = document.createTextNode(easyrtc.idToName(i));
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


function loginSuccess(easyrtcId) {
    selfEasyrtcid = easyrtcId;
    document.getElementById("iam").innerHTML = "I am " + easyrtc.cleanId(easyrtcId);
}


function loginFailure(errorCode, message) {
    easyrtc.showError(errorCode, message);
}
