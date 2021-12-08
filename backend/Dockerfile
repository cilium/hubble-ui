# syntax=docker/dockerfile:1.2

# Copyright 2021 Authors of Cilium
# SPDX-License-Identifier: Apache-2.0

ARG GOLANG_IMAGE=docker.io/library/golang:1.17.4-bullseye@sha256:dbc5c71a115118983b4bc3a253f9e05ff4854b6fda3adaf3c2eed3cd6e0e04cf

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
FROM docker.io/library/alpine:3.15.0@sha256:21a3deaa0d32a8057914f36584b5288d2e5ecc984380bc0118285c70fa8c9300
# TARGETOS is an automatic platform ARG enabled by Docker BuildKit.
ARG TARGETOS
# TARGETARCH is an automatic platform ARG enabled by Docker BuildKit.
ARG TARGETARCH
COPY --from=app-build /app/backend /usr/bin
COPY --from=gops /out/${TARGETOS}/${TARGETARCH}/bin/gops /usr/bin/gops
RUN mkdir -p /home/gops && chown 1001:1001 /home/gops

ENV GOPS_CONFIG_DIR=/home/gops
CMD ["/usr/bin/backend"]
