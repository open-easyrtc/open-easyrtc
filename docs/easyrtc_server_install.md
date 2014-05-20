EasyRTC Server: Installation
============================

Ubuntu EasyRTC Install Steps:
----------------------------

1. Install Node.js
    - `sudo apt-get install python-software-properties`
    - `sudo add-apt-repository ppa:chris-lea/node.js`
    - `sudo apt-get update`
    - `sudo apt-get install nodejs`

2. Create folder hold the EasyRTC application
    - ex: `sudo mkdir /var/nodes`
    - ex: `sudo mkdir /var/nodes/easyrtc`

3. Security Considerations (not going into specifics)
    - Create user for node.js (or use existing web user)
    - chown the nodes folder to be owned by this user
    - ensure the node is run as that user.

4. Download files from the [server_example folder](../server_example/) into your EasyRTC application folder.
    - OR [download and extract this .zip](http://easyrtc.com/files/easyrtc_server_example.zip)

5. Change to the easyrtc folder and then install node modules locally
    - `cd /var/nodes/easyrtc`
    - `sudo npm install`


Windows EasyRTC Install Steps:
------------------------------

1. Install Node.js
    - Go to [http://nodejs.org](http://nodejs.org)
    - Click 'Install' to download the .msi file
    - Run the Node.js installer

2. Create an EasyRTC application folder.
    - Note: Node is defaulted to browse to `%HOMEDRIVE%%HOMEPATH%`
    - ex: `C:\Users\USERNAME\nodes\easyrtc`

3. Download files from the [server_example folder](../server_example/) into your EasyRTC application folder.
    - OR [download and extract this .zip](http://easyrtc.com/files/easyrtc_server_example.zip)

4. In the start menu, launch the Node.js command prompt

5. Navigate to the easyrtc folder. There should be a server.js and package.json file.
    - ex: `cd C:\Users\USERNAME\nodes\easyrtc`

6. Run the node package manager to download dependencies. This will create a new folder called node_modules
    - `npm install`


Mac EasyRTC Install Steps:
--------------------------

1. Install Node.js
    - Go to [http://nodejs.org](http://nodejs.org)
    - Click 'Install' to download the .pkg file
    - In the finder double-click on the pkg file to start the install
    - By default node.js will be installed in /usr/local/bin/node and npm will be installed in /usr/local/bin/npm
    - Make sure /usr/local/bin is in your $PATH variable (echo $PATH)

2. Download files from the [server_example folder](../server_example/) into a folder of your choice.
    - OR [download and extract this .zip](http://easyrtc.com/files/easyrtc_server_example.zip)
    - ex: `/Users/USERNAME/nodes/easyrtc`

3. Open a terminal window by double-clicking on Terminal within the Applications/Utilities directory in finder

4. Navigate to the easyrtc folder. There should be a server.js and package.json file.
    - ex: `cd /Users/USERNAME/nodes/easyrtc`

5. Run the node package manager to download dependencies. This will create a new folder called node_modules
    - `npm install`


Git Install Steps:
------------------

For EasyRTC maintainers or those wishing to test the newer beta release, [a Git client](http://git-scm.com/) can be used to download EasyRTC directly from [our Github repository](github.com/priologic/easyrtc). Afterwards, EasyRTC can be updated using standard Git commands.


1. Follow install instructions for your OS

2. Delete the `easyrtc` folder from `/node_modules/`

3. From `/node_modules/` clone the EasyRTC repo
    - `git clone https://github.com/priologic/easyrtc.git`
    - `git clone -b beta https://github.com/priologic/easyrtc.git`

4. In the console, enter the `/node_modules/easyrtc/` folder
    - `cd easyrtc` 

5. Install EasyRTC dependencies from NPM
    - `npm install` 


Running EasyRTC Server
======================

From Console
------------

Running the server from the console may be the best approach for development. It allows easy access to console messages which can alert you to problems and status.

1. Open your console on the server.
    - In Windows you can use the provided Node.js console program located in the Start Menu.
2. Navigate to your EasyRTC application folder
3. Run the server using the node command.
    - `node server.js`


Running EasyRTC as a Service in Ubuntu
--------------------------------------

Below is a small upstart script which can be saved as /etc/init/easyrtc.conf

    description "EasyRTC Node.js server"
    author "Priologic Software Inc."

    # Saves log to /var/log/upstart/easyrtc.log
    console log

    # Starts only after drives are mounted.
    start on started mountall

    stop on shutdown

    # Automatically Respawn. But fail permanently if it respawns 10 times in 5 seconds:
    respawn
    respawn limit 10 5

    script
        # Note: To run as a non root user, use exec sudo -u USERNAME node /var/nodes/easyrtc/server.js
        exec /usr/bin/node /var/nodes/easyrtc/server.js
    end script

This will start EasyRTC at boot and allow you to start and stop the service in the console using the following:

    sudo start easyrtc
    sudo stop easyrtc

There are improvements which can be made such as increasing the open file limit, running the service as a non-root user, and adding notification commands to let administrators know of problems.


Upgrading EasyRTC
-----------------

If you are using the packaged version of EasyRTC, upgrading is easy. In the console change to your application directory then enter:

    npm upgrade

Note that you should first check the changelog to see if there are any breaking changes.


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

    // Start EasyRTC server
    var easyrtcServer = easyrtc.listen(httpApp, socketServer);


Configuring EasyRTC Server
==========================

Configuration options are set using the `setOption` function or from the `listen()` function.

    easyrtc.setOption('OPTION_NAME', 'OPTION_VALUE');

or

    var easyrtcServer = easyrtc.listen(httpApp, socketServer, {'OPTION1_NAME': 'OPTION1_VALUE', 'OPTION2_NAME': 'OPTION2_VALUE'})


Note that some options can not be set after the `listen()` function has been run.

For complete details, read [server_configuration.md](server_configuration.md)


Start Browsing!
---------------

Browsing EasyRTC should be a snap. If you have installed the server on your desktop machine with the default settings, you can browse to it by going to:

 - [http://localhost:8080/](http://localhost:8080/)
 - [http://localhost:8080/demos/](http://localhost:8080/demos/)

If the server is located on another computer, you can browse to it by knowing the IP address or domain name:

 - http://IPADDRESS:PORT/


If You Run Into Problems
------------------------
Please feel free to post on our discussion forum:

 - [https://groups.google.com/forum/#!forum/easyrtc](https://groups.google.com/forum/#!forum/easyrtc)
