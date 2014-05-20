/** @class
 *@version 1.0.11
 *<p>
 * Provides support file and data transfer support to easyrtc.
 * </p>
 *<p>
 *copyright Copyright (c) 2014, Priologic Software Inc.
 *All rights reserved.</p>
 *
 *<p>
 *Redistribution and use in source and binary forms, with or without
 *modification, are permitted provided that the following conditions are met:
 *</p>
 * <ul>
 *   <li> Redistributions of source code must retain the above copyright notice,
 *      this list of conditions and the following disclaimer. </li>
 *   <li> Redistributions in binary form must reproduce the above copyright
 *      notice, this list of conditions and the following disclaimer in the
 *      documentation and/or other materials provided with the distribution. </li>
 *</ul>
 *<p>
 *THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 *AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 *IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 *ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
 *LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 *CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 *SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 *INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 *CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 *ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 *POSSIBILITY OF SUCH DAMAGE.
 *</p>
 */


var easyrtc_ft = {};

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
            alert("Developer error: attempt to call BuildFileSender on unknown object " + droptargetName);
            throw("unknown object " + droptargetName);
        }
    }
    else {
        droptarget = droptargetName;
    }


    function ignore(e) {
        e.stopPropagation();
        e.preventDefault();
        return false;
    }

    function drageventcancel(e) {
        if (e.preventDefault)
            e.preventDefault(); // required by FF + Safari
        e.dataTransfer.dropEffect = 'copy'; // tells the browser what drop effect is allowed here
        return false; // required by IE
    }

    function dropHandler(e) {
        removeClass(droptarget, dropCueClass);
        var dt = e.dataTransfer;
        var files = dt.files;
        if (dt.files.length > 0) {
            try {
                filesHandler(files);
            } catch (errorEvent) {
                console.log("dragndrop errorEvent", errorEvent);
            }
        }
        return ignore(e);
    }


    var dropCueClass = "easyrtcfiledrop";

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
 *   argument that is true if the files are binary, false if they are text.
 *   It is safe to treat all files as binary, it will just require more bandwidth.
 */
easyrtc_ft.buildFileSender = function(destUser, progressListener) {
    var droptarget;
    var seq = 0;
    var positionAcked = 0;
    var filePosition = 0;
    var filesOffered = [];
    var filesBeingSent = [];
    var sendStarted = false;
    var curFile = null;
    var curFileSize;
    var filesAreBinary;
    var maxChunkSize = 10 * 1024;
    var waitingForAck = false;
    var ackThreshold = 100 * 1024; // send is allowed to be 150KB ahead of receiver
    var filesWaiting = [];
    var haveFilesWaiting = false;

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
            if (filesBeingSent.length > 0 || filesOffered.length > 0) {
                progressListener({status: "cancelled"});
            }
        }
    };
    easyrtc.addEventListener("roomOccupant", roomOccupantListener);
    //
    // if a file offer is rejected, we delete references to it.
    //
    function fileOfferRejected(sender, msgType, msgData, targeting) {
        if (!msgData.seq)
            return;
        delete filesOffered[msgData.seq];
        progressListener({status: "rejected"});
        filesOffered.length = 0;
        sendFilesWaiting();
    }
    //
    // if a file offer is accepted, initiate sending of files.
    //
    function fileOfferAccepted(sender, msgType, msgData, targeting) {
        if (!msgData.seq || !filesOffered[msgData.seq])
            return;
        var alreadySending = filesBeingSent.length > 0;
        for (var i = 0; i < filesOffered[msgData.seq].length; i++) {
            filesBeingSent.push(filesOffered[msgData.seq][i]);
        }
        delete filesOffered[msgData.seq];
        if (!alreadySending) {
            filePosition = 0;
            sendChunk(); // this starts the file reading
        }
    }

    function fileCancelReceived(sender, msgType, msgData, targeting) {
        filesBeingSent.empty();
        progressListener({status: "cancelled"});
        filesOffered.length = 0;
        filesBeingSent.length = 0;
        sendStarted = false;
        sendFilesWaiting();
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


    var outseq = 0;

    function sendChunk() {
        if (!curFile) {
            if (filesBeingSent.length === 0) {
                outseq = 0;
                easyrtc.sendData(destUser, "filesChunk", {done: "all"});
                filesOffered.length = 0;
                progressListener({status: "done"});
                sendFilesWaiting();
                return;
            }
            else {
                curFile = filesBeingSent.pop();
                progressListener({status: "started_file", name: curFile.name});
                curFileSize = curFile.size;
                positionAcked = 0;
                waitingForAck = false;
                easyrtc.sendData(destUser, "filesChunk", {name: curFile.name, type: curFile.type, outseq: outseq, size: curFile.size});
                outseq++;
            }
        }

        var amountToRead = Math.min(maxChunkSize, curFileSize - filePosition);
        if (!progressListener({status: "working", name: curFile.name, position: filePosition, size: curFileSize, numFiles: filesBeingSent.length + 1})) {
            filesOffered.length = 0;
            filePosition = 0;
            easyrtc.sendData(destUser, "filesChunk", {done: "cancelled"});
            sendFilesWaiting();
            return;
        }

        var nextLocation = filePosition + amountToRead;
        var blobSlice = curFile.slice(filePosition, nextLocation);
        var reader = new FileReader();
        reader.onloadend = function(evt) {
            if (evt.target.readyState === FileReader.DONE) { // DONE == 2
                var binaryString = evt.target.result;
                var maxchar = 32, minchar = 32;
                for (var pp = 0; pp < binaryString.length; pp++) {
                    var oneChar = binaryString.charCodeAt(pp);
                    maxchar = Math.max(maxchar, oneChar);
                    minchar = Math.min(minchar, oneChar);
                }
                var maxPacketSize = 400; // size in bytes
                for (var pos = 0; pos < binaryString.length; pos += maxPacketSize) {
                    var packetLen = Math.min(maxPacketSize, amountToRead - pos);
                    var packetData = binaryString.substring(pos, pos + packetLen);
                    var packetObject = {outseq: outseq};
                    if (filesAreBinary) {
                        packetObject.data64 = btoa(packetData);
                    }
                    else {
                        packetObject.datatxt = packetData;
                    }
                    easyrtc.sendData(destUser, "filesChunk", packetObject);
                    outseq++;
                }
                if (nextLocation >= curFileSize) {
                    easyrtc.sendData(destUser, "filesChunk", {done: "file"});
                }
                if (filePosition < positionAcked + ackThreshold) {
                    sendChunk();
                }
                else {
                    waitingForAck = true;
                }
            }
        };

        reader.readAsBinaryString(blobSlice);
        filePosition = nextLocation;

        //  advance to the next file if we've read all of this file
        if (nextLocation >= curFileSize) {
            curFile = null;
            filePosition = 0;
        }
    }

    function sendFilesWaiting() {
        haveFilesWaiting = false;
        if (filesWaiting.length > 0) {
            setTimeout(function() {
                var fileset = filesWaiting.pop();
                sendFilesOffer(fileset.files, fileset.areBinary);
            }, 240);
        }
    }
    
    
    function sendFilesOffer(files, areBinary) {
        if (haveFilesWaiting) {
            filesWaiting.push({files: files, areBinary: areBinary});
        }
        else {
            haveFilesWaiting = true;
            filesAreBinary = areBinary;
            progressListener({status: "waiting"});
            var fileNameList = [];
            for (var i = 0; i < files.length; i++) {
                fileNameList[i] = {name: files[i].name, size: files[i].size};
            }
            seq++;
            filesOffered[seq] = files;
            easyrtc.sendDataWS(destUser, "filesOffer", {seq: seq, fileNameList: fileNameList});
        }
    }
    return sendFilesOffer;
};


/**
 * Enable datachannel based file receiving. The received blobs get passed to the statusCB in the 'eof' typed message.
 * @param {Function(otherGuy,fileNameList, wasAccepted} acceptRejectCB - this function is called when another peer
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
easyrtc_ft.buildFileReceiver = function(acceptRejectCB, blobAcceptor, statusCB) {
    var userStreams = {};
    var ackThreshold = 10000; // receiver is allowed to be 10KB behind of sender
    var positionAcked = 0;

    var roomOccupantListener = function(eventType, eventData) {
        var user;
        var foundUser;
        var roomName;
        for (destUser in userStreams) {
            foundUser = false;
            for (roomName in eventData) {
                if (eventData[roomName][destUser]) {
                    foundUser = true;
                }
            }
            if (!foundUser) {
                easyrtc.removeEventListener("roomOccupant", roomOccupantListener);
                statusCB(destUser, {status: "done", reason: "cancelled"});
                delete userStreams[destUser];
            }
        }
    };
    easyrtc.addEventListener("roomOccupant", roomOccupantListener);

    function fileOfferHandler(otherGuy, msgType, msgData) {
        if (!userStreams[otherGuy]) {
            userStreams[otherGuy] = {};
        }
        acceptRejectCB(otherGuy, msgData.fileNameList, function(wasAccepted) {
            var ackHandler = function(ackMesg) {

                if (ackMesg.msgType === "error") {
                    statusCB(otherGuy, {status: "done", reason: "accept_failed"});
                    delete userStreams[otherGuy];
                }
                else {
                    statusCB(otherGuy, {status: "started"});
                }
            };
            if (wasAccepted) {
                userStreams[otherGuy] = {
                    groupSeq: msgData.seq,
                    nextPacketSeq: 0
                };
                easyrtc.sendDataWS(otherGuy, "filesAccept", {seq: msgData.seq}, ackHandler);
            }
            else {
                easyrtc.sendDataWS(otherGuy, "filesReject", {seq: msgData.seq});
                delete userStreams[otherGuy];
                statusCB(otherGuy, {status: "rejected"});
            }
        });
    }


    function fileChunkHandler(otherGuy, msgType, msgData) {
        var i;
        var userStream = userStreams[otherGuy];
        if (!userStream) {
            return;
        }
        if (msgData.done) {
            switch (msgData.done) {
                case "file":
                    var blob = new Blob(userStream.currentData, {type: userStream.currentFileType});
                    blobAcceptor(otherGuy, blob, userStream.currentFileName);
                    statusCB(otherGuy, {status: "eof", name: userStream.currentFileName});
                    blob = null;
                    positionAcked = 0;
                    userStream.currentData = [];
                    break;
                case "all":
                    statusCB(otherGuy, {status: "done", reason: "success"});
                    break;
                case "cancelled":
                    delete userStreams[otherGuy];
                    statusCB(otherGuy, {status: "done", reason: "cancelled"});
                    break;
            }
        }
        else if (msgData.name) {
            statusCB(otherGuy, {status: "started_file", name: msgData.name});
            userStream.currentFileName = msgData.name;
            userStream.currentFileType = msgData.type;
            userStream.lengthReceived = 0;
            userStream.lengthExpected = msgData.size;
            userStream.currentData = [];
        }
        else if (msgData.data64 || msgData.datatxt) {
            var binData;
            if (msgData.data64) {
                binData = atob(msgData.data64);
            }
            else {
                binData = msgData.datatxt;
            }
            var n = binData.length;
            var binheap = new Uint8Array(n);
            for (i = 0; i < n; i += 1) {
                binheap[i] = binData.charCodeAt(i);
            }
            userStream.lengthReceived += n;
            if (!userStream.currentData) {
                console.log("Lost my currentData!!!");
            }
            userStream.currentData.push(binheap);

            statusCB(otherGuy, {
                status: "progress",
                name: userStream.currentFileName,
                received: userStream.lengthReceived,
                size: userStream.lengthExpected});
            if (userStream.lengthReceived > positionAcked + ackThreshold) {
                positionAcked = userStream.lengthReceived;
                easyrtc.sendData(otherGuy, "filesAck", {positionAck: positionAcked});
            }
        }
        else {
            console.log("Unexpected data structure in filesChunk=", msgData);
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

    var saveAs = window.saveAs
            || (navigator.msSaveOrOpenBlob && navigator.msSaveOrOpenBlob.bind(navigator))
            || (function(view) {

        var
                doc = view.document
                // only get URL when necessary in case BlobBuilder.js hasn't overridden it yet
                , get_URL = function() {
            return view.URL || view.webkitURL || view;
        }
        , URL = view.URL || view.webkitURL || view
                , save_link = doc.createElementNS("http://www.w3.org/1999/xhtml", "a")
                , can_use_save_link = !view.externalHost && "download" in save_link
                , click = function(node) {
            var event = doc.createEvent("MouseEvents");
            event.initMouseEvent(
                    "click", true, false, view, 0, 0, 0, 0, 0
                    , false, false, false, false, 0, null
                    );
            node.dispatchEvent(event);
        }
        , webkit_req_fs = view.webkitRequestFileSystem
                , req_fs = view.requestFileSystem || webkit_req_fs || view.mozRequestFileSystem
                , throw_outside = function(ex) {
            (view.setImmediate || view.setTimeout)(function() {
                throw ex;
            }, 0);
        }
        , force_saveable_type = "application/octet-stream"
                , fs_min_size = 0
                , deletion_queue = []
                , process_deletion_queue = function() {
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
        , dispatch = function(filesaver, event_types, event) {
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
        , FileSaver = function(blob, name) {
            // First try a.download, then web filesystem, then object URLs
            var
                    filesaver = this
                    , type = blob.type
                    , blob_changed = false
                    , object_url
                    , target_view
                    , get_object_url = function() {
                var object_url = get_URL().createObjectURL(blob);
                deletion_queue.push(object_url);
                return object_url;
            }
            , dispatch_all = function() {
                dispatch(filesaver, "writestart progress write writeend".split(" "));
            }
            // on any filesys errors revert to saving with object URLs
            , fs_error = function() {
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
            }
            , abortable = function(func) {
                return function() {
                    if (filesaver.readyState !== filesaver.DONE) {
                        return func.apply(this, arguments);
                    }
                    else {
                        return null;
                    }
                };
            }
            , create_if_not_found = {create: true, exclusive: false}
            , slice
                    ;
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
        , FS_proto = FileSaver.prototype
                , saveAs = function(blob, name) {
            return new FileSaver(blob, name);
        }
        ;
        FS_proto.abort = function() {
            var filesaver = this;
            filesaver.readyState = filesaver.DONE;
            dispatch(filesaver, "abort");
        };
        FS_proto.readyState = FS_proto.INIT = 0;
        FS_proto.WRITING = 1;
        FS_proto.DONE = 2;

        FS_proto.error =
                FS_proto.onwritestart =
                FS_proto.onprogress =
                FS_proto.onwrite =
                FS_proto.onabort =
                FS_proto.onerror =
                FS_proto.onwriteend =
                null;

        view.addEventListener("unload", process_deletion_queue, false);
        return saveAs;
    }(self));

    return saveAs;
})();