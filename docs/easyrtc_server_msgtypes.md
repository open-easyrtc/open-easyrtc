EasyRTC Server: API to/from Server Messages
===========================================

EasyRTC socket messages are sent via socket.io using three custom emit types:

 - **easyrtcAuth** - Initial negotiation and authentication
 - **easyrtcCmd** - All standard EasyRTC communications including WebRTC messages
 - **easyrtcMsg** - Custom application specific messages


----------


easyrtcAuth
===========

"easyrtcAuth" is the socket.io emit type which EasyRTC expects to initialize (or re-initialize) a connection. No other messages are handled by EasyRTC until a connection is authenticated.


Incoming (to server)
--------------------

### msgType - 'authenticate'
Includes fields needed for authentication. Sender and target must be online, authenticated, and in same application. Returns a message with msgType='token' upon success.

**Fields:**

 - **msgData** (required)

**msgData Fields:**

 - **apiVersion** (required) Api version string.
 - **applicationName** (optional) Will default to the server default application.
 - **easyrtcsid** (optional) The EasyRTC session ID which should be available in the browser cookie variables.
 - **username** (optional) String containing the username for the client. May be shared to other clients in the room list.
 - **credential** (optional) Can be any JSONable object.
 - **setUserCfg** (optional) Contains all values from setUserCfg
 - **setPresence** (optional) Contains all values from setPresence
 - **roomJoin** (optional) Contains all values from roomJoin. Will default to application default room.

**Returns:**

 - **token**
 - **error**

----------

easyrtcCmd
==========

The easyrtcCmd is the core socket.io emit type which EasyRTC uses to send and receive commands.


Incoming (to server)
--------------------

Unless specified, messages sent to the server will be returned with an **ack** or an **error**.

### msgType - 'candidate'

WebRTC signal. Transfer of WebRTC ICE candidate(s) for establishing peer-connection. Sender and target must be online, authenticated, and in same application.

**Fields:**

 - **targetEasyrtcid** (required)
 - **msgData** (required)
   - Contains candidate data (SDP's)
   - {type, label, id, candidate}


### msgType - 'offer'

WebRTC signal. Sends WebRTC offer for establishing peer-connection. Sender and target must be online, authenticated, and in same application.

**Fields:**

 - **targetEasyrtcid** (required)
 - **msgData** (required)
   - Contains candidate data (SDP's)


### msgType - 'answer'

WebRTC signal. Accepts WebRTC offer for establishing peer-connection. Sender and target must be online, authenticated, and in same application.

**Fields:**

 - **targetEasyrtcid** (required)
 - **msgData** (required)
   - Contains session description (SDP)


### msgType - 'reject'

WebRTC signal. Rejects WebRTC offer for establishing peer-connection. Sender and target must be online, authenticated, and in same application.

**Fields:**

 - **targetEasyrtcid** (required)


### msgType - 'hangup'

WebRTC signal. Instructs target to hangup WebRTC peer-connection. Sender and target must be online, authenticated, and in same application.

**Fields:**

 - **targetEasyrtcid** (required)


### msgType - 'getIceConfig'

Requests a refreshed ICE configuration. This gives the ability to update STUN and TURN servers listing on a periodic basis for longer running connections.

**Fields:**

**Returns:**
  - **iceConfig**
  - **error**


### msgType - 'getRoomList'

Requests a list of all rooms which the client has access to. It has no fields. The server should return a message to the callback with msgType of 'roomList'.

**Fields:**

**Returns:**
  - **roomList**
  - **error**


### msgType - 'roomJoin'

Enters a room. If room doesn't exist, a new room may be created.

**Fields:**

 - **msgData** (required)

**msgData Fields:**

 - **roomJoin** (required) Map of room names
   - **roomName** (required) Room name (matches map key)
   - **roomParameter** (optional) A map(dictionary) object with key/value pairs. The values can be any JSONable object. This field is not currently looked at by EasyRTC, however it is available for custom server applications. May be used for room options or authentication needs.

**Returns:**
 - **roomData** (with roomStatus of `join`)
 - **error**


### msgType - 'roomLeave'

Leaves a room. Upon leaving a room, the API should remove all room info (incl. connection list) from memory.

**Fields:**

 - **msgData** (required)

**msgData Fields:**

 - **roomLeave** (required) Map of room names
   - **roomName** (required) Room name (matches map key)

**Returns:**
 - **roomData** (with roomStatus of `leave`)
 - **error**


### msgType - 'setRoomApiField'

Sets the apiField value for a connection. This apiField is sent to all other connections in the roomData. It is important to realize that this field is not unique to a room. Upon receiving an empty string, the field is removed.

**Fields:**
 - **msgData** (required)

**msgData Fields:**

   - **setRoomApiField** 
     - **field** (map of field names)
       - **fieldName** (required)
       - **fieldValue** (required) Any JSONable object.
     - **roomName**

**Returns:**
 - **roomData** (with roomStatus of `update`)
 - **error**


### msgType - 'setPresence'

Sets user online presence which is re-broadcast as part of the list. User must be authenticated.

**Fields:**

 - **msgData** (required)

**msgData Fields:**

   - **setPresence**
     - **show** (optional) [`away`|`chat`|`dnd`|`xa`]
     - **status** (optional) User configurable status string. TODO: Set regex for max length and allowed characters.

**Returns:**
 - **roomData** (with roomStatus of `update`)
 - **error**


### msgType - 'setUserCfg'

Sets user configurable options. User must be authenticated.

**Fields:**

 - **msgData** (required)

**msgData Fields:**

 - **setUserCfg**
   - **p2pList** (optional) Map of all connections with their statistics. The map key is the easyrtcid's. Unlike userSettings and apiField, this field must contain all current connections. Any connections not mentioned will be removed.
   - **userSettings** (optional) Map of fields related to the user's settings, WebRTC, browser, and OS capabilities/status. Any settings not mentioned will be left as-is. To remove a setting, give it a value of `null`.
   - **apiField** (optional) Map of fields for the special appDefinedFields value which gets transferred in the broadcast list. Any fields not mentioned will be left as-is. To remove a field, give it a value of `null`.


Outgoing (from server)
----------------------

### msgType - 'candidate'

Transfer of WebRTC ICE candidate(s) for establishing peer-connection. Sender and target must be online, authenticated, and in same application.

**Fields:**

 - **serverTime** (required)
 - **senderEasyrtcid** (required)
 - **msgData** (required)
   - Contains candidate data (SDP's)
   - {type, label, id, candidate}


### msgType - 'offer'

Sends WebRTC offer for establishing peer-connection. Sender and target must be online, authenticated, and in same application.

**Fields:**

 - **serverTime** (required)
 - **senderEasyrtcid** (required)
 - **msgData** (required)
   - Contains candidate data (SDP's)


### msgType - 'answer'

Accepts WebRTC offer for establishing peer-connection. Sender and target must be online, authenticated, and in same application.

**Fields:**

 - **serverTime** (required)
 - **senderEasyrtcid** (required)
 - **msgData** (required)
   - Contains session description (SDP)


### msgType - 'reject'

Rejects WebRTC offer for establishing peer-connection. Sender and target must be online, authenticated, and in same application.

**Fields:**

 - **serverTime** (required)
 - **senderEasyrtcid** (required)


### msgType - 'hangup'

Instructs target to hangup WebRTC peer-connection. Sender and target must be online, authenticated, and in same application.

**Fields:**

 - **serverTime** (required)
 - **senderEasyrtcid** (required)


### msgType - 'iceConfig'

ICE configuration object. This gives the ability to update the STUN and TURN server listing on a periodic basis for longer running connections. Upon reception, the client should refresh 

**Fields:**
 - **iceConfig**
   - **iceServers** (array of objects)
     - **url** (required) Format is `((stun|turn):ADDRESS:[PORT][?transport=tcp])`
     - **username** (optional) May be used by TURN servers
     - **credential** (optional) May be used by TURN servers


**Returns:**
  - **iceConfig**
  - **error**


### msgType - 'token'

Initiates an authenticated EasyRTC application. Note this may be sent multiple times in a session upon configuration changes. The API should reset application, room, and list data.

**Fields:**

 - **serverTime** (required)
 - **msgData** (required)

**msgData Fields:**

 - **easyrtcid** (required)
 - **field** (optional - map of connection fields)
   - **fieldName**
   - **fieldValue**
 - **iceConfig** (required)
 - **groupList** (optional - default to no group)
 - **roomData** (required) See roomData msgType for contents
 - **sessionData** (optional) See sessionData msgType for contents
 - **application**
   - **applicationName** (required - defaults to 'default')
   - **field** (optional - map of application fields)
     - **fieldName**
     - **fieldValue**
   - May contain other application options which user is permitted to view.


### msgType - 'roomData'

Provides room information for all rooms the user is currently in. This includes a list of online users who the user is permitted to see. By default authenticated users can see all other users in the same application and room.

**Fields:**

 - **serverTime** (required)
 - **msgData** (required)

**msgData Fields:**
 - **roomData** (required) Map of room names
   - **roomName** (required) Room name (matches map key)
   - **roomStatus** (required) Instruction to API as to whether to join, update, or leave a given room.  [join|update|leave]
     - `join` - Client is considered to be joined to the given room. `clientList` field will may be present to show other users who are visible in the room.
     - `update` - Client should update what it knows about the room. `field` or `clientList` or `clientListDelta` field may be present.
     - `leave` - Client is considered to have left the room, and should delete everything it knows about the room including the ids of other users.
   - **clientList** (optional) Map of easyrtcid's for users online in the same room. If present, this should overrule the current list in memory.
     - **easyrtcid** (required) Matches map key
     - **username** (optional)
     - **roomJoinTime** (required) Timestamp of when client joined room
     - **presence** (required) {show:[away|chat|dnd|xa],status:{String}}
     - **apiField** (optional) Map of appDefinedFields and their values
     - **browserFamily** (optional)
     - **browserMajor** (optional)
     - **osFamily** (optional)
     - **deviceFamily** (optional)
   - **clientListDelta** (optional)
     - **updateClient** (optional) Map of easyrtcids to update. Will contain same fields as 'clientList'
     - **removeClient** (optional) Map of easyrtcids to remove from the client list.
   - **field** (optional) - map of room fields. If this exists but is empty, than all fields should be removed.
     - **fieldName**
     - **fieldValue**


### msgType - 'roomList'

Provides rooms which the client has access to. By default authenticated users can see all other rooms in the same application.

**Fields:**

 - **serverTime** (required)
 - **msgData** (required)

**msgData Fields:**
 - **roomList** (required) Map of room names
   - **roomName** (required) Room name (matches map key)
   - **numberClients** (optional) The number of clients in the room. By default this is enabled.


### msgType - 'sessionData'

Provides session information for the user. This includes any session fields.

**Fields:**

 - **serverTime** (required)
 - **msgData** (required)

**msgData Fields:**
 - **sessionData** (required) Object holding session information
   - **easyrtcsid** (required) Session identifier
   - **field** (optional) - map of room fields
     - **fieldName**
     - **fieldValue**


### msgType - 'forwardToUrl'

Instructs API to forward user to specified URL. Useful for server handled error handling and user support techniques.

**Fields:**

 - **serverTime** (required)
 - **msgData** (required)

**msgData Fields:**

 - **forwardToUrl** (required)
   - **url** (required) URL to forward user to


### msgType - 'error'

Provides an error code to the API when an error occurs.

**Fields:**

 - **serverTime** (required)

**msgData Fields:**

 - **errorCode** (required)
 - **errorText** (optional) User readable text explaining error.


----------


easyrtcMsg
==========

"easyrtcMsg" is the socket.io emit type which EasyRTC uses for custom application level messages.

Incoming (to server)
--------------------

### General Message Format

**Fields:**

 - **msgType** (required) - String containing the message type.
 - **msgData** (optional) - Can contain any JSON compatible object or primitive type.
 - **targetEasyrtcid** (optional) - If present, will attempt to forward the message to the specific easyrtcid.
 - **targetGroup** (optional) - If present, will attempt to forward the message to all clients in a specific group. Can work in conjunction with targetEasyrtcid and targetRoom to further restrict the recipient.
 - **targetRoom** (optional) - If present, will attempt to forward the message to all clients in a specific room. Can work in conjunction with targetEasyrtcid and targetGroup to further restrict the recipient.

**Returns:**

 - **ack**
 - **error**


Outgoing (to client)
--------------------

### General Message Format

**Fields:**

 - **msgType** (required) - String containing the message type.
 - **msgData** (optional) - Can contain any JSON compatible object or primitive type.
 - **senderEasyrtcid** (optional) - If present, indicates the message was sent by a specific user.
 - **targetEasyrtcid** (optional) - If present, indicates the message was intended only for this specific easyrtcid.
 - **targetGroup** (optional) - If present, indicates the message was intended only for clients in this specific group. Can work in conjunction with targetEasyrtcid and targetRoom to further restrict the recipient.
 - **targetRoom** (optional) - If present, indicates the message was intended only for clients in this specific room. Can work in conjunction with targetEasyrtcid and targetGroup to further restrict the recipient.

**Returns:**

 - **ack**


If You Run Into Problems
------------------------
Please feel free to post on our discussion forum:

 - [https://groups.google.com/forum/#!forum/easyrtc](https://groups.google.com/forum/#!forum/easyrtc)
