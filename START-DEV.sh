#!/bin/bash

# npm run dev

if [ "x$CHATTERVOX_PORT" == "x" ] ; then
    source ./SETUP.bash
fi

PORT=$CHATTERVOX_PORT npm run dev
