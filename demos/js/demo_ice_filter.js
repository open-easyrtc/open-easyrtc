var selfEasyrtcid = "";

//
// filter ice candidates according to the ice candidates checkbox.
//
function iceCandidateFilter( iceCandidate, fromPeer) {
   var sdp = iceCandidate.candidate;
   if( sdp.indexOf("typ relay") > 0) { // is turn candidate
       if( document.getElementById("allowTurn").checked ) {
           return iceCandidate;
       }
       else {
           return null;
       }
   }
   else if( sdp.indexOf("typ srflx") > 0) { // is turn candidate
       if( document.getElementById("allowStun").checked ) {
           return iceCandidate;
       }
       else {
           return null;
       }
   }
   else if( sdp.indexOf("typ host") > 0) { // is turn candidate
       if( document.getElementById("allowLocal").checked ) {
           return iceCandidate;
       }
       else {
           return null;
       }
   }
   else {
      console.log("Unrecognized type of ice candidate, passing through: " + sdp);
   }
}

function connect() {
    easyrtc.setRoomOccupantListener(convertListToButtons);
    easyrtc.setIceCandidateFilter(iceCandidateFilter);
    easyrtc.easyApp("easyrtc.iceFilter", "selfVideo", ["callerVideo"], loginSuccess, loginFailure);
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
    easyrtc.setIceUsedInCalls( getModifiedIceList());
    var successCB = function() {};
    var failureCB = function() {};
    easyrtc.call(otherEasyrtcid, successCB, failureCB);
}





var iceMap = [];

function getModifiedIceList(){
   var iceList = [];
   var i;

   for( i = 0; i < iceMap.length; i++ ) {
      if( document.getElementById("iscb" + i).checked ) {
         iceList.push( iceMap[i]);
      }
   }
   return {iceServers: iceList};
}


function loginSuccess(easyrtcid) {
    var i;

    selfEasyrtcid = easyrtcid;
    document.getElementById("iam").innerHTML = "I am " + easyrtc.cleanId(easyrtcid);
    var blockentries = "<h3>Ice entries</h3>";
    var iceServers = easyrtc.getServerIce();
    for(i = 0; i < iceServers.iceServers.length; i++ ) {
	    iceMap[i] = iceServers.iceServers[i];
        var label = "iscb" + i;
        var url = iceServers.iceServers[i].url ||
                  iceServers.iceServers[i].urls || "no url";
	    blockentries += '<div style="width:100%;overflow:hidden;text-align:left"><input type="checkbox" id="' + label + '" + checked="checked" style="float:left /> <label for="' + label + '">' + url + '</label></div>';

    }
    document.getElementById("iceEntries").innerHTML = blockentries;

}


function loginFailure(errorCode, message) {
    easyrtc.showError(errorCode, message);
}
