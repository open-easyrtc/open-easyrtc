easyRTC: Server Events
======================

Customizing the server behavior of an easyRTC application is done by creating listeners and associating them with easyRTC events. 


## Setting Event Listeners

Setting event listeners in easyRTC is similar to the node.js events module method. Any differences are noted below. 

    easyrtc.on(event, listener);

 - All easyRTC events are limited to a single listener.
 - Setting a listener removes any current listeners, including default easyRTC listeners.


## Removing Event Listeners
Removing event listeners in easyRTC is similar to the node.js events module method. Any differences are noted below.

    easyrtc.removeAllListeners(event);

 - Removing a listener automatically re-adds the easyRTC default listener.



## easyRTC Event Callback Convention

Many easyRTC listeners include a callback as the last parameter. Conventions will differ depending on if it is named 'next' or 'callback'.

- **next**
  - Informs easyRTC that your listener is done processing and to move onto the next stage of the operation.
  - Expects a single 'err' parameter which should be null unless there is an error which should stop the operation and be logged. 

- **callback**
  - Informs easyRTC that your listener is done processing and to move onto the next stage of the operation.
  - The first parameter is always an 'err' type which should be null unless there is an error which should stop the operation and be logged.
  - The remaining parameter list will match that of the listener with the exception of the final callback parameter which is omitted.
  
## Calling Default easyRTC Listeners

Setting a listener overrides the default easyRTC listener. Depending on your application you may wish to release control back to the default easyRTC listener.

    easyrtc.defaultEvents.emit(event, [arg1], [arg2], [...]);

- Default event names are the same as public event names.
- The parameter list is the same as the public listener. This includes the callback if present.
- Do not call the callback after emitting a default event. Can be unstable. 
- Do not call events outside of a associated listener. Can be unstable.
- Events predicated by 'after' do not have default easyRTC listeners. Emitting these events will have no effect.


## List of easyRTC Events

### 'startup' (httpApp, socketServer, options, next)

Runs during easyRTC startup. It is preceeded by the http and socket server. Once 'next' is called, the 'startupCallback' is called if it was defined in easyrtc.listen().

### 'afterStartup' (httpApp, socketServer, options)

Runs at the end of the easyRTC startup routine.


### 'connect'

### 'afterConnect'

