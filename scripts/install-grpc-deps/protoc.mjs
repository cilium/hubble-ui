import https from 'https';
import fs from 'fs-extra';
import path from 'path';
import decompress from 'decompress';

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
  try {
    const target = path.resolve(targetDir, 'protoc');
    await fs.remove(`/tmp/${FILE_NAME}`);
    await download(DOWNLOAD_URL, `/tmp/${FILE_NAME}`);
    await fs.remove(target);
    await fs.mkdir(target);
    await decompress(`/tmp/${FILE_NAME}`, target);
    await fs.chmod(path.resolve(targetDir, './protoc/bin/protoc'), '0755');
  } catch (error) {
    console.error(error);
  }
};

async function download(url, targetFile) {
  return await new Promise((resolve, reject) => {
    https
      .get(url, response => {
        const code = response.statusCode ?? 0;
        if (code >= 400) {
          return reject(new Error(response.statusMessage));
        }
        if (code > 300 && code < 400 && !!response.headers.location) {
          return resolve(download(response.headers.location, targetFile));
        }
        const fileWriter = fs
          .createWriteStream(targetFile)
          .on('finish', () => resolve());
        response.pipe(fileWriter);
      })
      .on('error', error => reject(error));
  });
}
