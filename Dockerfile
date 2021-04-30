# syntax=docker/dockerfile:1.2

# Copyright 2021 Authors of Cilium
# SPDX-License-Identifier: Apache-2.0

# BUILDPLATFORM is an automatic platform ARG enabled by Docker BuildKit.
# Represents the plataform where the build is happening, do not mix with
# TARGETARCH
# Do not upgrade to alpine 3.13 as its nslookup tool returns 1, instead of 0
# for domain name lookups.
FROM --platform=${BUILDPLATFORM} docker.io/library/node:15.14.0-alpine3.12@sha256:0b0c5112216cdbacf8a2e55b075c411ef1c726eb6913796b4bfc72237aa5ac58 as stage1
RUN apk add bash
WORKDIR /app

COPY package.json package.json
COPY package-lock.json package-lock.json
COPY scripts/ scripts/
COPY patches/ patches/

RUN npm set unsafe-perm true
# TARGETOS is an automatic platform ARG enabled by Docker BuildKit.
ARG TARGETOS
# TARGETARCH is an automatic platform ARG enabled by Docker BuildKit.
ARG TARGETARCH
RUN npm --target_arch=${TARGETARCH} install
RUN npm set unsafe-perm false

COPY . .

ARG NODE_ENV=production
RUN npm run build

FROM docker.io/nginxinc/nginx-unprivileged:1.20.0-alpine@sha256:662f1691b70555829c845b1849e5eece9041a5405cb4206f7eada4da76143374
COPY --from=stage1 /app/server/public /app
COPY --from=stage1 /app/server/nginx-hubble-ui-frontend.conf /etc/nginx/conf.d/default.conf
