FROM node:14-slim

# Install nginx
RUN apt-get update && apt-get install -y \
    nginx \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Install minio
RUN wget https://dl.min.io/server/minio/release/linux-amd64/minio -O /usr/local/bin/minio
RUN chmod +x /usr/local/bin/minio

# Install pm2
RUN npm install pm2 -g

WORKDIR /deploy/apps/all-in-one
COPY ./common/deploy/apps/all-in-one/nginx.conf /etc/nginx/conf.d/default.conf
COPY ./common/deploy /deploy

EXPOSE 8080

ENV COPY_CONFIG=true

CMD ["/deploy/apps/all-in-one/start.sh"]
