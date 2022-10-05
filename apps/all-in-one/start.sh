#!/bin/bash

# Copy config
if [ "$COPY_CONFIG" = true ] ; then
    echo "Copying config files..."

    # api-server
    if [ -e /config/api-server.yaml ] ; then
        cp -v -f /config/api-server.yaml /deploy/apps/api-server/config.yaml
    fi
    if [ -e /config/api-server.env ] ; then
        cp -v -f /config/api-server.env /deploy/apps/api-server/.env
    fi

    # data-server
    if [ -e /config/data-server.yaml ] ; then
        cp -v -f /config/data-server.yaml /deploy/apps/data-server/config.yaml
    fi
    if [ -e /config/data-server.env ] ; then
        cp -v -f /config/data-server.env /deploy/apps/data-server/.env
    fi

    # gateway
    if [ -e /config/gateway.yaml ] ; then
        cp -v -f /config/gateway.yaml /deploy/apps/gateway/config.yaml
    fi
    if [ -e /config/gateway.env ] ; then
        cp -v -f /config/gateway.env /deploy/apps/gateway/.env
    fi

    # db
    if [ -e /config/db.env ] ; then
        cp -v -f /config/db.env /deploy/libs/db/.env
    fi
fi

# Run database migration
(cd /deploy/libs/db; npm run migrate:deploy)

# Create bucket
mkdir -p /storage/images

trap "exit 255" SIGINT SIGTERM

nginx -g "daemon off;" &

pm2-runtime /deploy/apps/all-in-one/ecosystem.config.js &

wait -n

exit $?
 