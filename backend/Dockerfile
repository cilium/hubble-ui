# syntax=docker/dockerfile:1.29

# Copyright 2021 Authors of Cilium
# SPDX-License-Identifier: Apache-2.0

# skopeo inspect --override-os linux --override-arch amd64 docker://docker.io/library/golang:1.27.4-trixie | jq -r '.Digest'
ARG GOLANG_IMAGE=docker.io/library/golang:1.27.4-trixie@sha256:430985542100b871e108ccc00e8dcc5eef08ca14ee5825e98ebf563d8ffec4ee

# $ skopeo inspect --override-os linux docker://gcr.io/distroless/static-debian13:nonroot | jq -r '.Digest'
# distroless images are signed by cosign. You should verify the image with the
# following commands:
# $ docker pull gcr.io/distroless/static-debian13:nonroot
# $ cosign verify gcr.io/distroless/static-debian13:nonroot --certificate-oidc-issuer https://accounts.google.com --certificate-identity keyless@distroless.iam.gserviceaccount.com
ARG BASE_IMAGE=gcr.io/distroless/static-debian13:nonroot@sha256:8ce6dd87e9823c5b48dcfb2c8604714ccb351ce59607327bcc4957448da279b5

FROM --platform=${BUILDPLATFORM} ${GOLANG_IMAGE} as app-build
WORKDIR /app

COPY . .
ARG TARGETARCH
RUN CGO_ENABLED=0 GOARCH=${TARGETARCH} go build -ldflags "-s -w" -o backend

FROM ${BASE_IMAGE} AS release
# TARGETOS is an automatic platform ARG enabled by Docker BuildKit.
ARG TARGETOS
# TARGETARCH is an automatic platform ARG enabled by Docker BuildKit.
ARG TARGETARCH
COPY --from=app-build /app/backend /usr/bin
USER 65532:65532
CMD ["/usr/bin/backend"]
