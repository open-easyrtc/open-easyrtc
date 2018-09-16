/**
 * Created by eric on 16/11/16.
 */

declare interface Easyrtc_ft_options {
    maxPacketSize ?: number;
    maxChunkSize ?: number;
    ackThreshold ?: number;
}

declare interface Easyrtc_ft_status {
    status :string;
}

/**
 * A canceller function can be used to cancel the sending of a block of files.
 */
declare type Easyrtc_ft_canceller = ()=>void;

/**
 * A file sender is used to send a block of files. The file sender returns a canceller function.
 */
declare type Easyrtc_ft_filesSender = (files:File[], areBinary:boolean)=>Easyrtc_ft_canceller;

declare type Easyrtc_ft_acceptRejectCB = (otherguy:string, filenamelist:string[], wasAccepted:(boolean)=>void)=>void;

declare type Easyrtc_ft_blobAcceptor = (otherguy:string, blob:Blob, filename:string)=>void;


declare var easyrtc_ft: {
    errorCodes: {
        DATA_LOST: string,
        INVALID_DATA: string,
        DROP_FILE: string
    },

    /**
     * Establish an area as a drag-n-drop drop site for files.
     * @param {DOMString} droptargetName - the id of the drag-and-drop site or the actual DOM object.
     * @param {Function} filesHandler - function that accepts an array of File's.
     */
    buildDragNDropRegion:(droptargetname:string, filesHandlers:(files:File[])=>void)=>void;

    /**
     * Builds a function that can be used to send a group of files to a peer.
     * @param {String} destUser easyrtcid of the person being sent to.
     * @param progressListener - if provided, is called with the following objects:
     *    {status:"waiting"}  // once a file offer has been sent but not accepted or rejected yet
     *    {status:"started_file", name: filename}
     *    {status:"working", name:filename, position:position_in_file, size:size_of_current_file, numFiles:number_of_files_left}
     *    {status:"cancelled"}  // if the remote user cancels the sending
     *    {status:"done"}       // when the file is done
     *    the progressListener should always return true for normal operation, false to cancel a filetransfer.
     * @return a function that accepts an array of File (the Files to be sent), and a boolean
     * @param  options - overide default file transfer settings
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
    buildFileSender:(destUser:string,
                     progressListener:(Easyrtc_ft_status)=>boolean, options?:Easyrtc_ft_options)=>Easyrtc_ft_filesSender;


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
    buildFileReceiver:(acceptRejectCB:Easyrtc_ft_acceptRejectCB,
                       blobAcceptor:Easyrtc_ft_blobAcceptor,
                       statusCB:(otherGuy:string, Easyrtc_ft_status)=>void,
                       options ?: {[key:string]:any})=>void;
    /** This is a wrapper around Eli Grey's saveAs function. This saves to the browser's downloads directory.
     * @param {Blob} Blob - the data to be saved.
     * @param {String} filename - the name of the file the blob should be written to.
     */

    /** This is a wrapper around Eli Grey's saveAs function. This saves to the browser's downloads directory.
     * @param {Blob} Blob - the data to be saved.
     * @param {String} filename - the name of the file the blob should be written to.
     */
    saveAs:(blob:Blob, filename:string)=>void;

}


