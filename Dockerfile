FROM nginx
RUN rm -r /usr/share/nginx/html
COPY server/public /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
