# syntax=docker/dockerfile:1.2

# Copyright 2021 Authors of Cilium
# SPDX-License-Identifier: Apache-2.0

# BUILDPLATFORM is an automatic platform ARG enabled by Docker BuildKit.
# Represents the plataform where the build is happening, do not mix with
# TARGETARCH
# skopeo inspect --override-os linux --override-arch amd64 docker://docker.io/library/node:24.14.1-alpine3.23 | jq -r '.Digest'
FROM --platform=${BUILDPLATFORM} docker.io/library/node:24.14.1-alpine3.23@sha256:01743339035a5c3c11a373cd7c83aeab6ed1457b55da6a69e014a95ac4e4700b as stage1
RUN apk add make git bash
WORKDIR /app

COPY package.json package.json
COPY package-lock.json package-lock.json
COPY .npmrc .npmrc
COPY scripts/ scripts/
COPY patches/ patches/

# TARGETOS is an automatic platform ARG enabled by Docker BuildKit.
ARG TARGETOS
# TARGETARCH is an automatic platform ARG enabled by Docker BuildKit.
ARG TARGETARCH
RUN npm --target_arch=${TARGETARCH} install && npm run postinstall

COPY . .

ARG NODE_ENV=production
RUN npm run build

# skopeo inspect --override-os linux --override-arch amd64 docker://docker.io/nginxinc/nginx-unprivileged:1.29.8-alpine3.23-slim | jq -r '.Digest'
FROM docker.io/nginxinc/nginx-unprivileged:1.29.8-alpine3.23-slim@sha256:f57d4c81491f04d5a9e6fe5609229b47ff440e769e3738a0476eda454281194e AS release
USER root
RUN apk upgrade --no-cache
USER 101
COPY --from=stage1 /app/server/public /app
