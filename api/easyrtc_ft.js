/* global define, module, require, console */
/*!
  Script: easyrtc_ft.js

    Provides support file and data transfer support to easyrtc.

  About: License

    Copyright (c) 2016, Priologic Software Inc.
    All rights reserved.

    Redistribution and use in source and binary forms, with or without
    modification, are permitted provided that the following conditions are met:

        * Redistributions of source code must retain the above copyright notice,
          this list of conditions and the following disclaimer.
        * Redistributions in binary form must reproduce the above copyright
          notice, this list of conditions and the following disclaimer in the
          documentation and/or other materials provided with the distribution.

    THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
    AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
    IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
    ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
    LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
    CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
    SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
    INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
    CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
    ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
    POSSIBILITY OF SUCH DAMAGE.
*/

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        //RequireJS (AMD) build system
        define(['easyrtc'], factory);
    } else if (typeof module === 'object' && module.exports) {
        //CommonJS build system
        module.exports = factory(require('easyrtc'));
    } else {
        //Vanilla JS, ensure dependencies are loaded correctly
        if (typeof window.easyrtc !== 'object' || !window.easyrtc) {
            throw new Error("easyrtc_ft requires easyrtc");
        }
        root.easyrtc_ft = factory(window.easyrtc);
  }
}(this, function (easyrtc, undefined) {

"use strict";

/**
 * @class Easyrtc_ft.
 *
 * @returns {Easyrtc_ft} the new easyrtc instance.
 *
 * @constructs Easyrtc_ft
 */

var easyrtc_ft = {};

/**
 * Error codes that the EasyRTC will use in the errorCode field of error object passed
 * to error handler set by easyrtc.setOnError. The error codes are short printable strings.
 * @type Object
 */
easyrtc_ft.errCodes = {
    DATA_LOST: "DATA_LOST",
    INVALID_DATA: "INVALID_DATA",
    DROP_FILE: "DROP_FILE"
};

/**
 * Establish an area as a drag-n-drop drop site for files.
 * @param {DOMString} droptargetName - the id of the drag-and-drop site or the actual DOM object.
 * @param {Function} filesHandler - function that accepts an array of File's.
 */
easyrtc_ft.buildDragNDropRegion = function(droptargetName, filesHandler) {
    var droptarget;
    if (typeof droptargetName === 'string') {
        droptarget = document.getElementById(droptargetName);
        if (!droptarget) {
            throw ("unknown object " + droptargetName);
        }
    }
    else {
        droptarget = droptargetName;
    }

    function addClass(target, classname) {
        if (target.className) {
            if (target.className.indexOf(classname, 0) >= 0) {
                return;
            }
            else {
                target.className = target.className + " " + classname;
            }
        }
        else {
            target.className = classname;
        }
        target.className = target.className.replace("  ", " ");
    }

    function removeClass(target, classname) {
        if (!target.className) {
            return;
        }
        target.className = target.className.replace(classname, "").replace("  ", " ");
    }

    function ignore(e) {
        e.stopPropagation();
        e.preventDefault();
        return false;
    }

    function drageventcancel(e) {
        if (e.preventDefault) {
            e.preventDefault(); // required by FF + Safari
        }
        e.dataTransfer.dropEffect = 'copy'; // tells the browser what drop effect is allowed here
        return false; // required by IE
    }

    var dropCueClass = "easyrtcfiledrop";

    function dropHandler(e) {
        removeClass(droptarget, dropCueClass);
        var dt = e.dataTransfer;
        var files = dt.files;
        if (dt.files.length > 0) {
            try {
                filesHandler(files);
            } catch (errorEvent) {
                easyrtc.showError(easyrtc_ft.errCodes.DROP_FILE, errorEvent);
            }
        }
        return ignore(e);
    }

    function dragEnterHandler(e) {
        addClass(droptarget, dropCueClass);
        return drageventcancel(e);
    }

    function dragLeaveHandler(e) {
        removeClass(droptarget, dropCueClass);
        return drageventcancel(e);
    }

    var addEvent = (function() {
        if (document.addEventListener) {
            return function(el, type, fn) {
                if (el && el.nodeName || el === window) {
                    el.addEventListener(type, fn, false);
                } else if (el && el.length) {
                    for (var i = 0; i < el.length; i++) {
                        addEvent(el[i], type, fn);
                    }
                }
            };
        } else {
            return function(el, type, fn) {
                if (el && el.nodeName || el === window) {
                    el.attachEvent('on' + type, function() {
                        return fn.call(el, window.event);
                    });
                } else if (el && el.length) {
                    for (var i = 0; i < el.length; i++) {
                        addEvent(el[i], type, fn);
                    }
                }
            };
        }
    })();

    droptarget.ondrop = dropHandler;
    droptarget.ondragenter = dragEnterHandler;
    droptarget.ondragleave = dragLeaveHandler;
    droptarget.ondragover = drageventcancel;
};

/**
 * Builds a function that can be used to send a group of files to a peer.
 * @param {String} destUser easyrtcid of the person being sent to.
 * @param {Function} progressListener - if provided, is called with the following objects:
 *    {status:"waiting"}  // once a file offer has been sent but not accepted or rejected yet
 *    {status:"started_file", name: filename}
 *    {status:"working", name:filename, position:position_in_file, size:size_of_current_file, numFiles:number_of_files_left}
 *    {status:"cancelled"}  // if the remote user cancels the sending
 *    {status:"done"}       // when the file is done
 *    the progressListener should always return true for normal operation, false to cancel a filetransfer.
 * @return {Function} an object that accepts an array of File (the Files to be sent), and a boolean
 * @param {Object} options - overide default file transfer settings
 *    maxPacketSize is the size (before base64 encoding) that is sent in a
 *               single data channel message, in bytes.
 *    maxChunkSize is the amount read from a file at a time, in bytes.
 *    ackThreshold is the amount of data that can be sent before an ack is
 *              received from the party we're sending to, bytes.
 *    maxChunkSize should be a multiple of maxPacketSize.
 *    ackThreshold should be several times larger than maxChunkSize. For
 *              network paths that have greater latency, increase
 *              ackThreshold further.
 */
easyrtc_ft.buildFileSender = function(destUser, progressListener, options) {
    options = options || {};
    var droptarget;
    var seq = 0;
    var positionAcked = 0;
    var filePosition = 0;
    var filesOffered = []; // TODO ARray vs Object look weird here but seq is Number 
    var filesBeingSent = [];
    var curFile = null;
    var curSeq = null;
    var curFileSize;
    var filesAreBinary;
    var maxPacketSize = options.maxPacketSize || (10 * 1024); // max bytes per packet, before base64 encoding
    var maxChunkSize = options.maxPacketSize || (maxPacketSize * 10); // max binary bytes read at a time.
    var ackThreshold = options.maxPacketSize || (maxChunkSize * 4); // send is allowed to be 400KB ahead of receiver

    var waitingForAck = false;
    var offersWaiting = [];
    var outseq = 0;

    function fileCancelReceived(sender, msgType, msgData, targeting) {

        if (!msgData.seq || !filesOffered[msgData.seq]){
            return;
        }

        progressListener({
            seq: msgData.seq,
            status: "cancelled"
        });

        // Offer can be offered only once
        delete filesOffered[msgData.seq];
    }

    function cancelFilesOffer(offerSeq) {

        // Clear from of
        if (filesOffered[offerSeq]) {

            fileCancelReceived(destUser, 'filesCancel', filesOffered[offerSeq]);  

            delete filesOffered[offerSeq]; 
        } else {

            // Clear from waiting queue
            offersWaiting = offersWaiting.filter(function(offersWaiting) {
                var isOfferToCancel = offersWaiting.seq === offerSeq;
                if (isOfferToCancel) {
                    fileCancelReceived(destUser, 'filesCancel', offersWaiting);  
                }
                return !isOfferToCancel;
            }); 
        }

        easyrtc.sendData(destUser, "filesChunk", {
            seq: offerSeq,
            done: "cancelled"
        });
    }

    function sendFilesOffer(files, areBinary) {
        
        var fileNameList = [];
        for (var i = 0, l = files.length; i < l; i++) {
            fileNameList[i] = {
                name: files[i].name, 
                size: files[i].size
            };
        }

        seq++;
        filesOffered[seq] = {
            seq: seq,
            files: files,
            areBinary: areBinary
        };
        
        easyrtc.sendDataWS(destUser, "filesOffer", {
            seq: seq, 
            fileNameList: fileNameList
        });

        progressListener({
            seq: seq,
            status: "waiting"
        });

        return cancelFilesOffer.bind(null, seq);
    }

    function addOfferToWaitingList(offer) {
        offersWaiting.push(offer);
    }

    function processOfferWaiting() {
        if (offersWaiting.length > 0) {
            setTimeout(function() {
                var fileset = offersWaiting.shift();
                sendOffer(fileset);
            }, 240);
        }
    }

    function sendChunk() {

        if (!curSeq) {
            return;
        }

        if (!curFile) {
            if (filesBeingSent.length === 0) {

                outseq = 0;
                easyrtc.sendData(destUser, "filesChunk", {
                    seq: curSeq,
                    done: "all"
                });

                progressListener({
                    seq: curSeq,
                    status: "done"
                });
                    
                curSeq = null;
                processOfferWaiting();
                return;
            }
            else {
                curFile = filesBeingSent.shift();
                curFileSize = curFile.size;
                positionAcked = 0;
                waitingForAck = false;
                easyrtc.sendData(destUser, "filesChunk", {
                    seq: curSeq,
                    name: curFile.name, 
                    type: curFile.type, 
                    outseq: outseq, 
                    size: curFile.size
                });
                outseq++;

                progressListener({
                    seq: curSeq,
                    status: "started_file", 
                    name: curFile.name
                });
            }
        }

        var amountToRead = Math.min(maxChunkSize, curFileSize - filePosition);
        var progressAck = progressListener({
            seq: curSeq,
            status: "working", 
            name: curFile.name, 
            position: filePosition, 
            size: curFileSize, 
            numFiles: filesBeingSent.length + 1
        });

        if (!progressAck) {
            curSeq = null;
            curFile = null;
            filePosition = 0;
            cancelFilesOffer(curSeq);
            processOfferWaiting();
            return;
        }

        var nextLocation = filePosition + amountToRead;
        var blobSlice = curFile.slice(filePosition, nextLocation);

        var reader = new FileReader();
        reader.onloadend = function(evt) {
            if (evt.target.readyState === FileReader.DONE) { // DONE == 2

                var binaryString = "";
                var bytes = new Uint8Array(evt.target.result);
                var length = bytes.length;

                for( var i = 0; i < length; i++ ) {
                   binaryString += String.fromCharCode(bytes[i]);
                }

                for (var pp = 0; pp < binaryString.length; pp++) {
                    var oneChar = binaryString.charCodeAt(pp);
                }

                for (var pos = 0; pos < binaryString.length; pos += maxPacketSize) {
                    
                    var packetLen = Math.min(maxPacketSize, amountToRead - pos);
                    var packetData = binaryString.substring(pos, pos + packetLen);
                    var packetObject = {
                        seq: curSeq,
                        outseq: outseq
                    };
                    
                    if (filesAreBinary) {
                        packetObject.data64 = btoa(packetData);
                    } else {
                        packetObject.datatxt = packetData;
                    }

                    easyrtc.sendData(destUser, "filesChunk", packetObject);
                    outseq++;
                }

                if (nextLocation >= curFileSize) {
                    easyrtc.sendData(destUser, "filesChunk", {
                        seq: curSeq,
                        done: "file"
                    });
                }

                if (filePosition < positionAcked + ackThreshold) {
                    sendChunk();
                } else {
                    waitingForAck = true;
                }
            }
        };

        reader.readAsArrayBuffer(blobSlice);
        filePosition = nextLocation;

        //  advance to the next file if we've read all of this file
        if (nextLocation >= curFileSize) {
            curFile = null;
            filePosition = 0;
        }
    }

    if (!progressListener) {
        progressListener = function() {
            return true;
        };
    }

    var roomOccupantListener = function(eventType, eventData) {
        var roomName;
        var foundUser = false;
        for (roomName in eventData) {
            if (eventData[roomName][destUser]) {
                foundUser = true;
            }
        }
        if (!foundUser) {
            easyrtc.removeEventListener("roomOccupant", roomOccupantListener);

            if (filesBeingSent.length > 0) {
                cancelFilesOffer(curSeq);
            }
            
            if (filesOffered.length > 0) {
                filesOffered.forEach(function (filesOffered, seq) {
                    cancelFilesOffer(seq);
                });
            }
        }
    };

    easyrtc.addEventListener("roomOccupant", roomOccupantListener);

    function sendOffer(offer) {

        curSeq = offer.seq;
        for (var i = 0, l = offer.files.length; i < l; i++) {
            filesBeingSent.push(offer.files[i]);
        }
        filesAreBinary = offer.filesAreBinary;
        filePosition = 0;

        progressListener({
            seq: curSeq,
            status: "started"
        });

        sendChunk(); // this starts the file reading
    }
    
    //
    // if a file offer is rejected, we delete references to it.
    //
    function fileOfferRejected(sender, msgType, msgData, targeting) {
        
        if (!msgData.seq || !filesOffered[msgData.seq]){
            return;
        }

        progressListener({
            seq: msgData.seq,
            status: "rejected"
        });

        delete filesOffered[msgData.seq];
    }
    //
    // if a file offer is accepted, initiate sending of files.
    //
    function fileOfferAccepted(sender, msgType, msgData, targeting) {
        
        if (!msgData.seq || !filesOffered[msgData.seq]){
            return;
        }

        var alreadySending = filesBeingSent.length > 0;
        var offer = filesOffered[msgData.seq];

        // Offer can be offered only once
        delete filesOffered[msgData.seq];

        if (!alreadySending && !curFile) {
            sendOffer(offer);
        } else {
            addOfferToWaitingList(offer);
        }
    }

    function packageAckReceived(sender, msgType, msgData) {
        positionAcked = msgData.positionAck;
        if (waitingForAck && filePosition < positionAcked + ackThreshold) {
            waitingForAck = false;
            sendChunk();
        }
    }

    easyrtc.setPeerListener(fileOfferRejected, "filesReject", destUser);
    easyrtc.setPeerListener(fileOfferAccepted, "filesAccept", destUser);
    easyrtc.setPeerListener(fileCancelReceived, "filesCancel", destUser);
    easyrtc.setPeerListener(packageAckReceived, "filesAck", destUser);

    return sendFilesOffer;
};


/**
 * Enable datachannel based file receiving. The received blobs get passed to the statusCB in the 'eof' typed message.
 * @param {Function(otherGuy,fileNameList, wasAccepted)} acceptRejectCB - this function is called when another peer
 * (otherGuy) offers to send you a list of files. this function should call it's wasAccepted function with true to
 * allow those files to be sent, or false to disallow them.
 * @param {Function} blobAcceptor - this function is called three arguments arguments: the suppliers easyrtcid, a blob and a filename. It is responsible for
 * saving the blob to the file, usually using easyrtc_ft.saveAs.
 * @param {type} statusCB  - this function is called with the current state of file receiving. It is passed two arguments:
 * otherGuy - the easyrtcid of the person sending the files. *
 * msg - one of the following structures:
 * {status:"done", reason:"accept_failed"}
 * {status:"done", reason:"success"}
 * {status:"done", reason:"cancelled"}
 * {status:"eof"},
 * {status:"started_file, name:"filename"}
 * {status:"progress", name:filename,
 *    received:received_size_in_bytes,
 *    size:file_size_in_bytes }
 *  @example
 *
 *    easyrtc_ft(
 *       function(otherGuy, filenamelist, wasAccepted) {  wasAccepted(true);},
 *       function(otherGuy, blob, filename) { easyrtc_ft(blob, filename);},
 *       function(otherGuy, status) {  console.log("status:" + JSON.stringify(status))}
 *     );
 */
easyrtc_ft.buildFileReceiver = function(acceptRejectCB, blobAcceptor, statusCB, options) {
    options = options || {};

    var usersOffers = {};
    var positionAcked = 0;
    var ackThreshold = options.ackThreshold || 10000; // receiver is allowed to be 10KB behind of sender

    var roomOccupantListener = function(eventType, eventData) {
        var destUser;
        var foundUser;
        var roomName;
        var destOffer;
        for (destUser in usersOffers) {
            if (usersOffers.hasOwnProperty(destUser)) {
                
                foundUser = false;
                for (roomName in eventData) {
                    if (eventData[roomName][destUser]) {
                        foundUser = true;
                    }
                }

                if (!foundUser) {   
                    var userOffers = usersOffers[destUser];
                    for (var userOffer in userOffers[destUser]) {
                        if (userOffers.hasOwnProperty(userOffer)) {
                            delete userOffers[userOffer];
                            statusCB(destUser, {
                                seq: destOffer,
                                status: "done", 
                                reason: "cancelled"
                            });
                        }
                    }

                    delete usersOffers[destUser];
                }
            }
        }
    };

    easyrtc.addEventListener("roomOccupant", roomOccupantListener);

    function fileOfferHandler(otherGuy, msgType, msgData) {
        var destOffer = msgData.seq;
        if (!destOffer){
            return;
        }
        var userOffers = usersOffers[otherGuy] = usersOffers[otherGuy] || {};
        var userOffer = userOffers[destOffer] = {
            seq: destOffer,
            status: 'pending'
        };
        acceptRejectCB(otherGuy, msgData.fileNameList, function(wasAccepted) {
            var ackHandler = function(ackMesg) {

                if (ackMesg.msgType === "error") {
                    statusCB(otherGuy, {
                        seq: destOffer,
                        status: "done", 
                        reason: "accept_failed"
                    });
                    delete userOffers[destOffer];
                }
                else {
                    statusCB(otherGuy, {
                        seq: destOffer,
                        status: "started"
                    });
                }
            };
            if (wasAccepted) {
                userOffers[destOffer] = {
                    seq: destOffer,
                    status: "accepted",
                    nextPacketSeq: 0
                };

                easyrtc.sendDataWS(otherGuy, "filesAccept", {
                    seq: destOffer
                }, ackHandler);
            }
            else {
                easyrtc.sendDataWS(otherGuy, "filesReject", {
                    seq: destOffer
                });

                statusCB(otherGuy, {
                    seq: destOffer,
                    status: "rejected"
                });

                delete userOffers[destOffer];
            }
        });
    }

    function fileChunkHandler(otherGuy, msgType, msgData) {
        var destOffer = msgData.seq;
        if (!destOffer){
            return;
        }
        var userOffers = usersOffers[otherGuy];
        if (!userOffers) {
            return;
        }
        var userOffer = userOffers[destOffer];
        if (!userOffer) {
            return;
        }
        if (msgData.done) {
            switch (msgData.done) {
                case "file":
                    var blob = new Blob(userOffer.currentData, {
                        type: userOffer.currentFileType
                    });
                    blobAcceptor(otherGuy, blob, userOffer.currentFileName);
                    statusCB(otherGuy, {
                        seq: destOffer,
                        status: "eof", 
                        name: userOffer.currentFileName
                    });
                    
                    blob = null;
                    positionAcked = 0;
                    userOffer.currentData = [];
                    break;
                case "all":
                    statusCB(otherGuy, {
                        seq: destOffer,
                        status: "done", 
                        reason: "success"
                    });
                    break;
                case "cancelled":
                    delete userOffers[destOffer];
                    statusCB(otherGuy, {
                        seq: destOffer,
                        status: "done", 
                        reason: "cancelled"
                    });
                    break;
            }
        }
        else if (msgData.name) {
            statusCB(otherGuy, {
                seq: destOffer,
                status: "started_file", 
                name: msgData.name
            });
            userOffer.currentFileName = msgData.name;
            userOffer.currentFileType = msgData.type;
            userOffer.lengthReceived = 0;
            userOffer.lengthExpected = msgData.size;
            userOffer.currentData = [];
        }
        else if (msgData.data64 || msgData.datatxt) {
            var binData;
            if (msgData.data64) {
                binData = atob(msgData.data64);
            }
            else {
                binData = msgData.datatxt;
            }
            var i;
            var n = binData.length;
            var binheap = new Uint8Array(n);
            for (i = 0; i < n; i += 1) {
                binheap[i] = binData.charCodeAt(i);
            }
            userOffer.lengthReceived += n;

            if (!userOffer.currentData) {
                easyrtc.showError(easyrtc_ft.errCodes.DATA_LOST, "file tranfert data lost");
            }

            userOffer.currentData.push(binheap);

            statusCB(otherGuy, {
                seq: destOffer,
                status: "progress",
                name: userOffer.currentFileName,
                received: userOffer.lengthReceived,
                size: userOffer.lengthExpected});

            if (userOffer.lengthReceived > positionAcked + ackThreshold) {
                positionAcked = userOffer.lengthReceived;
                easyrtc.sendData(otherGuy, "filesAck", {
                    seq: destOffer,
                    positionAck: positionAcked
                });
            }
        }
        else {
            easyrtc.showError(easyrtc.errCodes.INVALID_DATA, "Unexpected data structure in filesChunk");
        }
    }

    easyrtc.setPeerListener(fileOfferHandler, "filesOffer");
    easyrtc.setPeerListener(fileChunkHandler, "filesChunk");
};

/** This is a wrapper around Eli Grey's saveAs function. This saves to the browser's downloads directory.
 * @param {Blob} Blob - the data to be saved.
 * @param {String} filename - the name of the file the blob should be written to.
 */
easyrtc_ft.saveAs = (function() {

    /* FileSaver.js
     * A saveAs() FileSaver implementation.
     * 2013-01-23
     *
     * By Eli Grey, http://eligrey.com
     * License: X11/MIT
     *   See LICENSE.md
     */

    /*global self */
    /*jslint bitwise: true, regexp: true, confusion: true, es5: true, vars: true, white: true,
     plusplus: true */

    /*! @source http://purl.eligrey.com/github/FileSaver.js/blob/master/FileSaver.js */
    var saveAs = window.saveAs || (navigator.msSaveOrOpenBlob && navigator.msSaveOrOpenBlob.bind(navigator)) || (function(view) {

        var doc = view.document,
            // only get URL when necessary in case BlobBuilder.js hasn't overridden it yet
            get_URL = function () {
                return view.URL || view.webkitURL || view;
            },
            URL = view.URL || view.webkitURL || view,
            save_link = doc.createElementNS("http://www.w3.org/1999/xhtml", "a"),
            can_use_save_link = !view.externalHost && "download" in save_link,
            click = function(node) {
                var event = doc.createEvent("MouseEvents");
                event.initMouseEvent(
                    "click", true, false, view, 0, 0, 0, 0, 0,
                    false, false, false, false, 0, null
                );
                node.dispatchEvent(event);
            },
            webkit_req_fs = view.webkitRequestFileSystem,
            req_fs = view.requestFileSystem || webkit_req_fs || view.mozRequestFileSystem,
            throw_outside = function(ex) {
                (view.setImmediate || view.setTimeout)(function() {
                    throw ex;
                }, 0);
            },
            force_saveable_type = "application/octet-stream",
            fs_min_size = 0,
            deletion_queue = [];

        function process_deletion_queue() {
            var i = deletion_queue.length;
            while (i--) {
                var file = deletion_queue[i];
                if (typeof file === "string") { // file is an object URL
                    URL.revokeObjectURL(file);
                } else { // file is a File
                    file.remove();
                }
            }
            deletion_queue.length = 0; // clear queue
        }

        function dispatch(filesaver, event_types, event) {
            event_types = [].concat(event_types);
            var i = event_types.length;
            while (i--) {
                var listener = filesaver["on" + event_types[i]];
                if (typeof listener === "function") {
                    try {
                        listener.call(filesaver, event || filesaver);
                    } catch (ex) {
                        throw_outside(ex);
                    }
                }
            }
        }

        function FileSaver(blob, name) {
            // First try a.download, then web filesystem, then object URLs
            var filesaver = this,
                type = blob.type,
                blob_changed = false,
                object_url,
                target_view,
                get_object_url = function() {
                    var object_url = get_URL().createObjectURL(blob);
                    deletion_queue.push(object_url);
                    return object_url;
                },
                dispatch_all = function() {
                    dispatch(filesaver, "writestart progress write writeend".split(" "));
                },
                // on any filesys errors revert to saving with object URLs
                fs_error = function() {
                    // don't create more object URLs than needed
                    if (blob_changed || !object_url) {
                        object_url = get_object_url(blob);
                    }
                    if (target_view) {
                        target_view.location.href = object_url;
                    } else {
                        window.open(object_url, "_blank");
                    }
                    filesaver.readyState = filesaver.DONE;
                    dispatch_all();
                },
                abortable = function(func) {
                    return function() {
                        if (filesaver.readyState !== filesaver.DONE) {
                            return func.apply(this, arguments);
                        }
                        else {
                            return null;
                        }
                    };
                },
                create_if_not_found = {create: true, exclusive: false},
                slice;

            filesaver.readyState = filesaver.INIT;

            if (!name) {
                name = "download";
            }

            if (can_use_save_link) {
                object_url = get_object_url(blob);
                save_link.href = object_url;
                save_link.download = name;
                click(save_link);
                filesaver.readyState = filesaver.DONE;
                dispatch_all();
                return;
            }
            // Object and web filesystem URLs have a problem saving in Google Chrome when
            // viewed in a tab, so I force save with application/octet-stream
            // http://code.google.com/p/chromium/issues/detail?id=91158
            if (view.chrome && type && type !== force_saveable_type) {
                slice = blob.slice || blob.webkitSlice;
                blob = slice.call(blob, 0, blob.size, force_saveable_type);
                blob_changed = true;
            }
            // Since I can't be sure that the guessed media type will trigger a download
            // in WebKit, I append .download to the filename.
            // https://bugs.webkit.org/show_bug.cgi?id=65440
            if (webkit_req_fs && name !== "download") {
                name += ".download";
            }
            if (type === force_saveable_type || webkit_req_fs) {
                target_view = view;
            }
            if (!req_fs) {
                fs_error();
                return;
            }
            fs_min_size += blob.size;
            req_fs(view.TEMPORARY, fs_min_size, abortable(function(fs) {
                fs.root.getDirectory("saved", create_if_not_found, abortable(function(dir) {
                    var save = function() {
                        dir.getFile(name, create_if_not_found, abortable(function(file) {
                            file.createWriter(abortable(function(writer) {
                                writer.onwriteend = function(event) {
                                    target_view.location.href = file.toURL();
                                    deletion_queue.push(file);
                                    filesaver.readyState = filesaver.DONE;
                                    dispatch(filesaver, "writeend", event);
                                };
                                writer.onerror = function() {
                                    var error = writer.error;
                                    if (error.code !== error.ABORT_ERR) {
                                        fs_error();
                                    }
                                };
                                "writestart progress write abort".split(" ").forEach(function(event) {
                                    writer["on" + event] = filesaver["on" + event];
                                });
                                writer.write(blob);
                                filesaver.abort = function() {
                                    writer.abort();
                                    filesaver.readyState = filesaver.DONE;
                                };
                                filesaver.readyState = filesaver.WRITING;
                            }), fs_error);
                        }), fs_error);
                    };
                    dir.getFile(name, {create: false}, abortable(function(file) {
                        // delete file if it already exists
                        file.remove();
                        save();
                    }), abortable(function(ex) {
                        if (ex.code === ex.NOT_FOUND_ERR) {
                            save();
                        } else {
                            fs_error();
                        }
                    }));
                }), fs_error);
            }), fs_error);
        }

        function saveAs(blob, name) {
            return new FileSaver(blob, name);
        }

        var FS_proto = FileSaver.prototype;

        FS_proto.abort = function() {
            var filesaver = this;
            filesaver.readyState = filesaver.DONE;
            dispatch(filesaver, "abort");
        };

        FS_proto.readyState = FS_proto.INIT = 0;
        FS_proto.WRITING = 1;
        FS_proto.DONE = 2;
        FS_proto.error = null;
        FS_proto.onwritestart = null;
        FS_proto.onprogress = null;
        FS_proto.onwrite = null;
        FS_proto.onabort = null;
        FS_proto.onerror = null;
        FS_proto.onwriteend = null;

        view.addEventListener("unload", process_deletion_queue, false);

        return saveAs;

    }(self));

    return saveAs;
})();

return easyrtc_ft;

})); 
