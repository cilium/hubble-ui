
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

FROM nginx
RUN rm -r /usr/share/nginx/html
COPY --from=stage1 /app/server/public /usr/share/nginx/html
COPY --from=stage1 /app/server/nginx.conf /etc/nginx/nginx.conf
