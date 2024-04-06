#!/usr/bin/env bash

CWD="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NODE_MODULES="$CWD/../node_modules"

function installation_check() {
  if [ ! -d "$NODE_MODULES" ]; then
    echo "You must run npm install first. Exit."
    exit 1
  fi

  mkdir -p "$NODE_MODULES/.bin"
}

function install_protoc() {
  if [ ! -d "$NODE_MODULES/.bin/protoc" ]; then
    node ./scripts/install-grpc-deps/index.mjs protoc
  fi
}

function install_grpc_web_plugin() {
  if [ ! -f "$NODE_MODULES/.bin/protoc-gen-grpc-web" ]; then
    node ./scripts/install-grpc-deps/index.mjs web-plugin
  fi
}

function install_prerequisites() {
  installation_check

  # Protoc installation is now included to protobuf-ts/plugin package,
  # uncomment if protoc is no longer provided by any package
  # install_protoc
  #
  # install_grpc_web_plugin
}

install_prerequisites
