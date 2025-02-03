# syntax=docker/dockerfile:1.2

# Copyright 2021 Authors of Cilium
# SPDX-License-Identifier: Apache-2.0

# skopeo inspect --override-os linux docker://docker.io/library/golang:1.23.5-bookworm | jq -r '.Digest'
ARG GOLANG_IMAGE=docker.io/library/golang:1.23.5-bookworm@sha256:3149bc5043fa58cf127fd8db1fdd4e533b6aed5a40d663d4f4ae43d20386665f

# $ skopeo inspect --override-os linux docker://gcr.io/distroless/static-debian12:nonroot | jq -r '.Digest'
# distroless images are signed by cosign. You should verify the image with the
# following commands:
# $ docker pull gcr.io/distroless/static-debian12:nonroot
# $ cosign verify gcr.io/distroless/static-debian12:nonroot --certificate-oidc-issuer https://accounts.google.com --certificate-identity keyless@distroless.iam.gserviceaccount.com
ARG BASE_IMAGE=gcr.io/distroless/static-debian12:nonroot@sha256:6ec5aa99dc335666e79dc64e4a6c8b89c33a543a1967f20d360922a80dd21f02

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
