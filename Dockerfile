# Stage 1: cache go modules
FROM golang:1.14-alpine as stage1
RUN apk add bash git protoc
WORKDIR /app

COPY backend/go.* backend/
WORKDIR backend
RUN go mod download

# Stage 2: cache node_modules
FROM node:lts-alpine3.12 as stage2
RUN apk add bash protoc
WORKDIR /app

COPY package.json package.json
COPY package-lock.json package-lock.json
RUN sed -i '/"postinstall"\:/d' package.json
COPY scripts/ scripts/

RUN npm set unsafe-perm true
RUN npm install
RUN npm set unsafe-perm false

RUN bash ./scripts/post-install.sh prerequisites

# Stage 3: build proto
FROM stage1 as stage3
WORKDIR /app
COPY --from=stage2 /app/node_modules node_modules

COPY ./backend/go.* ./backend/
COPY ./backend/ctl.sh ./backend/
COPY ./backend/proto/ui/ui.proto ./backend/proto/ui/ui.proto
WORKDIR backend

RUN bash ./ctl.sh prerequisites
RUN bash ./ctl.sh build-proto-docker
WORKDIR ..

# Final stage: build assets
FROM stage2 as final
WORKDIR /app
COPY --from=stage3 /app/backend/proto /backend/proto
COPY . .

ARG NODE_ENV=production
RUN npm run build

FROM nginx
RUN rm -r /usr/share/nginx/html
COPY --from=final /app/server/public /usr/share/nginx/html
COPY --from=final /app/server/nginx.conf /etc/nginx/nginx.conf
