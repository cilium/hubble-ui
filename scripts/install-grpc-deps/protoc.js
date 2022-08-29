/* eslint-disable @typescript-eslint/no-var-requires */
const { Readable } = require('stream');

const fs = require('fs-extra');
const path = require('path');
const unzipper = require('unzipper');
const fetch = require('node-fetch');

const VERSION = '3.11.4';

const DL_PREFIX =
  'https://github.com/protocolbuffers/protobuf/releases/download';

const PLATFORM =
  {
    win32: 'windows',
    darwin: 'osx',
  }[process.platform] || process.platform;

const ARCH = {
  arm64: 'aarch_64',
  arm: 'aarch_64',
  x64: 'x86_64',
}[process.arch];

if (!ARCH) {
  throw new Error(
    `Unsupported arch: only support x86_64 and arm64, but you're using ${process.arch}`,
  );
}

const FILE_NAME = `protoc-${VERSION}-${PLATFORM}-${ARCH}.zip`;
const DOWNLOAD_URL = `${DL_PREFIX}/v${VERSION}/${FILE_NAME}`;

const run = async targetDir => {
  const buffer = await fetch(DOWNLOAD_URL)
    .then(r => r.buffer())
    .catch(err => {
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
