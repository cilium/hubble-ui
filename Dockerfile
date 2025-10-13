# syntax=docker/dockerfile:1.2

# Copyright 2021 Authors of Cilium
# SPDX-License-Identifier: Apache-2.0

# BUILDPLATFORM is an automatic platform ARG enabled by Docker BuildKit.
# Represents the plataform where the build is happening, do not mix with
# TARGETARCH
# skopeo inspect --override-os linux --override-arch amd64 docker://docker.io/library/node:22.17.1-alpine3.22 | jq -r '.Digest'
FROM --platform=${BUILDPLATFORM} docker.io/library/node:24.10.0-alpine3.22@sha256:6ff78d6d45f2614fe0da54756b44a7c529a15ebcaf9832fab8df036b1d466e73 as stage1
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

# skopeo inspect --override-os linux --override-arch amd64 docker://docker.io/nginxinc/nginx-unprivileged:1.29.0-alpine3.22-slim | jq -r '.Digest'
FROM docker.io/nginxinc/nginx-unprivileged:1.29.1-alpine3.22-slim@sha256:76f79f1f3c906a43076086e4517b019b3ab5cc18b3ed1b13417b583e0ab9b298
USER root
RUN apk upgrade --no-cache
USER 101
COPY --from=stage1 /app/server/public /app
