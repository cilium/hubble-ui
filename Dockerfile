# syntax=docker/dockerfile:1.2

# Copyright 2021 Authors of Cilium
# SPDX-License-Identifier: Apache-2.0

# BUILDPLATFORM is an automatic platform ARG enabled by Docker BuildKit.
# Represents the plataform where the build is happening, do not mix with
# TARGETARCH
# skopeo inspect --override-os linux --override-arch amd64 docker://docker.io/library/node:22.13.1-alpine3.20 | jq -r '.Digest'
FROM --platform=${BUILDPLATFORM} docker.io/library/node:22.13.1-alpine3.20@sha256:c52e20859a92b3eccbd3a36c5e1a90adc20617d8d421d65e8a622e87b5dac963 as stage1
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

# skopeo inspect --override-os linux --override-arch amd64 docker://docker.io/nginxinc/nginx-unprivileged:1.27.3-alpine3.20-slim | jq -r '.Digest'
FROM docker.io/nginxinc/nginx-unprivileged:1.27.3-alpine3.20-slim@sha256:65f2b40f4d9bd814f38be587d6a6a23d8d62d7a44d3b30df181fc3b10543e063
USER root
RUN apk upgrade --no-cache
USER 101
COPY --from=stage1 /app/server/public /app
