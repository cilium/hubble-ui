# syntax=docker/dockerfile:1.28

# Copyright 2021 Authors of Cilium
# SPDX-License-Identifier: Apache-2.0

# BUILDPLATFORM is an automatic platform ARG enabled by Docker BuildKit.
# Represents the plataform where the build is happening, do not mix with
# TARGETARCH
# skopeo inspect --override-os linux --override-arch amd64 docker://docker.io/library/node:24.20.0-alpine3.23 | jq -r '.Digest'
FROM --platform=${BUILDPLATFORM} docker.io/library/node:24.22.2-alpine3.23@sha256:9b69af715c7f9d038150b54ccccbaeffa9064bbc93e2904c29591ca097316af1 as stage1
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

# skopeo inspect --override-os linux --override-arch amd64 docker://docker.io/nginxinc/nginx-unprivileged:1.31.3-alpine3.24-slim | jq -r '.Digest'
FROM docker.io/nginxinc/nginx-unprivileged:1.31.7-alpine3.24-slim@sha256:a8cb0f33d51fa107c96fd2bd3a71aaf564ec131e9d2bdf8700944f0ed8b170d7 AS release
USER root
RUN apk upgrade --no-cache
USER 101
COPY --from=stage1 /app/server/public /app
