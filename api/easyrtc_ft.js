/**
 * Establish an area as a drag-n-drop drop site for files.
 * @param {DOMString} droptargetName - the id of the drag-and-drop site or the actual DOM object.
 * @param {Function} filesHandler - function that accepts an array of File's.
 */
easyrtc_ft = {};

easyrtc_ft.buildDragNDropRegion = function(droptargetName, filesHandler) {
    var droptarget;
    if (typeof droptargetName === 'String') {
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
            filesHandler(files);
        }
        return ignore(e);
    }


    var dropCueClass = "easyrtc_filedrop";

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
    }

    function removeClass(target, classname) {
        if (!target.className) {
            return;
        }
        target.className = target.className.replace(classname, "").replace("  ", " ");
    }
}
/**
 * Builds a function that can be used to send a group of files to a peer.
 * @param {String} destUser easyrtcId of the person being sent to.
 * @param {Function} progressListener - if provided, is called with the following objects:
 *    {status:"waiting"}  // once a file offer has been sent but not accepted or rejected yet
 *    {status:"working", position:position_in_file, size:size_of_current_file, numFiles:number_of_files_left} 
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
    var filePosition = 0;
    var filesOffered = [];
    var filesBeingSent = [];
    var sendStarted = false;
    var curFile = null;
    var curFileSize;
    var filesAreBinary;


    if (!progressListener) {
        progressListener = function() {
            return true;
        };
    }

    //
    // if a file offer is rejected, we delete references to it.
    //
    function fileOfferRejected(sender, msgType, msgData, targeting) {
        if (!msgData.seq)
            return;
        delete filesOffered[msgData.seq];
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
        sendStarted = false;
    }


    easyrtc.setPeerListener(fileOfferRejected, "files_reject", destUser);
    easyrtc.setPeerListener(fileOfferAccepted, "files_accept", destUser);
    easyrtc.setPeerListener(fileCancelReceived, destUser, "files_cancel");



    var maxChunkSize = 50000;
    var outseq = 0;

    function sendChunk() {
        if (!curFile) {
            if (filesBeingSent.length === 0) {
                outseq = 0;
                easyrtc.sendDataP2P(destUser, "files_chunk", {done: "all"});
                progressListener({status: "done"});
                return;
            }
            else {
                curFile = filesBeingSent.pop();
                curFileSize = curFile.size;
                easyrtc.sendDataP2P(destUser, "files_chunk", {name: curFile.name, type: curFile.type, outseq: outseq, size: curFile.size});
                outseq++;
            }
        }

        var amountToRead = Math.min(maxChunkSize, curFileSize - filePosition);
        if (!progressListener({status: "working", name: curFile.name, position: filePosition, size: curFileSize, numFiles: filesOffered.length})) {
            filesOffered.length = 0;
            filePosition = 0;
            easyrtc.sendDataP2P(destUser, "files_chunk", {done: "cancelled"});
            return;
        }

        var nextLocation = filePosition + amountToRead;
        var blobSlice = curFile.slice(filePosition, nextLocation);
        var reader = new FileReader();
        reader.onloadend = function(evt) {
            if (evt.target.readyState == FileReader.DONE) { // DONE == 2
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
                    var packetObject = { outseq: outseq };
                    if( filesAreBinary) {
                        packetObject.data64 =  btoa(packetData);
                    }
                    else {
                        packetObject.datatxt =  packetData;
                    }
                    easyrtc.sendDataP2P(destUser, "files_chunk", packetObject);
                    outseq++;
                }
                if (nextLocation >= curFileSize) {
                    easyrtc.sendDataP2P(destUser, "files_chunk", {done: "file"});
                }
                sendChunk();
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

    function sendFilesOffer(files, areBinary) {
        filesAreBinary = areBinary;
        progressListener({status: "waiting"});
        var fileNameList = [];
        for (var i = 0; i < files.length; i++) {
            fileNameList[i] = {name: files[i].name, size: files[i].size};
        }
        seq++;
        filesOffered[seq] = files;
        easyrtc.sendDataWS(destUser, "files_offer", {seq: seq, fileNameList: fileNameList});
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
 * {status:"started"}
 * {status:"progress" name:filename,
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

    function fileOfferHandler(otherGuy, msgType, msgData) {
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
                easyrtc.sendDataWS(otherGuy, "files_accept", {seq: msgData.seq}, ackHandler);
            }
            else {
                easyrtc.sendDataWS(otherGuy, "files_reject", {seq: msgData.seq});
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
            userStream.currentFileName = msgData.name;
            userStream.currentFileType = msgData.type;
            userStream.lengthReceived = 0;
            userStream.lengthExpected = msgData.size;
            userStream.currentData = [];
        }
        else if (msgData.data64 || msgData.datatxt) {            
            var binData;
            if( msgData.data64) {
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
        }
        else {
            console.log("Unexpected data structure in files_chunk=", msgData);
        }
    }

    easyrtc.setPeerListener(fileOfferHandler, "files_offer");
    easyrtc.setPeerListener(fileChunkHandler, "files_chunk");
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