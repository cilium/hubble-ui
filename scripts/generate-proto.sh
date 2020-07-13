#!/bin/bash
set -e

CWD="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PLATFORM=$(echo $(uname) | tr '[:upper:]' '[:lower:]') # darwin or linux

PROTOC_PATH="${CWD}/../node_modules/.bin/protoc/bin/protoc"
PROTOC_GEN_GRPC_WEB_PATH="${CWD}/../node_modules/.bin/protoc-gen-grpc-web"
PROTOS_PATH="${CWD}/../cilium/api/v1/"
OUT_DIR="${CWD}/../src/proto"

rm -rf $OUT_DIR && mkdir -p $OUT_DIR

${PROTOC_PATH} \
  --proto_path="${PROTOS_PATH}/" \
  --js_out="import_style=commonjs,binary:${OUT_DIR}" \
  --grpc-web_out="import_style=commonjs+dts,mode=grpcwebtext:${OUT_DIR}" \
  --plugin="protoc-gen-grpc-web=${PROTOC_GEN_GRPC_WEB_PATH}" \
  ${PROTOS_PATH}/{flow,observer,relay,peer}/*.proto
