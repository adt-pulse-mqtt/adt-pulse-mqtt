ARG BUILD_FROM
FROM $BUILD_FROM

ENV LANG C.UTF-8

# Install requirements for add-on
#RUN apk add --no-cache jq

WORKDIR /usr/src/adt-pulse-mqtt

# Install app dependencies
COPY package.json .
RUN npm install

# Bundle app source
COPY . .

# Copy data for add-on
COPY run.sh /
RUN chmod a+x /run.sh

CMD [ "/run.sh" ]
