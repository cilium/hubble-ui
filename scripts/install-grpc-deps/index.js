/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path');
const fs = require('fs-extra');

const installProtoc = require('./protoc');
const installPlugin = require('./grpc-web-plugin');

const BIN_DIR = path.resolve(__dirname, '../../node_modules/.bin');

const prepare = async () => {
  await fs.ensureDir(BIN_DIR);

  const packageJsonPath = path.resolve(__dirname, '../../package.json');
  return fs.readJSONSync(packageJsonPath).dependencies['grpc-web'];
};

const parseArgs = () => {
  const args = process.argv.slice(2);
  const parsed = {
    protoc: args.includes('protoc'),
    webPlugin: args.includes('web-plugin'),
  };

  return parsed;
};

const run = async () => {
  const pluginVersion = await prepare();
  const whatToInstall = parseArgs();

  if (whatToInstall.protoc) {
    console.log(`Downloading protoc...`);
    await installProtoc(BIN_DIR);
  }

  if (whatToInstall.webPlugin) {
    console.log(`Downloading GRPC Web plugin (version: ${pluginVersion}) ...`);
    await installPlugin(BIN_DIR, pluginVersion);
  }

  console.log('Done.');
};

run();
