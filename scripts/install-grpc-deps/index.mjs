import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs-extra';

import installProtoc from './protoc.mjs';
import installPlugin from './grpc-web-plugin.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
  process.exit(0);
};

run();
