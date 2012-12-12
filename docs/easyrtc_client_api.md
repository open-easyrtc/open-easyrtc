easyRTC: Client API
===================

easyRTC.enableAudio
-------------------
Sets whether audio is transmitted by the local user in any subsequent calls.

Arguments:

+ enabled - true to include audio, false to exclude audio. The default is true.


easyRTC.enableVideo
-------------------
Sets whether video is transmitted by the local user in any subsequent calls.

Arguments:

+    enabled - true to include video, false to exclude video. The default is true.


easyRTC.initMediaSource
-----------------------
Initializes your access to a local camera and microphone.

Arguments:

+    successCallback() will be called when the media source is ready.
+    errorCallback(msgStr) is called if the attempt to get media failed.

Failure could be caused a browser that didn't support WebRTC, or by the user
 not granting permission.

If you are going to call easyRTC.enableAudio or easyRTC.enableVideo, you need to do it before calling easyRTC.initMediaSource.


easyRTC.getLocalStream
----------------------
Returns a media stream for your local camera and microphone.

Arguments: None

It can be called only after easyRTC.initMediaSource has succeeded.
It returns a stream that can be used as an argument to easyRTC.setVideoObjectSrc.


easyRTC.createObjectURL
-----------------------
Builds a URL from a media stream. This is occasionally useful with Chrome.

Arguments:

+ MediaStream

The video object in Chrome expects a URL.


easyRTC.setVideoObjectSrc
-------------------------
Sets a video object from a media stream.

Arguments:

+ videoObject - a document object of type <video>.
+ stream - a media stream as returned by easyRTC.getLocalStream or your stream acceptor.

Chrome uses the src attribute and expects a URL, while Firefox uses the mozSrcObject and expects a stream. This procedure hides that from you.


easyRTC.setLoggedInListener
---------------------------
Supplies a callback that will be invoked when the list of people logged in changes.

Arguments:

+ function listener( {id1:{easyrtcid:id1, clientConnectTime:domString},
                        id2:{easyrtcid:id2, clientConnectTime:domString},...
                        }){}

The default is null, in which case no listener is alerted.

The easyrtcid of each object is currently the same as the id. For example, the listener could be passed something:
>  { smith:{easyrtcid:'smith', clientConnectTime:'19293838'}, { jones:{easyrtcid:'jones',  clientConnectTime:'19293838'}}


easyRTC.getConnectionCount
--------------------------

Returns the number of live connections.

Arguments: none


easyRTC.setAcceptChecker
------------------------
Sets the callback used to decide whether to accept or reject an incoming call.

Arguments:

+ function acceptCheck(callerEasyrtcid, function():boolean ) {}

The acceptCheck function is passed (as it's second argument) a function that should be called with either a true value (accept the call) or false value( reject the call). This is done, rather than having the callback return a boolean value itself, so that you can implement dialogs that don't block the main javascript thread.


easyRTC.setStreamAcceptor
-------------------------
Sets a callback to receive media streams from other peers, independent
  of where the call was initiated (caller or callee).

Arguments:

+ function acceptor (caller, mediaStream) {}


easyRTC.setOnError
------------------

Sets the error listener. This will be called when errors conditions occur. The default is to present an alert.

Arguments:

+ function errListener(errMessage) {}


easyRTC.setStreamClosed
-----------------------
Sets a callback to receive notification of a media stream closing.

Arguments:

+ function onStreamClose(callerName) {}


easyRTC.setVideoBandwidth
-------------------------
Sets the bandwidth for sending video data.

Arguments:

+rate: in kps per second.

Setting the rate too low will cause connection attempts to fail. 40 is probably good lower limit.
The default is 50. A value of zero will remove bandwidth limits.


easyRTC.setDataListener
-----------------------
Sets a listener for data sent from a peer that is connected to the same server.

Arguments:

+   function listener(senderId, data)

The data can be any JSON-ible structure.


easyRTC.connect
---------------
Performs the connection to the server. You must connect before trying to call other users. You should call easyRTC.initMediaSource before easyRTC.connect, if you are going to be sharing media streams.

Arguments:

+ function successCallback(yourEasyrtcid) is called on successful connect. yourEasyrtcid is guaranteed to be unique.
+ function errorCallback(msgString) is called on unsuccessful connect. If null, an alert is called instead.


easyrTC.sendData
----------------
Sends data to another user.

Arguments:

+ destEasyrtcid
+ data - an object which can be JSON'ed.

This is a complement to easyRTC.setDataListener.


easyRTC.call
------------
Initiates an audio and/or call to another user.

Arguments:

  + otherEasyrtcid - the name of the other user.
  + function callSuccessCB(callersEasyrtcid) - this callback is invoked when a media stream is received from the other end of call.
  + function callFailureCB(errMessage)- function to call if there was a system error interfering with the call.
  + function wasAcceptedCB( wasAccepted:boolean,otherEasyrtcid:string) - is called when a call is accepted or rejected by another party. It can be left null.

If the call succeeds, the streamAcceptor callback (provided by easyRTC.connect) will be called as well.


easyRTC.hangup
--------------
Hang up on a particular peer.

Arguments:

+ otherEasyrtcid - id of the peer to hang up on.


easyRTC.hangupAll
-----------------

Arguments: none.

Hangs up on all current connections.


easyRTC.initManaged
-------------------
Provides a layer on top of easyRTC.init.

Arguments:

+ monitorVideoId - the id of the video object used for monitoring the local stream.
+ videoIds - an array of video object ids (strings)
+ onReady - a callback function used on success. On failure, an alert is thrown.

It will call
 easyRTC.initMediaSource and easyRTC.connect, assign the local media stream to
 the video object identified by monitorVideoId, assign remote video streams to
 the video objects identified by videoIds, and then call onReady. One of it's
 side effects is to add refresh and stop buttons to the remote video objects, buttons
 that only appear when you hover over them with the mouse cursor.


easyRTC.disconnect
------------------
Drops your connection to the server and any other peers.

Arguments: none

Note: You can't reconnect with easyRTC.connect after calling easyRTC.disconnect. This seems to be caused by the underlying calls to the socket.io library not approving of the concept, it is not a design decision purposely done in easyRTC.
