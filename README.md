Open-EasyRTC
=======

[![npm version](https://img.shields.io/npm/v/open-easyrtc.svg?style=flat)](https://www.npmjs.com/package/open-easyrtc)
[![Build Status](https://travis-ci.org/open-easyrtc/open-easyrtc.svg?branch=master)](https://travis-ci.org/open-easyrtc/open-easyrtc)

Open-EasyRTC is a Fork of Priologic's EasyRTC, include an EasyRTC server and client API, HTML5 and JavaScript demos under a BSD 2 license.

Original Source and Fork intent
--------------------

This NodeJS `open-easyrtc` module version is a fork of `easyrtc` hosted on Github originally made by `Priologic Software Inc.` and available here: https://github.com/priologic/easyrtc

This fork of `easyrtc` module named `open-easyrtc` starts at version `2.0.0` in case previous the repository decides to pick up work again on version `1.x.x`.

The main reason of the fork is that `Priologic Software Inc.` as been trying to make the main contributor @hthetiot pay $200,000 for pushing major issues and security fixes to be released on NPM registry and the maintainer that closed more than 200 issues and contributed more than 80 Pull-Request past 3 years, do not agreed with that kind crooked open-source of practices.

This Fork will retain it's original BSD 2-Clause "Simplified" License until a License migration path solution is found.

Features
--------
 * Install EasyRTC's WebRTC Server on your own Linux, Windows, or Mac server in minutes not days.
 * Use our EasyRTC API and sample application code to build and deploy your WebRTC app in hours not weeks.
 * EasyRTC is completely free and open source under a BSD 2 license. No usage costs or other hidden fees.

Installation In A Nutshell
--------------------------
 1. Install [Node.js](http://nodejs.org)
 2. Download the EasyRTC distribution from github (https://github.com/open-easyrtc/open-easyrtc.git)
 3. Run `npm install` in the easyrtc directory.
 4. Enter the easyrtc/server_example directory by executing `cd server_example`
 5. Run `npm install` in the server_example directory.
 4. Start EasyRTC by running `node server.js` while in the server_example directory.
 5. Browse the examples using a WebRTC enabled browser. *(defaults to port `8080`)*

Important note: Chrome will not grant access to local microphones or cameras for a page served using http except for the localhost case. See the docs/easyrtc_server_ssl.md file for instructions on serving files using https.

Step by step instructions including additional setup options can be found in `/docs/easyrtc_server_install.md`

Note: there is no corresponding need to install the client files specifically; they were installed as part of EasyRTC in step 3.

Documentation
-------------
All documentation can be found within [the docs folder](./docs/).

_**Note:** Links marked with an asterisk (__*__) use the third-party service [http://htmlpreview.github.io](http://htmlpreview.github.io) to render HTML._

**EasyRTC Server**

 * [Install instructions for Ubuntu, Windows, and Mac](./docs/easyrtc_server_install.md)
     * `/docs/easyrtc_server_install.md`
 * [Configuration options](./docs/easyrtc_server_configuration.md)
     * `/docs/easyrtc_server_configuration.md`
 * [Using Server Events](./docs/easyrtc_server_events.md)
     * `/docs/easyrtc_server_events.md`  
 * [Server API](http://htmlpreview.github.io/?https://github.com/open-easyrtc/open-easyrtc/blob/master/docs/docs_in_html/server-api/index.html)__*__
     * `/docs/docs_in_html/server-api/index.html`  

**EasyRTC Client API**
 * [Client API tutorial](./docs/easyrtc_client_tutorial.md)
     * `/docs/easyrtc_client_tutorial.md`
 * [Client API (lite)](http://htmlpreview.github.io/?https://github.com/open-easyrtc/open-easyrtc/blob/master/docs/client_html_docs_lite/Easyrtc.html)__*__
     * `/docs/client_html_docs_lite/Easyrtc.html`
 * [Client File Transfer API (lite)](http://htmlpreview.github.io/?https://github.com/open-easyrtc/open-easyrtc/blob/master/docs/client_html_docs_lite/Easyrtc_ft.html)__*__
     * `/docs/client_html_docs_lite/easyrtc_ft.html`

**General Development**
 * [Frequently asked questions](./docs/easyrtc_faq.md)
     * `/docs/easyrtc_faq.md`
 * [Authentication](./docs/easyrtc_authentication.md/)
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
 * [Common WebRTC problems](./docs/easyrtc_webrtc_problems.md)
     * `/docs/easyrtc_webrtc_problems.md`
 * [Common EasyRTC problems (and solutions)](./docs/easyrtc_common_problems.md)
     * `/docs/easyrtc_common_problems.md`
 * [Debugging WebRTC](./docs/webrtc_debugging.md)
     * `/docs/webrtc_debugging.md`
 * [Server/Client Message Types](./docs/easyrtc_server_msgtypes.md)
     * `/docs/easyrtc_changelog.md`
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
 * Client side video recording

License
-------

Copyright (c) 2016, Priologic Software Inc.
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
