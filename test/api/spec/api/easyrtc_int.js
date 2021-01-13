/*
  Script: easyrtc_int.js

    This file is part of EasyRTC.
*/


/*global
    define, describe, it, expect
*/

define(['easyrtc_int'], function (easyrtc) {
    'use strict';

    describe("easyrtc_int", function () {

        describe('apiVersion', function () {
            it('should be a string', function (done) {
                expect(typeof easyrtc.apiVersion).toBe('string');
                done();
            });
        });

        describe('supportsGetUserMedia', function () {
            it('should be a function', function (done) {
                expect(typeof easyrtc.supportsGetUserMedia).toBe('function');
                done();
            });

            it('should return boolean', function (done) {
                expect(typeof easyrtc.supportsGetUserMedia()).toBe('boolean');
                done();
            });
        });

        describe('supportsPeerConnections', function () {
            it('should be a function', function (done) {
                expect(typeof easyrtc.supportsPeerConnections).toBe('function');
                done();
            });

            it('should return boolean', function (done) {
                expect(typeof easyrtc.supportsPeerConnections()).toBe('boolean');
                done();
            });
        });

        describe('initMediaSource', function () {
            it('should be a function', function (done) {
                expect(typeof easyrtc.initMediaSource).toBe('function');
                done();
            });

            it('should return undefined cand call Success or Error callback', function (done) {
                function success(mediastream) {
                    expect(typeof mediastream).not.toBe('undefined');
                    easyrtc.closeLocalStream();
                    done();
                }

                function fail(errorCode, errorText) {
                    expect(typeof errorCode).toBe('string');
                    expect(typeof errorText).toBe('string');
                    done();
                }
                expect(typeof easyrtc.initMediaSource(success, fail)).toBe('undefined');
            });
        });
    });
});

