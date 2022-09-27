#!/bin/bash

# Copy config
if [ "$COPY_CONFIG" = true ] ; then
    if [ -e /config/api-server.yaml ] ; then
        ln -v -s -f /config/api-server.yaml /deploy/apps/api-server/config.yaml
    fi
    if [ -e /config/data-server.yaml ] ; then
        ln -v -s -f /config/data-server.yaml /deploy/apps/data-server/config.yaml
    fi
    if [ -e /config/gateway-server.yaml ] ; then
        ln -v -s -f /config/gateway.yaml /deploy/apps/gateway/config.yaml
    fi
    if [ -e /config/admin.json ] ; then
        ln -v -s -f /config/admin.yaml /deploy/apps/admin/dist/config.json
    fi
fi

trap "exit 255" SIGINT SIGTERM

nginx -g "daemon off; disable_symlinks off;" &

pm2-runtime /deploy/apps/all-in-one/ecosystem.config.js &

wait -n

exit $?
 