// Load required modules
var http    = require("http");              // http server core module
var express = require("express");           // web framework external module
var serveStatic = require('serve-static');  // serve static files
var session = require('express-session');   // user session
var socketIo = require("socket.io");        // web socket external module

// This sample is using the easyrtc from parent folder.
// To use this server_example folder only without parent folder:
// 1. you need to replace this "require("../");" by "require("open-easyrtc");"
// 2. install easyrtc (npm i open-easyrtc --save) in server_example/package.json

var easyrtc = require("../"); // EasyRTC internal module

// Set process name
process.title = "node-easyrtc";

// Setup and configure Express http server. Expect a subfolder called "static" to be the web root.
var app = express();
app.use(serveStatic('static', {'index': ['index.html']}));

app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

// Start Express http server on port 8080
var webServer = http.createServer(app);

// Start Socket.io so it attaches itself to Express server
var socketServer = socketIo.listen(webServer, {"log level":1});

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
var rtc = easyrtc.listen(app, socketServer, null, function(err, rtcRef) {
    if (err) {
        console.error(err);
        return;
    }
});

// Listen on port 8080
webServer.listen(8080, function () {
    //console.log('listening on http://localhost:8080');
});
