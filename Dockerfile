# syntax=docker/dockerfile:1.2

# Copyright 2021 Authors of Cilium
# SPDX-License-Identifier: Apache-2.0

# BUILDPLATFORM is an automatic platform ARG enabled by Docker BuildKit.
# Represents the plataform where the build is happening, do not mix with
# TARGETARCH
FROM --platform=${BUILDPLATFORM} docker.io/library/node:18.19.0-alpine3.18@sha256:4bdb3f3105718f0742bc8d64bb4e36e8f955ebbee295325e40ae80bc8ef78833 as stage1
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

FROM docker.io/nginxinc/nginx-unprivileged:1.25.3-alpine3.18-slim@sha256:9c0ff8cdbfbdaa633630312ffc8e1553b60af46319375c44318e3cf8bbf70bdc
USER root
RUN apk upgrade --no-cache
USER 101
COPY --from=stage1 /app/server/public /app
