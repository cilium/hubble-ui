FROM node:13.7-slim

ENV CI true

RUN apt-get update \
 && apt-get install -y patch python

COPY package.json package.json
COPY cilium/ cilium/
COPY client/ client/
COPY patches/ patches/
COPY server/ server/

# install all dependencies
RUN npm run install:all

# Fix TLS issue with IPv6
RUN patch -p1 < patches/request_issue3274.patch

# run test and build server
RUN npm run build:server \
 && npm run test:server

ARG NODE_ENV=production
RUN npm run test:client \
 && npm run build:client

FROM node:lts-alpine3.12
WORKDIR /workspace
COPY --from=0 /server/package.json server/package.json
COPY --from=0 /server/build server/build
COPY --from=0 /client/build client/build
COPY --from=0 /client/index.html client/index.html
WORKDIR /workspace/server
# add non-root user
RUN adduser --system --uid 1001 hubble-ui \
 && npm install
USER 1001
EXPOSE 12000
CMD ["npm", "start"]
