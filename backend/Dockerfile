# syntax=docker/dockerfile:1.2

# Copyright 2021 Authors of Cilium
# SPDX-License-Identifier: Apache-2.0

ARG GOLANG_IMAGE=docker.io/library/golang:1.16.8@sha256:527d720ce3e2bc9b8900c9c165acfa90a81e1c6f66d3730d5c52726591cf2458

# BUILDPLATFORM is an automatic platform ARG enabled by Docker BuildKit.
# Represents the plataform where the build is happening, do not mix with
# TARGETARCH

FROM --platform=${BUILDPLATFORM} ${GOLANG_IMAGE} as app-build
WORKDIR /app

COPY . .
# TARGETARCH is an automatic platform ARG enabled by Docker BuildKit.
ARG TARGETARCH
RUN CGO_ENABLED=0 GOARCH=${TARGETARCH} go build -ldflags "-s -w" -o backend

# BUILDPLATFORM is an automatic platform ARG enabled by Docker BuildKit.
# Represents the plataform where the build is happening, do not mix with
# TARGETARCH
FROM --platform=${BUILDPLATFORM} ${GOLANG_IMAGE} as gops

RUN apt-get update && apt-get install -y binutils-aarch64-linux-gnu
COPY ./build-gops.sh .
RUN --mount=target=/root/.cache,type=cache --mount=target=/go/pkg/mod,type=cache \
    ./build-gops.sh

# Do not upgrade to alpine 3.13 as its nslookup tool returns 1, instead of 0
# for domain name lookups.
FROM docker.io/library/alpine:3.12.8@sha256:a296b4c6f6ee2b88f095b61e95c7ef4f51ba25598835b4978c9256d8c8ace48a
# TARGETOS is an automatic platform ARG enabled by Docker BuildKit.
ARG TARGETOS
# TARGETARCH is an automatic platform ARG enabled by Docker BuildKit.
ARG TARGETARCH
COPY --from=app-build /app/backend /usr/bin
COPY --from=gops /out/${TARGETOS}/${TARGETARCH}/bin/gops /usr/bin/gops
RUN mkdir -p /home/gops && chown 1001:1001 /home/gops

ENV GOPS_CONFIG_DIR=/home/gops
CMD ["/usr/bin/backend"]
