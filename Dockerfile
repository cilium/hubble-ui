# Use Debian as the build image until we figure out how to install grpc-tools on
# Alpine.
FROM node:14.4.0-slim
ENV CI true
COPY package.json package.json
COPY cilium/ cilium/
COPY client/ client/
COPY server/ server/
RUN apt-get update && apt-get install -y make patch python \
 && npm run install:all \
 && npm run build \
 && npm run test

# Use Alpine as the runtime image to avoid dealing with security vulnerabilities
# on Debian-based image.
FROM node:14.4.0-alpine3.12
WORKDIR /workspace
COPY package.json package.json
COPY server/package.json server/package.json
COPY server/package-lock.json server/package-lock.json
COPY --from=0 /server/build server/build
COPY --from=0 /client/build client/build
COPY --from=0 /client/index.html client/index.html
COPY patches/ patches/
RUN adduser --system --uid 1001 hubble-ui \
 && npm run install:prod \
 && apk add --no-cache patch \
 && patch -p1 < patches/request_issue3274.patch
WORKDIR /workspace/server
USER 1001
EXPOSE 12000
CMD ["npm", "start"]
