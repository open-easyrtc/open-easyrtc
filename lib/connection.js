exports.broadcastList = function(io, applicationName) {
    var listData = {
        serverStartTime: easyrtc.serverStartTime,
        connections: {}
    };

    //
    // needed by the rooms demo. Don't remove.
    //
    if( applicationName === 'default' ) return;
    
    // Form list of current connections
    for (var key in easyrtc.connections) {
        if (easyrtc.connections.hasOwnProperty(key) && easyrtc.connections[key].applicationName == applicationName) {
            listData.connections[key] = easyrtc.connections[key];
        }
    };

    // Broadcast list of current connections
    for (var key in listData.connections) {
        io.sockets.socket(key).json.emit('easyrtcCmd',{
            msgType:easyrtcCfg.cmdMsgType.list,
            msgData:listData,
            serverTime: Date.now()
        });
    };
};

exports.onSocketConnection = function(io, socket, connectionEasyRtcId) {
    var winston = require('winston');
    var logServer = winston.loggers.get('easyrtcServer');

    easyrtc.connections[connectionEasyRtcId]={
        easyrtcid: connectionEasyRtcId,
        applicationName: easyrtcCfg.defaultApplicationName,
        clientConnectTime: Date.now()
    };

    // Immediatly send the easyrtcid and application
    logServer.debug('easyRTC: Socket [' + socket.id + '] command sent', {
        label: 'easyrtc',
        easyrtcid:connectionEasyRtcId,
        data: {
            applicationName: easyrtc.connections[connectionEasyRtcId].applicationName,
            iceConfig: {"iceServers": easyrtcCfg.iceServers}
    }});
    socket.json.emit( easyrtcCfg.cmdPacketType, {
        msgType:easyrtcCfg.cmdMsgType.token,
        easyrtcid: connectionEasyRtcId,
        applicationName: easyrtc.connections[connectionEasyRtcId].applicationName,
        iceConfig: {"iceServers": easyrtcCfg.iceServers},
        serverTime: Date.now()
    });

    // Send the connection list to current connection, then broadcast to all others
    exports.broadcastList(io,easyrtc.connections[connectionEasyRtcId].applicationName);
}


exports.onSocketMessage = function(io, socket, connectionEasyRtcId, msg) {
    // Messages must have a targetId and a msgType. This section should be hardened.
    if (msg.targetId) {
        var winston = require('winston');
        var logServer = winston.loggers.get('easyrtcServer');
        logServer.debug('easyRTC: Socket [' + msg.targetId+ '] sending message from [' + connectionEasyRtcId + ']', {
            label: 'easyrtc',
            easyrtcid:msg.targetId,
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
    var previousApplicationName = easyrtc.connections[connectionEasyRtcId].applicationName;

    // Remove connection from the map
    delete easyrtc.connections[connectionEasyRtcId];
    // Broadcast new list to all others
    exports.broadcastList(io, previousApplicationName);
}


exports.onEasyRtcCmd = function(io, socket, connectionEasyRtcId, msg) {
    var winston = require('winston');
    var logServer = winston.loggers.get('easyrtcServer');

    // Messages with a targetId get forwarded on. This section should be hardened.
    if (msg.targetId) {
        logServer.debug('easyRTC: Socket [' + msg.targetId + '] command sent from [' + socket.id + ']', {
            label: 'easyrtc',
            easyrtcid:msg.targetId,
            data: {
                msgType:msg.msgType,
                senderId:connectionEasyRtcId,
                msgData:msg.msgData,
        }});
        io.sockets.socket(msg.targetId).json.emit('easyrtcCmd',{
            msgType:msg.msgType,
            senderId:connectionEasyRtcId,
            msgData:msg.msgData,
            serverTime: Date.now()
        });
    }
    // easyrtc server-side user configuration options are set here.
    if (msg.msgType == "setUserCfg") {
        setUserCfg(connectionEasyRtcId, msg.msgData);
        
       
        if (msg.msgData.applicationName) {  // Set the application namespace
            easyrtc.connections[connectionEasyRtcId].applicationName = msg.msgData.applicationName;
            // console.log('easyRTC: Application Name Change: ' + connectionEasyRtcId + ' : ' + msg.msgData.applicationName);
            exports.broadcastList(io,easyrtc.connections[connectionEasyRtcId].applicationName);
        }
        
        logServer.debug('easyRTC: Socket [' + connectionEasyRtcId + '] updated user config info', {
            label: 'easyrtc',
            easyrtcid:connectionEasyRtcId,
            data: {
                msgType:'updatedUserCfg',
                msgData:easyrtc.connections[connectionEasyRtcId]
        }});

    }
}

function setUserCfg(easyrtcid, userCfg) {
        // TODO: Harden section with better variable checking
        if (userCfg.screenWidth) {      easyrtc.connections[easyrtcid].screenWidth =      userCfg.screenWidth;}
        if (userCfg.screenHeight) {     easyrtc.connections[easyrtcid].screenHeight =     userCfg.screenHeight;}
        if (userCfg.browserUserAgent) { easyrtc.connections[easyrtcid].browserUserAgent = userCfg.browserUserAgent;}
        if (userCfg.sharingAudio) {     easyrtc.connections[easyrtcid].sharingAudio =     userCfg.sharingAudio;}
        if (userCfg.sharingVideo) {     easyrtc.connections[easyrtcid].sharingVideo =     userCfg.sharingVideo;}
        if (userCfg.sharingData) {      easyrtc.connections[easyrtcid].sharingData =      userCfg.sharingData;}
        if (userCfg.userName) {         easyrtc.connections[easyrtcid].userName =         userCfg.userName;}
        if (userCfg.windowWidth) {      easyrtc.connections[easyrtcid].windowWidth =      userCfg.windowWidth;}
        if (userCfg.windowHeight) {     easyrtc.connections[easyrtcid].windowHeight =     userCfg.windowHeight;}
        if (userCfg.cookieEnabled) {    easyrtc.connections[easyrtcid].cookieEnabled =    userCfg.cookieEnabled;}
        if (userCfg.language) {         easyrtc.connections[easyrtcid].language =         userCfg.language;}
        if (userCfg.nativeVideoWidth) { easyrtc.connections[easyrtcid].nativeVideoWidth = userCfg.nativeVideoWidth;}
        if (userCfg.nativeVideoHeight){ easyrtc.connections[easyrtcid].nativeVideoHeight= userCfg.nativeVideoHeight;}
        if (userCfg.connectionList) {
            easyrtc.connections[easyrtcid].connectionList = JSON.parse(JSON.stringify(userCfg.connectionList));
        }
}
