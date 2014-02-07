![EasyRTC](./api/img/easyrtc.png "EasyRTC")

EasyRTC
=======

**A bundle of Open Source WebRTC joy!**

Priologic's EasyRTC, a bundle of Open Source WebRTC joy, incorporates an EasyRTC server install and client API, and working, HTML5 and JavaScript, application source code under a BSD 2 license.


Features
--------
 * Install EasyRTC's WebRTC Server on your own Linux, Windows, or Mac server in minutes not days.
 * Use our EasyRTC API and sample application code to build and deploy your WebRTC app in hours not weeks.
 * EasyRTC is completely free and open source under a BSD 2 license. No usage costs or other hidden fees.


Installation In A Nutshell
--------------------------
 1. Install [Node.js](http://nodejs.org)
 2. Download files from [server_example/](./server_example/) and place them in a local folder of your choice.
    - [package.json](./server_example/package.json)
    - [server.js](./server_example/server.js)
    - OR [download and extract this .zip](http://easyrtc.com/files/easyrtc_server_example.zip)
 3. Run `npm install` from the installation folder to install dependent packages (including EasyRTC)
 4. Start EasyRTC by running `node server.js`
 5. Browse the examples using a WebRTC enabled browser. *(defaults to port `8080`)*

Step by step instructions including additional setup options can be found in `/docs/easyrtc_server_install.md`

Note: there is no corresponding need to install the client files specifically; they were installed as part of EasyRTC in step 3.

Documentation
-------------
All documentation can be found within [the docs folder](./docs/).

**EasyRTC Server**

 * [Install instructions for Ubuntu, Windows, and Mac](./docs/easyrtc_server_install.md)
     * `/docs/easyrtc_server_install.md`
 * [Configuration options](./docs/easyrtc_server_configuration.md)
     * `/docs/easyrtc_server_configuration.md`
 * [Using Server Events](./docs/easyrtc_server_events.md)
     * `/docs/easyrtc_server_events.md`  
 * Server API
     * `/docs/server_html_docs/index.html`  

**EasyRTC Client API**
 * [Client API tutorial](./docs/easyrtc_client_tutorial.md)
     * `/docs/easyrtc_client_tutorial.md`
 * Client API
     * `/docs/client_html_docs/easyrtc.html`
 * Client File Transfer API
     * `/docs/client_html_docs/easyrtc_ft.html`

**General Development**
 * [Frequently asked questions](./docs/easyrtc_faq.md)
     * `/docs/easyrtc_faq.md`
 * [Authentication](./docseasyrtc_authentication.md/)
     * `/docs/easyrtc_authentication.md`  
 * [ICE, TURN, STUN Configuration](./docs/easyrtc_server_ice.md)
     * `/docs/easyrtc_server_ice.md`  
 * [Using Rooms](./docs/easyrtc_rooms.md)
     * `/docs/easyrtc_rooms.md`  
 * [Serving with SSL](./docs/easyrtc_server_ssl.md)
     * `/docs/easyrtc_server_ssl.md`  
 * [Serving next to IIS or Apache](./docs/easyrtc_with_other_servers.md)
     * `/docs/easyrtc_with_other_servers.md`  
 * [Upcoming features](./docs/easyrtc_upcoming_features.md)
     * `/docs/easyrtc_upcoming_features.md`
 * [Changelog](./docs/easyrtc_changelog.md)
     * `/docs/easyrtc_changelog.md`


Folder Structure
----------------

 * / (root)
   * Licenses and package information
 * /api/
   * Client API files including easyrtc.js  
 * /demos/
   * EasyRTC live demos and example code
 * /docs/
   * Documentation for using the API and running the server
 * /lib/
   * Required libraries
 * /node_modules/
   * Required node.js modules
   * This folder will be created during the install
 * /server_example/
   * A simple server example  


Included Demos
--------------

EasyRTC comes with a number of demo's which work immediately after installation.

 * Video and/or Audio connections
 * Multi-party video chat
 * Text Messaging with or without Data Channels
 * Screen and tab sharing
 * File transfer


Links for help and information
------------------------------

* The EasyRTC website is at:
  * [http://www.easyrtc.com/](http://www.easyrtc.com/)
* Use our support forum is at:
  * [https://groups.google.com/forum/#!forum/easyrtc](https://groups.google.com/forum/#!forum/easyrtc)
* Live demo site:
  * [http://demo.easyrtc.com/](http://demo.easyrtc.com/)
* Bugs and requests can be filed on our github page or on the forum:
  * [https://github.com/priologic/easyrtc/issues](https://github.com/priologic/easyrtc/issues)
* Our YouTube channel has live demo's:
  * [http://www.youtube.com/user/priologic](http://www.youtube.com/user/priologic)


License
-------

Copyright (c) 2014, Priologic Software Inc.
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

    * Redistributions of source code must retain the above copyright notice,
      this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
POSSIBILITY OF SUCH DAMAGE.