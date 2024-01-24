# syntax=docker/dockerfile:1.2

# Copyright 2021 Authors of Cilium
# SPDX-License-Identifier: Apache-2.0

# skopeo inspect --override-os linux docker://docker.io/library/golang:1.21.6-bookworm | jq -r '.Digest'
ARG GOLANG_IMAGE=docker.io/library/golang:1.21.6-bookworm@sha256:d26cc6bb9b582095098ef54c115ec9ff43647fa3cf157330c57f5aafb97de842

# $ skopeo inspect --override-os linux docker://gcr.io/distroless/static-debian12:nonroot | jq -r '.Digest'
# distroless images are signed by cosign. You should verify the image with the
# following commands:
# $ docker pull gcr.io/distroless/static-debian12:nonroot
# $ cosign verify gcr.io/distroless/static-debian12:nonroot --certificate-oidc-issuer https://accounts.google.com --certificate-identity keyless@distroless.iam.gserviceaccount.com
ARG BASE_IMAGE=gcr.io/distroless/static-debian12:nonroot@sha256:39ae7f0201fee13b777a3e4a5a9326a8889269172c8b4f4289d9f19c831f45f4

FROM --platform=${BUILDPLATFORM} ${GOLANG_IMAGE} as app-build
WORKDIR /app

COPY . .
ARG TARGETARCH
RUN CGO_ENABLED=0 GOARCH=${TARGETARCH} go build -ldflags "-s -w" -o backend

FROM ${BASE_IMAGE}
# TARGETOS is an automatic platform ARG enabled by Docker BuildKit.
ARG TARGETOS
# TARGETARCH is an automatic platform ARG enabled by Docker BuildKit.
ARG TARGETARCH
COPY --from=app-build /app/backend /usr/bin
USER 65532:65532
CMD ["/usr/bin/backend"]