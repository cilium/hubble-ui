#!/bin/bash

CWD="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ROOT="${CWD}/.."

${ROOT}/node_modules/.bin/node-sass-chokidar ${ROOT}/src/blueprint.scss -o ${ROOT}/src --importer=${ROOT}/node_modules/node-sass-package-importer/dist/cli.js --functions=${CWD}/sass-inline-svg.js