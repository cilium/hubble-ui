#!/usr/bin/env bash

NODE_MODULES="./node_modules"

function installation_check() {
	if [ ! -d "$NODE_MODULES" ]; then
		echo "You must run npm install first. Exit."
		exit 1
	fi

	mkdir -p "$NODE_MODULES/.bin"
}

function install_protoc() {
	if [ ! -d "$NODE_MODULES/.bin/protoc" ]; then
		node ./scripts/install-grpc-deps protoc
	fi
}

function install_grpc_web_plugin() {
	if [ ! -f "$NODE_MODULES/.bin/protoc-gen-grpc-web" ]; then
		node ./scripts/install-grpc-deps web-plugin
	fi
}

function install_prerequisites() {
	installation_check

	install_protoc
	install_grpc_web_plugin
}

function regular_run() {
	install_prerequisites
	(
		cd ./backend && bash ./ctl.sh build
	)
	bash ./scripts/generate-proto.sh
}

function run() {
	local cmd=${1:-"all"}
	shift

	case $cmd in
		all)
			regular_run
			;;
		prerequisites)
			installation_check
			install_grpc_web_plugin
			;;
	esac
}

run $@
