import { Readable } from 'stream';

import fs from 'fs-extra';
import path from 'path';
import unzipper from 'unzipper';
import fetch from 'node-fetch';

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

export default async targetDir => {
  const buffer = await fetch(DOWNLOAD_URL)
    .then(r => r.buffer())
    .catch(err => {
      console.error(err.message);
      process.exit(1);
    });

  const protocTarget = path.resolve(targetDir, 'protoc');
  await fs.remove(protocTarget).catch(err => {
    console.error(err);
  });

  const r = new Readable();
  r._read = () => void 0;
  r.push(buffer);
  r.push(null);

  const unzip = unzipper.Extract({ path: protocTarget });
  await r.pipe(unzip).promise();

  fs.chmodSync(path.resolve(targetDir, './protoc/bin/protoc'), '0755');
};
