FROM docker.io/library/golang:1.16.0-alpine3.12 as stage1
RUN apk add bash
WORKDIR /app

COPY . .
RUN bash ctl.sh build

FROM docker.io/library/alpine:3.12
COPY --from=stage1 /app/backend /usr/bin

CMD ["/usr/bin/backend"]
