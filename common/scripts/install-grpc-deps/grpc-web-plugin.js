/* eslint-disable @typescript-eslint/no-var-requires */
const { Readable } = require('stream');

const fs = require('fs-extra');
const path = require('path');
const unzipper = require('unzipper');
const download = require('download');

const DL_PREFIX = 'https://github.com/grpc/grpc-web/releases/download';
const EXT = process.platform === 'win32' ? '.exe' : '';
const PLATFORM = process.platform === 'win32' ? 'windows' : process.platform;

const getUrl = v => {
  return `${DL_PREFIX}/${v}/protoc-gen-grpc-web-${v}-${PLATFORM}-x86_64${EXT}`;
};

const run = async (targetDir, version) => {
  const downloadUrl = getUrl(version);
  const filePath = path.resolve(targetDir, 'protoc-gen-grpc-web' + EXT);

  const buffer = await download(downloadUrl).catch(err => {
    console.error(err.message);
    process.exit(1);
  });


  const p = new Promise((resolve, reject) => {
    const pluginStream = fs.createWriteStream(filePath);
    pluginStream.write(buffer);

    pluginStream.on('end', resolve);
    pluginStream.on('error', reject);
  });

  await p;
  fs.chmodSync(filePath, '0755');
}

module.exports = run;
