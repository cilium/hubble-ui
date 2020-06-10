FROM node

COPY package.json package.json
COPY package-lock.json package-lock.json
COPY client/package.json client/package.json
COPY client/package-lock.json client/package-lock.json
COPY client/scripts/ client/scripts/
RUN npm set unsafe-perm true 
RUN npm run install:all
RUN npm set unsafe-perm false

COPY cilium/ cilium/
COPY server/ server/
COPY client/ client/
ARG NODE_ENV=production
RUN npm run build







FROM nginx
RUN rm -r /usr/share/nginx/html
COPY --from=0 /server/public /usr/share/nginx/html
COPY --from=0 /server/nginx.conf /etc/nginx/nginx.conf
