# Pull base image.
FROM node:latest
MAINTAINER Harold Thetiot <hthetiot@gmail.com>

# Upgrade npm
RUN npm i npm@latest -g

# Create app directory
ENV APPDIR /usr/src/app
RUN mkdir -p $APPDIR
WORKDIR $APPDIR

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
ADD package*.json $APPDIR/
RUN npm install

# Install dependencies in production mode (no dev dependencies).
ARG EASYRTC_BRANCH=feature/docker-easyrtc-server
RUN npm install priologic/easyrtc#$EASYRTC_BRANCH
RUN npm install --production

ADD . $APPDIR

# Replace 'easyrtc = require("..");' by 'easyrtc = require("easyrtc");''
# To use easyrtc from node_modules instead of parent directory
RUN sed -i "s|easyrtc = require(\"../\")|easyrtc = require(\"easyrtc\")|g" $APPDIR/server*.js

# Define service user
RUN chown -R nobody:nogroup $APPDIR && chmod -R a-w $APPDIR && ls -ld
USER nobody

# Ports > 1024 since we're not root.
EXPOSE 8080 8443

ENV SYLAPS_ENV all

ENTRYPOINT ["npm"]
CMD ["start"]
