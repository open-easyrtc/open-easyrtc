/*
  Script: karma.js

    This file is part of EasyRTC.
*/
/*global
    require, window
*/

require.config({

    // Karama serves files under /base,
    // which is the basePath from your config file
    baseUrl: '/base/',

    paths: {
        // Externals
        'jasmine': 'test/api/node_modules/jasmine-core/lib/jasmine-core/jasmine',
        'jasmine-html': 'test/api/node_modules/jasmine-core/lib/jasmine-core/jasmine-html',
        'boot': 'test/api/node_modules/jasmine-core/lib/jasmine-core/boot',
        'socket.io': 'test/api/node_modules/socket.io-client/dist/socket.io',
        'webrtc-adapter': 'test/api/node_modules/webrtc-adapter/out/adapter',
        // Internals
        "easyrtc_lang": "api/easyrtc_lang",
        "easyrtc_int": "api/easyrtc_int",
        "easyrtc_ft": "api/easyrtc_ft",
        "easy_app": "api/easy_app",
        "spec": "test/api/spec"
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
        }
    },

    // We have to kick of jasmine, as it is asynchronous
    callback: function () {

        // Load the specs
        require(['spec/index'], function () {

            // Initialize the HTML Reporter and execute the environment (setup by `boot.js`)
            window.onload();

            window.__karma__.start();
        });
    }

});
