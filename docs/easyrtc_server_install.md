EasyRTC: Server Installation
============================

Ubuntu EasyRTC Install Steps:
----------------------------

1. Install Node.js
    * `sudo apt-get install python-software-properties`
    * `sudo add-apt-repository ppa:chris-lea/node.js`
    * `sudo apt-get update`
    * `sudo apt-get install nodejs npm`

2. Create folder hold the EasyRTC application
    * ex: `sudo mkdir /var/nodes`
    * ex: `sudo mkdir /var/nodes/easyrtc`

3. Security Considerations (not going into specifics)
    * Create user for node.js (or use existing web user)
    * chown the nodes folder to be owned by this user
    * ensure the node is run as that user.
	
4. Uncompress the EasyRTC package into the easyrtc folder

5. Change to the easyrtc folder and then install node modules locally
    * `cd /var/nodes/easyrtc`
    * `sudo npm install`


Windows EasyRTC Install Steps:
------------------------------

1. Install Node.js
    * Go to [http://nodejs.org](http://nodejs.org)
    * Click 'Install' to download the .msi file
    * Run the Node.js installer

2. Uncompress the EasyRTC package into a folder of your choice.
    * Note: Node is defaulted to browse to `%HOMEDRIVE%%HOMEPATH%`
    * ex: `C:\Users\USERNAME\nodes\easyrtc`

3. In the start menu, launch the Node.js command prompt

4. Navigate to the easyrtc folder. There should be a server.js and package.json file.
    * ex: `cd C:\Users\USERNAME\nodes\easyrtc`

5. Run the node package manager to download dependencies. This will create a new folder called node_modules
    * `npm install`


Mac EasyRTC Install Steps:
------------------------------

1. Install Node.js
    * Go to [http://nodejs.org](http://nodejs.org)
    * Click 'Install' to download the .pkg file
    * In the finder double-click on the pkg file to start the install
    * By default node.js will be installed in /usr/local/bin/node and npm will be installed in /usr/local/bin/npm
    * Make sure /usr/local/bin is in your $PATH variable (echo $PATH)

2. Uncompress the EasyRTC package into a folder of your choice.
    * ex: `/Users/USERNAME/nodes/easyrtc`

3. Open a terminal window by double-clicking on Terminal within the Applications/Utilities directory in finder

4. Navigate to the easyrtc folder. There should be a server.js and package.json file.
    * ex: `cd /Users/USERNAME/nodes/easyrtc`

5. Run the node package manager to download dependencies. This will create a new folder called node_modules
    * `npm install`


Running EasyRTC Server
======================

From Console
------------

Running the server from the console may be the best approach for development. It allows easy access to console messages which can alert you to problems and status.

1. Open your console on the server.
    * In Windows you can use the provided Node.js console program located in the Start Menu.
2. Navigate to the EasyRTC project folder
3. Run the server using the node command.
    * `node server.js`


Your First EasyRTC Server Program
=================================

Below is the initial server program which will run an EasyRTC server along with all the demos. This server program is also included within the EasyRTC download. 

    // Load required modules
    var http    = require("http");              // http server core module
    var express = require("express");           // web framework external module
    var io      = require("socket.io");         // web socket external module
    var easyrtc = require("easyrtc");           // EasyRTC external module
    
    // Start Express http server on port 8080
    var webServer = http.createServer(httpApp).listen(8080);
    
    // Start Socket.io so it attaches itself to Express server
    var socketServer = io.listen(webServer);
    
    // Start easyRTC server
    var easyrtcServer = easyrtc.listen(httpApp, socketServer);


Configuring EasyRTC Server
==========================
Configuration options are set using the `setOption` function or from the `listen()` function.

	easyrtc.setOption('OPTION_NAME', 'OPTION_VALUE');

or

	var easyrtcServer = easyrtc.listen(httpApp, socketServer, {'OPTION1_NAME': 'OPTION1_VALUE', 'OPTION2_NAME': 'OPTION2_VALUE'})
	

Note that some options can not be set after the `listen()` function has been run.


Configuration Options
=====================


Application Options
-------------------

**appDefaultName**
The default application a connection belongs to if it is not initially specified.

Default Value:
 - "default"

**appAutoCreateEnable**
Enables the creation of rooms from the API. Occurs when client joins a nonexistent room.

Default Value:
 - true


Room Options
------------

**roomDefaultName**
The default room a connection joins if it is not initially specified.

Default Value:
 - "default"
 

**roomAutoCreateEnable**
Enables the creation of rooms from the API. Occurs when client joins a nonexistent room.

Default Value:
 - false


Connection Options
------------------

**connectionDefaultField**
The defaults fields the server is expecting from the client API after a connection.


Default Value:
 - {
    browserFamily:  {share:true, regex:null, data:null},
    browserMajor:   {share:true, regex:null, data:null},
    osFamily:       {share:true, regex:null, data:null},
    deviceFamily:   {share:true, regex:null, data:null}
}


API Hosting Options
-------------------

**apiEnable**
Enables hosting of the easyRTC API files.

Default Value:
 - true

**apiPublicFolder**
Api public folder without trailing slash. Note that the demos expect this to be '/easyrtc'

Default Value:
 - "/easyrtc"

**apiMinifyJsEnable**
Minify's the API Javascript for faster transfer.

Default Value:
 - true


Demo Options
------------

**demosEnable**
Enables the built in EasyRTC Demos. This should be disabled for a production site.

Default Value:
 - true
 
**demosPublicFolder**
Demos public folder without trailing slash.

Default Value:
 - "/demos"
 

Log options
-----------
Only applies if internal 'log' event is used

**logLevel**
The minimum log level to show. (debug|info|warning|error|none)

Default Value:
 - "info"

**logDateEnable**
Display timestamp in each log entry

Default Value:
 - false

**logErrorStackEnable**
print the stack trace in logged errors when available

Default Value:
 - true

**logWarningStackEnable**
print the stack trace in logged warnings when available

Default Value:
 - true

**logColorEnable**
include console colors. Disable if forwarding logs to files or databases

Default Value:
 - true

**logObjectDepth**
When objects are included in the log, this is the max depth the log will display

Default Value:
 - 7


Miscellaneous Server Options
----------------------------

**updateCheckEnable**
Checks for updates

Default Value:
 - true

Regular expressions
-------------------
For validating names and other input.

**appNameRegExp**
Application name

Default Value:
 - /^[a-z0-9_.-]{1,32}$/i

**roomNameRegExp**
Room name

Default Value:
 - /^[a-z0-9_.-]{1,32}$/i

**groupNameRegExp**
Group name

Default Value:
 - /^[a-z0-9_.-]{1,32}$/i

**fieldNameRegExp**
Field names (for defining app and room custom fields)

Default Value:
 - /^[a-z0-9_. -]{1,32}$/i

**optionNameRegExp**
Option names (for defining server options)

Default Value:
 - /^[a-z0-9_. -]{1,32}$/i

**easyrtcidRegExp**
easyRTC socket id (easyrtcid)

Default Value:
 - /^[a-z0-9_.-]{1,32}$/i

**sessionKeyRegExp**
Session key (easyrtcsid)

Default Value:
 - /^[a-z0-9_.-]{1,32}$/i
