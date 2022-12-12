# syntax=docker/dockerfile:1.2

# Copyright 2021 Authors of Cilium
# SPDX-License-Identifier: Apache-2.0

# BUILDPLATFORM is an automatic platform ARG enabled by Docker BuildKit.
# Represents the plataform where the build is happening, do not mix with
# TARGETARCH
FROM --platform=${BUILDPLATFORM} docker.io/library/node:18-alpine3.16@sha256:717a3d788a41347ceb43c1f65831538d75ea74a4d29dfefadb7b7246d450127c as stage1
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

FROM docker.io/nginxinc/nginx-unprivileged:1.23.2-alpine@sha256:bea513e7cca17da4fd24733bbb21c5693c305bda75d40ccddb77717a56a5fb4b
COPY --from=stage1 /app/server/public /app
