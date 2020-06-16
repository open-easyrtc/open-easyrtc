/*
  Script: adapter.js

    This file is part of EasyRTC.
*/
/*global
    define, describe, it, expect
*/
define(['webrtc-adapter'], function(easyrtc) {
    'use strict';

    describe("adapter", function() {
        describe('RTCPeerConnection', function() {
            it('should be a function', function(done) {
                expect(typeof RTCPeerConnection).toBe('function');
                done();
            });

            it('should works', function (done) {
                // http://w3c-test.org/webrtc/datachannel-emptystring.html
                var pc1 = new RTCPeerConnection(),
                    pc2 = new RTCPeerConnection();

                navigator.mediaDevices.getUserMedia({
                  video: true,
                  audio: true
                }).then(function (stream) {
                  return pc1.addStream(stream);
                }).catch(log);

                var add = function add(pc, can) {
                  return can && pc.addIceCandidate(can).catch(log);
                };
                pc1.onicecandidate = function (e) {
                  return add(pc2, e.candidate);
                };
                pc2.onicecandidate = function (e) {
                  return add(pc1, e.candidate);
                };

                pc2.onaddstream = function (e) {
                  return e.stream;
                };
                pc1.oniceconnectionstatechange = function (e) {
                  if (pc1.iceConnectionState === 'connected') {
                    done();
                  }
                  return log(pc1.iceConnectionState);
                };
                pc1.onnegotiationneeded = function (e) {
                  return pc1.createOffer().then(function (d) {
                    return pc1.setLocalDescription(d);
                  }).then(function () {
                    return pc2.setRemoteDescription(pc1.localDescription);
                  }).then(function () {
                    return pc2.createAnswer();
                  }).then(function (d) {
                    return pc2.setLocalDescription(d);
                  }).then(function () {
                    return pc1.setRemoteDescription(pc2.localDescription);
                  }).catch(log);
                };

                var log = function log(msg) {
                  //return console.log(msg);
                };

                expect(typeof window).toBe('object');
            });
        });

        describe('navigator.getUserMedia', function() {
            it('should be a function', function(done) {
                expect(typeof navigator.mediaDevices.getUserMedia).toBe('function');
                done();
            });
        });
    });
});