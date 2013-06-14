// Load required modules
var http    = require('http');              // http server core module
var express = require('express');           // web framework external module
var io      = require('socket.io');         // web socket external module
var easyrtc = require('easyrtc');           // easyRTC external module

// Setup and configure Express http server. Expect a subfolder called 'static' to be the web root.
var httpApp = express();
httpApp.configure(function() {
    httpApp.use(express.static(__dirname + '/static/'));
});

// Start Express http server
var webServer = http.createServer(httpApp).listen(80);

// Start Socket.io so it attaches itself to Express server
var socketServer = io.listen(webServer);

// Start easyRTC server
var easyrtcServer = easyrtc.listen(httpApp, socketServer);
