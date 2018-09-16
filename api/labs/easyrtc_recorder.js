/* global define, module, require, console, MediaRecorder */
/*!
  Script: easyrtc_recorder.js

    This code demonstrate recording of local and remote streams.

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
            throw new Error("easyrtc_recorder requires easyrtc");
        }
        root.easyrtc = factory(window.easyrtc);
  }
}(this, function (easyrtc, undefined) {

"use strict";

  /**
   * Provides methods for building MediaStream recorders.
   * @class Easyrtc_Recorder
   */
  function trace(message, obj) {
      if (easyrtc.debugPrinter) {
          easyrtc.debugPrinter(message, obj);
      }
  }

  /**
   * Determines if recording is supported by the browser. 
   * @function
   * @memberOf Easyrtc_Recorder
   * @returns true if recording is supported.
   */
  easyrtc.supportsRecording = function() {
      return (typeof MediaRecorder !== "undefined" && navigator.getUserMedia );
  };

  /**
  * Check if a particular codec can be used for recording.
  * @function
  * @memberOf Easyrtc_Recorder
  * @param {String} codecName, either "vp8" or "vp9 or "h264"
  * @returns true if the type can be used, or if the browser doesn't
  *  support a method to find out.
  */ 
  easyrtc.isRecordingTypeSupported = function(videoCodecName) {
     var mimeType = "video/webm;codecs=" + videoCodecName;
     if( MediaRecorder.isTypeSupported ) {
         // chrome definitely, maybe firefox
         return MediaRecorder.isTypeSupported(mimeType);
     }
     else if( MediaRecorder.isMimeTypeSupported ) {
         // maybe firefox
         return MediaRecorder.isMimeTypeSupported(mimeType);
     }
     else {
        if( typeof easyrtc.hasNoRecordTypeCheck === "undefined") {
           easyrtc.hasNoRecordTypeCheck = true;
           window.alert("This browser doesn't know what media types it supports. Assuming all types.");
        }
        return true;
     }
  };

  var mimeType;
  var audioBitRate;
  var videoBitRate;

  /**
   * Set the desired codec for the video encoding. 
   * @function
   * @memberOf Easyrtc_Recorder
   * @param {String} codecName, either "vp8" or "vp9 or "h264"
   * @returns true if the type can be used.
   */ 
  easyrtc.setRecordingVideoCodec = function(videoCodecName) {
     if( !easyrtc.supportsRecording ) {
         return false;
     }
     if(easyrtc.isRecordingTypeSupported(videoCodecName)) {
         mimeType = "video/webm;codecs=" + videoCodecName;
         return true;
     }
     else {
        return false;
     }
  };

  /** Sets the target bit rate of the audio encoder. 
   * @param bitrate bits per second
   */
  easyrtc.setRecordingAudioBitRate = function(bitRate) {
    audioBitRate = bitRate;
  };

  /** Sets the target bit rate of the video encoder. 
   * @param bitrate bits per second
   */
  easyrtc.setRecordingVideoBitRate = function(bitRate) {
    videoBitRate = bitRate;
  };

  if( easyrtc.supportsRecording()) {
     easyrtc.setRecordingVideoCodec("vp8");
  }

  /**
   * Create a recording object and attach a media stream to it.
   * @function
   * @memberOf Easyrtc_Recorder
   * @param  {HTMLMediaStream} mediaStream 
   * @returns a recorder object or null if recording not supported.
   */
  function startRecording( mediaStream) {

      if( !easyrtc.supportsRecording ) {
         trace("recording not supported by your browser");
         return null;
      }

      var recorderOptions = { mimeType:mimeType};

      if( audioBitRate ) {
             recorderOptions.audioBitsPerSecond = audioBitRate;
      }

      if( videoBitRate ) {
             recorderOptions.videoBitsPerSecond = videoBitRate;
      }

      var mediaRecorder = new MediaRecorder(mediaStream, recorderOptions);
      if( !mediaRecorder ) {
         trace("no media recorder");
         return;
      }
      mediaRecorder.start();

      mediaRecorder.onerror = function(e) {
         trace("Media recording error:", e);
      };

      mediaRecorder.onwarning = function(e) {
         trace("Media recording error:", e);
      };

      mediaRecorder.onstart = function(e) {
         trace("Media recording started");
      };

      mediaRecorder.onstop = function(e) {
         trace("Media recording stopped");
      };

      return mediaRecorder;
  }

  /** This method creates a media recorder and populates it's ondataavailable
   * method so that your own callback gets called with the data.
   * Use the media recorder's start(), stop(), pause() and resume() methods
   * on the returned object.
   * @function
   * @memberOf Easyrtc_Recorder
   * @param {HTMLMediaStream} mediaStream a local or remote media stream.
   * @param {Function} dataCallback a function to receive the webm data from.
   */
  easyrtc.recordToCallback = function (mediaStream, dataCallback) {
     var mediaRecorder = startRecording(mediaStream);
     if( !mediaRecorder) {
         return null;
     }

     mediaRecorder.ondataavailable = function(e) {
         dataCallback(e.data);
     };

     return mediaRecorder;
  };

  /** This method creates a media recorder that builds a blob 
  * Use the media recorder's start(), stop(), pause() and resume() methods
  * on the returned object.
  * @function
  * @memberOf Easyrtc_Recorder
  * @param  {HTMLMediaStream} mediaStream a local or remote media stream.
  * @param {Function} blobCallback a callback function that gets called with a
  *    blob once you invoke the stop method.
  **/
  easyrtc.recordToBlob = function(mediaStream, blobCallback) {
     var chunks = [];

     function dataConsumer(chunk) {
        chunks.push(chunk);
     }

     var mediaRecorder = easyrtc.recordToCallback(mediaStream,
            dataConsumer);

     if( !mediaRecorder) {
         return null;
     }

     mediaRecorder.onstop = function() {
          blobCallback( new Blob(chunks, {type:"video/webm"}));
          chunks = [];
     };
     
     return mediaRecorder;
  };

  /** This method creates a media recorder that builds a file.
  * Use the media recorder's start(), stop(), pause() and resume() methods
  * on the returned object.
  * @function
  * @memberOf Easyrtc_Recorder
  * @param {HTMLMediaStream} a local or remote media stream.
  * @param {Object} downloadLink an anchor tag to attach the file to.
  * @param {String} basename the name of the file. A .webm will be appended
  *    to the file if its not already present. The file doesn't get written
  *    until you call the mediaRecorder's stop method.
  **/
  easyrtc.recordToFile = function(mediaStream, downloadLink, basename) {
     function blobCallback( blob ) {
         var videoURL = window.URL.createObjectURL(blob);
        
         downloadLink.href = videoURL;
         downloadLink.appendChild(document.createTextNode(basename));

         var name = basename + ((basename.indexOf(".webm")>0)?"": ".webm") ;
         downloadLink.setAttribute( "download", name);
         downloadLink.setAttribute( "name", name);
     }

     downloadLink.innerHTML = "";
     var mediaRecorder = easyrtc.recordToBlob(mediaStream, blobCallback);
     return mediaRecorder;
  };

return easyrtc;

}));

