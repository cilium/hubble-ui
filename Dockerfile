FROM nginx
RUN rm -r /usr/share/nginx/html
COPY server/public /usr/share/nginx/html
COPY server/nginx.conf /etc/nginx/nginx.conf
