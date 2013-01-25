exports.moduleExists = function (modName) {
  try { return require.resolve(modName) }
  catch( e ) { return false }
}


// Checks with easyRTC site for latest version. If connection cannot be established no error will be shown.
exports.updateCheck = function(http) {
    http.get("http://easyrtc.com/version/?app=easyrtc&ver=" + easyRtcCfg.easyRtcVersion + "&platform=" + process.platform, function(res) {
        if (res.statusCode == 200)
            res.on('data', function(latestVersion) {
                latestVersion = (latestVersion+"").replace(/[^0-9a-z.]/g,"");
                if (latestVersion != easyRtcCfg.easyRtcVersion) {
                    var l = latestVersion.replace(/[^0-9.]/g, "").split(".", 3);
                    var v = easyRtcCfg.easyRtcVersion.replace(/[^0-9.]/g, "").split(".", 3);
                    var winston = require('winston');
                    var logServer = winston.loggers.get('easyRtcServer');

                    if (v[0] < l[0] || (v[0] == l[0] && v[1] < l[1]) || (v[0] == l[0] && v[1] == l[1] && v[2] < l[2]))
                        logServer.warn("Update Check: New version of easyRTC is available (" + latestVersion + "). Visit http://easyrtc.com/", { label: 'easyRtcServer'});
                    else if (v[0] > l[0] || (v[0] == l[0] && v[1] > l[1]) || (v[0] == l[0] && v[1] == l[1] && v[2] > l[2]))
                        logServer.info("Update Check: This version of easyRTC(" + easyRtcCfg.easyRtcVersion + ") is newer than the current stable release ("+ latestVersion +").", { label: 'easyRtcServer'});
                    else if (v[0] == l[0] && v[1] == l[1] && v[2] == l[2] && easyRtcCfg.easyRtcVersion.replace(/[^a-z]/gi, "") != "")
                        logServer.warn("Update Check: New non-beta version of easyRTC is available (" + latestVersion + "). Visit http://easyrtc.com/", { label: 'easyRtcServer'});
                }
            });
    }).on('error', function(e){});
}


// Starts up the experimental internal stun server
exports.experimentalStunServer = function() {
    var stunLib = require('./stunserver');
    var stunServer = stunLib.createServer();
    stunServer.setAddress0(easyRtcCfg.experimentalStunServerAddr0);
    stunServer.setAddress1(easyRtcCfg.experimentalStunServerAddr1);
    stunServer.setPort0(easyRtcCfg.experimentalStunServerPort0);
    stunServer.setPort1(easyRtcCfg.experimentalStunServerPort1);
    stunServer.listen();
}


exports.logInit = function() {
    var winston = require('winston');           // logging module

    winston.loggers.add('easyRtcServer', {
        console: {
            silent:    !easyRtcCfg.logEasyRtcConsoleEnabled,
            level:      easyRtcCfg.logEasyRtcConsoleLevel,
            timestamp:  easyRtcCfg.logConsoleDate,
            colorize:   easyRtcCfg.logConsoleColors,
            handleExceptions: true
        },
        file: {
            silent:    !easyRtcCfg.logEasyRtcFileEnabled,
            level:      easyRtcCfg.logEasyRtcFileLevel,
            filename:   easyRtcCfg.logEasyRtcFileName,
            handleExceptions: true
        }
    }).setLevels({debug:0,info: 1,warn: 2,error:3});
    winston.loggers.add('express', {
        console: {
            silent:    !easyRtcCfg.logExpressConsoleEnabled,
            level:      easyRtcCfg.logExpressConsoleLevel,
            timestamp:  easyRtcCfg.logConsoleDate,
            colorize:   easyRtcCfg.logConsoleColors
        },
        file: {
            silent:    !easyRtcCfg.logExpressFileEnabled,
            level:      easyRtcCfg.logExpressFileLevel,
            json:       easyRtcCfg.logExpressFileJson,
            filename:   easyRtcCfg.logExpressFileName
        }
    }).setLevels({debug:0,info: 1,warn: 2,error:3});
    winston.loggers.add('socketIo', {
        console: {
            silent:    !easyRtcCfg.logSocketIoConsoleEnabled,
            level:      easyRtcCfg.logSocketIoConsoleLevel,
            timestamp:  easyRtcCfg.logConsoleDate,
            colorize:   easyRtcCfg.logConsoleColors
        },
        file: {
            silent:    !easyRtcCfg.logSocketIoFileEnabled,
            level:      easyRtcCfg.logSocketIoFileLevel,
            filename:   easyRtcCfg.logSocketIoFileName
        }
    }).setLevels({debug:0,info: 1,warn: 2,error:3});
    winston.loggers.add('stun', {
        console: {
            silent:    !easyRtcCfg.logStunConsoleEnabled,
            level:      easyRtcCfg.logStunConsoleLevel,
            timestamp:  easyRtcCfg.logConsoleDate,
            colorize:   easyRtcCfg.logConsoleColors
        },
        file: {
            silent:    !easyRtcCfg.logStunFileEnabled,
            level:      easyRtcCfg.logStunFileLevel,
            filename:   easyRtcCfg.logStunFileName
        }
    }).setLevels({debug:0,info: 1,warn: 2,error:3});
}