easyRTC: Change Log
===================

v0.7.0
------

New Features:

 * API - Added initial support for Data Channels.
 * API - Added more debugging output and provided a means to control it through the easyRTC.debugPrinter variable and easyRTC.enableDebug function.
 * API - Added code to log application state (WRT webrtc) to the server.
 * API - New function setSocketUrl() to point to web socket server. Allows website to be hosted using a seperate server (suchs as Apache). The default remains for the easyRTC server to function as both the web and socket server.
 * API - Support for hanging up on calls still being set up - on the initiating side by extending the easyRTC.hangup function, and on the receiving side by adding the easyRTC.setCallCancelled callback setter.
 * API - Added easyrtc.getConnectStatus function to get the state of a connection to a peer.
 * Server - SSL support for web and socket server including non-ssl forwarding.
 * Server - Logging features. Both console and file based logging with fine-grained configuration.
 * Server - Checks if required modules are installed at start.
 * Demos - Added demos for data channel messaging and data channel file sharing.
 * Documentation - Server configuration.
 * Documentation - This changelog :)

Changes:

 * API - The callSuccessCB argument to easyRTC.call now has a second argument, which can be either 'audiovideo' or 'datachannel'. The callSuccessCB function may be get called twice if the peer connection is using data channels as well as audio or video.
 * API - Fixed easyRTC.connect so that you can reconnect after calling disconnect.
 * Server - Websocket 'onMessage' section moved to external function for easier editing.
 * Server - Much of the general server code moved to external functions.
 * Demos - Various visual html fixes and changes.
 * Demos - Removed unneeded CSS for selfVideo tag from demo_audio_only.html, changed callerVideo id to callerAudio id, removed selfVideo tag and javascript which referenced it, changed a variable name from 'video' to 'audio'.

Fixes:

 * Server - Bad link to a stun server.


v0.6.0
------

New Features:

 * Demo landing page which includes links and compatibility chart.
 * Option to disable demos in config.js.
 * powered_by_easyrtc.png image. Please use it to promote the project.

Changes:

 * change Split live demos to their own folder.
 * change Major graphical upgrade for demos and landing page.

v0.5.0
------
 * Initial release.