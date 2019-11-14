EasyRTC: Change Log
===================

v.2.0.5
-------
Changes:
- Fix clearMediaStream and call clearMediaStream on onUserMediaSuccess on video element used to detect size. 

v2.0.4
-------
Changes:
- Update enumerateDevices source.id only if missing to avoid readonly property error.

v2.0.3
-------
Changes:
 -  Improve stillAlive option changes and documentation #11
 -  Remove updateCheckEnable options #16
 -  Default STUN options are invalid #15

v2.0.2
-------
Changes:
  - Migrate RTCPeerConnection.getStats|setLocalDescription|setRemoteDescription to Promise instead of callbacks.

v2.0.1
-------
Changes:
  - Update to webrtc-adapter@7.3.0

v2.0.0
-------
Changes:
  - Merge beta branch
  - Fork from _EasyRTC_ to _Open-EasyRTC_, along with three years of changes [see here](https://github.com/open-easyrtc/open-easyrtc/issues/6)

v1.1.1
-------
New Features:
  - Documentation - Added explanation on why native clients aren't provided.
  - JS Client - Added restart ice.
  - JS Client - Added support for Half-trickle ice.
  - Server - Added methods to obtain connected easyrtcids with a given username.
  - JS Client - Pass stillAliveInterval from server. detect lack of still alive response on client.
  - JS Client - Better support for Cordova on iOS.

Changes:
  - JS Client - URL.createObjectURL was deprecated.
  - JS Client - Changes to typescript files.
  - JS Client - Updated use of navigator.GetUserMedia.
  - JS Client - Got rid of multistream_no_iframe demo since we don't have a plugin for it.
  - JS Client - Applied Chpasha's fix to support Temasys plugin.
  - JS Client - Updated webrtc-adapter and modified demo_multistream.
  - JS Client - fix Uncaught TypeError: Reduce of empty array with no initial value.
  - Server - New disconnect() function from sever code's connection object to allow for more graceful connections.

Fixes:
  - JS Client - Fix possible bad PeerConnection state on create-answer failure.
  - JS Client - RoomApiFieldTimer was being cleared instead of an element of it.
  - JS Client - Got rid of warning message about element not connected to root.
  - JS Client - fixed SessionDescription bug and IceCandidate bug.
  - Server - Fix issue where server's connectionObj.getUsername() didn't return a null if the connection object had no username.

v1.1.0
-------
New Features:
 
 - JS Client - Added setPeerOpenListener and setSignalingStateChangeListener. 
 - JS Client - Added options to set preferred video codec in peer connection.
 - JS Client - Added media stream recording feature and demo.
 - JS Client - Added support for selecting audio playback destination.
 - Documentation - Added info on git install steps. 

Changes:
 
 - JS Client - Use minFrameRate/MaxFrameRate for Firefox and Edge instead of frameRate.min and frameRate.max.
 - JS Client - Updated to use WebRTC ontrack api and newer media constraints api.
 - JS Client -Updated the ice filter demo and exposed it on the demo page.
 - Server - Updated default server options to use urls instead of url for ice se.
 - Server - Updated socket.io from 1.3.7 to 1.4.5.
 - Documentation - Updated client and server html documentation.
 - Documentation - Copyright date bump to 2016.
 - Documentation - Updated link to EasyRTC forum.
 - Documentation - Updated README to include bower install step.
 - Documentation - Updated docs to reflect the ../ reference in server.js and the need to run https servers.

Fixes:
 
 - JS Client - Fixed file sharing demo.
 - JS Client - Put a guard on onPeerClosed.
 - JS Client - Improvements in cancelling file transfer requests.
 - JS Client - Prevents possible undefined prop dataChannelReady if peer connection gets recycled early.
 - JS Client - Fixed easrytc_app UMD declaration.
 - JS Client - improved try catch block so that message processing errors didn't masquerade as json parse errors.
 - JS Client - Fix possible error due missing adapter.browserShim.attachMediaStream on some platform.
 - JS Client - In the multiparty demo, moved the socket.io reference above the easyrtc.js reference.
 - Documentation - Added fields to the inline documentation on client side to make it work better with jsdoc. We now get documentation for all the interesting files.
 - Documentation - Fixed error in easyrtc_client_tutorial.md
 - Packaging - Added index.js to bower ignored files since bower is for client only (not server).


v1.0.17
-------
New Features:

Changes:
 
 - JS Client - Remove check to see if createRTCPeerConnection works.
 - JS Client - Got rid of setVideoSrc (use setVideoSource instead)
 - JS Client - Updated adapter.js.
 - Documentation - Removed comment about Firefox non-support for video source.
 - Documentation - Updated inline documentation for getAudioSourceList and getVideoSourceList.
 - Documentation - Added .jshintrc
 - Documentation - Added copyright notice to easy_app.js
Fixes:
 - JS Client - Check if peer connection exists when responding to a webrtc negotiationneeded event, icecandidate event, addstream event.
 - JS Client - Check if peer connection exists before calling onPeerRecovered.
 - JS Client - Modified logic used to detect chrome browser.
 - JS Client - Updated references in device lists from id to deviceId.
 - JS Client - Improved setting of audio and video constraints.
 - JS Client - Prevent possible null on oniceconnectionstatechange event.currentTarget
 - JS Client - Fixes to easy_app error logging.
 - Documentation - Fixed documentation for setVideoDims.


v1.0.16
-------

New Features:
 
 - Add getSourceList and getAudioSourceList #80
 - IceConnectionStateChangeListener #122

Changes:

 - Update to socket.io 1.3.7 #209
 - Remove deprecated easyrtc.setVideoBandwidth #120

Fixes:

 - JS Client - WebRTC Version Detecting Fails When Simulating iPad In Chrome Dev Tools #90
 - JS Client - FileTransfer support on IE10 #137 #135
 - JS Client - Firefox and previous WebRTC impl does not call emitOnStreamClosed #173
 - JS Client - Update getUserMediaConstraints() implementation #176
 - JS Client - Possible bad userAgent RegExp in Adapter.js #177
 - JS Client - wrong condition expression in buildLocalMediaStream #189
 - JS Client - Missing argument for wasAcceptedCB #190
 - JS Client - Too many arguments passed into onRemoveStreamHelper #192
 - JS Client - Add missing error code SIGNAL_ERROR #193
 - JS Client - Add missing error code NOVIABLEICE #193
 - JS Client - Possible undefined getUserMedia #194
 - JS Client - Update Adapter.js to fix easyrtc require-js and AMD support #195
 - JS Client - joinRoom()'s roomParameters not a string #168
 - JS Client - Invalid range condition in getIthCaller #202
 - JS Client - Unnecessary if branch and flow in InitMediaSource #203
 - JS Client - Possible Undefined socket.io method #209
 - JS Client - bug for `deleted` in `findDeltas` #201
 - JS Client -  JSHint on easyrtc_int.js #169
 - Demos - Remove duplicate line #117
 - Demos - Fixed css class for mirroring local video #153
 - Documentation - A mistake in documentation #188
 - Server - error "attempt to connect when already connected to socket server" even if connection failed #98

 Thanks to contribution by @omochi for report and reviewing 1.0.16.

v1.0.15
-------

New Features:

 - JS Client - Support for IE10 file sharing. Thanks to contribution by Harold Thétiot. (issue #155)
 - Server - Added new server option "logMessagesEnable" which enables the logging of incoming and outgoing messages. In order to make this work, wrappers were added around the various log statements.

Changes:

 - JS Client - Allow longer p2p messages. Thanks to contribution by cphyc.
 - JS Client - Cut easyApp out of the easyrtc_int.js file into it's own easy_app.js file so it can be changed/replaced more easily. Some internal variables needed to be exposed to support this.
 - JS Client - Various code quality fixes
 - JS Client - Accommodate deprecated MediaStream.stop events
 - Server - Various code quality fixes
 - Server - Added additional debug level logging of incoming and outgoing socket messages. Added wrapper for socketCallbacks to permit additional logging for returning socket messages.
 - Demos - Updated links to point to new EasyRTC forums, located at https://easyrtc.com/forum/ (issue #167)

Fixes:

 - JS Client - Updated the peer statistics code to work with current Chrome api
 - JS Client - The onhangup method was being called with the wrong order of arguments when a roomOccupants message indicated that somebody had left.
 - JS Client - Changed mediastream.hasOwnProperty(id) to mediastream.id. Thanks to contribution by Harold Thétiot. (issue #163, #165)
 - Server - Fixed onCreateRoom events so they properly fire (issue #162)


v1.0.14
-------

Fixes: 

 - JS Client - Fix a bug in ProcessOccupantList that caused all rooms to appear to have the same occupant.
 - JS Client - Removed the dataset attribute usage in easyapp. It was causing problems in the multiroom demo.
 - JS Client - Fixed a bug in processRoomData that was clobbering apifields when the presence changed.
 - JS Client - Various code quality fixes
 - Demos - Added muting to the multstream demos so they didn't squawk.
 - Demos - Fixed the disconnect button in the demo_audio_video.html demo.


v1.0.13
-------

New Features:

 - JS Client - New function isPeerInAnyRoom() tells you whether a particular peer is still in any room. This is actually exposing an internal function.
 - JS Client - New function getNameOfRemoteStream() maps a remote stream  to the name it was assigned by the peer.
 - JS Client - New function setIceCandidateFilter() provides a hook to filter ice candidates on the fly. In theory, this should make it easier to test turn servers, just filter out the candidates that don't reference the turn server ip address.
 - JS Client - New function register3rdPartyLocalMediaStreams is used to register local media streams that were created external to EasyRTC (ie, by other frameworks).
 - JS Client - Stream names are now faked on Firefox. This is not a real solution to the problem of Firefox not labelling media streams, it is only a crude work around that will work if your Firefox session only has one local media stream.
 - JS Client - Added iframeless screen capture code to the labs directory.
 - JS Client - Added getAudioSourceList method as a complement to getVideoSourceList.

Changes:

 - JS Client - Changed setUsername so that it complains if you call it after authenticating.  This was done to make it more clear about when it was legal to call it.
 - JS Client - Added code to clear room data and your own easyrtcid on disconnecting from a server.  This was done to reduce confusion for applications that disconnected and reconnected.
 - JS Client - Updated the getPeerStatistics support for Firefox to take advantages of new fields that Firefox offers.
 - JS Client - Added *BytesSend and *BytesReceived fields to the peer statistics filters to support the ability to report bps rates.
 - JS Client - Added some support for the event "negotiationneeded". This should be transparent to developers. With thanks to Christophe Eyrignoux.
 - JS Client - Added code to remove information about a room after it has been exited.
 - JS Client - Added a connection options parameter to setSocketUrl. The default connection options now include a connect timeout of 10 seconds anda directive to always allocated a new connection (rather than reusing an old one). This was a fix for issue#107.
 - JS Client - Added some extra controls to the demo_audio_video demo.
 - JS Client - Added an extra callback parameter to the addStreamToCall method to report that the other peer received the offered stream.
 - JS Client - Changes to when the mediaIds (the mapping from stream names to stream labels) are propagated via setRoomApiFields.
 - JS Client - Added success/failure callbacks to addIceCandidate (and to setRemoteScriptions where missing).

Fixes:

 - JS Client - Fixed EasyApp so that it doesn't continue to reserve a video slot for a peer that has left the server before the peer connection was completed.
 - JS Client - Fixed a typo in setting the SDP filters.
 - JS Client - Fixed a problem that prevented the composition of new media streams (issue #110).
 - JS Client - Fixes for problems in closing remote media streams.
 - JS Client - Fixed a problem encountered when processing WebRTC answers (with thanks to Fabian Bernhard).
 - JS Client - Added a bugfix to the filesharing demo, supplied by vendredi67.
 - JS Client - Fixed a bug in the JSocs for setAcceptChecker.
 - JS Client - Added aggregating timers to compress a bunch of roomOccupant events that occur in a short span into a single event so that UI don't need to update as frequently as they would otherwise.
 - JS Client - If you call getPeerStatistics for a peer that isn't associated with a peer connection, you'll get a more useful object being passed to your callback now.


v1.0.12
-------

New Features:

 - JS Client - New Function setAutoInitUserMedia() sets whether the local media is automatically acquired before a call or answer (if not already acquired).
 - JS Client - New function setSdpFilters() for modifying SDP's just before a call. See issue #77.
 - JS Client - Labs directory with example SDP filters. See issue #77.
 - JS Client - New function getServerIce() gets the list of ice servers as supplied by the server.
 - JS Client - New function setIceUsedInCalls() sets the configuration used in the next call. 
 - JS Client - New function setUseFreshIceEachPeerConnection() causes the client to ask the server for a fresh ice config in the middle of each call or answer.
 - JS Client - Added support for multiple named mediastreams per connection , supported through the mediaIds apifield, getMediaStreamByName(), getLocalMediaIds(), closeLocalMediaStream(), buildLocalMediaStream(), getRemoteStream(), addStreamToCall(). See issue #34.
 - JS Client - Three new internal peer messages with types "__gotAddedMediaStream", "__closingMediaStream", and "__addedMediaStream" 
 - JS Client - New function getRoomOccupantsAsArray() and getRoomOccupantsAsMap().
 - JS Client - New function useThisSocketConnection() for people that want to allocate the websocket themselves. See issue #62.
 - Server - Socket.io v1.0 support. See issue #64.
 - Server - Support for hosting experimental API's in labs. New server option 'apiLabsEnable' defaults to true. See issue #76, #77.
 
Changes:

 - JS Client - enableCamera(), enableMicrophone(), getLocalStreamAsUrl(), initMediaSource(), call(), now take optional media stream names.
 - JS Client - initMediaSource's successCallback get	passed the new media stream.
 - JS Client - an onStreamClosed listener gets passed an easyrtcid plus the stream and the stream name.
 - JS Client - Added documentation for isTurnServer().
 - JS Client - getFreshIceConfig() now takes an optional callback.
 - Demos - Changed the titles of the demos and their labels to make them consistent. 
 - Demos - Gave a different app name to each demo.
 - Demos - Added a few new demos (multistream and low bandwidth).
 - JS Client - reduce the number of places where videoIds and the monitorVideoId was validated. See issue #68.

Fixes:

 - JS Client - Numerous documentation fixes.	
 - Demos - Fixed formatting in the hd definition demo. See issue #73.
 - JS Client - Fixed a null peer connection. See issue #72.


v1.0.11
-------

New Features:

 - JS Client - New function getVideoSourceList() to get the list of video sources (cameras).
 - JS Client - New function setVideoSource() to set the video source before calling initLocalMedia.
 - Server - New function appObj.deleteRoom() - Can now delete a room! See issue #16
 - Server - New function getRoomName() for returning the associated room name. Added to roomObj and connectionRoomObj.
 - Server - New synchronous function appObj.isRoomSync() for returning a quick boolean to indicate if a room exists
 - Server - New synchronous functions getFieldSync() and getFieldValueSync() added to objects which support fields.
 - Server - New function sessionObj.emitSessionDataFieldUpdate() added for emitting session fields to all connections with the same session id.

Changes:

 - JS Client - Redid getStatistics support for Firefox.
 - Server - Depreciating roomObj.setConnection() It was incomplete and improperly documented. It works as before, but logs a warning.
 - Documentation - Changelog now says 'JS Client' instead of 'API' to reference the JavaScript client.

Fixes:

 - JS Client - Fixed a bug in which entering a new room would cause you to drop any calls you had. The fix isn't perfect, leaving all rooms will still drop any calls you have.
 - JS Client - RoomJoinListener fires after storing updated data rather than before.
 - JS Client - Made candidate regexp matching case insensitive to support Firefox better.
 - JS Client - Better version number detection for Gecko not-Firefox browser userAgent strings. See issue #54
 - JS Client - A number of minor code and documentation fixes/changes to minimize warnings from Webstorm code inspection and Firefox execution.
 - Server - Fixed custom callback issue in roomObj.getConnectionObjects() which could affect custom listeners
 - Server - Fixed callbacks not always being called on default listeners for 'msgTypeRoomLeave', 'msgTypeGetIceConfig', 'msgTypeGetRoomList', 'msgTypeSetPresence'. This would cause problems in cases where custom listeners need to know when the default listener is complete.
 - Server - Added some extra checking for a condition when a client disconnected at the same time as a room field update is sent.
 - Server - Added roomParameter field to roomJoin event. This fixes issue #53
 - Server - Added additional error handling in several function to ensure objects are present
 - Server - Code clean-up. Spelling, documentation, formatting, and minor JavaScript fixes for issues found during code review
 - Server - Fixed message reply to setRoomApiField request which was invalid
 - Server - Fixed bad reference to default application name option. Added error handler so attempts to get a non-existent option are logged. 
 - Documentation - Updated ICE server help document to properly reference server option "appIceServers" 
 - Documentation - Several documentation updates to fix type-Os and improve clarity. Includes issue #39, #42
 - Documentation - Removed httpApp.configure() which caused a crash with Express v4. See issue #49, #57, #59.
 - Documentation - Improved documentation for 'demosPublicFolder' option. See issue #56
 - Server Example - Removed httpApp.configure() which caused a crash with Express v4. See issue #49, #57, #59.
 - Server Example - Specify Socket.io v0.9.x in package.json. Socket.io v1.0 is not currently supported.


v1.0.10
-------

New Features:

 - JS Client - Beginnings of internationalization support. This will be expanded upon in future versions.
 - JS Client - New media constraint function enableAudioReceive(). Control if client requests audio from peer.
 - JS Client - New media constraint function enableVideoReceive(). Control if client requests video from peer.

Changes:

 - JS Client: - Updates to getPeerStatistics() to better support Firefox

Fixes:

 - Server - Removed reference to Express's configure() which they removed in v4.0.0 (issue #49)


v1.0.9
------

New Features:

 - Documentation - New document entitled "WebRTC Common Problems and Solutions"

Changes:

 - JS Client - Removed support for TURN urls of the form "turn:name@domain:port" in favour of the newer form that separates the username field. Attempts to use the older form will result in an meaningful error message.
 - JS Client - If the first attempt to call to getUserMedia fails or throws an exception, wait two seconds and try again.
 - Server - Bumped Underscore module to v1.5.x.
 - Documentation - FAQ has both new and updated questions.
 - Documentation - New documentation for upgrading EasyRTC using NPM. (issue #43)

Fixes:

 - JS Client - Updated data channel support for Firefox so that it interops with Chrome again. 
 - JS Client - Fixed the easyrtc.supportsDataChannel methods check for Android browsers. Data channels aren't currently supported for Android by EasyRTC.
 - JS Client - When data channels are opened, an initial message is sent each way to verify that data channels work.
 - Server - Fixed bug where a getIceConfig request didn't return the proper format. (issue #46)
 - Documentation - Minor changes for greater consistency.


v1.0.8
------

New Features:

 - JS Client - Added easyrtc.getRoomApiField() convenience method to get a peers API fields.
 - Documentation - New install directions for Git users. (issue #29)

Changes:

 - JS Client - Better TURN detection for Firefox and Chrome
 - JS Client - Enabled 'force new connection' flag in socket.io.
 - Documentation - Various updates (inc. issue #41)
 - Demos - Added disconnect button to Instant Messaging Rooms demo

Fixes:

 - JS Client - A couple type-o fixes in easyrtc.supportsDataChannels()
 - JS Client - Fixed type-o in easyrtc.connect() causing bad reference to listener for signal failure. See issue #32 
 - JS Client - Fixed reference to error code in easyrtc.connect()
 - JS Client - Made data channel checks more strict (to cover lack of support on mobile)
 - JS Client - Fixed missing parameter when handing candidates.
 - JS Client - Fixed bug in easyrtc.sendServerMessage when debug was enabled.
 - Server - Allowing '+' symbol in client version string. This is allowed by http://semver.org
 - Server - Removed duplicate emit of room delta list when another client joins via explicit join room command. (issue #37)


v1.0.7
------

New Features:

 - Server - New function connectionObj.getUsername() to return the username of the specified connection.
 - Documentation - New guide for handling ICE configuration, including STUN and TURN
 - Documentation - New guide for handling authentication.

Changes:

 - JS Client - Renamed easyrtc.usernamePattern to easyrtc.usernameRegExp to align with server option name. Set the default value to align with default server option value.
 - Server - Cleanup of logging and error handling
 - Server - connectionObj.roomJoin() will no longer create a room if a room doesn't already exist. This logic is handled by the roomJoin event.
 - Demos - General cleanup including variable renaming (Why shoeldn't "signaling" have two L's?)

Fixes:

 - Server - Fixed issue when joining rooms when roomAutoCreateEnable option is disabled. When joining room fails, an error message is now returned rather than an empty roomData object. Related to issue #17 
 - Demos - Fixes and improvements for rooms demo.


v1.0.6-beta
-----------

New Features:

 - JS Client - New convenience function to return an array of easyrtcid's which match a username. easyrtc.usernameToIds()
 - Server - New application level function for determining if an easyrtcid is currently connected. appObj.isConnected()
 - Documentation - New guide for installing EasyRTC alongside another server
 - Documentation - New guide for running EasyRTC with SSL
 - Documentation - New guide for using rooms (still in progress)

Changes:

 - JS Client - easyrtc_closeicon uses an inline svg in the easyrtc.css file instead of an external svg.
 - JS Client - easyrtc.easyApp now renders remote video object invisible on stream close
 - JS Client - Fixed some handling in joinRoom and leaveRoom (which now optionally allows success and failure callbacks)
 - Server - Code cleanup. Error handling improvements. Removal of debug code.
 - Documentation - Updates to server configuration, upcoming features, and client tutorial.

Fixes:

 - JS Client - Handle a possibility of the lastLoggedInList not having a room entry before adding an easyrtcid to it (Related to issue #14)
 - Demos - Screen share and rooms demo now properly use easyrtc.setUsername()
 - Server - Now disconnects client if an easyrtcAuth message is received when they are already logged in.
 - Server - Message verification fixes for easyrtcsid, and application names


v1.0.5-beta
-----------

Changes:

 - JS Client - Additional improvements to file sharing API such as better handling of aborted transfers. 
 - Server - Renamed server option to `appIceServers` to match other application level options.

Fixes:

 - JS Client - Fixed a string split issue when sending easyrtcsid value
 - Server - Fixed bug which resulted in the iceServers message to be wrapped in another iceServers object. (Issue #20) 


v1.0.0-beta to v1.0.4-beta
--------------------------

Due to merge issues, these versions weren't fully released. (But may have made it onto NPM)

Changes:

 - Moved alpha branch to beta branch
 - Demos - Referenced Opera's WebRTC capabilities in the demo homepage
 - Demos - Cleaned up simple video demo
 - Documentation - Updated 'Alpha' to 'Beta' in a few spots which were missed.

Fixes:

 - Server Example - Switched package.json to match modules with '-' due to npm problems


v0.10.4-alpha
-------------

Fixes:

 - Server - Fixed onRoomCreate event force close bug.


0.10.3-alpha
------------

New Features:

 - JS Client + Server - API fields. These are basically variables which are set by the client and shared to others in the room. Many possibilities!
 - JS Client + Server - ICE Config improvements. Client can now request an updated ICE configuration from the server, or server can force new one on client.
 - Server - isConnected() function added to connection object.
 - Server - Added convenience functions to several objects such as getAppName()
 - Server - Added pub.events.emitDefault() method. The previous method of finding the default listener in an object was clunky.

Changes:

 - JS Client + Demos - Renaming initManaged() to easyApp(). Old name remains for the time being
 - Server - isAuthenticated() now a synchronous function and returns a boolean 

Fixes:

 - Lots. But please let us know if there's any others which need doing.


0.10.2-alpha
------------

New Features:

 - Server - Many changes to public object to ease development, including exposing events and util objects at every level.
 - Server - easyrtc_default_event_listeners.js has been improved by the addition of several new listeners. JSDoc's have been written for each default listener.
 - Server - New events "authenticate", "roomJoin", "roomCreate", "roomLeave"
 - Server - Initial support for Express sessions.
 - Server - Support for checking for minified version of API (not yet provided).

Changes:

 - JS Client - Added better treatment of server disconnect
 - Server - Additional support for fields.
 - Server - Many existing events have been renamed or improved. Too many to list here.
 - Documentation - JSDoc's of client API and server code is in separate folders.

Fixes:

 - Lots. But please let us know if there's any others which need doing.
 - Demos - Fixed several of the demos which broke in 0.10.1a


v0.10.1a
--------

New Features:

 - JS Client - easyrtc_ft.js - A separate official EasyRTC module for handling file transfers. See the updated file sharing demo for an example.
 - JS Client - Function to get list of currently subscribed rooms - getRoomsJoined()
 - JS Client - Functions to support fields - getRoomFields(), getApplicationFields(), getConnectionFields()
 - Server/API - Support for fields (Application, room, and connection level)
 - Server - Capability to set server options for specific applications, and rooms. Added parameter to createApp() and createRoom() to support this.
 - Server - Added setOption() and getOption() methods to application and room objects.
 - Server - Support for setting fields with new functions added to the application, room, and connection objects.
   - getField()
   - getFields()
   - setField()
 - Server - New server options for setting default field variables at the application, room, and connection level.
   - "appDefaultFieldObj", "roomDefaultFieldObj", and "connectionDefaultFieldObj"

Changes:

 - JS Client - setPeerListener() - Updated to allow the setting of listeners for specific message types and from specific peers.
 - Documentation - Lots more updates to support new release. Much more to do.

Fixes:

 - Lots. But please let us know if there's any others which need doing.


v0.10.0a
--------

New Features:

 - Server/API - Rooms. An EasyRTC application can have multiple rooms. A user can be in one or more rooms at the same time. Users can only see other users in the same room. If no room is provided, connections will be entered into a room named `default`.
 - Server/API - Custom authentication method. Username / Credential can be provided. Username is broadcast to other authenticated users, so it may be used by apps.
 - Server - Reworked to be node.js module. (BIGGEST NEW FEATURE)
 - Server - New server options handler. Allows possibility of server/application/room level options. Many new options available.
 - Server - Many new server events. This is intended to be the new primary way for developers to interact with EasyRTC server.
 - Documentation - New documentation for internal EasyRTC command messages which highlight how the API and server communicate to each other.

Changes:

 - Server/API - Delta lists. When the online list is changed, only the changed connections are broadcast. This should reduce bandwidth and improve scalability.
 - Server/API - Initial authentication and application setup now handled by a separate socket.io message type called 'easyrtcAuth'. This allows us to easily ignore other messages until a client has authenticated.
 - Server - Better incoming message validation. Now it's handled once right after the message is received.
 - Documentation - While the EasyRTC logo remains, when in text form, EasyRTC will have a capitol "E", which should make writing about it in sentences easier.

Removed Features:

 - Server - No longer includes modules for express, socket.io. These must now be included in your server app. (See our server examples)
 - Server - No longer uses the winston module for logging. The default listener logs to the console. This can be easily overruled by setting your own `log` listener.
 - Server - No longer includes the experimental STUN server. If there is enough demand we can release it as a separate module, otherwise there are several good STUN and TURN solutions now available.

Fixes:

 - Lots. But please let us know if there's any others which need doing.

Upgrade Note:

 - This is a major release which will require existing installations to carefully upgrade.


v0.9.0
------

New Features:

 - JS Client - new easyrtc.setPeerListener() function. Sets a listener for data sent from another client. Replacement for set data listener.
 - JS Client - new easyrtc.setServerListener() function. Listens for messages from the server which are not from another peer.

Changes:

 - JS Client - Implementing methods used in Google's adapter.js for cross browser support
 - Server/API - Renamed easyRTCcmd socket message type to easyrtcCmd. Should have no outside effect.
 - Server - Moved API files to the /api/ folder thus cleaning up the /static/. API files are publicly linked using /easyrtc/easyrtc.js and /easyrtc/easyrtc.css. For transitional purposes, the old public file locations are still accessible.
 - Server - Version bump for express to 3.3.x
 - Demos - Renamed mobile rooms demo to multiparty char room demo so its capabilities were more clear
 - Documentation - Added links and images in readme.md to the various documentation and youtube resources

Fixes:

 - JS Client - Firefox - Strips TURN servers from ICE config if they are present. Firefox doesn't currently handle TURN servers well.
 - JS Client - Added one second delay to getUserMedia call to try and correct some page loading problems.


v0.8.0
------

New Features:

 - JS Client - Added support for grabbing the screen as the local media source. Currently this only works in Canary, and causes the browser to crash if you try to use it in a peer connection.
 - JS Client - Added support for grabbing video at high-definition instead of the default standard definition. Warning: the browser may cheat and give you a lower resolution than you asked for that has the desired aspect ratio.
 - JS Client - Added a number of callbacks to the initManaged method to support richer interactions with the client.
 - JS Client - Added a cleaner error reporting mechanism. The code now calls showError(errCode, errText) to report an error. showError will in turn call onError (which you can still override).
 - JS Client - Added support for calls that get cancelled (by the initiator) before they are accepted or rejected.
 - JS Client - Added a method to query the status of a peer to peer call.
 - JS Client - Added the dontAddCloseButtons method.
 - JS Client - When initMediaSource is called, the API creates a temporary video object to determine the pixel dimensions of the local camera. Until this version, that video object wasn't being explicitly destroyed, which resulted in a feedback shriek in Firefox and the most recent versions of Chrome. The temporary video object is now being destroyed.
 - Server - Added socket.io options to config.js. Note that socketIoClientGzipEnabled is now false by default as gzip causes issues on some servers (often Windows).
 - Demos - Added a screen sending and screen receiving demo. These tend to crash the browser at this point. Hopefully Google will get that feature working properly again.
 - Demos - Added a multiperson tablet-oriented chat demo that runs very nicely on your Android devices.
 - Documentation - Moved the client API documentation from mark-down format to jsDoc and added inline examples. Check out the easyrtc.html file in the docs directory. The easyrtcjs.html file is a helper file that shouldn't be looked at directly.

Changes:

 - Demos - In demos which show the local media stream as both audio and video (as a mirror), the video object with the local media stream is muted and given a volume of 0.
 - Demos - Removed references to Firefox requiring flags
 - Server - Version bumps for node modules express (3.2.x) and winston (0.7.x).
 - Server - Added additional public stun servers

Fixes:

 - JS Client - The mozRTCSessionDescription object didn't used to work properly in Firefox. Now it appears to be required.
 - JS Client - When initMediaSource is called, the API creates a temporary video object to determine the pixel dimensions of the local camera. Until this version, that video object wasn't being explicitly destroyed, which resulted in a feedback shriek in Firefox and the most recent versions of Chrome. The temporary video object is now being destroyed.


v0.7.0
------

New Features:

 - JS Client - Added initial support for Data Channels.
 - JS Client - Added more debugging output and provided a means to control it through the easyrtc.debugPrinter variable and easyrtc.enableDebug function.
 - JS Client - Added code to log application state (WRT webrtc) to the server.
 - JS Client - New function setSocketUrl() to point to web socket server. Allows website to be hosted using a seperate server (suchs as Apache). The default remains for the EasyRTC server to function as both the web and socket server.
 - JS Client - Support for hanging up on calls still being set up - on the initiating side by extending the easyrtc.hangup function, and on the receiving side by adding the easyrtc.setCallCancelled callback setter.
 - JS Client - Added easyrtc.getConnectStatus function to get the state of a connection to a peer.
 - Server - SSL support for web and socket server including non-ssl forwarding.
 - Server - Logging features. Both console and file based logging with fine-grained configuration.
 - Server - Checks if required modules are installed at start.
 - Demos - Added demos for data channel messaging and data channel file sharing.
 - Documentation - Server configuration.
 - Documentation - This changelog :)

Changes:

 - JS Client - The callSuccessCB argument to easyrtc.call now has a second argument, which can be either 'audiovideo' or 'datachannel'. The callSuccessCB function may be get called twice if the peer connection is using data channels as well as audio or video.
 - JS Client - Fixed easyrtc.connect so that you can reconnect after calling disconnect.
 - Server - Websocket 'onMessage' section moved to external function for easier editing.
 - Server - Much of the general server code moved to external functions.
 - Demos - Various visual html fixes and changes.
 - Demos - Removed unneeded CSS for selfVideo tag from demo_audio_only.html, changed callerVideo id to callerAudio id, removed selfVideo tag and javascript which referenced it, changed a variable name from 'video' to 'audio'.

Fixes:

 - Server - Bad link to a stun server.


v0.6.0
------

New Features:

 - Demos - Demo landing page which includes links and compatibility chart.
 - Server - Option to disable demos in config.js.
 - JS Client - powered_by_easyrtc.png image. Please use it to promote the project.

Changes:

 - Demos - Change Split live demos to their own folder.
 - Demos - Change Major graphical upgrade for demos and landing page.


v0.5.0
------

 - Initial release.
