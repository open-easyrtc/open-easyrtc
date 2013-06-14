# easyrtcCmd msgType List

The easyrtcCmd is the core socket.io emit type which easyRTC uses to send and receive commands.

## Incoming (to server)

### msgType - 'candidate'
Transfer of WebRTC ICE candidate(s) for establishing peer-connection. Sender and target must be online, authenticated, and in same application.

**Fields:**

 - **targetEasyrtcid** (required)
 - **msgData** (required)
   - Contains candidate data (SDP's)
   - {type, label, id, candidate}

### msgType - 'offer'
Sends WebRTC offer for establishing peer-connection. Sender and target must be online, authenticated, and in same application.

**Fields:**

 - **targetEasyrtcid** (required)
 - **msgData** (required)
   - Contains candidate data (SDP's) 
 
### msgType - 'answer'
Accepts WebRTC offer for establishing peer-connection. Sender and target must be online, authenticated, and in same application.

**Fields:**

 - **targetEasyrtcid** (required) 
 - **msgRefId** (required) Should reference offer message
 - **msgData** (required)
   - Contains session description (SDP)

### msgType - 'reject'
Rejects WebRTC offer for establishing peer-connection. Sender and target must be online, authenticated, and in same application.

**Fields:**

 - **targetEasyrtcid** (required)
 - **msgRefId** (required) Should reference offer message

### msgType - 'hangup'
Instructs target to hangup WebRTC peer-connection. Sender and target must be online, authenticated, and in same application.

**Fields:**

 - **targetEasyrtcid** (required)


### msgType - 'authenticate'
Includes fields needed for authentication. Sender and target must be online, authenticated, and in same application. Returns a message with msgType='token' upon success.

**Fields:**

 - **msgData** (required)
   - **applicationName** (optional)
   - **easyrtcsid** (optional) The easyRTC session ID which should be available in the browser cookie variables.
   - **username** (optional)
   - **credential** (optional) (for enterprise, this would include the apiKey)
   - Can also contain all values from setUserCfg.


### msgType - 'setUserCfg'
Sets user configurable options. User must be authenticated.

**Fields:**

 - **msgData** (required)
   - **connectionList** (optional) Array of connections with their statistics.
   - **userSettings** (optional) Fields related to the user's settings, WebRTC, browser, and OS capabilities/status.
   - **appSettings** (optional) Fields for changing application settings. Change may be restricted by group.
   - **roomSettings** (optional) Fields for changing room settings. Change may be restricted by group.
   - **appDefinedFields** (optional) Fields for the special appDefinedFields value which gets transferred in the broadcast list.
   - **roomSettings** (optional) Fields for changing room settings.




## Outgoing (from server)

### msgType - 'candidate'
Transfer of WebRTC ICE candidate(s) for establishing peer-connection. Sender and target must be online, authenticated, and in same application.

**Fields:**

 - **senderEasyrtcid** (required)
 - **msgData** (required)
   - Contains candidate data (SDP's)
   - {type, label, id, candidate}

### msgType - 'offer'
Sends WebRTC offer for establishing peer-connection. Sender and target must be online, authenticated, and in same application.

**Fields:**

 - **senderEasyrtcid** (required)
 - **msgData** (required)
   - Contains candidate data (SDP's) 
 
### msgType - 'answer'
Accepts WebRTC offer for establishing peer-connection. Sender and target must be online, authenticated, and in same application.

**Fields:**

 - **senderEasyrtcid** (required)
 - **msgRefId** (required) Should reference offer message
 - **msgData** (required)
   - Contains session description (SDP)

### msgType - 'reject'
Rejects WebRTC offer for establishing peer-connection. Sender and target must be online, authenticated, and in same application.

**Fields:**

 - **senderEasyrtcid** (required)
 - **msgRefId** (required) Should reference offer message

### msgType - 'hangup'
Instructs target to hangup WebRTC peer-connection. Sender and target must be online, authenticated, and in same application.

**Fields:**

 - **senderEasyrtcid** (required)

### msgType - 'token'
Instructs target to hangup WebRTC peer-connection. Sender and target must be online, authenticated, and in same application.

**Fields:**

 - **easyrtcid** (required)
 - **easyrtcsid** (if available)
 - **iceConfig** (required)
 - **groupList** (optional - default to no group)
 - **serverTime** (required)
 - **rooms** (required)
   - map of rooms (with room name as key).
     - **room** (required) Name of room. 
     - Object containing room options which user is permitted to view. May be empty.
 - **application**
   - **applicationName** (required - defaults to 'default')
   - May contain other application options which user is permitted to view.

### msgType - 'list'
Provides full list of online users who the user is permitted to see. By default authenticated users can see all other users in the same application and room.

**Fields:**

 - **serverTime** (required)
 - **connections** {required}
   - Map of connected easyrtcid's (may be empty)
     - **easyrtcid** (required)
     - **clientConnectTime** (required)
     - **browserFamily** (optional)
     - **browserMajor** (optional)
     - **osFamily** (optional)
     - **deviceFamily** (optional)
     - **appDefinedFields** (optional)
     - **callAvailability** (required)
 - **senderEasyrtcid** (required)

### msgType - 'listDelta'
Provides a delta of the list of online users who the user is permitted to see. When any piece of a user's information is changed, the whole record is resent.

**Fields:**

 - **serverTime** (required)
 - **updateConnections** {optional}
   - Map of connected easyrtcid's
     - **easyrtcid** (required)
     - **clientConnectTime** (required)
     - **browserFamily** (optional)
     - **browserMajor** (optional)
     - **osFamily** (optional)
     - **deviceFamily** (optional)
     - **appDefinedFields** (optional)
     - **callAvailability** (required)
 - **removeConnections** {optional}
   - Map of easyrtcid's to remove from list
     - **easyrtcid** (required)
 - **senderEasyrtcid** (required)


### msgType - 'forwardToUrl'
Instructs API to forward user to specified URL. Useful for server handled error handling and user support techniques. 

**Fields:**

 - **serverTime** (required)
 - **msgData** (required)
   - **url** (required) URL to forward user t 


### msgType - 'error'
Provides an error code to the API when an error occurs.

**Fields:**

 - **errorCode** (required)
 - **errorText** (optional) User readable text explaining error. 
 - **msgRefId** (optional) Message ID if error is in response to a received message.

