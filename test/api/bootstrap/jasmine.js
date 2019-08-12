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
        'jasmine': 'node_modules/jasmine-core/lib/jasmine-core/jasmine',
        'jasmine-html': 'node_modules/jasmine-core/lib/jasmine-core/jasmine-html',
        'boot': 'node_modules/jasmine-core/lib/jasmine-core/boot',
        'socket.io': 'node_modules/socket.io-client/dist/socket.io',
        'webrtc-adapter': 'node_modules/webrtc-adapter/out/adapter',

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