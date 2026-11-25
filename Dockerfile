# syntax=docker/dockerfile:1.29

# Copyright 2021 Authors of Cilium
# SPDX-License-Identifier: Apache-2.0

# BUILDPLATFORM is an automatic platform ARG enabled by Docker BuildKit.
# Represents the plataform where the build is happening, do not mix with
# TARGETARCH
# skopeo inspect --override-os linux --override-arch amd64 docker://docker.io/library/node:24.22.3-alpine3.23 | jq -r '.Digest'
FROM --platform=${BUILDPLATFORM} docker.io/library/node:24.22.3-alpine3.23@sha256:3946fb783fdce8a2812136ea694bc95c698c4f4096f3fd18568dc27a8ac389dc as stage1
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

# skopeo inspect --override-os linux --override-arch amd64 docker://docker.io/nginx/nginx-unprivileged:1.31.10-alpine3.24-slim | jq -r '.Digest'
FROM docker.io/nginx/nginx-unprivileged:1.31.10-alpine3.24-slim@sha256:f4afc48254dc77ea692ec6979d220e5b1176331c636a4d51c502ffdded6789bd AS release
USER root
RUN apk upgrade --no-cache
USER 101
COPY --from=stage1 /app/server/public /app
