/* eslint-disable @typescript-eslint/no-var-requires */
const { Readable } = require('stream');

const fs = require('fs-extra');
const path = require('path');
const unzipper = require('unzipper');
const download = require('download');

const VERSION = '3.11.4';

const DL_PREFIX =
  'https://github.com/protocolbuffers/protobuf/releases/download';

const PLATFORM =
  {
    win32: 'windows',
    darwin: 'osx',
  }[process.platform] || process.platform;

const FILE_NAME = `protoc-${VERSION}-${PLATFORM}-x86_64.zip`;
const DOWNLOAD_URL = `${DL_PREFIX}/v${VERSION}/${FILE_NAME}`;

const run = async targetDir => {
  const buffer = await download(DOWNLOAD_URL).catch(err => {
    console.error(err.message);
    process.exit(1);
  });

  const protocTarget = path.resolve(targetDir, 'protoc');
  await fs.remove(protocTarget).catch(err => {});

  const r = new Readable();
  r._read = () => {};
  r.push(buffer);
  r.push(null);

  const unzip = unzipper.Extract({ path: protocTarget });
  await r.pipe(unzip).promise();

  fs.chmodSync(path.resolve(targetDir, './protoc/bin/protoc'), '0755');
};

module.exports = run;
