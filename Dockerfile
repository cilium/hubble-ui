FROM nginx
COPY nginx.conf /etc/nginx/nginx.conf
COPY server/public /usr/share/nginx/html
