EasyRTC Server: Events
======================

Customizing the server behavior of an EasyRTC application is done by creating listeners and associating them with EasyRTC events.


Event Methods
-------------

The EasyRTC `events` object is directly accessible via the `easyrtc` object. As a convienience it is also a child of the `pub`, `appObj`, `connectionObj`, `sessionObj`, `roomObj`, and `connectionRoomObj`.


### Setting Event Listeners

Setting event listeners in EasyRTC is similar to the node.js events module method. Any differences are noted below.

    easyrtc.events.on(eventName, listener);

 - All EasyRTC events are limited to a single listener.
 - Setting a listener removes any current listeners, including default EasyRTC listeners.


### Resetting Event To Default Listener

    easyrtc.events.setDefaultListener(eventName);

 - Removes a custom listener from an event and then restores the EasyRTC default Listener

### Emit an Event

    easyrtc.events.emit(event, [arg1], [arg2], [...], [callback|next]);

 - See individual event documentation for parameter details.

### Emit a Default Event

Setting a listener overrides the default EasyRTC listener. Depending on your application you may wish to release control back to the default EasyRTC listener.

    easyrtc.events.emitDefault(event, [arg1], [arg2], [...], [callback|next]);

 - Default event names are the same as public event names.
 - The parameter list is the same as the public listener. This includes the callback if present.


EasyRTC Event Callback Convention
---------------------------------

Many EasyRTC listeners include a callback as the last parameter. Conventions will differ depending on if it is named 'next' or 'callback'.

 - **next**
   - Informs EasyRTC that your listener is done processing and to move onto the next stage of the operation. 
   - Expects a single 'err' parameter which should be null unless there is an error which should stop the operation and be logged.

 - **callback**
   - Informs EasyRTC that your listener is done processing and to move onto the next stage of the operation.
   - The first parameter is always an 'err' type which should be null unless there is an error which should stop the operation and be logged.
   - See individual event documentation for the remaining parameters.


Event Documentation
-------------------

The best spot (currently) to see all the available events is by reading the default event listeners documentation. This will give you an idea of the events, parameters, and default behavior.

 - /docs/server_html_docs/module-easyrtc_default_event_listeners-eventListener.html


If You Run Into Problems
------------------------
Please feel free to post on our discussion forum:

 - [https://groups.google.com/forum/?fromgroups#!forum/easyrtc](https://groups.google.com/forum/?fromgroups#!forum/easyrtc)

