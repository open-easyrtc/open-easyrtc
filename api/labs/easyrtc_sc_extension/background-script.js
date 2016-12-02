/* global chrome */
// this background script is used to invoke desktopCapture API
// to capture screen-MediaStream.

var session = ['screen', 'window'];
var pending = false;

chrome.runtime.onConnect.addListener(function (port) {

    // on getting sourceId
    // "sourceId" will be empty if permission is denied.
    function onAccessApproved(sourceId) {

        pending = false;
        
        // if "cancel" button is clicked
        if(!sourceId || !sourceId.length) {
            return port.postMessage('PermissionDeniedError');
        }
        
        // "ok" button is clicked; share "sourceId" with the
        // content-script which will forward it to the webpage
        port.postMessage({
            chromeMediaSourceId: sourceId
        });
    }
    
    // this one is called for each message from "content-script.js"
    function portOnMessageHanlder(message) {
        if(message === 'get-sourceId' && !pending) {
            pending = true;
            chrome.desktopCapture.chooseDesktopMedia(session, port.sender.tab, onAccessApproved);
        }
    }
    
    port.onMessage.addListener(portOnMessageHanlder);
});