# syntax=docker/dockerfile:1.2

# Copyright 2021 Authors of Cilium
# SPDX-License-Identifier: Apache-2.0

# BUILDPLATFORM is an automatic platform ARG enabled by Docker BuildKit.
# Represents the plataform where the build is happening, do not mix with
# TARGETARCH
FROM --platform=${BUILDPLATFORM} docker.io/library/node:18-alpine3.16@sha256:1eabdb1aa3f6e68558c08501572731db560d10c2194a67d3417103b0a9868693 as stage1
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

FROM docker.io/nginxinc/nginx-unprivileged:1.25-alpine@sha256:05696001775e33798fccab756b8a9441671aa961718019d7097fb7c75dae69b6
COPY --from=stage1 /app/server/public /app
