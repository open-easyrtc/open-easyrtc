/* global define, module, require, console */
/*!
  Script: easyrtc_rates.js

    This code builds sdp filter functions

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
            throw new Error("easyrtc_rates requires easyrtc");
        }
        root.easyrtc = factory(window.easyrtc);
  }
}(this, function (easyrtc, undefined) {

"use strict";
    /**
     * Provides methods for building SDP filters. SDP filters can be used
     * to control bit rates.
     * @class Easyrtc_Rates
     */

    function buildSdpFilter(options, isLocal) {

        var audioSendBitrate = options.audioSendBitrate;
        var audioRecvBitrate = options.audioRecvBitrate;
        var videoRecvBitrate = options.videoRecvBitrate;
        var videoSendBitrate = options.videoSendBitrate;
        var videoSendInitialBitrate = options.videoSendInitialBitrate;
        var audioSendCodec = options.audioSendCodec || '';
        var audioRecvCodec = options.audioRecvCodec || '';
        var videoSendCodec = options.videoSendCodec || '';
        var videoRecvCodec = options.videoRecvCodec || '';
        var stereo = options.stereo;
        function trace(arg) {
            console.log("trace:" + arg);
        }
        // these functions were cribbed from the google apprtc.appspot.com demo.

        function findLineInRange(sdpLines, startLine, endLine, prefix, substr) {
            var realEndLine = endLine !== -1 ? endLine : sdpLines.length;
            for (var i = startLine; i < realEndLine; ++i) {
                if (sdpLines[i].indexOf(prefix) === 0) {
                    if (!substr || sdpLines[i].toLowerCase().indexOf(substr.toLowerCase()) !== -1) {
                        return i;
                    }
                }
            }
            return null;
        }

        function findLine(sdpLines, prefix, substr) {
            return findLineInRange(sdpLines, 0, -1, prefix, substr);
        }

        function preferBitRate(sdp, bitrate, mediaType) {
            var sdpLines = sdp.split('\r\n');
            var mLineIndex = findLine(sdpLines, 'm=', mediaType);
            if (mLineIndex === null) {
                trace('Failed to add bandwidth line to sdp, as no m-line found');
                return sdp;
            }
            var nextMLineIndex = findLineInRange(sdpLines, mLineIndex + 1, -1, 'm=');
            if (nextMLineIndex === null) {
                nextMLineIndex = sdpLines.length;
            }
            var cLineIndex = findLineInRange(sdpLines, mLineIndex + 1, nextMLineIndex, 'c=');
            if (cLineIndex === null) {
                trace('Failed to add bandwidth line to sdp, as no c-line found');
                return sdp;
            }
            var bLineIndex = findLineInRange(sdpLines, cLineIndex + 1, nextMLineIndex, 'b=AS');
            if (bLineIndex) {
                sdpLines.splice(bLineIndex, 1);
            }
            var bwLine = 'b=AS:' + bitrate;
            sdpLines.splice(cLineIndex + 1, 0, bwLine);
            sdp = sdpLines.join('\r\n');
            return sdp;
        }

        function setDefaultCodec(mLine, payload) {
            var elements = mLine.split(' ');
            var newLine = [];
            var index = 0;
            for (var i = 0; i < elements.length; i++) {
                if (index === 3) {
                    newLine[index++] = payload;
                }
                if (elements[i] !== payload) {
                    newLine[index++] = elements[i];
                }
            }
            return newLine.join(' ');
        }

        function maybeSetAudioSendBitRate(sdp) {
            if (!audioSendBitrate) {
                return sdp;
            }
            trace('Prefer audio send bitrate: ' + audioSendBitrate);
            return preferBitRate(sdp, audioSendBitrate, 'audio');
        }

        function maybeSetAudioReceiveBitRate(sdp) {
            if (!audioRecvBitrate) {
                return sdp;
            }
            trace('Prefer audio receive bitrate: ' + audioRecvBitrate);
            return preferBitRate(sdp, audioRecvBitrate, 'audio');
        }

        function maybeSetVideoSendBitRate(sdp) {
            if (!videoSendBitrate) {
                return sdp;
            }
            trace('Prefer video send bitrate: ' + videoSendBitrate);
            return preferBitRate(sdp, videoSendBitrate, 'video');
        }

        function maybeSetVideoReceiveBitRate(sdp) {
            if (!videoRecvBitrate) {
                return sdp;
            }
            trace('Prefer video receive bitrate: ' + videoRecvBitrate);
            return preferBitRate(sdp, videoRecvBitrate, 'video');
        }
        
        function getCodecPayloadType(sdpLine) {
            var pattern = new RegExp('a=rtpmap:(\\d+) \\w+\\/\\d+');
            var result = sdpLine.match(pattern);
            return (result && result.length === 2) ? result[1] : null;
        }

        function maybeSetVideoSendInitialBitRate(sdp) {
            if (!videoSendInitialBitrate) {
                return sdp;
            }
            var maxBitrate = videoSendInitialBitrate;
            if (videoSendBitrate) {
                if (videoSendInitialBitrate > videoSendBitrate) {
                    trace('Clamping initial bitrate to max bitrate of ' + videoSendBitrate + ' kbps.');
                    videoSendInitialBitrate = videoSendBitrate;
                }
                maxBitrate = videoSendBitrate;
            }
            var sdpLines = sdp.split('\r\n');
            var mLineIndex = findLine(sdpLines, 'm=', 'video');
            if (mLineIndex === null) {
                trace('Failed to find video m-line');
                return sdp;
            }
            var vp8RtpmapIndex = findLine(sdpLines, 'a=rtpmap', 'VP8/90000');
            var vp8Payload = getCodecPayloadType(sdpLines[vp8RtpmapIndex]);
            var vp8Fmtp = 'a=fmtp:' + vp8Payload + ' x-google-min-bitrate=' + videoSendInitialBitrate.toString() + '; x-google-max-bitrate=' + maxBitrate.toString();
            sdpLines.splice(vp8RtpmapIndex + 1, 0, vp8Fmtp);
            return sdpLines.join('\r\n');
        }

        function preferCodec(sdp, codec, codecType){
            var sdpLines = sdp.split('\r\n');
            var mLineIndex = findLine(sdpLines, 'm=', codecType);
            if (mLineIndex === null) {
                return sdp;
            }
            //
            // there are two m= lines in the sdp, one for audio, one for video.
            // the audio one comes first. when we search for codecs for audio, we
            // want stop before we enter the section for video, hence we'll hunt 
            // for that subsequent m= line before we look for codecs. Otherwise,
            // you could ask for a audio codec of VP9.
            //
            var mBottom = findLineInRange(sdpLines, mLineIndex+1, -1, "m=") || -1;

            var codecIndex = findLineInRange(sdpLines, mLineIndex, mBottom, 'a=rtpmap', codec);
            if (codecIndex) {
                var payload = getCodecPayloadType(sdpLines[codecIndex]);
                if (payload) {
                    sdpLines[mLineIndex] = setDefaultCodec(sdpLines[mLineIndex], payload);
                }
            }
            sdp = sdpLines.join('\r\n');
            return sdp;
        } 

        function maybePreferVideoSendCodec(sdp) {
            if (videoSendCodec === '') {
                trace('No preference on video send codec.');
                return sdp;
            }
            trace('Prefer video send codec: ' + videoSendCodec);
            return preferCodec(sdp, videoSendCodec, 'video');
        }

        function maybePreferVideoReceiveCodec(sdp) {
            if (videoRecvCodec === '') {
                trace('No preference on video receive codec.');
                return sdp;
            }
            trace('Prefer video receive codec: ' + videoRecvCodec);
            return preferCodec(sdp, videoRecvCodec,'video');
        } 

        function maybePreferAudioSendCodec(sdp) {
            if (audioSendCodec === '') {
                trace('No preference on audio send codec.');
                return sdp;
            }
            trace('Prefer audio send codec: ' + audioSendCodec);
            return preferCodec(sdp, audioSendCodec, 'audio');
        }

        function maybePreferAudioReceiveCodec(sdp) {
            if (audioRecvCodec === '') {
                trace('No preference on audio receive codec.');
                return sdp;
            }
            trace('Prefer audio receive codec: ' + audioRecvCodec);
            return preferCodec(sdp, audioRecvCodec, 'audio');
        } 

        function addStereo(sdp) {
            var sdpLines = sdp.split('\r\n');
            var opusIndex = findLine(sdpLines, 'a=rtpmap', 'opus/48000');
            var opusPayload;
            if (opusIndex) {
                opusPayload = getCodecPayloadType(sdpLines[opusIndex]);
            }
            var fmtpLineIndex = findLine(sdpLines, 'a=fmtp:' + opusPayload.toString());
            if (fmtpLineIndex === null) {
                return sdp;
            }
            sdpLines[fmtpLineIndex] = sdpLines[fmtpLineIndex].concat('; stereo=1');
            sdp = sdpLines.join('\r\n');
            return sdp;
        }

        if( isLocal ) {
            return function(insdp) {
                console.log("modifying local sdp");
                var sdp;
                sdp = maybePreferAudioReceiveCodec(insdp);
                sdp = maybePreferVideoReceiveCodec(insdp);
                sdp = maybeSetAudioReceiveBitRate(sdp);
                sdp = maybeSetVideoReceiveBitRate(sdp);
                //if( sdp != insdp ) {
                //    console.log("changed the sdp from \n" + insdp + "\nto\n" + sdp);
                //}
                return sdp;
            };
        }
        else {
            return function(insdp) {
                console.log("modifying remote sdp");
                var sdp;
                sdp = maybePreferAudioSendCodec(insdp);
                sdp = maybePreferVideoSendCodec(insdp);
                sdp = maybeSetAudioSendBitRate(sdp);
                sdp = maybeSetVideoSendBitRate(sdp);
                sdp = maybeSetVideoSendInitialBitRate(sdp);
                if (stereo) {
                    sdp = addStereo(sdp);
                }
                //if( sdp != insdp ) {
                //    console.log("changed the sdp from \n" + insdp + "\nto\n" + sdp);
                //}
                return sdp;
            };
        }
    }

    /**
     *  This function returns an sdp filter function.
     * @function
     * @memberOf Easyrtc_Rates
     * @param options A map that optionally includes values for the following keys: audioRecvCodec, audioRecvBitrate, videoRecvBitrate, videoRecvCodec
     * @returns {Function} which takes an SDP string and returns a modified SDP string.
     */
    easyrtc.buildLocalSdpFilter = function (options) {
        return buildSdpFilter(options, true);
    };

    /**
     * This function returns an sdp filter function.
     * @function
     * @memberOf Easyrtc_Rates
     * @param options A map that optionally includes values for the following keys: stereo, audioSendCodec, audioSendBitrate, videoSendBitrate, videoSendInitialBitRate, videoRecvCodec
     * @returns {Function} which takes an SDP string and returns a modified SDP string.
     */
    easyrtc.buildRemoteSdpFilter = function(options) {
        return buildSdpFilter(options, false);
    };

return easyrtc;

}));
