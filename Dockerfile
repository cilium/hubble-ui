FROM node:13.7-slim

ENV CI true

# install global dependencies
COPY package.json package.json

RUN apt-get update \
 && apt-get install -y wget \
 && apt-get install -y unzip \
 && wget https://github.com/protocolbuffers/protobuf/releases/download/v3.9.1/protoc-3.9.1-linux-x86_64.zip \
 && unzip protoc-3.9.1-linux-x86_64.zip \
 && mv /bin/protoc /usr/bin \
 && mv include/google /usr/include

# install client dependencies
COPY client/package.json client/package.json
COPY client/package-lock.json client/package-lock.json 

# install server dependencies
COPY server/package.json server/package.json
COPY server/package-lock.json server/package-lock.json

# install all dependencies
RUN npm run install:all

COPY hubble/ hubble/
COPY server/ server/

# run test and build server
RUN npm run build:server \
    && npm run test:server

ARG NODE_ENV=production
COPY client/ client/
RUN npm run test:client \
 && npm run build:client \
 && npm run install:server

FROM node:12.13-slim
WORKDIR /workspace
COPY --from=0 /server/node_modules server/node_modules
COPY --from=0 /server/package.json server/package.json
COPY --from=0 /server/build server/build
COPY --from=0 /client/build client/build
COPY --from=0 /client/index.html client/index.html
WORKDIR /workspace/server
CMD ["npm", "start"]
