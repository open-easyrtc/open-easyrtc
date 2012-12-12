/*
Copyright (c) 2012, Priologic Software Inc.
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

    * Redistributions of source code must retain the above copyright notice,
      this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
POSSIBILITY OF SUCH DAMAGE.
*/

// All server configuration is done in config.js
easyRtcConfig = require('./config');

// Module dependencies
var express = require('express');
var sio = require('socket.io');

//	Set express http server options. Ensure static folder is not in the root.
var httpApp = express();
httpApp.configure(function() {
  httpApp.use(express.static(__dirname + '/static/'));
});

// Start HTTP and socket server
var server = httpApp.listen(easyRtcConfig.httpPort);
var io = sio.listen(server);
// io.enable('browser client minification');  // send minified client
io.enable('browser client etag');          // apply etag caching logic based on version number
io.enable('browser client gzip');          // gzip the file
io.set('log level', 1);                    // reduce logging
console.log('HTTP and Socket Server started on port: ' + easyRtcConfig.httpPort);


// Start experimental STUN server (if enabled)
if (easyRtcConfig.experimentalStunServerEnable) {
    var stunLib = require('./lib/stunserver');
    var stunServer = stunLib.createServer();
    stunServer.setAddress0(easyRtcConfig.experimentalStunServerAddr0);
    stunServer.setAddress1(easyRtcConfig.experimentalStunServerAddr1);
    stunServer.setPort0(easyRtcConfig.experimentalStunServerPort0);
    stunServer.setPort1(easyRtcConfig.experimentalStunServerPort1);
    stunServer.listen();
}

// Shared variable to hold server and socket information.
var easyRtc = {
	serverStartTime: Date.now(),
	connections: {}
};

// Upon a socket connection, a socket is created for the life of the connection
io.sockets.on('connection', function (socket) {
    // console.log('easyRTC: User: ' + socket.id + ' Application: ' + easyRtcConfig.defaultApplicationName);
	var connectionEasyRtcId = socket.id;
	easyRtc.connections[connectionEasyRtcId]={
		easyrtcid: connectionEasyRtcId,
        applicationName: easyRtcConfig.defaultApplicationName,
		clientConnectTime: Date.now()
	};

	// Immediatly send the easyrtcid and application
	socket.json.emit( easyRtcConfig.cmdPacketType, {
		msgType:easyRtcConfig.cmdMsgType.token,
		easyrtcid: connectionEasyRtcId,
        applicationName: easyRtc.connections[connectionEasyRtcId].applicationName,
		iceConfig: {"iceServers": easyRtcConfig.iceServers},
		serverTime: Date.now()
	});

	// Send the connection list to current connection, then broadcast to all others
    broadcastList(easyRtc.connections[connectionEasyRtcId].applicationName);
    
	// console.log('easyRTC: Socket connected: ' + socket.id);
	
    // Incoming messages: Custom message. Allows applications to send socket messages to other connected users.
	socket.on('message', function(msg) {
		// Messages must have a targetId and a msgType. This section should be hardened.
		if (msg.targetId) {
			// console.log('easyRTC: Custom Message: ' + msg.msgData);
			io.sockets.socket(msg.targetId).json.send({
				msgType:msg.msgType,
				senderId:connectionEasyRtcId,
				msgData:msg.msgData,
				serverTime: Date.now()
			});
		}
	});

	// Incoming Messages: easyRTC commands. Used to forward webRTC negotiation details and manage server settings.
	socket.on('easyRTCcmd', function(msg) {
		// Messages with a targetId get forwarded on. This section should be hardened.
		if (msg.targetId) {
			// console.log('easyRTC: Command: ' + msg.msgType + ' To: ' + msg.targetId + ' From: ' + connectionEasyRtcId);
			io.sockets.socket(msg.targetId).json.emit('easyRTCcmd',{
				msgType:msg.msgType,
				senderId:connectionEasyRtcId,
				msgData:msg.msgData,
				serverTime: Date.now()
			});
		}
        // easyRtc server-side user configuration options are set here.
		if (msg.msgType == "setUserCfg") {
			// console.log('easyRTC: Command: ' + msg.msgType + ' From: ' + connectionEasyRtcId);

            if (msg.msgData.applicationName) {  // Set the application namespace
                easyRtc.connections[connectionEasyRtcId].applicationName = msg.msgData.applicationName;
                // console.log('easyRTC: Application Name Change: ' + connectionEasyRtcId + ' : ' + msg.msgData.applicationName);
                broadcastList(easyRtc.connections[connectionEasyRtcId].applicationName);
            }
		}
    });
    
	// Upon a socket disconnecting (either directed or via time-out)
	socket.on('disconnect', function(data) {
		// console.log('easyRTC: Socket disconnected: ' + connectionEasyRtcId);

        var previousApplicationName = easyRtc.connections[connectionEasyRtcId].applicationName;

		// Remove connection from the map
		delete easyRtc.connections[connectionEasyRtcId];

		// Broadcast new list to all others
        broadcastList(previousApplicationName);
	});

    // Send a list of all connected clients to a specific user
    // This function is due for a major overhaul to improve its usefullness.
    function sendList(easyRtcId) {
        io.sockets.socket(easyRtcId).json.emit('easyRTCcmd',{
            msgType:easyRtcConfig.cmdMsgType.list,
            msgData:easyRtc,
            serverTime: Date.now()
        });
    };
    
    // Broadcast a list of all connected clients to all connected users (except current client).
    // This function is due for a major overhaul to improve its usefullness.
    function broadcastList(applicationName) {
        var listData = {
            serverStartTime: easyRtc.serverStartTime,
            connections: {}
        };

        // Form list of current connections
        for (var key in easyRtc.connections) {
            if (easyRtc.connections.hasOwnProperty(key) && easyRtc.connections[key].applicationName == applicationName) {
                listData.connections[key] = easyRtc.connections[key];
            }
        };
        
        // Broadcast list of current connections
        for (var key in listData.connections) {
            io.sockets.socket(key).json.emit('easyRTCcmd',{
                msgType:easyRtcConfig.cmdMsgType.list,
                msgData:listData,
                serverTime: Date.now()
            });
        };
        
    };
    
});

// Checks to see if there is a newer version of easyRTC available
if (easyRtcConfig.updateCheckEnable) {
    http = require('http');
    http.get("http://easyrtc.com/version/?app=easyrtc&ver=" + easyRtcConfig.easyRtcVersion + "&platform=" + process.platform, function(res) {
        if (res.statusCode == 200)
            res.on('data', function(latestVersion) {
                latestVersion = (latestVersion+"").replace(/[^0-9a-z.]/g,"");
                if (latestVersion != easyRtcConfig.easyRtcVersion)
                    console.log("Note: New version of easyRTC is available (" + latestVersion + "). Visit http://easyrtc.com/");
            });
    }).on('error', function(e){});
}