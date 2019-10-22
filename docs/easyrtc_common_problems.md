# Common EasyRTC Problems

### I can't get video from my camera and/or microphone

#### I can only access the camera if the browser url is "localhost://..."

Chrome requires an https url except in the case of localhost. 
This is for security reasons. 
You can get free SSL certificates at https://letsencrypt.org/  or at
https://www.startssl.com/Support?v=1 .
There is a document in the documents section that describes how to add ssl certificates to the EasyRTC server.

#### Only some WebRTC applications can't access my camera.

With Chrome, if you don't give a website permission to use your camera or your microphone, it remembers this and doesn't request camera permission in the future. If that is the case, the camera icon (in your browser's URL field, to the right) will show a 'X'ed out camera. 
Click the camera icon to pull up a dialog box that will let you change this.

#### No WebRTC application can access my camera.

A single camera can be shared by mutiple tabs in a browser, but whether a camera can be shared by multiple binary applications or not depends on the Operating system. We've seen MacOS share the camera, Linux can't, not sure about Windows 10. So the standard operating procedure is: kill any process that may be holding onto the camera (Skype, Ring central, etc) and try reloading your app. 

With Linux, 
it is possible for operating system to get confused about the 
state of the camera if an application has been using died. 
Sometimes, it is suffcient to simply suspend the computer and wake 
it a few seconds later, other times it requires rebooting.

### I can't establish a connection!

Just to re-iterate what you should already know by now so we have a common
context: 

   + An EasyRTC application is hosted on a single web server that has to be
    reachable by any client machines (laptops, desktops, android devices). 
    The webserver provides the html, style, and javascript files used by the 
    application.

   + All instances of the EasyRTC application connect to the same 
    signaling server which is implemented in node js. The signaling server
    needs to be reachable by all the client machines.

   + EasyRTC comes with an example signaling server called server.js that 
     can also provide the webserver support (that is to say, it acts as the webserver as well as the signaling server).


The general order of testing is:

   + Can a client reach the webserver and the signaling server? If it can't, you'll see interesting messages in the browser's console about being unable to connect or connection timeouts. This might indicate that one or both of your servers hasn't been started up, or that they have crashed.

   + Can you establish a peer connection between two clients running in the same browser (different tabs or windows)? If you can't do this, there something wrong with your browser or your signaling server. Check the console logs of the signaling server and of the web apps for clues.

   + Can you establish a peer connection between two WebRTC applications running on different machines in the same subnet? If you can't, you should be looking at the firewalls running on the machines, or check to see if the router common to the two machines allows them to see each other. Note: EasyRTC uses a single signallying server with multiple clients talk to; you don't a signaling server on each client machine; it would defeat the whole notion of a "server".

   + Can you establish a peer connection between two client machines that are on completely different networks? 
Presumably you can't, or you'd have already stopped reading this section by now.
This case suggests that there is a router or Firewall (between the two clients) implementing a symmetric NAT policy that prevents the usual peer-peer port busting system from working. Symmetric nats are common in larger institutions (Universities, Government, Corporations), and very uncommon in home routers.
To handle this case, you'll need a TURN server. 
Typically, you'll want your turn server to run on the standard UDP port but also run on UDP 443 and TCP 443 because TCP 443 is
usually left unblocked by system admins to support SSH. 
The demos at demo.EasyRTC.com are backed by a turn server and should still work for those two client machines.

   + Have you checked if your turn server is actually working on the ports you configured it at? You can filter your ice candidates to force certains types of connections. Chromes  chrome://webrtc-internals for verifying this worked.

   + Do you only fail to establish a peer connection when using 3G or 4G on a cell phone? Some cell providers block WebRTC. The TCP 443 dodge sometimes helps here.
 