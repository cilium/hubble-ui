# syntax=docker/dockerfile:1.2

# Copyright 2021 Authors of Cilium
# SPDX-License-Identifier: Apache-2.0

# BUILDPLATFORM is an automatic platform ARG enabled by Docker BuildKit.
# Represents the plataform where the build is happening, do not mix with
# TARGETARCH
# skopeo inspect --override-os linux --override-arch amd64 docker://docker.io/library/node:22.13.1-alpine3.20 | jq -r '.Digest'
FROM --platform=${BUILDPLATFORM} docker.io/library/node:24.1.0-alpine3.20@sha256:8fe019e0d57dbdce5f5c27c0b63d2775cf34b00e3755a7dea969802d7e0c2b25 as stage1
RUN apk add make git bash
WORKDIR /app

COPY package.json package.json
COPY package-lock.json package-lock.json
COPY scripts/ scripts/
COPY patches/ patches/

# TARGETOS is an automatic platform ARG enabled by Docker BuildKit.
ARG TARGETOS
# TARGETARCH is an automatic platform ARG enabled by Docker BuildKit.
ARG TARGETARCH
RUN npm --target_arch=${TARGETARCH} install

COPY . .

ARG NODE_ENV=production
RUN npm run build

# skopeo inspect --override-os linux --override-arch amd64 docker://docker.io/nginxinc/nginx-unprivileged:1.27.3-alpine3.20-slim | jq -r '.Digest'
FROM docker.io/nginxinc/nginx-unprivileged:1.27.3-alpine3.20-slim@sha256:24ae9a39acde5b55b877c7d2ced48549cfada5ae497a9fe2cd8a9c0cfc15919b
USER root
RUN apk upgrade --no-cache
USER 101
COPY --from=stage1 /app/server/public /app
