FROM golang:1.14.4-alpine3.12 as stage1
RUN apk add bash
WORKDIR /app

COPY . .
RUN bash ctl.sh build

FROM alpine:3.12
COPY --from=stage1 /app/backend /usr/bin
CMD ["/usr/bin/backend"]
