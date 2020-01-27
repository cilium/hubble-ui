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
export enum COLUMN_SYMBOL {
  SRC_POD_NAME = "SRC_POD_NAME",
  SRC_ENDPOINT = "SRC_ENDPOINT",
  DST_POD_NAME = "DST_POD_NAME",
  DST_ENDPOINT = "DST_ENDPOINT",
  DST_IP = "DST_IP",
  DST_PROTOCOL = "DST_PROTOCOL",
  DST_FUNCTION = "DST_FUNCTION",
  FORWARDING_STATUS = "FORWARDING_STATUS",
  LAST_SEEN = "LAST_SEEN"
}

export enum COLUMN_TITLE {
  SRC_POD_NAME = "Source Pod Name",
  SRC_ENDPOINT = "Source Service",
  DST_POD_NAME = "Destination Pod Name",
  DST_ENDPOINT = "Destination Service",
  DST_IP = "Destination IP",
  DST_PROTOCOL = "Destination Port",
  DST_FUNCTION = "Destination L7 Info",
  FORWARDING_STATUS = "Status",
  LAST_SEEN = "Last Seen"
}
