WebRTC Problems and Possible Fixes
==================================

Many of these issues are general WebRTC or browser issues and not specific to EasyRTC. Given time, many of these will become less frequent as the specification browsers are updated.


No Self Video
-------------

 - Ensure no other program is using the camera
 - Test camera in another application (such as Skype or WebEx)
 - Completely close the browser then reopen it.
 - Shutdown / reset camera and computer. Some cameras seem to freeze up (even Apple ones).
 - No hardware / driver support. WebRTC in Android isn't enabled for all devices.
 - HOPE: Browsers will do a better job of detecting and handling camera problems in the future.


No Video Sent To Peer
---------------------

 - Firewall issues are the primary cause. For simple testing, be sure to use a simple single subnet network.
 - Production environment should allow direct, then STUN, then UDP-TURN, then TCP-TURN.
 - Even with TURN, some firewalls will still prevent WebRTC traffic.
 - Mobile networks (3G/4G) have differing restrictions.
 - We've seen some Android devices unable to display remote video reliably. The Nexus devices seem to be the best tested.
 - HOPE: Network admins and firewall manufacturers recognize the upcoming importance of WebRTC and provide QOS and whitelist rules.


Lag and slow connections
------------------------

 - The upload speed provided by most broadband providers is often much slower than the download.
 - WebRTC video is not covered by many firewall QOS rules.
 - Beef up your router. New routers are able handle faster connections and more concurrent traffic.
 - Adjust resolution and bandwidth settings (see Picture Quality section)
 - HOPE: The whole world gets fiber to the home :)


Delays in Video or Audio
------------------------

 - Often hardware related, not connection.
   - Frames get held up in buffer waiting to be displayed / transported.
   - Faster video / CPU processor are recommended.
   - Reduced resolution and fewer streams will often reduce effect.
 - Using TURN server does introduce a slight delay.
   - Best if TURN server is geographically nearer to callers.
   - Load balancing and beefier servers may be needed.
 - HOPE: Support for hardware encoding / decoding will greatly reduce processor usage and video delay.


Picture Quality
---------------

 - Video resolution can be in set using:
   -  easyrtc.setVideoDims(width, height);
 - In Chrome the bandwidth can be set using:
   -  easyrtc.setVideoBandwidth(kbits-per-second);
 - Video camera hardware makes a big difference. When we upgraded from a 5yr old 720p camera to a new 1080p camera, the differences were remarkable. Even when just sending 640x480.
 - HOPE: Support for hardware encoding / decoding will allow higher resolution video.
 - HOPE: Support for adjusting bandwidth from within the JavaScript API.


Sound Quality
-------------

 - Reduce video resolution to allow more bandwidth for audio
 - Feedback?
   - Especially common with laptops and tablets.
   - Reduce the speaker volume.
   - Use a headset.
   - Use a conference microphone/speaker with built-in noise cancelling.
 - HOPE: Browsers implement (and expose) their own noise cancelling and feedback protection options.


If You Run Into Problems
------------------------
Please feel free to post on our discussion forum:

 - [https://groups.google.com/forum/#!forum/easyrtc](https://groups.google.com/forum/#!forum/easyrtc)
