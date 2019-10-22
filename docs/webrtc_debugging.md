# Debugging WebRTC

## Browser Tools and Logging

### Chrome/Chromium

Chrome has a built-in debugging tool for WebRTC, which can be found by browsing to __*chrome://webrtc-internals*__.

You can also view log output for Chrome by providing some command-line arguments:
```
~$ chrome --enable-logging --vmodule=*/webrtc/*=1
```
More information on logging in Chrome in general can be found [here](https://www.chromium.org/for-testers/enable-logging), and WebRTC-specific logging information can be found [here](https://webrtc.org/web-apis/chrome/#native-webrtc-logging-in-chrome).

### Firefox

Firefox has a built-in debugging tool, which can be found by entering __*about:webrtc*__ into your url bar.

Additionally, a plugin can be installed to provide extra features, more info can be found in [the Mozilla blog](https://blog.mozilla.org/webrtc/new-tool-debugging-webrtc/).

Logging can be enabled via the __*about:networking#logging*__ config page. Logging must be enabled specifically for each module you wish to debug. Information on which modules you need to enable can be found on [the Mozilla wiki](https://wiki.mozilla.org/Media/WebRTC/Logging).