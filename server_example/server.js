// Load required modules
const http = require("http");                 // http server core module
const express = require("express");           // web framework external module
const serveStatic = require('serve-static');  // serve static files
const session = require('express-session');   // user session
const socketIo = require("socket.io");        // web socket external module
const path = require('path');

// Set process name
process.title = "node-easyrtc";

// This sample is using the easyrtc from parent folder.
// To use this server_example folder only without parent folder:
// 1. you need to replace this "require("../");" by "require("open-easyrtc");"
// 2. install easyrtc (npm i open-easyrtc --save) in server_example/package.json

const easyrtc = require(path.join(__dirname, "..")); // EasyRTC internal module

// Setup and configure Express http server. Expect a subfolder called "static" to be the web root.
const httpApp = express();

httpApp.use(serveStatic(path.join(__dirname, 'static'), {'index': ['index.html']}));

httpApp.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

// Start Express http server on port 8080
const webServer = http.createServer(httpApp);

// Start Socket.io so it attaches itself to Express server
const socketServer = socketIo.listen(webServer, {"log level":1});

// Cross-domain workaround presented below:
/*
socketServer.origins(function(origin, callback) {
    if (origin && ![
        'http://localhost:8080',
        '*'
    ].includes(origin)) {
        return callback('origin not allowed', false);
    }
    callback(null, true);
});
*/

easyrtc.setOption("logLevel", "info");

// Start EasyRTC server
easyrtc.listen(httpApp, socketServer, null, function(err, rtcRef) {
    if (err) {
        console.error(err);
        return;
    }
});

// Listen on port 8080
webServer.listen(8080, function () {
    //console.log('listening on http://localhost:8080');
});
