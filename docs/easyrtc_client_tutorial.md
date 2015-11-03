EasyRTC Framework Tutorial
=======================

Overview
---------

EasyRTC is a framework built on top of WebRTC, an emerging W3C/IETF standard for real time communication of audio, video, and data directly between web browsers.  WebRTC supports the transfer of audio, video and data on a peer-to-peer basis putting very little load on supporting servers.

The EasyRTC framework consists of a client or browser-side JavaScript library and a backend JavaScript server built on top of a node.js.  Because the WebRTC libraries is built into each browser there is no need for a browser plug-in.

Google's Chrome browser has the broadest support for the WebRTC API. Opera is now using the same engine as Chrome and hence mimics it's behavior. Firefox provides excellent support for data communications but only basic support for video chats (it lacks the ability to set the camera resolution, programmatically allow screen sharing, or do statistics gathering).

WebRTC has the potential once it is fully standardized to support audio and video chats and conferencing, multiplayer games and many other audio, video and data-based applications.

As is often the case with software, with power comes complexity. WebRTC has a learning curve that is likely to hamper its use by web developers. To hide that complexity, Priologic has built the EasyRTC framework.

A WebRTC application usually needs to do most of the following steps.

+ Get access to the local camera and microphone in the form of a "media stream".
+ Establish a connection to a signaling server.
+ Initiate a call to a person on another browser.
+ Connect media streams to video tags.

Using the EasyRTC framework, several of these steps can be collapsed into a single call,
vastly simplifying the developers job, particularly if the web developer is
trying to support multiple platforms.

This document is a tutorial for writing applications with the EasyRTC framework. It does not cover the entire EasyRTC API.


Terminology
-----------
 - Callback - A JavaScript function supplied to a library so that the library will call it when a particular event occurs.
 - Media Stream - An object encapsulating a video track and/or one or more audio tracks.
 - Peer Connection - A connection between two different browsers that enables peer to peer communication.
 - Server - The Node.js server plus some JavaScript code we supply provides the server side of the EasyRTC framework.


Installing EasyRTC and Getting Help
--------------

The EasyRTC framework can be easily installed on most platforms in 10 minutes.  We have install  instructions for Windows, Mac and Linux available. The files that make up EasyRTC at [https://github.com/priologic/easyrtc] start with the README.md file. The docs directory of EasyRTC distribution has documentation in HTML for both server and client side components.

If you find yourself running into problems installing check out the various sources for connecting with us and the community also listed in the README.md file.


Video Conferencing - Easy-Side Up
---------------------------------

This section shows you how to build a page that supports two-way (person to person) audio/visual conversations with as little developer effort as possible.

Include the below four lines in the &lt;head> section of your HTML file. The first two scripts are needed by EasyRTC, while the third will be your own application logic.
The CSS file provides some styling for an error messages dialog.

    <head>
      ...
        <link rel="stylesheet" type="text/css" href="/easyrtc/easyrtc.css" />
        <script src="/socket.io/socket.io.js"></script>
        <script type="text/javascript" src="/easyrtc/easyrtc.js"></script>
        <script type="text/javascript" src="mylogic.js"></script>
      ...
    </head>

Put two video tags (one to display video from the local camera, one to display video from somebody else's camera)
with id attributes in the &lt;body> section of your html file, like the below.
The second video tag should be in a &lt;div> block with a CSS _position_ value of "relative" to help position it's hangup button. There is no hangup button for the self video.

    <body>
       ...
       <video  style="float:left" id="self" width="300" height="200" muted="muted"></video>
       <div style="position:relative;float:left;width:300px">
           <video id="caller" width="300" height="200"></video>
       </div>
       ...
    </body>

If you don't have the muted flag in the self video tag, you'll get a feedback loop from your speakers to your microphone.

Now we have to start writing some application logic for the application.js file,
starting with an initialization function that will be called when the page gets loaded.
The primary responsibility of the initialization function is to call the EasyRTC.easyApp method. It takes the following arguments:

 - applicationName - some literal string like "Company_Chat_Line".
 - self-video-id - a string containing the id of the first video tag.
 - array-of-caller-video-ids - an array containing the id of the second video tag.
 - successCallback - a function to call on successful connection.

The initialization function is also a good place to register a callback to
find out who else is hooked up to the server. The callback is registered using EasyRTC.setRoomOccupantListener.

Here is an example initialization function:

     function my_init() {
         easyrtc.setRoomOccupantListener( roomListener);
         easyrtc.easyApp("Company_Chat_Line", "self", ["caller"],
             function(myId) {
                console.log("My easyrtcid is " + myId);
             }
         );
     }

The callback will be called whenever somebody else connects to
or disconnects from the "Company_Chat_Line", and immediately after the call to easyrtc.easyApp.

The callback is passed two arguments:

 - a room name 
 - a map whose keys are the ids (easyrtcids) of the other people connected to the server using the same application name.

In our example, the callback will maintain a list of buttons
to call the other people connected to the "Company_Chat_Line".
We'll add a &lt;div> to the &lt;body> to hold these buttons.

     <body>
        ...
        <div id="otherClients"> </div>
        ...
     </body>

The text for the roomListener is below:

    function roomListener(roomName, otherPeers) {
        var otherClientDiv = document.getElementById('otherClients');
        while (otherClientDiv.hasChildNodes()) {
            otherClientDiv.removeChild(otherClientDiv.lastChild);
        }
        for(var i in otherPeers) {
            var button = document.createElement('button');
            button.onclick = function(easyrtcid) {
                return function() {
                    performCall(easyrtcid);
                }
            }(i);

            label = document.createTextNode(i);
            button.appendChild(label);
            otherClientDiv.appendChild(button);
        }
    }
Most applications can ignore the roomName parameter; it is only of interest if your application can access several rooms simultaneously.

Of course, in a real application,
we wouldn't be using the easyrtcids for button labels.
Instead, we would have some application logic to map the easyrtcids
to more permanent identifiers like name, job title, and profile picture.

To actually initiate a call to a person, all we need to do is call the easyrtc.call method,
passing it the easyrtcid of the person, and three callbacks:

 - function successCallback(easyrtcid) - called when the initiation succeeds.
 - function errorCallback(errorCode, errorText) - called on error.
 - function accepted(wasAccepted,easyrtcid) - called to indicate whether the call was accepted or not.

Here is some code for the actual call initiation:

    function performCall(easyrtcid) {
        easyrtc.call(
           easyrtcid,
           function(easyrtcid) { console.log("completed call to " + easyrtcid);
           function(errorMessage) { console.log("err:" + errorMessage);
           function(accepted, bywho) {
              console.log((accepted?"accepted":"rejected")+ " by " + bywho);
           }
        );
    }

Now we just have to modify the body tag of our html file to actually call the my_init function.

     <body onload="my_init()">

Here is the complete HTML and JavaScript for this solution.

    The HTML file:
        <!DOCTYPE HTML>
        <html>
            <head>
                <link rel="stylesheet" type="text/css" href="/easyrtc/easyrtc.css" />
                <script src="/socket.io/socket.io.js"></script>
                <script type="text/javascript" src="/easyrtc/easyrtc.js"></script>
                <script type="text/javascript" src="js/mylogic.js"></script>
            </head>
             <body onload="my_init()">
                <div id="otherClients"> </div>
                <video  style="float:left" id="self" width="300" height="200"></video>
                <div style="position:relative;float:left;width:300px">
                    <video id="caller" width="300" height="200"></video>
                </div>
            </body>
        </html>

    The mylogic.js file:
        function my_init() {
             easyrtc.setRoomOccupantListener( loggedInListener);
             easyrtc.easyApp("Company_Chat_Line", "self", ["caller"],
                 function(myId) {
                    console.log("My easyrtcid is " + myId);
                 }
             );
         }


         function loggedInListener(roomName, otherPeers) {
            var otherClientDiv = document.getElementById('otherClients');
            while (otherClientDiv.hasChildNodes()) {
                otherClientDiv.removeChild(otherClientDiv.lastChild);
            }
            for(var i in otherPeers) {
                var button = document.createElement('button');
                button.onclick = function(easyrtcid) {
                    return function() {
                        performCall(easyrtcid);
                    }
                }(i);

                label = document.createTextNode(i);
                button.appendChild(label);
                otherClientDiv.appendChild(button);
            }
        }


        function performCall(easyrtcid) {
            easyrtc.call(
               easyrtcid,
               function(easyrtcid) { console.log("completed call to " + easyrtcid);},
               function(errorMessage) { console.log("err:" + errorMessage);},
               function(accepted, bywho) {
                  console.log((accepted?"accepted":"rejected")+ " by " + bywho);
               }
           );
        }


Video Conferencing - Trading Ease For Flexibility
-------------------------------------------------

In the previous section, we outlined the approach that maximized the ease of getting a video conference page up and running.
In this section, we trade off some the ease for greater flexibility and control.

Instead of calling easyrtc.easyApp, you can call easyrtc.initMediaSource
to get access to the local media stream,
followed by a call to easyrtc.connect once the call to
easyrtc.initMediaSource finished. This (and a bit more) is what easyrtc.easyApp does internally.

If you do it this way, you don't need the CSS file or the &lt;div> surrounding the second video
because there won't be any automatically added hangup buttons. The HTML ends up looking like this:

    <!DOCTYPE HTML>
    <html>
        <head>
            <link rel="stylesheet" type="text/css" href="/easyrtc/easyrtc.css" />
            <script src="/socket.io/socket.io.js"></script>
            <script type="text/javascript" src="/easyrtc/easyrtc.js"></script>
            <script type="text/javascript" src="js/mylogic2.js"></script>
        </head>
         <body onload="my_init()">
            <div id="otherClients"> </div>
            <video style="float:left" id="self" width="300" height="200"></video>
            <video style="float:left" id="caller" width="300" height="200">/video>
        </body>
    </html>

The new initialization looks like:

    function my_init() {
        easyrtc.setRoomOccupantListener( loggedInListener);
        var connectSuccess = function(myId) {
            console.log("My easyrtcid is " + myId);
        }
        var connectFailure = function(errmesg) {
            console.log(errmesg);
        }
        easyrtc.initMediaSource(
              function(){       // success callback
                  var selfVideo = document.getElementById("self");
                  easyrtc.setVideoObjectSrc(selfVideo, easyrtc.getLocalStream());
                  easyrtc.connect("Company_Chat_Line", connectSuccess, connectFailure);
              },
              connectFailure
        );
     }

Notice the call to easyrtc.getLocalStream and easyrtc.setVideoObjectSrc. The former gets a media stream object
for the local camera and microphone, once the call to easyrtc.initMediaSource succeeds. The latter ties a video tag
to a media stream object. Put together, it provides a mirror-like facility, allowing a user to monitor how their own image looks.

We'll need two more calls for the involved version:

 - A callback for new media streams provided by remote peers. The callback's job is to tie another video tag to the incoming stream. It looks like:

            easyrtc.setStreamAcceptor( function(callerEasyrtcid, stream) {
                var video = document.getElementById('caller');
                easyrtc.setVideoObjectSrc(video, stream);
            });

 - A callback to detect that a remote peer has hung-up. This callback's job is to clear the video tag.

            easyrtc.setOnStreamClosed( function (callerEasyrtcid) {
                easyrtc.setVideoObjectSrc(document.getElementById('caller'), "");
            });


The entire JavaScript looks like the below code:

    The mylogic2.js file:
         easyrtc.setStreamAcceptor( function(callerEasyrtcid, stream) {
            var video = document.getElementById('caller');
            easyrtc.setVideoObjectSrc(video, stream);
        });

         easyrtc.setOnStreamClosed( function (callerEasyrtcid) {
            easyrtc.setVideoObjectSrc(document.getElementById('caller'), "");
        });


        function my_init() {
            easyrtc.setRoomOccupantListener( roomListener);
            var connectSuccess = function(myId) {
                console.log("My easyrtcid is " + myId);
            }
            var connectFailure = function(errorCode, errText) {
                console.log(errText);
            }
            easyrtc.initMediaSource(
                  function(){        // success callback
                      var selfVideo = document.getElementById("self");
                      easyrtc.setVideoObjectSrc(selfVideo, easyrtc.getLocalStream());
                      easyrtc.connect("Company_Chat_Line", connectSuccess, connectFailure);
                  },
                  connectFailure
            );
         }


        function roomListener(roomName, otherPeers) {
            var otherClientDiv = document.getElementById('otherClients');
            while (otherClientDiv.hasChildNodes()) {
                otherClientDiv.removeChild(otherClientDiv.lastChild);
            }
            for(var i in otherPeers) {
                var button = document.createElement('button');
                button.onclick = function(easyrtcid) {
                    return function() {
                        performCall(easyrtcid);
                    }
                }(i);

                label = document.createTextNode(i);
                button.appendChild(label);
                otherClientDiv.appendChild(button);
            }
        }


        function performCall(easyrtcid) {
            easyrtc.call(
               easyrtcid,
               function(easyrtcid) { console.log("completed call to " + easyrtcid);},
               function(errorCode, errorText) { console.log("err:" + errorText);},
               function(accepted, bywho) {
                  console.log((accepted?"accepted":"rejected")+ " by " + bywho);
               }
           );
        }

Sharing Multiple Local Media Streams
------------------------------------
The basis idea in using multiple local media streams is that you need to name them each stream
when it is created. 
When you call initMediaSource, pass it a third argument which is the name you want 
assigned to the resulting media. Such as:

    easyrtc.initMediaStream( success, failure, "timesSquareCamera");

If you don't pass a name when creating the stream, it implicitly gets named 'default'. 
Usually you don't need to know this of course.


You can get a list of the names of your local media streams using easyrtc.getLocalMediaIds.

    var ids = easyrtc.getLocalMediaIds();
    var i;
    for( i = 0; i < ids.length; i++ ) {
        console.log(ids[i]);
    }

When you initiate a call, you can supply an array list of stream names as the fifth argument.
Similarly, when you accept a call, you can pass a list of stream names as the 
second argument to the accept callback.

    easyrtc.call(otherEasyrtcId, successCB, failCB, wasAcceptedCB, ["timesSquareCamera"]);
    easyrtc.setAcceptChecker(function(otherGuy, acceptorCallback){
        acceptorCallback(true, [ "livingRoomCamera", ["kitchenCamera"]);
    });

You can also add a stream to an existing call using easyrtc.addStreamToCall. It takes a stream name
and a stream name as arguments. If successful, the receiver's streamAcceptor callback gets called with 
the media stream. The streamAcceptor gets passed three arguments: the peer's easyrtcid, the
stream itself, and the name of the remote stream.

 
Note: The EasyApp framework is not designed to work with multiple media streams. It's based on 
the simplifying assumption that there is only one local media stream. 
If you want to use multiple multiple media streams, you have to accept the effort of managing their assignment
to video tags yourself.

Screen Sharing
--------------
The new way of desktop sharing is to first create a media stream using esayrtc.initScreenCapture.
It takes the same arguments as easyrtc.initMediaSource.

    easyrtc.initScreenCapture( successCB, failCB, "myScreen");
    ...
    easyrtc.call(otherEasyrtcId, successCB, failCB, wasAcceptedCB, ["myScreen"]);

Useful Extras
-------------

### Sharing Audio Or Video Only

If you don't want to share your audio or your video, you can disable their transmission with one of the below calls.

    easyrtc.enableAudio(false);

    easyrtc.enableVideo(false);

These calls determine the content of the local media stream initialized by easyrtc.initMediaSource, so you must call them before calling easyrtc.initMediaSource.

### Setting The Video Bandwidth ###

You can set the bandwidth used to send and receive each media stream's video track by
calling easyrtc.setVideoBandwidth. The function takes a single integer argument, the desired bandwidth in kilobits per second.

    easyrtc.setVideoBandwidth(45);

The method should be called before initiating or accepting connections as it operates by modifying records used to establish peer connections.
It will have no effect on media streams passed to a peer connection before it was invoked. Currently, this is only respected by Chrome, and we're told by Mozilla that Firefox won't like it.


### Ignoring Calls

In the examples above, the callee always accepted connections from the caller.
In a production environment, a user would want control over which calls were accepted.
The EasyRTC framework supports such by allowing you to register a callback that will be invoked
each time a caller tries to establish a connection with you. The callback should expect to get
the caller's easyrtcid as it's first argument, and a reporting function as it's second argument.
The reporting function should be called with a value of true if the call should be accepted, false otherwise.


In your HTML code, add:

        <body ... >
            ...
            <div id="acceptCallBox" style="display:none;z-index:2;position:absolute;padding:20px;left:20px;top:150px;border:red solid 2px;background-color:pink">
                  <div id="acceptCallLabel"></div>
                  <button id="callAcceptButton" >Accept</button> <button id="callRejectButton">Reject</button>
            </div>
            ....
        </body>

In your JavaScript, add the below:

        easyrtc.setAcceptChecker( function(callerId, reporterFunction) {
                document.getElementById('acceptCallBox').style.display = "block";
                if( easyrtc.getConnectionCount() > 0 ) {
                    document.getElementById('acceptCallLabel').innerHTML = "Drop current call and accept new from " + caller + " ?";
                }
                else {
                    document.getElementById('acceptCallLabel').innerHTML = "Accept incoming call from " + caller + " ?";
                }
                var acceptTheCall = function(wasAccepted) {
                   document.getElementById('acceptCallBox').style.display = "none";
                   if( wasAccepted && easyrtc.getConnectionCount() > 0 ) {
                        easyrtc.hangupAll();
                   }
                   cb(wasAccepted);
                }
                document.getElementById("callAcceptButton").onclick = function() { acceptTheCall(true);};
                document.getElementById("callRejectButton").onclick =function() { acceptTheCall(false);};
            }
        );

While the above callback is fine for handling a single check, a real implementation would need to handle the case
of a second check coming in before the first has been responded to.


### Joining and Leaving Rooms

Rooms are a compartmentalizing feature of EasyRTC that are useful for setting up "chat rooms".  
Their behavior is controlled by application logic you install in the EasyRTC server (see the server documentation for details of this). By default, this behavior is:

 - Unless a client specifies a room (or set of rooms) before it connects, it will be a member of the room named "default".
 - A client can be a member of multiple rooms simultaneously.
 - A client's roomOccupantListener callback gets called whenever there are reported changes to a room that they are a member of.
 - Joining a nonexistent room creates it.

A client becomes a member of a room by calling
 
    easyrtc.joinRoom(roomName, roomParameters, successCallback, failureCallback);

The roomParameters argument is application specific.

For example:

    easyrtc.joinRoom("ballroom", null,
          function(roomName) {
               console.log("I'm now in room " + roomName);
          },
          function(errorCode, errorText, roomName) {
              console.log("had problems joining " + roomName);
          });

A client leaves a room by calling

    easyrtc.leaveRoom(roomName, successCallback, failureCallback);

For example:

    easyrtc.leaveRoom("ballroom", 
          function(roomName) {
               console.log("No longer in room " + roomName);
          },
          function(errorCode, errorText, roomName) {
              console.log("had problems leaving " + roomName);
          });

Both easyrtc.joinRoom and easyrtc.leaveRoom can be called before a connect, or after.
If they are called before the connect, their successCallback and failureCallback functions
won't be invoked.

For more information about rooms, see the [easyrtc_rooms.md](easyrtc_rooms.md) file.


### Listening For Errors

You can register an error callback to find out about errors using easyrtc.setOnError. The callback gets passed an object of the form {"errorCode:errorCode", "errorText":errorText}.
Example usage:

    easyrtc.setOnError( function(errEvent) { console.log(errEvent.errorText);}

The errorCode parameter is a short string that is more intended for programmatic use than human consumption.


### Trading Notes

You can send data (via websockets) to someone by calling easyrtc.sendDataWS as below:

    // easyrtc.sendDataWS( destination, messageType, messageData, ackHandler);
    easyrtc.sendDataWS( 'xkdkfhfde9d94', 'contactInfo', { firstName:'john', lastName:'smith' }, function(ackMesg) {
         if( ackMesg.msgType === 'error' ) {
             console.log(ackMesg.msgData.errorText);
         }
    });
The destination is either a peer's easyrtcid or an object that may specify one or more of targetEasyrtcid, targetGroup, and targetRoom.
The messageType is a short string you chose. The ackHandler gets called when the server receives your message, and does not
constitute a reply from the other peer.

The other peer must be connected to the server and it must have registered a peer listener (callback) as below:

    easyrtc.setPeerListener( function(sendersEasyrtcid, msgType, msgData, targeting) {
          if( msgType === 'contactInfo' ) {
              console.log( sendersEasyrtcid  + ' is named ' + msgData.firstName + ' ' + msgData.lastName);
          }
    });

The targeting parameter is present if the destination was specified as an object by the sender.

You can also have a peer listener that is specific to a particular message type, or a particular message type and sender. Only one peer listener will be called per message and the most specific peer listener takes priority.


### Using Data Channels

To use data channels, each peer must enable data channels before calling (or accepting a call):
    easyrtc.enableDataChannels(true);

It's then a good idea to listen for the events telling you that the datachannel to a particular peer is ready to be used,
or that it's been closed.
    easyrtc.setDataChannelOpenListener(
        function(sourceEasyrtcid) { console.log("channel is open");}
    );

    easyrtc.setDataChannelCloseListener(
        function(sourceEasyrtcid) { console.log("channel has been closed");}
    );

Once your data channel open listener has been called, you can send a message using
easyrtc.sendDataP2P:
    easyrtc.sendDataP2P(targetEasyrtcid, 'contactInfo',
            { firstName:'john', lastName:'smith' });

Listening is done with the same peerListener as used when sending message using websockets.

Note: At this time, Data Channels are not working on Android.


### Are You Connected

You can find out how many peer connections you have by calling easyrtc.getConnectionCount. Example use:

    console.log("You are connected to " + easyrtc.getConnectionCount() + " people.");

Typically it will be 0 or 1 unless you are hooked up to multiple people.


### Hanging Up ###

You can hang up on a someone using easyrtc.hangup as below:

    easyrtc.hangup(peerEasyrtcid);

Alternatively, you can hang up on all the people you are connected to with:

    easyrtc.hangupAll();


### Dropping Your Connection To The Server

You can disconnect from the server by calling easyrtc.disconnect. Example use:

     easyrtc.disconnect();


If You Run Into Problems
------------------------
Please feel free to post on our discussion forum:

 - [https://easyrtc.com/forums/](https://easyrtc.com/forums/)
