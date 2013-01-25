/*
Copyright (c) 2013, Priologic Software Inc.
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

// Local includes
easyRtcCfg  = require('./config');          // All server configuration (global)
var g       = require('./lib/general');     // General helper functions
var c       = require('./lib/connection');  // easyRTC connection functions


// Ensure required modules are installed before beginning
if (!g.moduleExists('express') || !g.moduleExists('socket.io') || !g.moduleExists('winston')) {
    console.log('Error: Required modules are not installed. Run \'npm install\' from command line.');
    process.exit(1);
}


// Module dependencies
var fs      = require('fs');                // file system core module
var http    = require('http');              // http server core module
var express = require('express');           // web framework external module
var sio     = require('socket.io');         // web socket external module
var winston = require('winston');           // logging module


// Logging Setup
g.logInit();                                // Initialize logging settings
var logServer   = winston.loggers.get('easyRtcServer');
var logApi      = winston.loggers.get('easyRtcApi');
var logExpress  = winston.loggers.get('express');
var logSocketIo = winston.loggers.get('socketIo');


//  Set express http server options.
var httpApp = express();
httpApp.configure(function() {
    var logStream = {
        write: function(message, encoding){
            logExpress.info(message, { label: 'express'});
        }        
    }
    httpApp.use(express.logger({stream: logStream}));
    httpApp.use(express.static(__dirname + '/static/'));

    if(easyRtcCfg.enableDemos) {
        httpApp.use("/demos", express.static(__dirname + "/demos"));
    }
});


// Start either the HTTP or HTTPS web service
logServer.info('Starting easyRTC Server (v' + easyRtcCfg.easyRtcVersion +')', { label: 'easyRtcServer'});
if (easyRtcCfg.sslEnable) {  // Start SSL Server (https://)
    var https = require('https');
    var sslOptions = {
        key:  fs.readFileSync(easyRtcCfg.sslKeyFile),
        cert: fs.readFileSync(easyRtcCfg.sslCertFile)
    };

    var server = https.createServer(sslOptions, httpApp).listen(easyRtcCfg.sslPort);

    logServer.info('HTTPS (SSL) Server started on port: ' + easyRtcCfg.sslPort, { label: 'easyRtcServer'});

    // Optionally listen in on an http port and forward requests to secure port
    if (easyRtcCfg.sslForwardFromHttp) {
        var forwardingServer = express();
        forwardingServer.all('*', function(req, res) {
            return res.redirect("https://" + req.host + (easyRtcCfg.sslPort==443 ? '' :':' + easyRtcCfg.sslPort) + req.url);
        });
        forwardingServer.listen(easyRtcCfg.httpPort);
    }    
} else {    // Start HTTP server (http://)
    var server = http.createServer(httpApp).listen(easyRtcCfg.httpPort);
    logServer.info('HTTP Server started on port: ' + easyRtcCfg.httpPort, { label: 'easyRtcServer'});
}


// Start socket server
var io = sio.listen(server, {
        'logger': {
            debug: function(message){ logSocketIo.debug(message, { label: 'socket.io'}); },
            info:  function(message){ logSocketIo.info( message, { label: 'socket.io'}); },
            warn:  function(message){ logSocketIo.warn( message, { label: 'socket.io'}); },
            error: function(message){ logSocketIo.error(message, { label: 'socket.io'}); }
        },
        'browser client minification': true,
        'browser client etag': true,
        'browser client gzip': true
});
logServer.info('Socket Server started', { label: 'easyRtcServer'});


// Start experimental STUN server (if enabled)
if (easyRtcCfg.experimentalStunServerEnable) {
    g.experimentalStunServer();
}


// Shared variable to hold server and socket information.
easyRtc = {
    serverStartTime: Date.now(),
    connections: {}
};


// Upon a socket connection, a socket is created for the life of the connection
io.sockets.on('connection', function (socket) {
    logServer.debug('easyRTC: Socket [' + socket.id + '] connected with application: [' + easyRtcCfg.defaultApplicationName + ']', { label: 'easyRtc', easyRtcId:connectionEasyRtcId, applicationName:easyRtcCfg.defaultApplicationName});
    var connectionEasyRtcId = socket.id;
    c.onSocketConnection(io, socket, connectionEasyRtcId);

    // Incoming messages: Custom message. Allows applications to send socket messages to other connected users.
    socket.on('message', function(msg) {
        logServer.debug('easyRTC: Socket [' + socket.id + '] message received', { label: 'easyRtc', easyRtcId:connectionEasyRtcId, applicationName: easyRtc.connections[connectionEasyRtcId].applicationName, data:msg});
        c.onSocketMessage(io, socket, connectionEasyRtcId, msg);
    });

    // Incoming easyRTC commands: Used to forward webRTC negotiation details and manage server settings.
    socket.on('easyRTCcmd', function(msg) {
        logServer.debug('easyRTC: Socket [' + socket.id + '] command received', { label: 'easyRtc', easyRtcId:connectionEasyRtcId, data:msg});
        c.onEasyRtcCmd(io, socket, connectionEasyRtcId, msg);
    });
    
    // Upon a socket disconnecting (either directed or via time-out)
    socket.on('disconnect', function(data) {
        logServer.debug('easyRTC: Socket [' + socket.id + '] disconnected', { label: 'easyRtc', easyRtcId:connectionEasyRtcId});
        c.onSocketDisconnect(io, socket, connectionEasyRtcId);
    });
});


// Checks to see if there is a newer version of easyRTC available
if (easyRtcCfg.updateCheckEnable) {
    g.updateCheck(http);
}
