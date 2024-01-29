# syntax=docker/dockerfile:1.2

# Copyright 2021 Authors of Cilium
# SPDX-License-Identifier: Apache-2.0

# BUILDPLATFORM is an automatic platform ARG enabled by Docker BuildKit.
# Represents the plataform where the build is happening, do not mix with
# TARGETARCH
FROM --platform=${BUILDPLATFORM} docker.io/library/node:21.6.0-alpine3.18@sha256:1df0c5dfdf73c7ecbcd7fe4b1cd3ce6a0c63b447aa1b6c177fe20575c59f7b72 as stage1
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

FROM docker.io/nginxinc/nginx-unprivileged:1.25.3-alpine3.18-slim@sha256:57a630cf4a357007959cac5b8a6d91ff381a55699b31545792fa9b88b26c5f5c
USER root
RUN apk upgrade --no-cache
USER 101
COPY --from=stage1 /app/server/public /app
