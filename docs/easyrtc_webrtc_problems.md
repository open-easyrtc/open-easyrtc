WebRTC Problems and Possible Fixes
==================================

Many of these issues are general WebRTC or browser issues and not specific to EasyRTC. Given time, many of these will become less frequent as the specification browsers are updated.

PermissionDeniedError When Creating A Local Media Stream
--------------------------------------------------------

 - If your page is not being served using https (instead of http), 
chrome won't let your page access a local camera or microphone.
 - If you have previously disallowed camera or micrphone access from a 
 particular domain, the browser remembers this and refuses permission in 
 the future. If this is the case, you'll see a crossed-circle around the camera 
 icon in the title bar. Click it to bring up a dialog for controlling media 
 access, and reload the page after using the dialog. 

No Self Video
-------------

 - Ensure no other program is using the camera (such as another brand of browser: Chrome and Firefox can't share a single camera on Windows).
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
 - Video camera hardware makes a big difference. When we upgraded from a 5yr old 720p camera to a new 1080p camera, the differences were remarkable. Even when just sending 640x480.
 - HOPE: Support for hardware encoding / decoding will allow higher resolution video.
 - HOPE: Support for adjusting bandwidth from within the JavaScript API.


Sound Quality
-------------

 - Reduce video resolution to allow more bandwidth for audio
 - Feedback?
   - Especially common with laptops and tablets.
   - Don't run two clients in the same physical room (sound from the speaker on one computer enters the microphone of the other computer).
   - Reduce the speaker volume.
   - Use a headset.
   - Use a conference microphone/speaker with built-in noise cancelling.
 - HOPE: Browsers implement (and expose) their own noise cancelling and feedback protection options.


If You Run Into Problems
------------------------
We have a dicussion forum you can find at:

 - [https://easyrtc.com/forum/](https://easyrtc.com/forum/)

Note, if you are having trouble getting the demos to work on your own machine, here is a suite of easy tests for you to try before posting to our discussion forum.

Which of the following tests work when you point your browsers at [http://demo.easyrtc.com/demos/demo_audio_video_simple.html] (http://demo.easyrtc.com/demos/demo_audio_video_simple.html)
1. Two instances running on the same client computer (ie, two different windows or tabs on the same browser). This test verifies that your browser/hardware is capable of WebRTC.
2. Two instances, each running on a different computer on the same subnet. 
3. Two computers on different subnets.

Which of the following tests work when you point your browsers at demo_audio_video_simple.html on your own instance of easyrtc?
1. Two instances running on the same client computer (ie, two different windows or tabs on the same browser). If this test fails, your server probably isn't letting through websocket communication.
2. Two instances, each running on a different computer on the same subnet. 
3. Two computers on different subnets. If this is the only test that fails, then you need a TURN server because you are dealing with a tight firewall or a router enforcing symmetric NAT.





