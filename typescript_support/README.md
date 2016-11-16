Support For Typescript
======================

You can find a set of typescript declarations for EasyRTC in

    d.ts.files/client/easyrtc.d.ts.

It is dependent on :

    d.ts.files/DefinitelyTyped/webrtc/RTCPeerConnection.d.ts

The RTCPeerConnection.d.ts has been hand edited to remove declarations
that are already provided by typescript's own libraries; otherwise there 
are conflicts.
 
In the demo directory, you can execute

     tsc

which transpiles the exerciseCalls.ts file. The exerciseCalls.ts file is present
to show that (hopefully) all the public easyrtc methods and members are 
correctly typed by easyrtc.d.ts, the actual generated code is not intended to
do anything useful.

These definitions are experimental (as of Nov 15, 2016). If you find problems
with them, or would like to make suggestions, feel free to enter it on a github issue.

You should be using at least version 2.0.* of typescript.
