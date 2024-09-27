#!/bin/bash

# npm run dev

if [ "x$CHATTERVOX_PORT" == "x" ] ; then
    source ./SETUP.bash
fi

./node_modules/pm2/bin/pm2 delete "$CHATTERVOX_PM2_NAME"
