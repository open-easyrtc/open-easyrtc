//
// This code builds sdp filter functions
(function () {

    function buildSdpFilter(options, isLocal) {

        var audioSendBitrate = options.audioSendBitrate;
        var audioRecvBitrate = options.audioRecvBitrate;
        var videoSendBitrate = options.videoSendBitrate;
        var videoRecvBitrate = options.videoRecvBitrate;
        var videoSendBitrate = options.videoSendBitrate;
        var videoSendInitialBitrate = options.videoSendInitialBitrate;
        var audioSendCodec = options.audioSendCodec || '';
        var audioRecvCodec = options.audioRecvCodec || '';
        var stereo = options.stereo;
        function trace(arg) {
            console.log("trace:" + arg);
        }
        // these functions were cribbed from the google apprtc.appspot.com demo.

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

        function preferBitRate(sdp, bitrate, mediaType) {
            var sdpLines = sdp.split('\r\n');
            var mLineIndex = findLine(sdpLines, 'm=', mediaType);
            if (mLineIndex === null) {
                messageError('Failed to add bandwidth line to sdp, as no m-line found');
                return sdp;
            }
            var nextMLineIndex = findLineInRange(sdpLines, mLineIndex + 1, -1, 'm=');
            if (nextMLineIndex === null) {
                nextMLineIndex = sdpLines.length;
            }
            var cLineIndex = findLineInRange(sdpLines, mLineIndex + 1, nextMLineIndex, 'c=');
            if (cLineIndex === null) {
                messageError('Failed to add bandwidth line to sdp, as no c-line found');
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

        function maybeSetVideoSendInitialBitRate(sdp) {
            if (!videoSendInitialBitrate) {
                return sdp;
            }
            var maxBitrate = videoSendInitialBitrate;
            if (videoSendBitrate) {
                if (videoSendInitialBitrate > videoSendBitrate) {
                    messageError('Clamping initial bitrate to max bitrate of ' + videoSendBitrate + ' kbps.');
                    videoSendInitialBitrate = videoSendBitrate;
                }
                maxBitrate = videoSendBitrate;
            }
            var sdpLines = sdp.split('\r\n');
            var mLineIndex = findLine(sdpLines, 'm=', 'video');
            if (mLineIndex === null) {
                messageError('Failed to find video m-line');
                return sdp;
            }
            var vp8RtpmapIndex = findLine(sdpLines, 'a=rtpmap', 'VP8/90000');
            var vp8Payload = getCodecPayloadType(sdpLines[vp8RtpmapIndex]);
            var vp8Fmtp = 'a=fmtp:' + vp8Payload + ' x-google-min-bitrate=' + videoSendInitialBitrate.toString() + '; x-google-max-bitrate=' + maxBitrate.toString();
            sdpLines.splice(vp8RtpmapIndex + 1, 0, vp8Fmtp);
            return sdpLines.join('\r\n');
        }

        function maybePreferAudioSendCodec(sdp) {
            if (audioSendCodec === '') {
                trace('No preference on audio send codec.');
                return sdp;
            }
            trace('Prefer audio send codec: ' + audioSendCodec);
            return preferAudioCodec(sdp, audioSendCodec);
        }

        function maybePreferAudioReceiveCodec(sdp) {
            if (audioRecvCodec === '') {
                trace('No preference on audio receive codec.');
                return sdp;
            }
            trace('Prefer audio receive codec: ' + audioRecvCodec);
            return preferAudioCodec(sdp, audioRecvCodec);
        }

        function preferAudioCodec(sdp, codec) {
            var sdpLines = sdp.split('\r\n');
            var mLineIndex = findLine(sdpLines, 'm=', 'audio');
            if (mLineIndex === null) {
                return sdp;
            }
            var codecIndex = findLine(sdpLines, 'a=rtpmap', codec);
            if (codecIndex) {
                var payload = getCodecPayloadType(sdpLines[codecIndex]);
                if (payload) {
                    sdpLines[mLineIndex] = setDefaultCodec(sdpLines[mLineIndex], payload);
                }
            }
            sdp = sdpLines.join('\r\n');
            return sdp;
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

        function findLine(sdpLines, prefix, substr) {
            return findLineInRange(sdpLines, 0, -1, prefix, substr);
        }

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

        function getCodecPayloadType(sdpLine) {
            var pattern = new RegExp('a=rtpmap:(\\d+) \\w+\\/\\d+');
            var result = sdpLine.match(pattern);
            return (result && result.length === 2) ? result[1] : null;
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



        if( isLocal ) {
            return function(insdp) {
                console.log("modifying local sdp");
                var sdp;
                sdp = maybePreferAudioReceiveCodec(insdp);
                sdp = maybeSetAudioReceiveBitRate(sdp);
                sdp = maybeSetVideoReceiveBitRate(sdp);
                if( sdp != insdp ) {
                    console.log("changed the sdp from \n" + insdp + "\nto\n" + sdp);
                }
                return sdp;
            };
        }
        else {
            return function(insdp) {
                console.log("modifying remote sdp");
                if (stereo) {
                    sdp = addStereo(sdp);
                }
                var sdp = maybePreferAudioSendCodec(insdp);
                sdp = maybeSetAudioSendBitRate(sdp);
                sdp = maybeSetVideoSendBitRate(sdp);
                sdp = maybeSetVideoSendInitialBitRate(sdp);
                if( sdp != insdp ) {
                    console.log("changed the sdp from \n" + insdp + "\nto\n" + sdp);
                }
                return sdp;
            };
        }

    }

    /**
     *  This function returns an sdp filter function.
     * @param options A map that optionally includes values for the following keys: audioRecvCodec, audioRecvBitrate, videoRecvBitrate
     * @returns {Function} which takes an SDP string and returns a modified SDP string.
     */
    easyrtc.buildLocalSdpFilter = function (options) {
        return buildSdpFilter(options, true);
    }

    /**
     *  This function returns an sdp filter function.
     * @param options A map that optionally includes values for the following keys: stereo, audioSendCodec, audioSendBitrate, videoSendBitrate, videoSendInitialBitRate
     * @returns {Function} which takes an SDP string and returns a modified SDP string.
     */
    easyrtc.buildRemoteSdpFilter = function(options) {
        return buildSdpFilter(options, false);
    }
})();


