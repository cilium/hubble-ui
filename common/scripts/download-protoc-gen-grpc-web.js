/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path');
const fs = require('fs-extra');
const download = require('download');

const VERSION = fs.readJSONSync(path.resolve(__dirname, '..', 'package.json'))
  .dependencies['grpc-web'];
const DL_PREFIX = 'https://github.com/grpc/grpc-web/releases/download';
const BIN_DIR = path.resolve(__dirname, '..', 'node_modules', '.bin');
const EXT = process.platform === 'win32' ? '.exe' : '';
const PLATFORM = process.platform === 'win32' ? 'windows' : process.platform;
const DOWNLOAD_URL = `${DL_PREFIX}/${VERSION}/protoc-gen-grpc-web-${VERSION}-${PLATFORM}-x86_64${EXT}`;
const FILE_PATH = path.resolve(BIN_DIR, 'protoc-gen-grpc-web' + EXT);

async function run() {
  if (process.arch !== 'x64') {
    throw new Error(
      `Unsupported arch: only support x86_64, but you're using ${process.arch}`,
    );
  }
  await fs.ensureDir(BIN_DIR);
  console.log('Downloading', DOWNLOAD_URL);
  const buffer = await download(DOWNLOAD_URL).catch(err => {
    console.error(err.message);
    process.exit(1);
  });
  const pluginStream = fs.createWriteStream(FILE_PATH);
  pluginStream.write(buffer);
  pluginStream.end(() => {
    fs.chmodSync(FILE_PATH, '0755');
  });
}

try {
  run();
} catch (error) {
  throw error;
}
