exports.moduleExists = function (modName) {
  try { return require.resolve(modName) }
  catch( e ) { return false }
}


// Checks with easyRTC site for latest version. If connection cannot be established no error will be shown.
exports.updateCheck = function(http) {
    http.get("http://easyrtc.com/version/?app=easyrtc&ver=" + easyrtcCfg.easyrtcVersion + "&platform=" + process.platform, function(res) {
        if (res.statusCode == 200)
            res.on('data', function(latestVersion) {
                latestVersion = (latestVersion+"").replace(/[^0-9a-z.]/g,"");
                if (latestVersion != easyrtcCfg.easyrtcVersion) {
                    var l = latestVersion.replace(/[^0-9.]/g, "").split(".", 3);
                    var v = easyrtcCfg.easyrtcVersion.replace(/[^0-9.]/g, "").split(".", 3);
                    var winston = require('winston');
                    var logServer = winston.loggers.get('easyrtcServer');

                    if (v[0] < l[0] || (v[0] == l[0] && v[1] < l[1]) || (v[0] == l[0] && v[1] == l[1] && v[2] < l[2]))
                        logServer.warn("Update Check: New version of easyRTC is available (" + latestVersion + "). Visit http://easyrtc.com/", { label: 'easyrtcServer'});
                    else if (v[0] > l[0] || (v[0] == l[0] && v[1] > l[1]) || (v[0] == l[0] && v[1] == l[1] && v[2] > l[2]))
                        logServer.info("Update Check: This version of easyRTC(" + easyrtcCfg.easyrtcVersion + ") is newer than the current stable release ("+ latestVersion +").", { label: 'easyrtcServer'});
                    else if (v[0] == l[0] && v[1] == l[1] && v[2] == l[2] && easyrtcCfg.easyrtcVersion.replace(/[^a-z]/gi, "") != "")
                        logServer.warn("Update Check: New non-beta version of easyRTC is available (" + latestVersion + "). Visit http://easyrtc.com/", { label: 'easyrtcServer'});
                }
            });
    }).on('error', function(e){});
}


// Starts up the experimental internal stun server
exports.experimentalStunServer = function() {
    var stunLib = require('./stunserver');
    var stunServer = stunLib.createServer();
    stunServer.setAddress0(easyrtcCfg.experimentalStunServerAddr0);
    stunServer.setAddress1(easyrtcCfg.experimentalStunServerAddr1);
    stunServer.setPort0(easyrtcCfg.experimentalStunServerPort0);
    stunServer.setPort1(easyrtcCfg.experimentalStunServerPort1);
    stunServer.listen();
}


exports.logInit = function() {
    var winston = require('winston');           // logging module

    winston.loggers.add('easyrtcServer', {
        console: {
            silent:    !easyrtcCfg.logEasyRtcConsoleEnabled,
            level:      easyrtcCfg.logEasyRtcConsoleLevel,
            timestamp:  easyrtcCfg.logConsoleDate,
            colorize:   easyrtcCfg.logConsoleColors,
            handleExceptions: true
        },
        file: {
            silent:    !easyrtcCfg.logEasyRtcFileEnabled,
            level:      easyrtcCfg.logEasyRtcFileLevel,
            filename:   easyrtcCfg.logEasyRtcFileName,
            handleExceptions: true
        }
    }).setLevels({debug:0,info: 1,warn: 2,error:3});
    winston.loggers.add('express', {
        console: {
            silent:    !easyrtcCfg.logExpressConsoleEnabled,
            level:      easyrtcCfg.logExpressConsoleLevel,
            timestamp:  easyrtcCfg.logConsoleDate,
            colorize:   easyrtcCfg.logConsoleColors
        },
        file: {
            silent:    !easyrtcCfg.logExpressFileEnabled,
            level:      easyrtcCfg.logExpressFileLevel,
            json:       easyrtcCfg.logExpressFileJson,
            filename:   easyrtcCfg.logExpressFileName
        }
    }).setLevels({debug:0,info: 1,warn: 2,error:3});
    winston.loggers.add('socketIo', {
        console: {
            silent:    !easyrtcCfg.logSocketIoConsoleEnabled,
            level:      easyrtcCfg.logSocketIoConsoleLevel,
            timestamp:  easyrtcCfg.logConsoleDate,
            colorize:   easyrtcCfg.logConsoleColors
        },
        file: {
            silent:    !easyrtcCfg.logSocketIoFileEnabled,
            level:      easyrtcCfg.logSocketIoFileLevel,
            filename:   easyrtcCfg.logSocketIoFileName
        }
    }).setLevels({debug:0,info: 1,warn: 2,error:3});
    winston.loggers.add('stun', {
        console: {
            silent:    !easyrtcCfg.logStunConsoleEnabled,
            level:      easyrtcCfg.logStunConsoleLevel,
            timestamp:  easyrtcCfg.logConsoleDate,
            colorize:   easyrtcCfg.logConsoleColors
        },
        file: {
            silent:    !easyrtcCfg.logStunFileEnabled,
            level:      easyrtcCfg.logStunFileLevel,
            filename:   easyrtcCfg.logStunFileName
        }
    }).setLevels({debug:0,info: 1,warn: 2,error:3});
}