/* global chrome, easyrtc, console */
//  This file is a modification of Muaz Khan's getScreenId.js. It uses loads an iframe 
//  pointed at Muaz Khan's page, and then communicates with that Iframe. You can also point
//  it at other urls.
//  
//  Technically, it is possible to desktop capture without iframes and for a production system.
//  However, this solution get will get you running with the minimal effort on your side.
//  
//  //
//  
// // Last time updated at July 29, 2014, 08:32:23
// Latest file can be found here: https://cdn.webrtc-experiment.com/getScreenId.js

// Muaz Khan         - www.MuazKhan.com
// MIT License       - www.WebRTC-Experiment.com/licence
// Documentation     - https://github.com/muaz-khan/WebRTC-Experiment/tree/master/getScreenId.js
// Modified by Eric Davies Sept 1/ 2014.
// 
// ______________
// getScreenId.js

/**
 * Provides a method for window/screen capture using an iframe.
 * This requires that your users install Muah Khans desktop extension.
 * Read the source code for more details.
 * @class Easyrtc_IframeCapture
 */



(function() {
   /** Create a local media stream for desktop capture.
     * This will fail if a desktop capture extension is not installed.
     * not granting permission.
     * @function
     * @memberOf Easyrtc_IframeCapture
     * @param {function(Object)} successCallback - will be called with localmedia stream on success. 
     * @param {function(String,String)} errorCallback - is called with an error code and error description.
     * @param {String} streamName - an optional name for the media source so you can use multiple cameras and screen share simultaneously.
     * @param {String} iframeUrl - an optional url for the iframe. The default is to use Muaz Khan's.
     * @example
     *       easyrtc.initMediaSource(
     *          function(mediastream){
     *              easyrtc.setVideoObjectSrc( document.getElementById("mirrorVideo"), mediastream);
     *          },
     *          function(errorCode, errorText){
     *               easyrtc.showError(errorCode, errorText);
     *          });
     *
     */
    var iframeUrl =  'https://www.webrtc-experiment.com/getSourceId/';

    var iframe = document.createElement('iframe');
    
    iframe.onload = function() {
        iframe.isLoaded = true;
    };

    iframe.src = iframeUrl;

    iframe.style.display = 'none';

    function postMessage() {
        if (!iframe.isLoaded) {
            setTimeout(postMessage, 100);
            return;
        }

        iframe.contentWindow.postMessage({
            captureSourceId: true
        }, '*');
    }

    easyrtc.initDesktopStream = function(successCallback, failureCallback, streamName) {
        // for Firefox:
        // sourceId == 'firefox'
        // screen_constraints = {...}
        
        if (!!navigator.mozGetUserMedia) {
            easyrtc._presetMediaConstraints = {
                video: {
                    mozMediaSource: 'window',
                    mediaSource: 'window',
                    maxWidth: 1920,
                    maxHeight: 1080,
                    minAspectRatio: 1.77
                },
                audio: false
                };
            easyrtc.initMediaSource(successCallback, failureCallback, streamName);
            return;
        }

        postMessage();

        var cb = function(event) {
            if (!event.data) {
                return;
            }

            if (event.data.chromeMediaSourceId) {
                window.removeEventListener("message", cb);
                if (event.data.chromeMediaSourceId === 'PermissionDeniedError') {
                    failureCallback(easyrtc.errCodes.MEDIA_ERR, 'permission-denied');
                } else {
                    easyrtc._presetMediaConstraints = {
                        video: {
                            mandatory: {
                                chromeMediaSource:'desktop',
                                chromeMediaSourceId: event.data.chromeMediaSourceId,
                                maxWidth: 1920,
                                maxHeight: 1080,
                                minAspectRatio: 1.77
                            }
                        },
                        audio: false
                    };

                    easyrtc.initMediaSource(successCallback, failureCallback, streamName);
                }
            }

            if (event.data.chromeExtensionStatus) {
                console.log("extension status is ", event.data.chromeExtensionStatus);  
            }
        };
        easyrtc.desktopCaptureInstalled = null;
        window.addEventListener('message', cb);
    };

    (document.body || document.documentElement).appendChild(iframe);
})();
