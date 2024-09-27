#!/bin/bash

nodejs_full_ver=node-v20.16.0-linux-x64
nodejs_full_ver_tarfile="node-v20.16.0-linux-x64.tar.xz"

nodejs_installed="nodejs"

if [ -d "$nodejs_installed" ] ; then
   echo "Detected directory: '$nodejs_installed'.  Installation already setup"
   exit 1
fi
   
if [ ! -f "$nodejs_full_ver_tarfile" ] ; then
    wget "https://nodejs.org/dist/v20.16.0/node-v20.16.0-linux-x64.tar.xz"
fi


if [ ! -d "$nodejs_full_ver" ] ; then
    tar xvf "$nodejs_full_ver_tarfile"
fi

/bin/mv "$nodejs_full_ver" "$nodejs_installed"
   

