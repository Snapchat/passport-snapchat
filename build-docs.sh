#!/bin/bash

typedoc \
  --includeDeclarations \
  --excludeExternals \
  --excludePrivate \
  --excludeProtected \
  --module commonjs \
  --target ES5 \
  --tsconfig tsconfig.docs.json \
  --mode file \
  --theme minimal \
  --name passport-snapchat \
  --readme README.md \
  --sourcefile-url-prefix "https://github.com/Snapchat/passport-snapchat" \
  --out docs src \
