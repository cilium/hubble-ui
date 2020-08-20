
FROM node:14.4.0-alpine as stage1
RUN apk add bash
WORKDIR /app

COPY package.json package.json
COPY package-lock.json package-lock.json
COPY scripts/ scripts/

RUN npm set unsafe-perm true
RUN npm install
RUN npm set unsafe-perm false

COPY . .

ARG NODE_ENV=production
RUN npm run build


# bitnami/nginx with configured non-root user
FROM bitnami/nginx
COPY --from=stage1 /app/server/public /app
COPY --from=stage1 /app/server/nginx-hubble-ui-frontend.conf /opt/bitnami/nginx/conf/server_blocks/nginx-hubble-ui-frontend.conf
