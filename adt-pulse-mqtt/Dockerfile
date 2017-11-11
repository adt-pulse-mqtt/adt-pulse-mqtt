ARG BUILD_FROM
FROM $BUILD_FROM

ENV LANG C.UTF-8
ENV NODE_ENV production

# Install node
RUN apk add --update nodejs

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

