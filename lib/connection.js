exports.broadcastList = function(io, applicationName) {
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
            msgType:easyrtcCfg.cmdMsgType.list,
            msgData:listData,
            serverTime: Date.now()
        });
    };
};

exports.onSocketConnection = function(io, socket, connectionEasyRtcId) {
    var winston = require('winston');
    var logServer = winston.loggers.get('easyRtcServer');

    easyRtc.connections[connectionEasyRtcId]={
        easyrtcid: connectionEasyRtcId,
        applicationName: easyrtcCfg.defaultApplicationName,
        clientConnectTime: Date.now()
    };

    // Immediatly send the easyrtcid and application
    logServer.debug('easyRTC: Socket [' + socket.id + '] command sent', {
        label: 'easyRtc',
        easyRtcId:connectionEasyRtcId,
        data: {
            applicationName: easyRtc.connections[connectionEasyRtcId].applicationName,
            iceConfig: {"iceServers": easyrtcCfg.iceServers}
    }});
    socket.json.emit( easyrtcCfg.cmdPacketType, {
        msgType:easyrtcCfg.cmdMsgType.token,
        easyrtcid: connectionEasyRtcId,
        applicationName: easyRtc.connections[connectionEasyRtcId].applicationName,
        iceConfig: {"iceServers": easyrtcCfg.iceServers},
        serverTime: Date.now()
    });

    // Send the connection list to current connection, then broadcast to all others
    exports.broadcastList(io,easyRtc.connections[connectionEasyRtcId].applicationName);
}


exports.onSocketMessage = function(io, socket, connectionEasyRtcId, msg) {
    // Messages must have a targetId and a msgType. This section should be hardened.
    if (msg.targetId) {
        var winston = require('winston');
        var logServer = winston.loggers.get('easyRtcServer');
        logServer.debug('easyRTC: Socket [' + msg.targetId+ '] sending message from [' + connectionEasyRtcId + ']', {
            label: 'easyRtc',
            easyRtcId:msg.targetId,
            data:msg
        });
        io.sockets.socket(msg.targetId).json.send({
            msgType:msg.msgType,
            senderId:connectionEasyRtcId,
            msgData:msg.msgData,
            serverTime: Date.now()
        });
    }
}


exports.onSocketDisconnect = function(io, socket, connectionEasyRtcId) {
    // console.log('easyRTC: Socket disconnected: ' + connectionEasyRtcId);
    var previousApplicationName = easyRtc.connections[connectionEasyRtcId].applicationName;

    // Remove connection from the map
    delete easyRtc.connections[connectionEasyRtcId];
    // Broadcast new list to all others
    exports.broadcastList(io, previousApplicationName);
}


exports.onEasyRtcCmd = function(io, socket, connectionEasyRtcId, msg) {
    var winston = require('winston');
    var logServer = winston.loggers.get('easyRtcServer');

    // Messages with a targetId get forwarded on. This section should be hardened.
    if (msg.targetId) {
        logServer.debug('easyRTC: Socket [' + msg.targetId + '] command sent from [' + socket.id + ']', {
            label: 'easyRtc',
            easyRtcId:msg.targetId,
            data: {
                msgType:msg.msgType,
                senderId:connectionEasyRtcId,
                msgData:msg.msgData,
        }});
        io.sockets.socket(msg.targetId).json.emit('easyRTCcmd',{
            msgType:msg.msgType,
            senderId:connectionEasyRtcId,
            msgData:msg.msgData,
            serverTime: Date.now()
        });
    }
    // easyRtc server-side user configuration options are set here.
    if (msg.msgType == "setUserCfg") {
        setUserCfg(connectionEasyRtcId, msg.msgData);
        
       
        if (msg.msgData.applicationName) {  // Set the application namespace
            easyRtc.connections[connectionEasyRtcId].applicationName = msg.msgData.applicationName;
            // console.log('easyRTC: Application Name Change: ' + connectionEasyRtcId + ' : ' + msg.msgData.applicationName);
            exports.broadcastList(io,easyRtc.connections[connectionEasyRtcId].applicationName);
        }
        
        logServer.debug('easyRTC: Socket [' + connectionEasyRtcId + '] updated user config info', {
            label: 'easyRtc',
            easyRtcId:connectionEasyRtcId,
            data: {
                msgType:'updatedUserCfg',
                msgData:easyRtc.connections[connectionEasyRtcId]
        }});

    }
}

function setUserCfg(easyRtcId, userCfg) {
        // TODO: Harden section with better variable checking
        if (userCfg.screenWidth) {      easyRtc.connections[easyRtcId].screenWidth =      userCfg.screenWidth;}
        if (userCfg.screenHeight) {     easyRtc.connections[easyRtcId].screenHeight =     userCfg.screenHeight;}
        if (userCfg.browserUserAgent) { easyRtc.connections[easyRtcId].browserUserAgent = userCfg.browserUserAgent;}
        if (userCfg.sharingAudio) {     easyRtc.connections[easyRtcId].sharingAudio =     userCfg.sharingAudio;}
        if (userCfg.sharingVideo) {     easyRtc.connections[easyRtcId].sharingVideo =     userCfg.sharingVideo;}
        if (userCfg.sharingData) {      easyRtc.connections[easyRtcId].sharingData =      userCfg.sharingData;}
        if (userCfg.windowWidth) {      easyRtc.connections[easyRtcId].windowWidth =      userCfg.windowWidth;}
        if (userCfg.windowHeight) {     easyRtc.connections[easyRtcId].windowHeight =     userCfg.windowHeight;}
        if (userCfg.cookieEnabled) {    easyRtc.connections[easyRtcId].cookieEnabled =    userCfg.cookieEnabled;}
        if (userCfg.language) {         easyRtc.connections[easyRtcId].language =         userCfg.language;}
        if (userCfg.nativeVideoWidth) { easyRtc.connections[easyRtcId].nativeVideoWidth = userCfg.nativeVideoWidth;}
        if (userCfg.nativeVideoHeight){ easyRtc.connections[easyRtcId].nativeVideoHeight= userCfg.nativeVideoHeight;}
        if (userCfg.connectionList) {
            easyRtc.connections[easyRtcId].connectionList = JSON.parse(JSON.stringify(userCfg.connectionList));
        }
}
