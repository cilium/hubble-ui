# syntax=docker/dockerfile:1.2

# Copyright 2021 Authors of Cilium
# SPDX-License-Identifier: Apache-2.0

# BUILDPLATFORM is an automatic platform ARG enabled by Docker BuildKit.
# Represents the plataform where the build is happening, do not mix with
# TARGETARCH
# skopeo inspect --override-os linux --override-arch amd64 docker://docker.io/library/node:20.14.0-alpine3.20 | jq -r '.Digest'
FROM --platform=${BUILDPLATFORM} docker.io/library/node:20.14.0-alpine3.20@sha256:da1fb4e470cbe065c849c47c1187a592f7505c1a679f5b3f845ea88b30f763a6 as stage1
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

# skopeo inspect --override-os linux --override-arch amd64 docker://docker.io/nginxinc/nginx-unprivileged:1.25.5-alpine3.19-slim | jq -r '.Digest'
FROM docker.io/nginxinc/nginx-unprivileged:1.25.5-alpine3.19-slim@sha256:9cb7e1ce0b93244c97df36ee9395fef5fe4393869ebfb136875b16cf966c02bc
USER root
RUN apk upgrade --no-cache
USER 101
COPY --from=stage1 /app/server/public /app
