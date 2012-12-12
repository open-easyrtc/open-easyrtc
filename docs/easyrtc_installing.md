easyRTC: Server Installation
============================

Ubuntu easyRTC Install Steps:
----------------------------

1. Install Node.js
    * `sudo apt-get install python-software-properties`
    * `sudo add-apt-repository ppa:chris-lea/node.js`
    * `sudo apt-get update`
    * `sudo apt-get install nodejs npm`

2. Create folder hold the easyRTC application
    * ex: `sudo mkdir /var/nodes`
    * ex: `sudo mkdir /var/nodes/easyrtc`

3. Security Considerations (not going into specifics)
    * Create user for node.js (or use existing web user)
    * chown the nodes folder to be owned by this user
    * ensure the node is run as that user.
	
4. Uncompress the easyRTC package into the easyrtc folder

5. Change to the easyrtc folder and then install node modules locally
    * `cd /var/nodes/easyrtc`
    * `sudo npm install`


Windows easyRTC Install Steps:
------------------------------

1. Install Node.js
    * Go to [http://nodejs.org](http://nodejs.org)
    * Click 'Install' to download the .msi file
    * Run the Node.js installer

2. Uncompress the easyRTC package into a folder of your choice.
    * Note: Node is defaulted to browse to `%HOMEDRIVE%%HOMEPATH%`
    * ex: `C:\Users\USERNAME\nodes\easyrtc`

3. In the start menu, launch the Node.js command prompt

4. Navigate to the easyrtc folder. There should be a server.js and package.json file.
    * ex: `cd C:\Users\USERNAME\nodes\easyrtc`

5. Run the node package manager to download dependencies. This will create a new folder called node_modules
    * `npm install`


Mac easyRTC Install Steps:
------------------------------

1. Install Node.js
    * Go to [http://nodejs.org](http://nodejs.org)
    * Click 'Install' to download the .pkg file
    * In the finder double-click on the pkg file to start the install
    * By default node.js will be installed in /usr/local/bin/node and npm will be installed in /usr/local/bin/npm
    * Make sure /usr/local/bin is in your $PATH variable (echo $PATH)

2. Uncompress the easyRTC package into a folder of your choice.
    * ex: `/Users/USERNAME/nodes/easyrtc`

3. Open a terminal window by double-clicking on Terminal within the Applications/Utilities directory in finder

4. Navigate to the easyrtc folder. There should be a server.js and package.json file.
    * ex: `cd /Users/USERNAME/nodes/easyrtc`

5. Run the node package manager to download dependencies. This will create a new folder called node_modules
    * `npm install`
 


Configuring easyRTC (all platforms)
-----------------------------------

Open "config.js" in your favorite text editor. The file is located in the project root folder.

**Changing the port:**

1. The web/socket server port can be changed by altering config.httpPort (defaults to 8080).
2. Ensure firewalls are set to allow connections to the ports

**Enabling The Internal Experimental STUN Server: (optional)**

Note 1: External public stun servers are freely provided by several companies. The default is one from Google.

Note 2: The internal stun server is disabled by default but can be used in those circumstances where firewalls prevent their use or if corporate policy discourages outside server connections.

Note 3: Before you begin, your server "should" have two addresses which resolve to itself. For simple development purposes, I've found duplicating a single address still can work.

1. Set `config.experimentalStunServerEnable = true`
2. Set the following address lines to IP addresses or domains which resolve to your server.
    * `config.experimentalStunServerAddr0`
    * `config.experimentalStunServerAddr1`
3. Set the following ports to ones you wish to have open to answer STUN requests (defaults to 3478 and 3479).
    * `config.experimentalStunServerPort0`
    * `config.experimentalStunServerPort1`
4. Ensure firewalls are set to allow connections to the ports


Running easyRTC Server From Console
-----------------------------------

Running the server from the console may be the best approach for development. It allows easy access to console messages which can alert you to problems and status.

1. Open your console on the server.
    * In Windows you can use the provided Node.js console program located in the Start Menu.
2. Navigate to the easyrtc project folder
3. Run the server using the node command.
    * `node server.js`

Running easyRTC as a Service in Ubuntu
--------------------------------------

Below is a small upstart script which can be saved as /etc/init/easyrtc.conf

    description "easyRTC Node.js server"
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
        # Note: To run as a non root user, use exec sudu -u USERNAME /var/nodes/easyrtc/server.js
        exec /usr/bin/node /var/nodes/easyrtc/server.js
    end script

This will start easyRTC at boot and allow you to start and stop the service in the console using the following:

    sudo start easyrtc  
    sudo stop easyrtc

There are improvements which can be made such as increasing the open file limit, running the service as a non-root user, and adding notification commands to let administrators know of problems.


Start Browsing!
---------------

Browsing easyRTC should be a snap. If you have installed the server on your desktop machine with the default settings, you can browse to it by going to:

 * [http://localhost:8080/](http://localhost:8080/)

If the server is located on another computer, you can browse to it by knowing the IP address or domain name:

 * http://IPADDRESS:PORT/


If You Run Into Problems
------------------------
Please feel free to post on our discussion forum:

 * [https://groups.google.com/forum/#!forum/easyrtc](https://groups.google.com/forum/#!forum/easyrtc)
