#!/usr/bin/env bash
set -e

function fullpath() {
  perl -MCwd -e 'print Cwd::abs_path shift' $1
}

CWD="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

CILIUM_DIR="${CWD}/vendor/github.com/cilium/cilium"

PROTOC_GEN_TS=$(fullpath "${CWD}/../node_modules/.bin/protoc-gen-ts")
PROTOC_WEB_PLUGIN="--plugin=protoc-gen-ts=$PROTOC_GEN_TS"
PROTOC="$CWD/../node_modules/.bin/protoc"

BIN="backend"

function faded() {
  echo -e "\033[2m$1\033[0m"
}

function red() {
  echo -e "\033[31m$1\033[0m"
}

function bred() {
  echo -e "\033[1;31m$1\033[0m"
}

function green() {
  echo -e "\033[92m$1\033[0m"
}

function bgreen() {
  echo -e "\033[1;92m$1\033[0m"
}

function bold() {
  echo -e "\033[1;39m$1\033[0m"
}

function show_usage() {
  echo "Available commands:"
  echo "    ▪ $(bold build)"
  echo "    ▪ $(bold run) [server | client]"
}

function unknown_command() {
  echo "Unknown command $1."

  show_usage
}

function install_go_prerequisites() {
  go install google.golang.org/protobuf/cmd/protoc-gen-go@v1.30.0
  go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@v1.3.0
  go install github.com/mitchellh/protoc-gen-go-json@v1.1.0
}

function check_outer_dependencies() {
  if [ ! -f "$PROTOC" ]; then
    echo "You must install outer node_modules first. Exit."
    exit 1
  fi

  go mod download
}

function build_proto_inner() {
  echo "Building, protoc version: $($PROTOC --version)"

  for dir in observer flow relay; do
    mkdir -p ./proto/$dir
    cp -R $CILIUM_DIR/api/v1/$dir/*.proto $CWD/proto/$dir/
  done

  local GO_MAPPINGS="Mflow/flow.proto=github.com/cilium/cilium/api/v1/flow"
  GO_MAPPINGS+=",Mobserver/observer.proto=github.com/cilium/cilium/api/v1/observer"
  GO_MAPPINGS+=",Mrelay/relay.proto=github.com/cilium/cilium/api/v1/relay"
  GO_MAPPINGS+=",Mui/ui.proto=github.com/cilium/hubble-ui/backend/proto/ui"
  GO_MAPPINGS+=",Mui/notifications.proto=github.com/cilium/hubble-ui/backend/proto/ui"
  GO_MAPPINGS+=",Mui/status.proto=github.com/cilium/hubble-ui/backend/proto/ui"
  GO_MAPPINGS+=",Mgoogle/protobuf/timestamp.proto=google.golang.org/protobuf/types/known/timestamppb"
  GO_MAPPINGS+=",Mgoogle/protobuf/duration.proto=google.golang.org/protobuf/types/known/durationpb"
  GO_MAPPINGS+=",Mcustomprotocol/customprotocol.proto=github.com/cilium/hubble-ui/backend/proto/customprotocol"

  $PROTOC \
    --proto_path ./proto \
    --go_out=./proto \
    --go_opt=paths=source_relative,$GO_MAPPINGS \
    --go-grpc_out=./proto \
    --go-grpc_opt=paths=source_relative,$GO_MAPPINGS \
    ./proto/customprotocol/*.proto \
    ./proto/ui/*.proto

  $PROTOC $PROTOC_WEB_PLUGIN \
    --proto_path ./proto \
    --ts_out="./proto" \
    --ts_opt add_pb_suffix \
    --ts_opt eslint_disable \
    --ts_opt ts_nocheck \
    --ts_opt generate_dependencies \
    --ts_opt long_type_number \
    ./proto/customprotocol/*.proto \
    ./proto/flow/flow.proto \
    ./proto/observer/observer.proto \
    ./proto/relay/relay.proto \
    ./proto/ui/*.proto

  chmod +w -R ./proto
}

function rm_current_generated_proto() {
  for dir in ui customprotocol observer flow relay google; do
    rm -rf $CWD/proto/$dir/{,v0,v1}/*.{go,ts,js}
  done
}

function update_proto() {
  check_outer_dependencies
  install_go_prerequisites
  rm_current_generated_proto
  build_proto_inner
}

function build() {
  if ! go build -o $BIN .; then
    exit 1
  fi
}

function main_run() {
  build skip-proto-build

  local mode=${1:-"server"}
  MODE=$mode ./$BIN
}

function run() {
  local main_cmd=${1:-"help"}
  shift

  echo -n "$(faded "Running command ")"
  echo "$(bold $main_cmd)"
  echo ""

  case $main_cmd in
  build)
    build "$@"
    ;;
  run)
    main_run "$@"
    ;;
  update-proto)
    update_proto
    ;;
  *)
    unknown_command "$main_cmd"
    ;;
  esac

}

run "$@"
