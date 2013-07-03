/** 
 * @file        Http functions specific to easyRTC, including those for setting up API hosting 
 * @module      easyrtc_http
 * @author      Priologic Software, info@easyrtc.com
 * @copyright   Copyright 2013 Priologic Software. All rights reserved.
 */

var pub         = require("./easyrtc_public_obj");  // easyRTC public object
var e           = require("./easyrtc_private_obj"); // easyRTC private object
var eu          = require("./easyrtc_util");        // easyRTC utility functions

exports.initHttpApp = function(next) {
    pub.httpApp.configure( function() {
        // Set the easyRTC demos
        if (pub.getOption("demosEnable")) {
            eu.logDebug("Setting up demos to be accessed from '" + pub.getOption("demosPublicFolder") + "/'");
            pub.httpApp.get(pub.getOption("demosPublicFolder") + "/*", function(req, res) {
                res.sendfile(
                    './demos/' + (req.params[0] ? req.params[0] : 'index.html'),
                    {root:__dirname + "/../"},
                    function(err) {
                        try{if (err && err.status && res && !res._headerSent) {
                            res.status(404);
                            var body =    "<html><head><title>File Not Found</title></head><body><h1>File Not Found</h1></body></html>";
                            res.setHeader('Content-Type', 'text/html');
                            res.setHeader('Content-Length', body.length);
                            res.end(body);
                        }}catch(e){}
                    }
                );
            });
            // Forward people who forget the trailing slash to the folder.
            pub.httpApp.get(pub.getOption("demosPublicFolder"), function(req, res) {res.redirect(pub.getOption("demosPublicFolder") + "/");});
        }

        if (pub.getOption("apiEnable")) {
            // Set the easyRTC API files
            // TODO: Minified version
            eu.logDebug("Setting up API files to be accessed from '" + pub.getOption("apiPublicFolder") + "/'");
            pub.httpApp.get(pub.getOption("apiPublicFolder") + "/easyrtc.js",                  function(req, res) {res.sendfile('api/easyrtc.js',                  {root:__dirname + "/../"});});
            pub.httpApp.get(pub.getOption("apiPublicFolder") + "/easyrtc.css",                 function(req, res) {res.sendfile('api/easyrtc.css',                 {root:__dirname + "/../"});});
            pub.httpApp.get(pub.getOption("apiPublicFolder") + "/img/powered_by_easyrtc.png",  function(req, res) {res.sendfile('api/img/powered_by_easyrtc.png',  {root:__dirname + "/../"});});
        }

        if (pub.getOption("apiEnable") && pub.getOption("apiOldLocationEnable")) {
            eu.logWarning("Enabling listening for API files in older depreciated location.");
            // Transition - Old locations of easyRTC API files
            pub.httpApp.get("/js/easyrtc.js",                   function(req, res) {res.sendfile('api/easyrtc.js',              {root:__dirname + "/../"});});
            pub.httpApp.get("/css/easyrtc.css",                 function(req, res) {res.sendfile('api/easyrtc.css',             {root:__dirname + "/../"});});
        }
    });
    next(null);
}
