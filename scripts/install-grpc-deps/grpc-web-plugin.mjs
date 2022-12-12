import fs from 'fs-extra';
import path from 'path';
import fetch from 'node-fetch';

const DL_PREFIX = 'https://github.com/grpc/grpc-web/releases/download';
const EXT = process.platform === 'win32' ? '.exe' : '';
const PLATFORM = process.platform === 'win32' ? 'windows' : process.platform;

const getUrl = v => {
  return `${DL_PREFIX}/${v}/protoc-gen-grpc-web-${v}-${PLATFORM}-x86_64${EXT}`;
};

export default async (targetDir, version) => {
  const downloadUrl = getUrl(version);
  const filePath = path.resolve(targetDir, 'protoc-gen-grpc-web' + EXT);

  const buffer = await fetch(downloadUrl)
    .then(r => r.buffer())
    .catch(err => {
      console.error(err.message);
      process.exit(1);
    });

  const p = new Promise((resolve, reject) => {
    const pluginStream = fs.createWriteStream(filePath);
    pluginStream.end(buffer);

    pluginStream.on('close', resolve);
    pluginStream.on('error', reject);
  });

  await p;
  fs.chmodSync(filePath, '0755');
};
