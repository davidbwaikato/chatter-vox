#!/bin/bash

# npm run dev

if [ "x$CHATTERVOX_PORT" == "x" ] ; then
    source ./SETUP.bash
fi

PORT=$CHATTERVOX_PORT ./node_modules/pm2/bin/pm2 start --name "$CHATTERVOX_PM2_NAME" "npm run dev"
