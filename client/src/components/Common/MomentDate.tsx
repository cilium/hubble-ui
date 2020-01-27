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
import * as React from "react";
import { Button } from "@blueprintjs/core";
import * as moment from "moment";

const FORMAT = "LLL";
const FORMAT_TIME = "LLL";

export const MomentDate: React.SFC<{
  date: Date;
  format?: string;
  withTime?: boolean;
}> = ({ date, withTime = false, format = withTime ? FORMAT_TIME : FORMAT }) => (
  <Button
    small
    text={moment(date).format(format)}
    rightIcon="double-caret-vertical"
  />
);
