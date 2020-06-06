FROM docker.io/library/golang:1.14.4-alpine3.12 as builder
WORKDIR /go/src/github.com/cilium/hubble-ui/events-server
COPY . .
RUN go build

FROM docker.io/library/alpine:3.12
COPY --from=builder /go/src/github.com/cilium/hubble-ui/events-server/events-server /usr/bin
CMD ["/usr/bin/events-server"]
