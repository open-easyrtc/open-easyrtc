//
// the below code is a copy of the standard polyfill adapter.js
//
var getUserMedia = null;
var attachMediaStream = null;
var reattachMediaStream = null;
var webrtcDetectedBrowser = null;
var webrtcDetectedVersion = null;
if (navigator.mozGetUserMedia) {
// console.log("This appears to be Firefox");

    webrtcDetectedBrowser = "firefox";
    webrtcDetectedVersion =
            parseInt(navigator.userAgent.match(/Firefox\/([0-9]+)\./)[1]);

    //
    // better version detection for gecko based browsers provided by
    // KÃ©vin Poulet.
    //
    var matches = navigator.userAgent.match(/\srv:([0-9]+)\./);
    if (matches !== null && matches.length > 1) {
        webrtcDetectedVersion = parseInt(matches[1]);
    }

    // The RTCPeerConnection object.
    window.RTCPeerConnection = mozRTCPeerConnection;
    // The RTCSessionDescription object.
    window.RTCSessionDescription = mozRTCSessionDescription;
    // The RTCIceCandidate object.
    window.RTCIceCandidate = mozRTCIceCandidate;
    // Get UserMedia (only difference is the prefix).
    // Code from Adam Barth.
    window.getUserMedia = navigator.mozGetUserMedia.bind(navigator);
    // Creates iceServer from the url for FF.
    window.createIceServer = function(url, username, password) {
        var iceServer = null;
        var url_parts = url.split(':');
        var turn_url_parts;
        if (url_parts[0].indexOf('stun') === 0) {
// Create iceServer with stun url.
            iceServer = {'url': url};
        } else if (url_parts[0].indexOf('turn') === 0 &&
                (url.indexOf('transport=udp') !== -1 ||
                        url.indexOf('?transport') === -1)) {
// Create iceServer with turn url.
// Ignore the transport parameter from TURN url.
            turn_url_parts = url.split("?");
            iceServer = {'url': turn_url_parts[0],
                'credential': password,
                'username': username};
        }
        return iceServer;
    };
    // Attach a media stream to an element.
    attachMediaStream = function(element, stream) {
//        console.log("Attaching media stream");
        element.mozSrcObject = stream;
        element.play();
    };
    reattachMediaStream = function(to, from) {
//        console.log("Reattaching media stream");
        to.mozSrcObject = from.mozSrcObject;
        to.play();
    };
    if (webrtcDetectedVersion < 23) {
// Fake get{Video,Audio}Tracks
        MediaStream.prototype.getVideoTracks = function() {
            return [];
        };
        MediaStream.prototype.getAudioTracks = function() {
            return [];
        };
    }
} else if (navigator.webkitGetUserMedia) {
//    console.log("This appears to be Chrome");

    webrtcDetectedBrowser = "chrome";
    webrtcDetectedVersion =
            parseInt(navigator.userAgent.match(/Chrom(e|ium)\/([0-9]+)\./)[2]);
    // Creates iceServer from the url for Chrome.
    window.createIceServer = function(url, username, password) {
        var iceServer = null;
        var url_turn_parts;
        var url_parts = url.split(':');
        if (url_parts[0].indexOf('stun') === 0) {
// Create iceServer with stun url.
            iceServer = {'url': url};
        } else if (url_parts[0].indexOf('turn') === 0) {
            if (webrtcDetectedVersion < 28) {
// For pre-M28 chrome versions use old TURN format.
                url_turn_parts = url.split("turn:");
                iceServer = {'url': 'turn:' + username + '@' + url_turn_parts[1],
                    'credential': password};
            } else {
// For Chrome M28 & above use new TURN format.
                iceServer = {'url': url,
                    'credential': password,
                    'username': username};
            }
        }
        return iceServer;
    };
    // The RTCPeerConnection object.
    window.RTCPeerConnection = webkitRTCPeerConnection;
    // Get UserMedia (only difference is the prefix).
    // Code from Adam Barth.
    window.getUserMedia = navigator.webkitGetUserMedia.bind(navigator);
    // Attach a media stream to an element.
    attachMediaStream = function(element, stream) {
        if (typeof element.srcObject !== 'undefined') {
            element.srcObject = stream;
        } else if (typeof element.mozSrcObject !== 'undefined') {
            element.mozSrcObject = stream;
        } else if (typeof element.src !== 'undefined') {
            element.src = URL.createObjectURL(stream);
        } else {
            console.log('Error attaching stream to element.');
        }
    };
    reattachMediaStream = function(to, from) {
        to.src = from.src;
    };
    // The representation of tracks in a stream is changed in M26.
    // Unify them for earlier Chrome versions in the coexisting period.
    if (!webkitMediaStream.prototype.getVideoTracks) {
        webkitMediaStream.prototype.getVideoTracks = function() {
            return this.videoTracks;
        };
        webkitMediaStream.prototype.getAudioTracks = function() {
            return this.audioTracks;
        };
    }

// New syntax of getXXXStreams method in M26.
    if (!webkitRTCPeerConnection.prototype.getLocalStreams) {
        webkitRTCPeerConnection.prototype.getLocalStreams = function() {
            return this.localStreams;
        };
        webkitRTCPeerConnection.prototype.getRemoteStreams = function() {
            return this.remoteStreams;
        };
    }
} else {
    console.log("Browser does not appear to be WebRTC-capable");
}

if (!window.createIceServer) {
    window.createIceServer = function(url, username, credential) {
        return {'url': url, 'credential': credential, 'username': username};
    };
}