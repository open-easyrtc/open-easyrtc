EasyRTC Server: Configuration
=============================

Configuration levels - Server versus Application versus Room
------------------------------------------------------------

EasyRTC allows management of configuration options at the server, application and room level. This will allow different rooms in the same application, or different applications in the same server to run with customized options.


Setting Server Options
----------------------

Options can be set prior, during, or after the easyrtc.listen() function has been run.

**Seperate**
 - easyrtc.setOption(optionName, optionValue)

**Within Listen()**
 - easyrtc.listen(httpApp, socketServer, options, listenCallback)

**Afterwards with resulting EasyRTC interface function**
 - ei.setOption(optionName, optionValue)

*note: Not all options will have an effect if changed after the server has started.*


Setting Server Options Example
------------------------------
The following server.js code snippet includes three ways of setting EasyRTC options.

    // Load required modules
    var http    = require("http");              // http server core module
    var express = require("express");           // web framework external module
    var io      = require("socket.io");         // web socket external module
    var easyrtc = require("..");           // EasyRTC external module


    // Setup and configure Express http server. Expect a subfolder called "static" to be the web root.
    var httpApp = express();
    httpApp.use(express.static(__dirname + "/static/"));

    // Start Express http server on port 8080
    var webServer = http.createServer(httpApp).listen(8080);

    // Start Socket.io so it attaches itself to Express server
    var socketServer = io.listen(webServer);

    // Configure EasyRTC to load demos from /easyrtcdemos/
    easyrtc.setOption("demosPublicFolder", "/easyrtcdemos");
    
    // Start EasyRTC server with options to change the log level and add dates to the log.
    var easyrtcServer = easyrtc.listen(
            httpApp,
            socketServer,
            {logLevel:"debug", logDateEnable:true},
            function(err, rtc) {

                // After the server has started, we can still change the default room name
                rtc.setOption("roomDefaultName", "SectorZero");
    
                // Creates a new application called MyApp with a default room named "SectorOne".
                rtc.createApp(
                    "easyrtc.instantMessaging",
                    {"roomDefaultName":"SectorOne"},
                    myEasyrtcApp
                );
            }
    );

    // Setting option for specific application
    var myEasyrtcApp = function(err, appObj) {
        // All newly created rooms get a field called roomColor.
        // Note this does not affect the room "SectorOne" as it was created already.
        appObj.setOption("roomDefaultFieldObj",
             {"roomColor":{fieldValue:"orange", fieldOption:{isShared:true}}}
        );
    };


Available Server Options
------------------------

### Application Options

 - **appAutoCreateEnable**
   - Enables the creation of application from the API. Occurs when client joins a nonexistent application.
   - This should be set to false for production use.
   - Defaults to: true
 - **appDefaultFieldObj**
   - Default fields which are set when an application is created. In form of {"fieldName":{fieldValue:<JsonObj>, fieldOption:{isShared:<boolean>}}[, ...]}
   - Defaults to: null
 - **appDefaultName**
   - The default application a connection belongs to if it is not initially specified.
   - Defaults to: "default"
 - **appIceServers**
   - ICE Servers object which identifies all STUN and TURN servers.
   - With new username field in TURN specification, this object may be updated soon.
   - Defaults to:

    [{url: "stun:stun.l.google.com:19302"},
    {url: "stun:stun.sipgate.net"},
    {url: "stun:217.10.68.152"},
    {url: "stun:stun.sipgate.net:10000"},
    {url: "stun:217.10.68.152:10000"}]

   - The format for a TURN server is:

    {"url":"turn:[ADDRESS]:[PORT]","username":"[USERNAME]", "credential":"[CREDENTIAL]"}


### Room Options

 - **roomAutoCreateEnable**
   - Enables the creation of rooms from the API. Occurs when client joins a nonexistent room.
   - Defaults to: true
 - **roomDefaultEnable**
   -  Enables connections joining a default room if it is not initially specified. If false, than a connection initially may be in no room.
   - Defaults to: true
 - **roomDefaultFieldObj**
   - Default fields which are set when a room is created. In form of {"fieldName":{fieldValue:<JsonObj>, fieldOption:{isShared:<boolean>}}[, ...]}
   - Defaults to: null
 - **roomDefaultName**
   - The default room a connection joins if it is not initially specified.
   - Defaults to: "default"


### Connection Options

 - **connectionDefaultField**
   - Default connection fields.
   - Defaults to: null


### Session Options

 - **sessionEnable**
   - Enable sessions. If sessions are disabled, each socket connection from the same user will be the same. Relies on Express session handling also being enabled.
   - Defaults to: true
 - **sessionCookieEnable**
   - If enabled, the server will attempt to send a easyrtcsid cookie which matches the Express session id.
   - Defaults to: true


### API Hosting Options

 - **apiEnable**
   - Enables hosting of the EasyRTC API files.
   - Defaults to: true
 - **apiPublicFolder**
   - Api public folder without trailing slash. Note that the demos expect this to be '/easyrtc'
   - Defaults to: "/easyrtc"
 - **apiOldLocationEnable**
   - [Depreciated] Listens for requests to core API files in old locations (in addition to the new standard locations)
   - Defaults to: false


### Demo Options

 - **demosEnable**
   - Enables the various EasyRTC demos. For a production system, this should be disabled.
   - Defaults to: true
 - **demosPublicFolder**
   - Demos public folder without trailing slash.
   - This sets the public URL where where demos are hosted, such as http://yourdomain/demos/
   - Defaults to: "/demos"


### Log options

Log options only apply if internal 'log' event is used

 - **logLevel**
   - The minimum log level to show. (debug|info|warning|error|none)
   - Defaults to: "info"
 - **logDateEnable**
   - Display timestamp in each entry
   - Defaults to: false
 - **logErrorStackEnable**
   - print the stack trace in logged errors when available
   - Defaults to: true
 - **logWarningStackEnable**
   - print the stack trace in logged warnings when available
   - Defaults to: true
 - **logColorEnable**
   - include console colors. Disable if forwarding logs to files or databases
   - Defaults to: true
 - **logObjectDepth**
   - When objects are included in the log, this is the max depth the log will display
   - Defaults to: 7


### Miscellaneous Server Options
 - **stillAliveInterval**
   - Maximum time between stillAlive messages, before connection is considered dead
   - When set to 0, stillAlive timeout checking is disabled
   - Defaults to: 20000
 - **stillAliveGracePeriod**
   - Additional grace period for stillAlive messages
   - Defaults to: 10000


### Regular expressions for validating names and other input
 - **apiVersionRegExp**
   - API Version
   - Defaults to: /^[a-z0-9_.-]{1,32}$/i
 - **appNameRegExp**
   - Application name
   - Defaults to: /^[a-z0-9_.-]{1,32}$/i
 - **easyrtcidRegExp**
   - EasyRTC socket id (easyrtcid)
   - Defaults to: /^[a-z0-9_.-]{1,32}$/i
 - **easyrtcsidRegExp**
   - EasyRTC session id (easyrtcsid)
   - Defaults to: /^[a-z0-9_.-]{1,64}$/i
 - **groupNameRegExp**
   - Group name
   - Defaults to: /^[a-z0-9_.-]{1,32}$/i
 - **fieldNameRegExp**
   - Field names (for defining app and room custom fields)
   - Defaults to: /^[a-z0-9_. -]{1,32}$/i
 - **optionNameRegExp**
   - Option names (for defining server options)
   - Defaults to: /^[a-z0-9_. -]{1,32}$/i
 - **presenceShowRegExp**
   - Allowed presence "show" values (for setPresence command)
   - Can be set at application level
   - Defaults to: /^(away|chat|dnd|xa)$/
 - **presenceStatusRegExp**
   - Allowed presence "status" value
   - Can be set at application level
   - Defaults to: /^(.){0,255}$/
 - **roomNameRegExp**
   - Room name
   - Can be set at application level
   - Defaults to: /^[a-z0-9_.-]{1,32}$/i
 - **usernameRegExp**
   - Username
   - Can be set at application level
   - Defaults to: /^(.){1,64}$/i


If You Run Into Problems
------------------------
Please feel free to post on our discussion forum:

- [https://groups.google.com/forum/?fromgroups#!forum/easyrtc](https://groups.google.com/forum/?fromgroups#!forum/easyrtc)

