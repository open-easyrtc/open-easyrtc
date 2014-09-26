//
// This code was taken from: https://github.com/muaz-khan/WebRTC-Experiment/tree/master/Pluginfree-Screen-Sharing 
// and modified to fit with EasyRTC.
//

// todo: need to check exact chrome browser because opera/node-webkit also uses chromium framework
var isChrome = !!navigator.webkitGetUserMedia;

// DetectRTC.js - github.com/muaz-khan/WebRTC-Experiment/tree/master/DetectRTC
// Below code is taken from RTCMultiConnection-v1.8.js (http://www.rtcmulticonnection.org/changes-log/#v1.8)
// and modified.
var DetectRTC = {};

(function() {
    var screenCallback;

    DetectRTC.screen = {
        supported: false,
        getSourceId: function(callback) {
            if (!callback)
                throw '"callback" parameter is mandatory.';
            screenCallback = callback;
            window.postMessage('desktopcapture-get-sourceId', '*');
        },
        isChromeExtensionAvailable: function(callback) {
            if (!callback) {
                return;
            }

            if (DetectRTC.screen.supported) {
                callback(true);
            }

            // ask extension if it is available
            window.postMessage('desktopcapture-are-you-there', '*');

            setTimeout(function() {
                callback(DetectRTC.screen.supported);
            }, 2000);
        },
        onMessageCallback: function(data) {
            // "cancel" button is clicked
            if (data == 'PermissionDeniedError') {
                DetectRTC.screen.chromeMediaSource = 'PermissionDeniedError';
                if (screenCallback) {
                   return screenCallback('PermissionDeniedError');
                }
                else {
                    throw new Error('PermissionDeniedError');
                }
            }

            // extension notified his presence
            if (data == 'desktopcapture-loaded') {
                DetectRTC.screen.supported = true;
            }

            // extension shared temp sourceId
            if (data.sourceId) {
                DetectRTC.screen.sourceId = data.sourceId;
                if (screenCallback) {
                    screenCallback(null);
                }
            }
        }
    };

    // check if desktop-capture extension installed.
    if (window.postMessage && isChrome) {
        DetectRTC.screen.isChromeExtensionAvailable(function(){});
    }
})();

window.addEventListener('message', function(event) {
    if (event.origin != window.location.origin) {
        return;
    }

    DetectRTC.screen.onMessageCallback(event.data);
});

easyrtc.isDesktopCaptureInstalled = function() {
    return DetectRTC.screen.supported;
}

easyrtc.initDesktopStream = function(successCallback, failureCallback, streamName) {
    if (!easyrtc.isDesktopCaptureInstalled()) {
        failureCallback(easyrtc.errCodes.DEVELOPER_ERR, "Desktop capture plugin not installed").
                return;
    }

    DetectRTC.screen.getSourceId(function(error) {
        if( error) {
            failureCallback(easyrtc.errCodes.MEDIA_ERR, error);
        }
        else if (DetectRTC.screen.sourceId) {
            easyrtc._presetMediaConstraints = {
                video: {
                    mandatory: {
                        chromeMediaSource: 'desktop',
                        chromeMediaSourceId: DetectRTC.screen.sourceId,
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

/**
 * This method builds a function that can be attached to a button to install an extension.
 * @param extensionId - the google webstore extensionId
 * @param successCallback - function to call on success
 * @param failureCallback - function to call on failure. Will be passed an error code and error message.
 */
easyrtc.extensionInstaller = function(extensionId, successCallback, failureCallback) {
   return function() {
     if( !navigator.webkitGetUserMedia ||
         !window.chrome ||
         !chrome.webstore ||
         !chrome.webstore.install ) {
         failureCallback(easyrtc.errCodes.DEVELOPER_ERR, "Can't install plugin on non-chrome browsers");
     }
     else {
        chrome.webstore.install(
             "https://chrome.google.com/webstore/detail/" + extensionId, 
             successCallback, 
             function(error) {
               failureCallback(easyrtc.errCodes.DEVELOPER_ERR, error);
             }
         );
     };
   }
}