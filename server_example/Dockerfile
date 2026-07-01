# Pull base image.
ARG NODE_VERSION=24
FROM node:${NODE_VERSION}

# OCI standard labels
LABEL org.opencontainers.image.title="open-easyrtc"
LABEL org.opencontainers.image.description="WebRTC toolkit for building real-time communication apps (open-easyrtc server)"
LABEL org.opencontainers.image.authors="Harold Thetiot <hthetiot@gmail.com>"
LABEL org.opencontainers.image.source="https://github.com/open-easyrtc/open-easyrtc"
LABEL org.opencontainers.image.url="https://hub.docker.com/r/open-easyrtc/open-easyrtc"
LABEL org.opencontainers.image.documentation="https://github.com/open-easyrtc/open-easyrtc#readme"
LABEL org.opencontainers.image.licenses="BSD-2-Clause"
LABEL org.opencontainers.image.vendor="open-easyrtc"

# Upgrade npm
RUN npm i npm@latest -g
ENV NO_UPDATE_NOTIFIER=1

# Create app directory
ENV APPDIR=/usr/src/app
RUN mkdir -p $APPDIR
WORKDIR $APPDIR

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json $APPDIR/
RUN npm install

# Install open-easyrtc, then prune dev dependencies
ARG EASYRTC_BRANCH=master
RUN npm install open-easyrtc@latest
RUN npm install --omit=dev

COPY . $APPDIR
VOLUME ["/usr/src/app/certs", "/usr/src/app/static"]

# Replace 'easyrtc = require("../");' by 'easyrtc = require("open-easyrtc");'
# To use easyrtc from node_modules instead of parent directory
RUN sed -i "s|easyrtc = require(\"../\")|easyrtc = require(\"open-easyrtc\")|g" $APPDIR/*.js

# Define service user
RUN chown -R nobody:nogroup $APPDIR && chmod -R a-w $APPDIR
USER nobody

# Ports > 1024 since we're not root.
EXPOSE 8080 8443
ENV HTTP_ONLY=true
ENTRYPOINT ["npm"]
CMD ["start"]