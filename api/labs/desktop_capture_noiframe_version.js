//
// This code was taken from: https://github.com/muaz-khan/WebRTC-Experiment/tree/master/Pluginfree-Screen-Sharing 
// and modified to fit with EasyRTC.
//

// todo: need to check exact chrome browser because opera/node-webkit also uses chromium framework
var isChrome = !!navigator.webkitGetUserMedia;

// DetectRTC.js - github.com/muaz-khan/WebRTC-Experiment/tree/master/DetectRTC
// Below code is taken from RTCMultiConnection-v1.8.js (http://www.rtcmulticonnection.org/changes-log/#v1.8)
var DetectRTC = {};

(function() {
    var screenCallback;

    DetectRTC.screen = {
        chromeMediaSource: 'screen',
        getSourceId: function(callback) {
            if (!callback)
                throw '"callback" parameter is mandatory.';
            screenCallback = callback;
            window.postMessage('get-sourceId', '*');
        },
        isChromeExtensionAvailable: function(callback) {
            if (!callback)
                return;

            if (DetectRTC.screen.chromeMediaSource == 'desktop')
                callback(true);

            // ask extension if it is available
            window.postMessage('are-you-there', '*');

            setTimeout(function() {
                if (DetectRTC.screen.chromeMediaSource == 'screen') {
                    callback(false);
                } else
                    callback(true);
            }, 2000);
        },
        onMessageCallback: function(data) {
            console.log('chrome message', data);

            // "cancel" button is clicked
            if (data == 'PermissionDeniedError') {
                DetectRTC.screen.chromeMediaSource = 'PermissionDeniedError';
                if (screenCallback)
                    return screenCallback('PermissionDeniedError');
                else
                    throw new Error('PermissionDeniedError');
            }

            // extension notified his presence
            if (data == 'rtcmulticonnection-extension-loaded') {
                DetectRTC.screen.chromeMediaSource = 'desktop';
            }

            // extension shared temp sourceId
            if (data.sourceId) {
                DetectRTC.screen.sourceId = data.sourceId;
                if (screenCallback)
                    screenCallback(DetectRTC.screen.sourceId);
            }
        }
    };

    // check if desktop-capture extension installed.
    if (window.postMessage && isChrome) {
        DetectRTC.screen.isChromeExtensionAvailable();
    }
})();

window.addEventListener('message', function(event) {
    if (event.origin != window.location.origin) {
        return;
    }

    DetectRTC.screen.onMessageCallback(event.data);
});

easyrtc.isDesktopInstalled = function() {
    return DetectRTC.screen.chromeMediaSource == 'desktop';
}

easyrtc.initDesktopStream = function(successCallback, failureCallback, streamName) {
    if (!easyrtc.isDesktopInstalled()) {
        failureCallback(easyrtc.errCodes.DEVELOPER_ERR, "Desktop capture plugin not installed").
                return;
    }

    DetectRTC.screen.getSourceId(function(error) {
        if (DetectRTC.screen.sourceId) {
            easyrtc._presetMediaConstraints = {
                video: {
                    mandatory: {
                        chromeMediaSource: 'desktop',
                        chromeMediaSourceId: event.data.chromeMediaSourceId,
                        maxWidth: 1920,
                        maxHeight: 1080,
                        minAspectRatio: 1.77
                    }
                },
                audio: false
            }
            easyrtc.initMediaSource(successCallback, failureCallback, streamName);
        }
        else {
            failureCallback(easyrtc.errCodes.MEDIA_CANCELLED, "Desktop capture plugin not installed");
        }
    });
}