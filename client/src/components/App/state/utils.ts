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
export const downloadFile = (
  filename: string,
  data: any,
  filetype: string = "json"
) => {
  let filedata = data;

  if (filetype === "json") {
    filedata = JSON.stringify(data, null, "  ");
  }

  const blob = new Blob([filedata], { type: `text/${filetype}` });
  const e = document.createEvent("MouseEvents");
  const a = document.createElement("a");

  a.download = `${filename}.${filetype}`;
  a.href = window.URL.createObjectURL(blob);
  a.dataset.downloadurl = [`text/${filetype}`, a.download, a.href].join(":");
  e.initMouseEvent(
    "click",
    true,
    false,
    window,
    0,
    0,
    0,
    0,
    0,
    false,
    false,
    false,
    false,
    0,
    null
  );
  a.dispatchEvent(e);
};
