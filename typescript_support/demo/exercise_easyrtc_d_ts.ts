/// <reference path="../d.ts.files/client/easyrtc.d.ts" />

var selfEasyrtcid:string = "";



function wrapperForCalls():void {

    easyrtc._presetMediaConstraints = { audio:true, video:true};

    easyrtc.setDebugPrinter( function(message:any[]):void{
    });

    easyrtc.setSdpFilters(easyrtc.buildLocalSdpFilter({}), easyrtc.buildRemoteSdpFilter({}));

    easyrtc.setPeerClosedListener( function(easyrtcid:string):void{
    });

    easyrtc.setPeerFailingListener(
        function(easyrtcid:string):void{

        },
        function(easyrtcid:string):void{

        }
    );

    easyrtc.setIceCandidateFilter( function(candidate:RTCIceCandidate, remotelyGenerate:boolean):RTCIceCandidate{
        return candidate;
    });

    easyrtc.setIceConnectionStateChangeListener(function(easyrtcid:string, eventTarget:Event):void{

    });

    easyrtc.setSignalingStateChangeListener(function(easyrtcid:string, eventTarget:Event, signalingState:string):void{

    });
    
    let roomOccupants:string[] = easyrtc.getRoomOccupantsAsArray("some_room");
    
    let roomMap:{[peerEasyrtcId:string]:any} = easyrtc.getRoomOccupantsAsMap("some_room");

    easyrtc.setAutoInitUserMedia(true);


     let formattedString = easyrtc.format("xx{1}", 3);


    
    let eventListener =function(eventName:string, eventData:any):void{

    }; 
    easyrtc.addEventListener("roomOccupant", eventListener);


    easyrtc.removeEventListener("roomOccupant", eventListener);


    easyrtc.emitEvent("roomOccupant", {id:33});


    let errCode:string = easyrtc.errCodes.CALL_ERR;
    let apiVersion:string = easyrtc.apiVersion;


    /** Regular expression pattern for user ids. This will need modification to support non US character sets */
    easyrtc.usernameRegExp = /[a..z]+/;

    /** Default cookieId name */
    easyrtc.cookieId = "smith";

    /** Flag to indicate that user is currently logging out */
    let loggingOUt:boolean =  easyrtc.loggingOut;

    easyrtc.enableAudioReceive(true);

    easyrtc.enableVideoReceive(true);

    easyrtc.setAudioOutput(<HTMLVideoElement>document.getElementById("selfVideo"), "1234");

    easyrtc.getAudioSinkList(function(items:MediaDeviceInfo[]):void{

    });

    easyrtc.getAudioSourceList(function(items:MediaDeviceInfo[]):void{

    });

    easyrtc.getVideoSourceList(function(items:MediaDeviceInfo[]):void{
         });

    let width:number = easyrtc.nativeVideoHeight;
    let height:number = easyrtc.nativeVideoWidth;

    let len:number = easyrtc.maxP2PMessageLength;

    let isValid:boolean  = easyrtc.isNameValid("some_name");

    easyrtc.setCookieId("cookiemonster");

    easyrtc.setVideoSource("abc123");

    easyrtc.setAudioSource("abc123");

    easyrtc.setVideoDims(640,480, undefined);

    easyrtc.setApplicationName("roomdemo");

    easyrtc.enableDebug(true);

    var boolValue;
    boolValue = easyrtc.supportsGetUserMedia();

    boolValue = easyrtc.supportsPeerConnections();

    boolValue = easyrtc.supportsDataChannels();

    boolValue = easyrtc.supportsStatistics();

    let peerConn:RTCPeerConnection =  easyrtc.getPeerConnectionByUserId("abc");


    easyrtc.getPeerStatistics("abc", function(easyrtcId:string, values:{[fieldName:string]:any;}):void{

        },
        easyrtc.standardStatsFilter);

    easyrtc.setRoomApiField("myroom", "roomArea", 33);


    easyrtc.showError(easyrtc.errCodes.DEVELOPER_ERR, "smurf attack");

    let somestring:string = easyrtc.cleanId("&hello");


     easyrtc.setRoomEntryListener(function(entering:boolean, roomName:string):void{

     });

   
    easyrtc.setRoomOccupantListener( function(roomName:string, occupants:Easyrtc_PerRoomData, isOwner:boolean):void{

    });

   
    easyrtc.setDataChannelOpenListener(function(easyrtcid:string):void{
        
    });

   
    easyrtc.setDataChannelCloseListener(function(easyrtcid:string):void{
        
    });

  
    let connectCount:number = easyrtc.getConnectionCount();

    easyrtc.setMaxP2PMessageLength(10000);

    easyrtc.enableAudio(true);

    easyrtc.enableVideo(true);

    easyrtc.enableDataChannels(true);

    let localMediaIds:string[] = easyrtc.getLocalMediaIds();

    let streamPlaceHolder:MediaStream;
    easyrtc.register3rdPartyLocalMediaStream(streamPlaceHolder, "someStreamName");

    let remoteName:string = easyrtc.getNameOfRemoteStream("abc", streamPlaceHolder);

    easyrtc.closeLocalStream("default");

    easyrtc.enableCamera(true, "default");


    easyrtc.enableMicrophone(true, "default");

    easyrtc.muteVideoObject( "selfVideo",true);
    easyrtc.muteVideoObject( <HTMLVideoElement>document.getElementById("selfVideo"),true);

    let url:string = easyrtc.getLocalStreamAsUrl("default");

    streamPlaceHolder = easyrtc.getLocalStream("default");

    easyrtc.clearMediaStream(<HTMLVideoElement>document.getElementById("selfvideo"));

    easyrtc.setVideoObjectSrc(<HTMLVideoElement>document.getElementById("selfVideo"), streamPlaceHolder);

    let trackPlaceHolder: MediaStreamTrack[] = [];
    streamPlaceHolder = easyrtc.buildLocalMediaStream("default", trackPlaceHolder, trackPlaceHolder);

    easyrtc.loadStylesheet();

    easyrtc.initMediaSource(
        function(mediaStream:MediaStream):void{},
        function(errorCode:string, errorText:string):void{},
        "default");

    easyrtc.setAcceptChecker(function(callerEasyrtcId:string, acceptor:(acceptTheCall:boolean, mediaStreamNames:string[]) => void):void{
        acceptor(true, ["default"]);
    });

    easyrtc.setStreamAcceptor(function(easyrtcid:string, stream:MediaStream, streamName:string):void{
        // do something
    });


    easyrtc.setOnError(function(errorObject:{
        errorCode:string;
        errorText:string;
    }):void{
        // do something
    });


    easyrtc.setCallCancelled(function(easyrtcid:string, explicitlyCancelled:boolean):void{
        // do something
    });



    easyrtc.setOnStreamClosed(function(easyrtc:string, mediaStream:MediaStream, streamName:string):void{
        // do something
    });


    easyrtc.setPeerListener(function(easyrtcId:string, msgType:string, msgData:any, targetting:Easyrtc_MessageTargeting):void{

    }, "ammessage");

    easyrtc.setSocketUrl("localhost:8080", { reconnect:true});

    easyrtc.setUsername("fred");

    let ids:string[] = easyrtc.usernameToIds("fred", "default");

    let somefield  =  easyrtc.getRoomApiField("kitchen", "abc123", "area");

    easyrtc.setCredential("itsasecret");

    easyrtc.setDisconnectListener(function():void{

    });

    /**
     * Convert an easyrtcid to a user name. This is useful for labeling buttons and messages
     * regarding peers.
     * @param {String} easyrtcid
     * @return {String} the username associated with the easyrtcid, or the easyrtcid if there is
     * no associated username.
     * @example
     *    console.log(easyrtcid + " is actually " + easyrtc.idToName(easyrtcid));
     */
    let name:string = easyrtc.idToName("abcd");

    easyrtc.setUseFreshIceEachPeerConnection(true);

    let config:RTCPeerConnectionConfig = easyrtc.getServerIce();

    easyrtc.setIceUsedInCalls(config);

    boolValue = easyrtc.haveAudioTrack("abcd", "default");

    boolValue = easyrtc.haveVideoTrack("abcd", "default");

    somefield = easyrtc.getRoomField("default", "area");

    easyrtc.disconnect();

    easyrtc.sendDataP2P("abcd", "amessage", somefield);

    easyrtc.sendDataWS("abcd", "amessage", somefield,
        function(ackmsg:Easyrtc_BasicMessage):void{
        // do something
    });

    easyrtc.sendData("abcd", "amessage", {voters:0}, function(ack:any):void{

    });


    easyrtc.sendPeerMessage("abcd", "amessage", somefield,
        function(msgType:string, msgBody:any):void{
            // do something with response
        }, function(errorCode:string, errorText:string):void{
           //  do something with error
        });


    easyrtc.sendServerMessage("amessage", somefield,
        function(successMessageType:string, successData:any):void{
            // do something on success
        }, function(errorCode:string, errText:string):void{
            // do something on failure
        });

    /** Sends the server a request for the list of rooms the user can see.
     * You must have already be connected to use this function.
     * @param {function(Object)} callback - on success, this function is called with a map of the form  { roomName:{"roomName":String, "numberClients": Number}}.
     * The roomName appears as both the key to the map, and as the value of the "roomName" field.
     * @param {function(String, String)} errorCallback   is called on failure. It gets an errorCode and errorText as it's too arguments.
     * @example
     *    easyrtc.getRoomList(
     *        function(roomList){
     *           for(roomName in roomList){
     *              console.log("saw room " + roomName);
     *           }
     *         },
     *         function(errorCode, errorText){
     *            easyrtc.showError(errorCode, errorText);
     *         }
     *    );
     */
    easyrtc.getRoomList(function(roomNames:string[]):void{

    }, function(errCode:string, errorText:string):void{

    });


    somestring = easyrtc.NOT_CONNECTED;

    somestring = easyrtc.BECOMING_CONNECTED;

    somestring = easyrtc.IS_CONNECTED;


    somestring = easyrtc.getConnectStatus("abcd");


    easyrtc.call("abcd",
        function(easyrtcid:string, mediaType:string):void{},
        function(errcode:string, errString:string):void{},
        function(wasAccepted:boolean, easyrtcid:string):void{},
        ["default"]);

    easyrtc.hangup("abcd");

    /**
     * Hangs up on all current connections.
     * @example
     *    easyrtc.hangupAll();
     */
    easyrtc.hangupAll();

    boolValue = easyrtc.doesDataChannelWork("abcd");

    streamPlaceHolder = easyrtc.getRemoteStream("abcd", "default");

    easyrtc.registerLocalMediaStreamByName(streamPlaceHolder, "somename");

    easyrtc.makeLocalStreamFromRemoteStream("abcd", "default", "remoteDefault");


    easyrtc.addStreamToCall("abcd", "default",
        function(easyrtcid:string, streamName:string):void{

        });

    boolValue = easyrtc.isPeerInAnyRoom("abcd");

    easyrtc.updatePresence("chat", "gone for lunch");


    let sessionFields:Easyrtc_RedundantMap = easyrtc.getSessionFields();

    let sessionValue:any = easyrtc.getSessionField("default");

    boolValue = easyrtc.isTurnServer("192.168.0.99");

    boolValue = easyrtc.isStunServer("192.168.0.99");

    easyrtc.getFreshIceConfig(function(sawSuccess:boolean):void{});

    
    easyrtc.joinRoom("default", {},
        function(roomName:string):void{}, 
        function(errorCode:string, errorText:string, roomName:string):void{});

  
    easyrtc.leaveRoom("default",
        function(roomName:string):void{},
        function(errorCode:string, errorText:string, roomName:string):void{});

  
    let roomsJoined:{[key:string]:boolean} = easyrtc.getRoomsJoined();
    
    let roomFields:Easyrtc_RedundantMap = easyrtc.getRoomFields("default");


    roomFields = easyrtc.getApplicationFields();


    roomFields = easyrtc.getConnectionFields();


    let alreadyAllocatedSocket:any;
    easyrtc.useThisSocketConnection(alreadyAllocatedSocket);

    easyrtc.connect("simpleApp",
        function(easyrtcid:string, roomOwner:boolean):void{},
        function(errorCode:string, errorText:string):void{});


    easyrtc.dontAddCloseButtons();


    let ithCaller:string = easyrtc.getIthCaller(3);

    let i:number = easyrtc.getSlotOfCaller("abcd");

    easyrtc.easyApp("simpleApp",
        "selfVideo",
        ["callerVideo1"],
        function(easyrtcId:string):void{},
        function(errorCode:string, errorText:string):void{});

    easyrtc.setGotMedia(function(gotMedia:boolean, errorText:string):void{});

    easyrtc.setGotConnection(function(gotConnection:boolean, errorText:string):void{});

}


