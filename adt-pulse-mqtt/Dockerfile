ARG BUILD_FROM
FROM $BUILD_FROM

USER node

ENV LANG C.UTF-8
ENV NODE_ENV production

RUN mkdir -p /home/node/adt-pulse-mqtt
WORKDIR /home/node/adt-pulse-mqtt

# Install app dependencies
COPY package.json .
RUN npm install

# Bundle app source
COPY . .

# Copy data for add-on
COPY run.sh /
RUN chmod a+x /run.sh

CMD [ "/run.sh" ]
