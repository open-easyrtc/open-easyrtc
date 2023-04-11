// Load required modules
const https = require("https");               // https server core module
const express = require("express");           // web framework external module
const serveStatic = require('serve-static');  // serve static files
const session = require('express-session');   // user session
const socketIo = require("socket.io");        // web socket external module
const fs = require("fs");                     // file system core module
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

// Start Express https server on port 8443
const webServer = https.createServer({
    key:  fs.readFileSync(path.join(__dirname, "certs", "localhost.key")),
    cert: fs.readFileSync(path.join(__dirname, "certs", "localhost.crt"))
}, httpApp);

// Start Socket.io so it attaches itself to Express server
const socketServer = socketIo.listen(webServer, {"log level":1});

// Cross-domain workaround presented below:
/*
socketServer.origins(function(origin, callback) {
    if (origin && ![
        'https://localhost:8080',
        '*'
    ].includes(origin)) {
        return callback('origin not allowed', false);
    }
    callback(null, true);
});


// Overriding the default easyrtcAuth listener, only so we can directly access its callback
easyrtc.events.on("easyrtcAuth", function(socket, easyrtcid, msg, socketCallback, callback) {
    easyrtc.events.defaultListeners.easyrtcAuth(socket, easyrtcid, msg, socketCallback, function(err, connectionObj){
        if (err || !msg.msgData || !msg.msgData.credential || !connectionObj) {
            callback(err, connectionObj);
            return;
        }

        // save credential in connectionObj
        if (msg.msgData.credential) {
            connectionObj.setField("credential", msg.msgData.credential, {"isShared":false});
            //console.log("["+easyrtcid+"] Credential saved!", connectionObj.getFieldValueSync("credential"));
        }

        callback(err, connectionObj);
    });
});

// To test, lets print the credential to the console for every room join!
easyrtc.events.on("roomJoin", function(connectionObj, roomName, roomParameter, callback) {
    //console.log("["+connectionObj.getEasyrtcid()+"] Credential retrieved!", connectionObj.getFieldValueSync("credential"));
    easyrtc.events.defaultListeners.roomJoin(connectionObj, roomName, roomParameter, callback);
});

//console.log("Initiated");
easyrtc.events.on("roomCreate", function(appObj, creatorConnectionObj, roomName, roomOptions, callback) {
    //console.log("roomCreate fired! Trying to create: " + roomName);
    easyrtc.events.defaultListeners.roomCreate(appObj, creatorConnectionObj, roomName, roomOptions, callback);
});
*/

// Start EasyRTC server
easyrtc.listen(httpApp, socketServer);

// Listen on port 8443
webServer.listen(8443, function () {
    console.log('listening on https://localhost:8443');
});
