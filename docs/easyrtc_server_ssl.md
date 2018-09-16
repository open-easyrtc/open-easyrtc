EasyRTC Server: Using SSL
=========================

Being a signaling server, EasyRTC sends many message in plain text between the client and server. It is a good idea to connect to EasyRTC via SSL.

Benefits of using SSL:
----------------------

 - Increase end user confidence
 - Secure signaling traffic from eavesdroppers
 - In Chrome: Browser remembers camera and microphone sharing preference for site. Does not re-ask at each  - visit.
 - In Chrome: Enables screen sharing API


Obtaining and Installing an SSL Certificate:
--------------------------------------------

[SSL certificates](https://www.google.com/#q=SSL+certificates) can be obtained from several different providers. Before applying, you will need to generate a CSR (Certificate Signing Request). The most common software used for generating CSR's and handling SSL is [OpenSSL](http://www.openssl.org/), There are many operating system specific guides available for how to use SSL on your server.

[Self signed certificates](http://www.selfsignedcertificate.com/) are a free method of creating a certificate suitable for development. A warning will occur when browsing your site.


Setting Up Node.JS For SSL:
---------------------------

Node.JS provides [the https module](http://nodejs.org/api/https.html#https_https_createserver_options_requestlistener) which uses SSL. This method is easy and useful for development and lower traffic sites. For higher traffic, the site can be more responsive if SSL is handled by a SSL gateway or load balancing server.


Example server.js file using SSL:
---------------------------------

    // Load required modules
    var https   = require("https");     // https server core module
    var fs      = require("fs");        // file system core module
    var express = require("express");   // web framework external module
    var io      = require("socket.io"); // web socket external module
    var easyrtc = require("..");   // EasyRTC external module
    
    // Setup and configure Express http server. Expect a subfolder called "static" to be the web root.
    var httpApp = express();
    httpApp.use(express.static(__dirname + "/static/"));

    // Start Express https server on port 8443
    var webServer = https.createServer(
    {
        key:  fs.readFileSync("/pathtokeys/domain.key"),
        cert: fs.readFileSync("/pathtokeys/domain.crt")
    },
    httpApp).listen(8443);
    
    // Start Socket.io so it attaches itself to Express server
    var socketServer = io.listen(webServer, {"log level":1});
    
    // Start EasyRTC server
    var rtc = easyrtc.listen(httpApp, socketServer);
    

Using an SSL Gateway or Load Balancing server:
----------------------------------------------

For performance, load balancing, or firewall reasons you may wish to use an SSL gateway or load balancer. These often entail the gateway handling SSL, then routing requests to an EasyRTC server in a virtual private network. The gateway should be set to include the X-Forwarded-For http header. There are many solutions for doing this, each with their own instructions.


If You Run Into Problems
------------------------
Please feel free to post on our discussion forum:

- [https://groups.google.com/forum/?fromgroups#!forum/easyrtc](https://groups.google.com/forum/?fromgroups#!forum/easyrtc)
 
