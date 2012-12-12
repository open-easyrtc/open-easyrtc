Client API Tutorial
====================

Support scripts
---------------

You need to include the following two lines in your html file:

 >   <script src="/socket.io/socket.io.js"></script>
 
 >   <script type="text/javascript" src="js/easyrtc.js"></script>            

The socket.io.js file provides Websocket support needed by the easyrtc.js library.

Initializing the media Stream
-----------------------------
If you don't want to share your audio or your video, you can disable their transmission with one of the below calls (before calling easyRTC.initMediaSource):

>    easyRTC.enableAudio(false);

>    easyRTC.enableVideo(false);

It is an error to disable both your audio and video since you won't have a media stream if you disable both.

To initialize the media stream, you next call: 

>    easyRTC.initMediaSource(successCallback, failureCallback);

If the successCallback gets called, you can call easyRTC.getLocalStream() to get the local media stream. 
You can then use easyRTC.setVideoObjectSrc to assign the local media stream to a video object or a canvas object, allowing you to monitor what your webcam is displaying.

If the failureCallback gets called, it's first argument will be error message text indicating why the call failed.


Connecting to the Server
------------------------

Before you can contact another peer, you need to connect to your node.js server. 
You do this with the following call:

>    easyRTC.connect(applicationName, loginSuccessCB, loginFailureCB);

The application name is used to control which clients can see which other clients are connected. 
Clients only see other clients that present the same applicationName.
    
Once you connect, your loginSuccessCB function will be invoked, passing you an easyrtcid (DOMString) that identifies your client. 
The easyrtcid is only valid for the duration of the connection. 

Before connecting to the server, you typically set callbacks to catch interesting events:

+ easyRTC.setLoggedInListener: sets the callback to find out when other clients with the same application name
   connect or disconnect. 
+ easyRTC.acceptCheck: sets a callback that is used to decide whether or not to accept a call from another client.   
+ easyRTC.setStreamAcceptor: sets a callback that is invoked each time 
   a media stream is delivered to the client as a result of calling another or accepting a call.    
+ easyRTC.setOnError: sets a callback that is invoked if an error occurs.    
+ easyRTC.setOnStreamClosed: sets a callback that is invoked when a media stream is closed (i.e., a peer hangs up).
+ easyRTC.setDataListener: sets a callback for listening for messages from other peers. This is a server mediated communication.


This is also a good time to set the bandwidth that WebRTC uses for video connections. 
You can do this using easyRTC.setVideoBandwidth. Currently, this is only respected by Chrome.

An Easier Path
--------------
You can combine the easyRTC.initMediaSource and easyRTC.connect call using:

>    easyRTC.initManaged(applicationName, self-video-id,  array-of-caller-video-ids, loginSuccessCB);    

This call will also provide it's own listeners for easyRTC.setStreamAcceptor and easyRTC.setOnStreamClosed. 

Once You Have A Connection
--------------------------

+ You can send data to another client using easyRTC.sendData. This will generate an event on the
 peer responded by the peer's data listener (see easyRTC.setDataListener).
+ You can initiate a audio/video conference with another peer using easyRTC.call.               
+ You can hangup on an existing audio/video conference using easyRTC.hangup.
+ You can hangup on all your existing audio/video conferences using easyRTC.hangup.

Disconnecting From The Server
-----------------------------
You can disconnect from the server by calling easyRTC.disconnect. 
Currently there is a problem in re-connecting afterwards though.
