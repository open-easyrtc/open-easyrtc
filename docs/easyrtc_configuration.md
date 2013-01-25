easyRTC: Configuration
======================

config.js
---------

Configuration of easyRTC is done within config.js which is located in the easyRTC root folder. It should be edited within your favorite text editor. Any changes will take effect the next time the server is started.


Ports
-----
- **httpPort** - The port which the http server will listen on. Commonly this is 80 or 8080.

- Note 1: Any ports which are opened may require firewall and NAT rules to be adjusted.

- Note 2: With Linux, choosing a port below 1024 may require the server be started with root privileges.

- Note 3: If sslEnable is true and sslForwardFromHttp if false, the http server will not be started, thus the port will not be used.


SSL
---

- **sslEnable** - Enables SSL for both https and web sockets. [true|false]
- **sslPort** - The port which the https server will listen on. Commonly this is 443 or 8443.
- **sslForwardFromHttp** - Forces non-secure connections to be forwarded to the secure site. [true|false]
- **sslKeyFile** - Local file location of private SSL key
- **sslCertFile** - Local file location of public SSL certificate

- Note 1: When SSL is enabled, all server traffic must use it. Optionally, the http port can be used to forward requests to use SSL.

- Todo: Document process of creating self-signed key


Experimental Stun Server
------------------------

- **experimentalStunServerEnable** - Enables the integrated STUN server. [true|false]
- **experimentalStunServerAddr0** - IP or domain pointing to server.
- **experimentalStunServerAddr1** - Second IP or domain pointing to server.
- **experimentalStunServerPort0** - First port number to listen on. Defaults to "3478".
- **experimentalStunServerPort1** - Second port number to listen on. Defaults to "3479".

- Note 1: The integrated stun server is useful in cases where there is no outside internet connection, or corporate policies / firewalls restrict outside connections.

- Note 2: The integrated stun server should only be used for debugging or development purposes. 

- Note 3: It will still work if both Addr0 and Addr1 are identical. Just not recommended.

- Note 4: Each address listens on both Port0 and Port1.


General Log Settings
--------------------

- **logConsoleColors** - Enable colors to be shown in console log. [true|false]
- **logConsoleDate** - Prepend date and time to console log. [true|false]


Service Log Settings
--------------------
Logs can be enabled can controlled independantly for the following services.

- **EasyRtc** - Logs server starts/stops and easyRTC commands sent within websockets.
- **Express** - Logs http and https connection information.
- **SocketIo** - Logs generic websocket information. Not highly detailed.
- **Stun** - Logs STUN connection information if experimantal STUN server is enabled.


*Rather than repeat commands for every service, replace ??? with the service name.*

- **log???ConsoleEnabled** - Enable console logging [true|false]
- **log???ConsoleLevel** - Lowest priority level to start showing logs for. ['debug'|'info'|'warn'|'error']
- **log???FileEnabled** - Enable file logging. [true|false]
- **log???FileLevel** - Lowest priority level to start showing logs for. ['debug'|'info'|'warn'|'error']
- **log???FileName** - File location relative to the easyRTC root.


Other Settings
--------------

- **defaultApplicationName** - The namespace for the default application. This can be read and reassigned via the easyRTC API.
- **enableDemos** - Enable the provided easyRTC demos. Viewable in /demos/. [true|false]
- **updateCheckEnable** - Checks in with easyrtc.com to see if a new version is available. [true|false]





