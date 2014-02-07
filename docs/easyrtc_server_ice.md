EasyRTC: ICE Configuration
==========================

WebRTC utilizes a technique called [ICE, Interactive Connectivity Establishment](http://en.wikipedia.org/wiki/Interactive_Connectivity_Establishment), to traverse NAT's and firewalls. As part of the ICE process, the browser may utilize [STUN](http://en.wikipedia.org/wiki/STUN) and [TURN](http://en.wikipedia.org/wiki/Traversal_Using_Relays_around_NAT) servers. The addresses to STUN and TURN servers are sent to the browser via an ICE configuration.

STUN servers generally require very little bandwidth, thus there are many free servers available. On the other hand, TURN does incur significant processing and bandwidth costs. There are some free TURN services for development, but for production you will need a commercial or self-hosted solution.

It is estimated that 85-90% of connections do not require TURN, however that still leaves a significant percentage which does require it.


TURN Details:
-------------

 - UDP - The UDP based TURN server is the preferred and most common.
 - TCP - Connecting to a TCP based TURN server introduces a bit more latency and network overhead, but gets through more firewalls.
   - Append "?transport=tcp" to the end of the url
   - Use port 443 or port 80 to get through port-blocking firewalls
 - Old method was to provide username @beginning of the domain. Now uses separate username field.


Setting appIceConfig Option
---------------------------

The appIceConfig option accepts an array containing zero or more URL's to STUN and TURN servers along with additional authentication details. It is useful when setting a common configuration for all connections. 

**Example ICE Config Array**


    var myIceConfig = [
      {"url":"stun:[ADDRESS]:[PORT]"},
      {
        "url":"turn:[ADDRESS]:[PORT]",
        "username":"[USERNAME]",
        "credential":"[CREDENTIAL]"
      },
      {
        "url":"turn:[ADDRESS]:[PORT][?transport=tcp]",
        "username":"[USERNAME]",
        "credential":"[CREDENTIAL]"
      }
    ];


**Setting appIceConfig Across Server**

    easyrtc.setOption("appIceConfig", myIceConfig);


**Can be Application Specific**
Run setOption() from the application object to give a unique configuration for the specific application.

    appObj.setOption("appIceConfig", myIceConfig);


**Order Maters**
 - The first URL(s) should be to STUN servers
 - Followed by a UDP TURN server. This should catch the majority of peer connections unable to handle STUN
 - Finally a TCP TURN server can handle those connections which are behind port blocking firewalls.


Creating Listener for Event "getIceConfig"
------------------------------------------

Create a custom listener for the event "getIceConfig" in cases where a custom ICE configuration needs to be delivered on a per connection basis. This may be needed for authentication, localization, or load balancing.

In this example we are supplying a custom username for the TURN server.

    easyrtc.on("getIceConfig", function(connectionObj, callback){
      var myIceConfig=[
        {"url":"stun:stun.easyrtc.com:3478"},
        {
          "url":        "turn:turn.easyrtc.com:3478",
          "username":   connectionObj.getUsername(),
          "credential": "345yRTC!"
        }
      ];
    
      callback(null, myIceConfig);
    });

For more information about EasyRTC server events, see [easyrtc_server_events.md](easyrtc_server_events.md)


Note: TURN Does Not Solve All Connection Problems
-------------------------------------------------

Even with TURN, a WebRTC peer connections can fail.

 - Firewalls with packet or header inspection may block traffic
 - Disconnection issues
 - Low bandwith
 - High latency
 - Packet loss
 - Poor client processing power


If You Run Into Problems
------------------------
Please feel free to post on our discussion forum:

 - [https://groups.google.com/forum/#!forum/easyrtc](https://groups.google.com/forum/#!forum/easyrtc)
