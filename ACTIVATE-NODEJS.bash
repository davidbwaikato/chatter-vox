

full_setup="$PWD/${BASH_SOURCE}"
fulldir=${full_setup%/*}
fulldir=${fulldir%/.}


export NODE_PATH="$fulldir/nodejs/lib/node_modules"
export PATH="$fulldir/nodejs/bin:$PATH"

echo "Set NODE_PATH:"
echo "  $NODE_PATH"
echo "And updated PATH"

