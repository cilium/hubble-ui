#!/usr/bin/env bash
set -e

CWD="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

CILIUM_DIR="${CWD}/vendor/github.com/cilium/cilium"

PROTOC_GEN_GO_PLUGIN="--plugin ${CWD}/vendor/google.golang.org/protobuf/cmd/protoc-gen-go/protoc-gen-go"
PROTOC_GEN_GO_GRPC_PLUGIN="--plugin ${CWD}/vendor/google.golang.org/grpc/cmd/protoc-gen-go-grpc/protoc-gen-go-grpc"
PROTOC_GEN_GRPC_WEB_PATH="${CWD}/../node_modules/.bin/protoc-gen-grpc-web"
PROTOC_WEB_PLUGIN="--plugin $PROTOC_GEN_GRPC_WEB_PATH"
PROTOC="$CWD/../node_modules/.bin/protoc/bin/protoc"

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

function build_protoc_gen_go() {
    (cd ./vendor/google.golang.org/grpc/cmd/protoc-gen-go-grpc && go build)
    (cd ./vendor/google.golang.org/protobuf/cmd/protoc-gen-go && go build)
}

function check_outer_dependencies() {
    if [ ! -f $PROTOC ]; then
        echo "You must install outer node_modules first. Exit."
        exit 1
    fi

    go mod download
}

function build_proto_inner() {
    mkdir -p proto
    rm -rf ./proto/{observer,flow,relay}

    cp -R $CILIUM_DIR/api/v1/{observer,flow,relay} ./proto
    chmod +w -R ./proto
    rm -rf ./proto/{observer,flow,relay,ui}/*.go

    local GO_MAPPINGS="Mflow/flow.proto=github.com/cilium/cilium/api/v1/flow"
    GO_MAPPINGS+=",Mobserver/observer.proto=github.com/cilium/cilium/api/v1/observer"
    GO_MAPPINGS+=",Mrelay/relay.proto=github.com/cilium/cilium/api/v1/relay"
    GO_MAPPINGS+=",Mui/ui.proto=github.com/cilium/hubble-ui/backend/proto/ui"
    GO_MAPPINGS+=",Mui/notifications.proto=github.com/cilium/hubble-ui/backend/proto/ui"
    GO_MAPPINGS+=",Mui/status.proto=github.com/cilium/hubble-ui/backend/proto/ui"
    GO_MAPPINGS+=",Mgoogle/protobuf/timestamp.proto=github.com/golang/protobuf/ptypes/timestamp"

    $PROTOC $PROTOC_GEN_GO_PLUGIN $PROTOC_GEN_GO_GRPC_PLUGIN \
        --proto_path ./proto \
        --go_out=./proto \
        --go_opt=paths=source_relative,$GO_MAPPINGS \
        --go-grpc_out=./proto \
        --go-grpc_opt=paths=source_relative,$GO_MAPPINGS \
        ./proto/ui/notifications.proto \
        ./proto/ui/status.proto \
        ./proto/ui/ui.proto

    $PROTOC $PROTOC_WEB_PLUGIN \
        -I ./proto \
        --js_out="import_style=commonjs,binary:./proto" \
        --grpc-web_out="import_style=commonjs+dts,mode=grpcwebtext:./proto" \
        ./proto/flow/flow.proto \
        ./proto/observer/observer.proto \
        ./proto/relay/relay.proto \
        ./proto/ui/notifications.proto \
        ./proto/ui/status.proto \
        ./proto/ui/ui.proto

    chmod +w -R ./proto
}

function update_proto() {
    check_outer_dependencies
    build_protoc_gen_go

    build_proto_inner
}

function build() {
    if ! go build -o $BIN . ; then
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
            build $@
            ;;
        run)
            main_run $@
            ;;
        update-proto)
            update_proto
            ;;
        *)
            unknown_command $main_cmd
            ;;
    esac

}

run $@
