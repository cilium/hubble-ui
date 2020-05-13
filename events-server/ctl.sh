#!/usr/bin/env bash

PROTOC="./../common/node_modules/.bin/protoc/bin/protoc"
CILIUM_API="./../hubble/vendor/github.com/cilium/cilium/api/v1"
PROTOC_PLUGINS="--plugin $GOPATH/bin/protoc-gen-go"

BIN="events-server"

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

function install_prerequisites() {
    go get -u github.com/golang/protobuf/protoc-gen-go

    cd .. && npm run install:common
}

function build() {
    if ! go build -o $BIN . ; then
        return
    fi

    return "1"
}

function main_run() {
    build

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
        *)
            unknown_command $main_cmd
            ;;
    esac

}

run $@
