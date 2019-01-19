ARG BUILD_FROM=homeassistant/amd64-base:latest
FROM $BUILD_FROM

ENV LANG C.UTF-8
ENV NODE_ENV production

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

CMD [ "/run.sh" ]
