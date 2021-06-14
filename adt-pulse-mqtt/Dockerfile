ARG BUILD_FROM=balenalib/amd64-alpine:3.13-run
FROM $BUILD_FROM

ENV LANG C.UTF-8
ENV NODE_ENV production

# Install node and npm (Node 14 LTS)
RUN apk add --update nodejs=~14
RUN apk add --update nodejs-npm=~14

WORKDIR /usr/src/app

# Install app dependencies
COPY package.json .
RUN npm install --production

# Bundle app source
COPY . .

# Copy data for add-on
COPY run.sh /
RUN chmod a+x /run.sh

CMD [ "/run.sh" ]
