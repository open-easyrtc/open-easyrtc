// Load required modules
var https   = require("https");     // https server core module
var fs      = require("fs");        // file system core module
var express = require("express");   // web framework external module
var io      = require("socket.io"); // web socket external module

// This sample is using the easyrtc from parent folder.
// To use this server_example folder only without parent folder:
// 1. you need to replace this "require("../");" by "require("open-easyrtc");"
// 2. install easyrtc (npm i open-easyrtc --save) in server_example/package.json

var easyrtc = require("../"); // EasyRTC internal module

// Set process name
process.title = "node-easyrtc-ssl";

// Setup and configure Express http server. Expect a subfolder called "static" to be the web root.
var httpApp = express();
httpApp.use(express.static(__dirname + "/static/"));

// Start Express https server on port 8443
var webServer = https.createServer({
    key:  fs.readFileSync(__dirname + "/certs/localhost.key"),
    cert: fs.readFileSync(__dirname + "/certs/localhost.crt")
}, httpApp);

// Start Socket.io so it attaches itself to Express server
var socketServer = io.listen(webServer, {
    "log level": 1,
    // Whether to enable compatibility with Socket.IO v2 clients.
    "allowEIO3": true,
    // See Socket.io CORS documentation: 
    // - https://socket.io/docs/v3/handling-cors/
    "cors": {
        "origin": '*'
    }
});

// Start EasyRTC server
var rtc = easyrtc.listen(httpApp, socketServer);

// Listen on port 8443
webServer.listen(process.env.PORT || 8443, function () {
    console.log(`listening on ${process.env.PORT || 8443}`);
});