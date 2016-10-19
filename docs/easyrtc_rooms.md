EasyRTC: Rooms
==============

EasyRTC Room Features
---------------------

 - Clients can connect to one or more rooms
 - Clients can see all other clients in the same room
 - Server can restrict who gains access to rooms
 - Server can define room fields (variables) which are shared to all clients in a room


Default Room Behavior
---------------------

 - If no room is specified the client will join a default room named "default"
 - Requested rooms will automatically be created if they don't currently exist
 - Clients see all other authenticated clients within the same room


Server Options which Effect Rooms
---------------------------------

**Room Options**
 - roomAutoCreateEnable
   - Enables the creation of rooms from the API. Occurs when client joins a nonexistent room.
   - Defaults to: true
 - roomDefaultEnable
   -  Enables connections joining a default room if it is not initially specified. If false, than a connection initially may be in no room.
   - Defaults to: true
 - roomDefaultFieldObj
   - Default fields which are set when a room is created. In form of {"fieldName":{fieldValue:<JsonObj>, fieldOption:{isShared:<boolean>}}[, ...]}
   - Defaults to: null
 - roomDefaultName
   - The default room a connection joins if it is not initially specified.
   - Defaults to: "default"


JavaScript Client API - Joining a room
--------------------------------------

### easyrtc.joinRoom()

Joining a room is handled using the joinRoom function. This can be run before or after `easyrtc.connect()` or `easyrtc.easyApp()`. It may be called multiple times to be in multiple rooms simultaneously. It may be called before or after connecting to the server.

Note: the successCB and failureDB will only be called if you are already connected to the server.

**Format**

`easyrtc.joinRoom(roomName, roomParameters, successCB, failureCB)`

**Parameters**
 - **roomName** - String. Unique room name
 - **roomParameters** - Can be null. Parameters set here are sent to the server and seen in the `roomJoin` event.
 - **successCB** - Success callback which expects a function(roomName). May be null. Is only called if client is already connected to the server.
 - **failureCB** - Failure callback which expects a function(errorCode, errorText, roomName). May be null. Is only called if client is already connected to the server.


JavaScript Client API - Leaving a room
--------------------------------------

### easyrtc.leaveRoom()

Leaving a room is handled using the leaveRoom function, or through disconnecting.

**Format**

`easyrtc.leaveRoom(roomName, successCB, failureCB)`

**Parameters**
 - **roomName** - String. Unique room name
 - **successCB** - Success callback which expects a function(roomName). May be null. Is only called if client is already connected to the server.
 - **failureCB** - Failure callback which expects a function(errorCode, errorText, roomName). May be null. Is only called if client is already connected to the server.


Server - "roomCreate" Event
---------------------------

When a client has requested to create a room, the "roomCreate" event is fired. By setting a new listener for the "roomCreate" event, the default behavior can be overruled.

Note: The roomCreate event will be fired when a client requests to join a room which doesn't exist and the "roomAutoCreateEnable" option is set to true. Upon successful callback.

### Common Uses:
 - Authenticate who is permitted to create rooms
 - Set roomField's
 - Perform application logic, where rooms may be matched to a database entry


Server - "roomJoin" Event
-------------------------

Controlling who can join an existing room, and what occurs when joining is controlled by a listener for the "roomJoin" event. By setting a new listener for the "roomJoin" event, the default behavior can be overruled.

### Common Uses:
 - Authenticate who is permitted to join rooms
 - Set roomField's
 - Control which other clients receive an update that a client joined the room
 - Perform application logic, where rooms may be matched to a database entry


Server - "roomLeave" Event
---------------------------

When a client has requested to leave a room, the "roomLeave" event is fired. By setting a new listener for the "roomLeave" event, the default behavior can be overruled.

### Common Uses:
 - Prevent a client from leaving a room
 - Set roomField's
 - Control which other clients receive an update that a client left the room
 - Perform application logic, where rooms may be matched to a database entry


If You Run Into Problems
------------------------
Please feel free to post on our discussion forum:

- [https://groups.google.com/forum/?fromgroups#!forum/easyrtc](https://groups.google.com/forum/?fromgroups#!forum/easyrtc)

