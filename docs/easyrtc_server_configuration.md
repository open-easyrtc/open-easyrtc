EasyRTC: Server Configuration
=============================

**Alpha Version**
*This page will be updated before we leave alpha, and certainly before we get to production. If not, feel free to attack us with wet noodles.*

For the code setting the default configuration options see:
 - [../lib/easyrtc_default_options.js](../lib/easyrtc_default_options.js)

Configuration levels - Server versus Application versus Room
----

In the near(ish) future, we will be exposing methods to manage configuration options at the application and room level. This will allow different rooms in the same application, or different applications in the same server to run with customized options.

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


	var http    = require("http");              // http server core module
	var express = require("express");           // web framework external module
	var io      = require("socket.io");         // web socket external module
	var easyrtc = require("easyrtc");           // EasyRTC external module
	
	// Setup and configure Express http server. Expect a subfolder called "static" to be the web root.
	var httpApp = express();
	httpApp.configure(function() {
	    httpApp.use(express.static(__dirname + "/static/"));
	});

	var webServer = http.createServer(httpApp).listen(8080);
	var socketServer = io.listen(webServer);

	
	// Configure EasyRTC to load demos from /easyrtcdemos/ 
	easyrtc.setOption("demosPublicFolder", "/easyrtcdemos");

	// Start EasyRTC server with options to change the log level and add dates to the log.
	var easyrtcServer = easyrtc.listen(
			httpApp,
			socketServer,
			{logLevel:"debug", logDateEnable:true},
			easyrtcListener
	);

	
	var easyrtcListener = function(err, ei) {
		// After the server has started, we can still change the default room name
		ei.setOption("roomDefaultName", "SectorZero");
	};

Available Server Options
------------------------

**WebRTC Options**
 - iceServers
   - ICE Servers object which identifies all STUN and TURN servers.
   - With new username field in TURN specification, this object may be updated soon.
   - Defaults to: [{url: "stun:stun.l.google.com:19302"},{url: "stun:stun.sipgate.net"},{url: "stun:217.10.68.152"},{url: "stun:stun.sipgate.net:10000"},{url: "stun:217.10.68.152:10000"}]


**Application Options**
 - appDefaultName
   - The default application a connection belongs to if it is not initially specified.
   - Defaults to: "default"
 - appAutoCreateEnable
   - Enables the creation of rooms from the API. Occurs when client joins a nonexistent room.
   - Defaults to: true             

**Room Options**
 - roomDefaultEnable    
   -  Enables connections joining a default room if it is not initially specified. If false, than a connection initially may be in no room.
   - Defaults to: true                        
 - roomDefaultName      
   - The default room a connection joins if it is not initially specified.
   - Defaults to: "default"                   
 - roomAutoCreateEnable 
   - Enables the creation of rooms from the API. Occurs when client joins a nonexistent room.
   - Defaults to: true


**Connection Options**
 - connectionDefaultField 
   - Default connection fields.
   - Defaults to: {browserFamily:  {share:true, regex:null, data:null},browserMajor:   {share:true, regex:null, data:null},osFamily:       {share:true, regex:null, data:null},deviceFamily:   {share:true, regex:null, data:null}}


**API Hosting Options**
 - apiEnable            
   - Enables hosting of the EasyRTC API files.
   - Defaults to: true                       
 - apiPublicFolder      
   - Api public folder without trailing slash. Note that the demos expect this to be '/easyrtc'
   - Defaults to: "/easyrtc"       
 - apiMinifyJsEnable    
   - Minify's the API Javascript for faster transfer.
   - NOT YET IMPLEMENTED
   - Defaults to: true                         
 - apiOldLocationEnable 
   - [Depreciated] Listens for requests to core API files in old locations (in addition to the new standard locations)
   - Defaults to: true         


**Demo Options**
 - demosEnable
   - Enables the various EasyRTC demos. For a production system, this should be disabled.
   - Defaults to: true
 - demosPublicFolder
   - Demos public folder without trailing slash.
   - Defaults to: "/demos"                      


**Log options** - Only apply if internal 'log' event is used
 - logLevel
   - The minimum log level to show. (debug|info|warning|error|none)
   - Defaults to: "info"
 - logDateEnable     
   -  Display timestamp in each entry
   - Defaults to: false
 - logErrorStackEnable 
   - print the stack trace in logged errors when available
   - Defaults to: true
 - logWarningStackEnable
   - print the stack trace in logged warnings when available
   - Defaults to: true
 - logColorEnable     
   - include console colors. Disable if forwarding logs to files or databases
   - Defaults to: true
 - logObjectDepth
   - When objects are included in the log, this is the max depth the log will display
   - Defaults to: 7


**Miscellaneous Server Options**
 - updateCheckEnable
   - Checks for updates
   - Defaults to: true


**Regular expressions for validating names and other input**
 - apiVersionRegExp
   - API Version
   - Defaults to: /^[a-z0-9_.-]{1,32}$/i
 - appNameRegExp
   - Application name 
   - Defaults to: /^[a-z0-9_.-]{1,32}$/i       
 - easyrtcidRegExp
   - EasyRTC socket id (easyrtcid)
   - Defaults to: /^[a-z0-9_.-]{1,32}$/i       
 - easyrtcsidRegExp
   - EasyRTC session id (easyrtcsid)
   - Defaults to: /^[a-z0-9_.-]{1,64}$/i       
 - groupNameRegExp
   - Group name
   - Defaults to: /^[a-z0-9_.-]{1,32}$/i       
 - fieldNameRegExp
   - Field names (for defining app and room custom fields)
   - Defaults to: /^[a-z0-9_. -]{1,32}$/i      
 - optionNameRegExp
   - Option names (for defining server options)
   - Defaults to: /^[a-z0-9_. -]{1,32}$/i      
 - presenceShowRegExp
   - Allowed presence "show" values (for setPresence command)
   - Defaults to: /^(away|chat|dnd|xa)$/       
 - presenceStatusRegExp
   - Allowed presence "status" value
   - Defaults to: /^(.){0,255}$/               
 - roomNameRegExp
   - Room name
   - Defaults to: /^[a-z0-9_.-]{1,32}$/i       
 - sessionKeyRegExp
   - Session key (easyrtcsid)
   - Defaults to: /^[a-z0-9_.-]{1,32}$/i       
 - usernameRegExp
   - Username
   - Defaults to: /^(.){1,64}$/i                

