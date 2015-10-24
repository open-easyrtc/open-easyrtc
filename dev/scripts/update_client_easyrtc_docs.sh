#!/bin/sh
jsdoc -d ../../docs/client_html_docs  -t client_jsdoc_templates ../../api/easyrtc_int.js --verbose
mv -f ../../docs/client_html_docs/Easyrtc.html ../../docs/client_html_docs/easyrtc.html
