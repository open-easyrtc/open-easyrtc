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
 - **msgData** (required)
   - Contains session description (SDP)

### msgType - 'reject'
Rejects WebRTC offer for establishing peer-connection. Sender and target must be online, authenticated, and in same application.

**Fields:**

 - **targetEasyrtcid** (required)

### msgType - 'hangup'
Instructs target to hangup WebRTC peer-connection. Sender and target must be online, authenticated, and in same application.

**Fields:**

 - **targetEasyrtcid** (required)


### msgType - 'authenticate'
Includes fields needed for authentication. Sender and target must be online, authenticated, and in same application. Returns a message with msgType='token' upon success.

**Fields:**

 - **msgData** (required)
   - **apiVersion** (required) Api version string. 
   - **applicationName** (optional) Will default to the server default application.
   - **easyrtcsid** (optional) The easyRTC session ID which should be available in the browser cookie variables.
   - **username** (optional)
   - **credential** (optional) (for enterprise, this would include the apiKey)
   - **setUserCfg** (optional) Contains all values from setUserCfg
   - **setPresence** (optional) Contains all values from setPresence
   - **enterRoom** (optional) Contains all values from enterRoom. Will default to application default room (if set).

**Returns:**

 -token
 -error


### msgType - 'setUserCfg'
Sets user configurable options. User must be authenticated.

**Fields:**

 - **msgData** (required)
   - **setUserCfg** 
     - **connectionList** (optional) Array of connections with their statistics.
     - **userSettings** (optional) Fields related to the user's settings, WebRTC, browser, and OS capabilities/status.
     - **apiField** (optional) Map of ffelds for the special appDefinedFields value which gets transferred in the broadcast list.

**Returns:**

 -ack
 -error


### msgType - 'setPresence'
Sets user online presence which is re-broadcast as part of the list. User must be authenticated.

**Fields:**

 - **msgData** (required)
   - **setPresence** 
     - **show** (optional) [away|chat|dnd|xa]
     - **status** (optional) User configurable status string. TODO: Set regex for max length and allowed characters.

**Returns:**

 -ack
 -error


### msgType - 'enterRoom'
Enters a room. If room doesn't exist, a new room may be created.

**Fields:**

 - **msgData** (required)
   - **enterRoom** 
     - **roomName** (required) String containing room name.

**Returns:**

 -roomData
 -error


### msgType - 'leaveRoom'
Leaves a room. Upon leaving a room, the API should remove all room info (incl. connection list) from memory.

**Fields:**

 - **msgData** (required)
   - **leaveRoom** 
     - **roomName** (required) String containing room name.

**Returns:**

 -ack
 -error


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
 - **msgData** (required)
   - Contains session description (SDP)

### msgType - 'reject'
Rejects WebRTC offer for establishing peer-connection. Sender and target must be online, authenticated, and in same application.

**Fields:**

 - **senderEasyrtcid** (required)

### msgType - 'hangup'
Instructs target to hangup WebRTC peer-connection. Sender and target must be online, authenticated, and in same application.

**Fields:**

 - **senderEasyrtcid** (required)

### msgType - 'token'
Initiates an authenticated easyRTC application. Note this may be sent multiple times in a session upon configuration changes. The API should reset application, room, and list data.

**Fields:**

 - **easyrtcid** (required)
 - **easyrtcsid** (if available)
 - **iceConfig** (required)
 - **groupList** (optional - default to no group)
 - **serverTime** (required)
 - **roomData** (required) See roomData msgType for contents
 - **application**
   - **applicationName** (required - defaults to 'default')
   - May contain other application options which user is permitted to view.


### msgType - 'roomData'
Provides room information for all rooms the user is currently in. This includes a list of online users who the user is permitted to see. By default authenticated users can see all other users in the same application and room.

**Fields:**

 - **roomData** (required) Map of room names
   - **roomName** (required) Room name (matches map key)
   - **list** (optional) Map of easyrtcid's for users online in the same room. If present, this should overrule the current list in memory.
     - **easyrtcid** (required) Matches map key
     - **username** (optional)
     - **presence** (required) {show:[away|chat|dnd|xa],status:{String}}
     - **apiField** (optional) Map of appDefinedFields and their values
     - **browserFamily** (optional)
     - **browserMajor** (optional)
     - **osFamily** (optional)
     - **deviceFamily** (optional)
   - **listDelta** (optional)
     - **updateConnection** (optional) Map of easyrtcid's to update. Will contain same fields as 'list'
     - **removeConnection** (optional) Map of easyrtcid's to remove the the list.


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

