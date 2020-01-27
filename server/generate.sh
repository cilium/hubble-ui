#!/bin/bash
set -e
CWD="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
OUT_DIR="$CWD/src/hubble_proto"

mkdir -p $OUT_DIR

for proto_dir in observer flow; do
  grpc_tools_node_protoc \
    -I ${CWD}/../hubble/api/v1/ \
    --js_out=import_style=commonjs,binary:${OUT_DIR} \
    --grpc_out=${OUT_DIR} \
    --plugin=protoc-gen-grpc=`which grpc_tools_node_protoc_plugin` \
    ${CWD}/../hubble/api/v1/$proto_dir/*.proto

  grpc_tools_node_protoc \
    -I ${CWD}/../hubble/api/v1/ \
    --plugin="protoc-gen-ts=${CWD}/node_modules/grpc_tools_node_protoc_ts/bin/protoc-gen-ts" \
    --ts_out=${OUT_DIR} \
    ${CWD}/../hubble/api/v1/$proto_dir/*.proto
done
