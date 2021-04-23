# syntax=docker/dockerfile:1.2

# Copyright 2021 Authors of Cilium
# SPDX-License-Identifier: Apache-2.0

# BUILDPLATFORM is an automatic platform ARG enabled by Docker BuildKit.
# Represents the plataform where the build is happening, do not mix with
# TARGETARCH

FROM --platform=${BUILDPLATFORM} docker.io/library/golang:1.16.0-alpine3.13@sha256:6c4d5e6ea7b6e3f28a2218424b011fcdfddcdd721f9693c9e2d2644c67a4b827 as stage1
WORKDIR /app

COPY . .
# TARGETARCH is an automatic platform ARG enabled by Docker BuildKit.
ARG TARGETARCH
RUN CGO_ENABLED=0 GOARCH=${TARGETARCH} go build -ldflags "-s -w" -o backend

FROM docker.io/library/alpine:3.13@sha256:69e70a79f2d41ab5d637de98c1e0b055206ba40a8145e7bddb55ccc04e13cf8f
COPY --from=stage1 /app/backend /usr/bin

CMD ["/usr/bin/backend"]
