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
        'socket.io': 'node_modules/socket.io-client/dist/socket.io',
        'webrtc-adapter': 'node_modules/webrtc-adapter/out/adapter',

        // Internals
        "easyrtc_lang": "api/easyrtc_lang",
        "easyrtc_int": "api/easyrtc_int",
        "easyrtc_ft": "api/easyrtc_ft",
        "easy_app": "api/easy_app",
        "spec": "test/api/spec"
    },

    // We have to kick of jasmine, as it is asynchronous
    callback: function () {

        // Load the specs
        require(['spec/index'], function () {

            window.__karma__.start();
        });
    }

});
