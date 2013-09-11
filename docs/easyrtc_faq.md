EasyRTC: FAQ
============

What is WebRTC?
---------------

> WebRTC allows real-time communications within the browser without the need for plugins. A few of its greatest benefits include:

> * Standardized methods of connecting to web cameras and microphones.
> * Peer to peer connections. Improves latency and reduces bottlenecks on the servers.
> * Standardized negotiation for steaming audio, video and data.


What is EasyRTC?
----------------

> EasyRTC removes the pain associated with getting started with WebRTC with the following cool features:

> * Cross browser support.
> * Working source code.
> * Easy server install.
> * WebSocket server.
> * Single language for server and clients (Javascript).
> * Open Source and free!

Why is WebRTC Hard?
-------------------

> The WebRTC API is a mid-level API. That is to say, that while it insulates the developer from stuff like connecting to cameras or contacting TURN and STUN servers, it still requires the developers to implement an involved message passing scheme between clients to establish the peer to peer connection.

> The EasyRTC framework provides that message passing scheme so that the developer can focus on the tasks that are actually relevant to them.


EasyRTC Requirements:
--------------------
> So far we have tested EasyRTC on Windows 7 and Ubuntu 12.04 LTS where users have administrator or sudo access.

> We'll be testing it on a bunch more platforms shortly. We expect it can run anywhere Node.JS will, with only minor changes.


Is EasyRTC production ready?
----------------------------

> Not yet. Our first priority is to get EasyRTC out quickly to allow developers the chance to experiment and program WebRTC applications. There is a lot of work still to go in providing additional features which production code will need. We invite all users to give us feedback as to what features you desire.


When will WebRTC be ready for production?
-----------------------------------------

> Currently the WebRTC W3C specification is still being finalized. The posted date  they have for reaching recommendation status (Q1 2013)  is likely over optimistic. With implementation methods still being debated, be prepared for it to take until Q4 2013 (or longer).

> As the specification gets closer to recommendation status, we expect those browsers which are currently working on WebRTC to better communicate with each other.

> Some browsers may wait until after the standard reaches recommendation status to implement WebRTC.


How about Multi-way Conversations?
----------------------------------
> WebRTC doesn't support multicast or broadcast packets (currently), so the only way to do multi-way conversations is a star configuration: each peer establishes a connection to every other peer. The EasyRTC API will support this, but it isn't advised for production environments because multiple connections tend to make the browser crash.

> [Check out our YouTube Demo](http://www.youtube.com/watch?v=ZIIcEac24RU) where we had a four-way conversation going using Chrome Canary (v25).


Why use Node.js?
----------------

> Node.JS is a powerful asynchronous server platform which has several qualities we find enduring:

> * Performs exceptionally well as a HTML5 socket server.
> * Easy to program for with a thriving open source community to back it up.
> * Multi-platform! Allows installs on Linux, Windows, and Macs.
> * The Node Package Manager provides an easy way to distribute and install EasyRTC.


Are there plans to integrating with SIP?
----------------------------------------

> SIP is an extensive protocol, and developing a WebRTC platform which supports it in a way casual developers could use it would be difficult. Unless we can come up with a way to make this "easy", it won't happen. This does allow for SIP and VOIP gateways to implement WebRTC using EasyRTC.

> We hope to get to the point where the question will be posed to the SIP gateways out there. Are there plans to integrate with EasyRTC?


How do I report bugs or ask for features?
-----------------------------------------

> We monitor both the Github issue tracker and the Google Groups discussion forum.

> * [https://github.com/priologic/easyrtc/issues](https://github.com/priologic/easyrtc/issues)
> * [https://groups.google.com/forum/?forum/#!forum/easyrtc](https://groups.google.com/forum/?forum/#!forum/easyrtc)


You Didn't Answer My Question!
------------------------------
> Ask away on our forum. We do monitor it!

> * [https://groups.google.com/forum/?forum/#!forum/easyrtc](https://groups.google.com/forum/?forum/#!forum/easyrtc)
