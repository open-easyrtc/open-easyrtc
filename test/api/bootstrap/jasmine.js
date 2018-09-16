/*
  Script: jasmine.js

    This file is part of EasyRTC.
*/
/*global
    require
*/
require.config({

    // Jasmin serves files under /,
    // which is the basePath from your html file
    baseUrl: '',

    paths: {
        // Externals
        'jasmine': 'bower_components/jasmine/lib/jasmine-core/jasmine',
        'jasmine-html': 'bower_components/jasmine/lib/jasmine-core/jasmine-html',
        'boot': 'bower_components/jasmine/lib/jasmine-core/boot',
        'socket.io': 'bower_components/socket.io-client/dist/socket.io',
        'webrtc-adapter': 'bower_components/webrtc-adapter/release/adapter',

        // Internals
        "easyrtc_lang": "easyrtc_lang",
        "easyrtc_int": "easyrtc_int",
        "easyrtc_ft": "easyrtc_ft",
        "easy_app": "easyrtc_app",
        "easyrtc": "easyrtc",

        // Internals

        // Spec
        "spec": "spec"
    },

    // Dynamically load all spec modules
    deps: [
        'boot'
    ],

    shim: {
        'jasmine': {
            exports: 'window.jasmineRequire'
        },
        'jasmine-html': {
            deps: ['jasmine'],
            exports: 'window.jasmineRequire'
        },
        'boot': {
            deps: ['jasmine', 'jasmine-html'],
            exports: 'window.jasmineRequire'
        },
        'webrtc-adapter': {
            exports: 'adapter'
        }
    },

    // We have to kick of jasmine, as it is asynchronous
    callback: function () {

        // Load the specs
        require(['spec/index'], function () {

            // Initialize the HTML Reporter and execute the environment (setup by `boot.js`)
            window.onload();
        });
    }
});