/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path');
const fs = require('fs-extra');

const installProtoc = require('./protoc');
const installPlugin = require('./grpc-web-plugin');

const BIN_DIR = path.resolve(__dirname, '../../node_modules/.bin');

const prepare = async () => {
  if (process.arch !== 'x64') {
    throw new Error(
      `Unsupported arch: only support x86_64, but you're using ${process.arch}`,
    );
  }

  await fs.ensureDir(BIN_DIR);

  const packageJsonPath = path.resolve(__dirname, '../../package.json');
  return fs.readJSONSync(packageJsonPath).dependencies['grpc-web'];
};

const run = async () => {
  const pluginVersion = await prepare();

  console.log(`Downloading protoc...`);
  await installProtoc(BIN_DIR);

  console.log(`Downloading GRPC Web plugin (version: ${pluginVersion}) ...`);
  await installPlugin(BIN_DIR, pluginVersion);

  console.log('Done.');
};

run();
