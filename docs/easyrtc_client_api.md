easyRTC: Client API
===================

easyRTC.enableDebug
-------------------
A function that enables or disables debugging output in the easyRTC.js library.

Arguments:

+ enable - true for debugging output to the console, false by default.

You can handle the debugging messages yourself by setting easyRTC.debugPrinter to 
a function that accepts single text string argument. This is what easyRTC.enableDebug
does when you give it a true valued argument.


easyRTC.setSocketUrl
---------------------
Sets the url of the Socket server.
The node.js server is great as a webrtc signaling server, but it doesn't have
all the hooks you'd like in a general web server, like PHP or Python
plug-ins. By setting the serverPath your application can get it's regular
pages from a regular webserver, but the easyRTC library can still reach the
socket server. If used, this function needs to be called before calling easyRTC.connect.

Arguments:

+ socketUrl: The URL of the webrtc signaling server.

You can use a string of the form  ":port" if the signaling server is on the same domain 
as the web server, where port is the port number. For example, ":8080".

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


easyRTC.enableDataChannels
--------------------------
Sets whether Peer-to-peer data channels will be established in any subsequent calls.

Arguments:

+    enabled - true to define data channels, false otherwise. The default is false.


easyRTC.cleanId
---------------
Transforms a string, removing parts of a string that define HTML tags if used as HTML source.

Arguments: 

+ sourceString - A string that may include HTML tags.


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


easyRTC.getLocalStreamAsUrl
---------------------------
Returns a URL for your local camera and microphone.
It can be called only after easyRTC.initMediaSource has succeeded.
It returns a url that can be used as a source by the chrome <video> element or the <canvas> element.

Arguments: none


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

The easyrtcid of each object is currently the same as the id. For example, the listener could be passed something like:
>  { smith:{easyrtcid:'smith', clientConnectTime:'19293838'}, { jones:{easyrtcid:'jones',  clientConnectTime:'19293838'}}


easyRTC.setCallCancelled
------------------------
Supplies a callback that will be invoked on the called party's side when the caller hangups before the call is completed.

Arguments:

+ function listener(easyrtcid)


easyRTC.getConnectionCount
--------------------------

Returns the number of connections to peers.

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


easyRTC.setOnStreamClosed
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

+ function listener(senderId, data)

The data can be any JSON-ible structure.


easyRTC.setDataChannelOpenListener
----------------------------------
Supplies a callback that is called when a data channel is open and ready to send data.

Arguments:

+ function listener( easyrtcid)


easyRTC.setDataChannelCloseListener
----------------------------------
Supplies a callback that is called when a data channel is closed.

Arguments:

+ function listener( easyrtcid)


easyRTC.getConnectStatus
------------------------
Returns the state of a connection to particular user.

Arguments: 

+ easyrtcid - the id of the other user.

Returns one of the following values:
   +    easyRTC.NOT_CONNECTED
   +    easyRTC.BECOMING_CONNECTED
   +    easyRTC.IS_CONNECTED
The return values are text strings so you can use them in debugging output.


easyRTC.connect
---------------
Performs the connection to the server. You must connect before trying to call other users. You should call easyRTC.initMediaSource before easyRTC.connect, if you are going to be sharing media streams.

Arguments:
+ applicationName - the name of your application. The loggedInListener only gets lists of other people
  connected who have used the same applicationName. 
+ function successCallback(yourEasyrtcid) is called on successful connect. yourEasyrtcid is guaranteed to be unique. 
+ function errorCallback(msgString) is called on unsuccessful connect. If null, an alert is called instead.


easyRTC.sendData
----------------
Sends data to another user. This method will use a data channel if one has been established to the 
remote user, or websockets otherwise.

Arguments:

+ destEasyrtcid
+ data - an object which can be JSON'ed.

This is a complement to easyRTC.setDataListener.


easyRTC.sendDataP2P
-------------------
Sends data to another user using previously established data channel. This method will
fail if no data channel has been established yet. Unlike the easyRTC.sendWS method, 
you can't send a dictionary, convert dictionaries to strings using JSON.stringify first. 
What datatypes you can send, and how large a datatype depends on your browser.

Arguments:

+ destEasyrtcid
+ data - an object which can be JSON'ed.

This is a specialized version of easyRTC.sendData.


easyRTC.sendDataWS
------------------
Sends data to another user using websockets.

Arguments:

+ destEasyrtcid
+ data - an object which can be JSON'ed.

This is a specialized version of easyRTC.sendData.


easyRTC.call
------------
Initiates an audio and/or call to another user.

Arguments:

  + otherEasyrtcid - the name of the other user.
  + function callSuccessCB(callersEasyrtcid, mediaType) - this callback is invoked when a media stream is received from the other end of call. Mediatype is either 'audiovideo' or 'datachannel'. The successCallback will be called twice if you have enabled data sharing as well as audio and/or video sharing (once with each mediaType value).
  + function callFailureCB(errMessage)- function to call if there was a system error interfering with the call.
  + function wasAcceptedCB( wasAccepted:boolean,otherEasyrtcid:string) - is called when a call is accepted or rejected by another party. It can be left null.

If the call succeeds, the streamAcceptor callback (provided by easyRTC.connect) will be called as well.


easyRTC.hangup
--------------
Hang up on a particular peer.

Arguments:

+ otherEasyrtcid - id of the peer to hang up on.

This is used for hanging up on peers that you have an established session with,
as well as hanging up on calls that haven't been completed yet.


easyRTC.hangupAll
-----------------

Arguments: none.

Hangs up on all current connections.


easyRTC.initManaged
-------------------
Provides a layer on top of easyRTC.init.

Arguments:
+ applicationName - name of the application. See easyrtc.connect for explanation.
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

Note: This function initially defined in the easyRTC.js file with an empty body, but gets reassigned once the server is connected to.
