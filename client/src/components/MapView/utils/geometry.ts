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
export const lineIntersect = (
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  x3: number,
  y3: number,
  x4: number,
  y4: number
) => {
  const denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
  const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom;
  return {
    x: x1 + ua * (x2 - x1),
    y: y1 + ua * (y2 - y1)
  };
};

export const distBetweenPoints = (
  x1: number,
  y1: number,
  x2: number,
  y2: number
) => Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));

export const putPointOnLine = (
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  dist: number
) => {
  const rad = Math.atan2(y2 - y1, x2 - x1);
  const angle = rad * (180 / Math.PI);
  const sin = Math.sin(rad) * dist;
  const cos = Math.cos(rad) * dist;
  const x = x1 + cos;
  const y = y1 + sin;
  return { x, y, angle };
};
