// Copyright 2019 Authors of Hubble
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
import * as crypto from "crypto";

export async function generateNewToken(
  generator: (
    bytes: number,
    callback: (err: any, buf: any) => any
  ) => any = crypto.randomBytes
): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    generator(36, (err, buf) => {
      if (err) {
        return reject(err);
      }
      resolve(buf.toString("base64"));
    });
  });
}

export async function hashToken(token: string): Promise<string> {
  const hash = crypto.createHash("sha256");
  hash.update(token);
  return hash.digest("base64");
}
