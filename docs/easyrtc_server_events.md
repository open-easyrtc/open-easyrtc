EasyRTC: Server Events
======================

Customizing the server behavior of an EasyRTC application is done by creating listeners and associating them with EasyRTC events.


## Setting Event Listeners

Setting event listeners in EasyRTC is similar to the node.js events module method. Any differences are noted below.

    easyrtc.on(event, listener);

 - All EasyRTC events are limited to a single listener.
 - Setting a listener removes any current listeners, including default EasyRTC listeners.


## Removing Event Listeners
Removing event listeners in EasyRTC is similar to the node.js events module method. Any differences are noted below.

    easyrtc.removeAllListeners(event);

 - Removing a listener automatically re-adds the EasyRTC default listener.


## EasyRTC Event Callback Convention

Many EasyRTC listeners include a callback as the last parameter. Conventions will differ depending on if it is named 'next' or 'callback'.

- **next**
  - Informs EasyRTC that your listener is done processing and to move onto the next stage of the operation.
  - Expects a single 'err' parameter which should be null unless there is an error which should stop the operation and be logged.

- **callback**
  - Informs EasyRTC that your listener is done processing and to move onto the next stage of the operation.
  - The first parameter is always an 'err' type which should be null unless there is an error which should stop the operation and be logged.
  - The remaining parameter list will match that of the listener with the exception of the final callback parameter which is omitted.

## Calling Default EasyRTC Listeners

Setting a listener overrides the default EasyRTC listener. Depending on your application you may wish to release control back to the default EasyRTC listener.

    easyrtc.defaultEvents.emit(event, [arg1], [arg2], [...]);

- Default event names are the same as public event names.
- The parameter list is the same as the public listener. This includes the callback if present.


## List of EasyRTC Events

### 'startup' (httpApp, socketServer, options, next)

Runs during EasyRTC startup. It is preceeded by the http and socket server. Once 'next' is called, the 'startupCallback' is called if it was defined in easyrtc.listen().


### 'connect'

