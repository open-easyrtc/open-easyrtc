EasyRTC Server Example
======================

This folder contains all the files you'll need to create a simple server with EasyRTC, Express, and Socket.io. You can copy these files where you wish.

Files and Folders:
------------------

 - package.json - Provides project information allowing npm to find and install required modules.
 - server.js - Server code.
 - server_ssl.js - Server code for doing ssl using included keys, for testing purposes.
 - localhost.(key/crt) - self-signed keys for local host.
 - /static/ - Root folder for web server. Put html files here!

 
Installing Required Modules:
----------------------------

 - Type `npm install` in console.
 - This will read the package.json file to find and install the required modules including EasyRTC, Express, and Socket.io.
 - Required modules will go into a new 'node_modules' subfolder


Running the Server:
-------------------

 - Type `npm start` in console.


Viewing the examples:
---------------------

 - In your WebRTC enabled browser, visit your server address including the port. By default port 8080 is used.
 - http://localhost:8080/

Running the Server using docker:
-------------------

 - Type `npm run docker:build` then `npm run docker:start` in console.

Note: Require Docker to be installed.

Running the Server using docker-compose:
-------------------

 - Type `npm run docker-compose:start` in console.

Note: Require docker-compose to be installed.


Manualy build and run container
-------------------

Build:
> docker build . -t easyrtc

Run default:
> docker run -it --name easyrtc -p 8080:8080 easyrtc

Run HTTP server:
> docker run -it --name easyrtc --rm -p 8080:8080 easyrtc run server

Run HTTPS server:
>  docker run -it --name easyrtc --rm -p 8443:8443 easyrtc run server_ssl

Run HTTPS server with custom certs:
>  docker run -it --name easyrtc --rm -p 8443:8443 -v $(pwd)/certs/:/usr/src/app/certs/:ro easyrtc run server_ssl



