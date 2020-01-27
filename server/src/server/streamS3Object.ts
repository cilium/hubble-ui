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
export function streamS3Object(s3, params, res, next, headers) {
  const stream = s3.getObject(params).createReadStream();
  Object.entries(headers).forEach(entry => {
    res.setHeader(entry[0], entry[1]);
  });
  stream
    .on("error", err => {
      if (res.headersSent) {
        return next(err);
      }
      res.status(404).send("");
    })
    .pipe(res);
}
