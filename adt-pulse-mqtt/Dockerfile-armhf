ARG BUILD_FROM=arm32v6/alpine:3.6
FROM $BUILD_FROM

ENV LANG C.UTF-8
ENV NODE_ENV production
ENV QEMU_EXECVE 1

COPY armhf/qemu-arm-static /usr/bin
COPY armhf/resin-xbuild /usr/bin

RUN [ "/usr/bin/qemu-arm-static", "/bin/sh", "-c", "ln -s /usr/bin/resin-xbuild /usr/bin/cross-build-start; ln -s /usr/bin/resin-xbuild /usr/bin/cross-build-end; ln /bin/sh /bin/sh.real" ]

RUN [ "cross-build-start" ]

# Install node and npm
RUN apk add --update nodejs
RUN apk add --update nodejs-npm

WORKDIR /usr/src/app

# Install app dependencies
COPY package.json .
RUN npm install

# Bundle app source
COPY . .

# Copy data for add-on
COPY run.sh /
RUN chmod a+x /run.sh  

RUN [ "cross-build-end" ]

CMD [ "/run.sh" ]
