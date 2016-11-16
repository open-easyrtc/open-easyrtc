Support For Typescript
======================

Currently, typescript support is limited to the client side code.

You can find a set of typescript declarations for EasyRTC in

    d.ts.files/client/easyrtc.d.ts.
    d.ts.files/client/easyrtc_ft.d.ts.

It is dependent on :

    d.ts.files/DefinitelyTyped/webrtc/RTCPeerConnection.d.ts

The RTCPeerConnection.d.ts has been hand edited to remove declarations
that are already provided by typescript's own libraries; otherwise there 
are conflicts.
 
In the demo directory, you can execute

     tsc

which transpiles the exercise_easyrtc_d_ts.ts and exercise_easyrtc_ft_d_ts.ts files. 
These files are present to show that (hopefully) all the public easyrtc methods and members are 
correctly typed by easyrtc.d.ts and easyrtc_ft.d.ts, the actual generated code is not intended to
do anything useful.

These definitions are experimental (as of Nov 15, 2016). If you find problems
with them, or would like to make suggestions, feel free to enter it on a github issue.

You should be using at least version 2.0.* of typescript.

Declarations have not been created for Desktop capture yet.
