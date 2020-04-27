/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path');
const fs = require('fs-extra');
const download = require('download');
const unzipper = require('unzipper');

const VERSION = '3.11.4';
const DL_PREFIX =
  'https://github.com/protocolbuffers/protobuf/releases/download';
const BIN_DIR = path.resolve(__dirname, '..', 'node_modules', '.bin');
const PLATFORM =
  process.platform === 'win32'
    ? 'windows'
    : process.platform === 'darwin'
    ? 'osx'
    : process.platform;
const FILE_NAME = `protoc-${VERSION}-${PLATFORM}-x86_64.zip`;
const FILE_PATH = path.resolve(BIN_DIR, FILE_NAME);
const DOWNLOAD_URL = `${DL_PREFIX}/v${VERSION}/${FILE_NAME}`;

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
  pluginStream.end(async () => {
    await fs.remove(path.resolve(BIN_DIR, 'protoc'));
    fs.createReadStream(FILE_PATH)
      .pipe(unzipper.Extract({ path: path.resolve(BIN_DIR, 'protoc') }))
      .promise()
      .then(() => {
        fs.chmodSync(path.resolve(BIN_DIR, 'protoc', 'bin', 'protoc'), '0755');
        fs.removeSync(FILE_PATH);
      });
  });
}

try {
  run();
} catch (error) {
  throw error;
}
