# syntax=docker/dockerfile:1.2

# Copyright 2021 Authors of Cilium
# SPDX-License-Identifier: Apache-2.0

# BUILDPLATFORM is an automatic platform ARG enabled by Docker BuildKit.
# Represents the plataform where the build is happening, do not mix with
# TARGETARCH
# skopeo inspect --override-os linux docker://docker.io/library/node:20.11.0-alpine3.18 | jq -r '.Digest'
FROM --platform=${BUILDPLATFORM} docker.io/library/node:21.7.2-alpine3.18@sha256:d3398787ac2f4d83206293be6b41371a628383eadaf7fb108faab63d13c5469e as stage1
RUN apk add bash
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

# skopeo inspect --override-os linux docker://docker.io/nginxinc/nginx-unprivileged:1.25.3-alpine3.18-slim | jq -r '.Digest'
FROM docker.io/nginxinc/nginx-unprivileged:1.25.4-alpine3.18-slim@sha256:e726b2a8bfc09e579e717573582632a917a1236a37d73dffb4bcffcf3bf7f112
USER root
RUN apk upgrade --no-cache
USER 101
COPY --from=stage1 /app/server/public /app
