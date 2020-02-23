#!/usr/bin/env sh

set x-
set e-

#npm run build

cd dist/translation-ui/

content=`cat runtime.*.js polyfills.*.js main.*.js styles.*.js`

hash=`echo $content|md5 -q`

echo $content > ngwt.$hash.js

cd -
