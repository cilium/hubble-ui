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
import { Label } from "../graphqlTypes";
import { findNamespaceFromLabels, findReservedEntityString } from "./finders";

export function isReservedWorldLabels(labels: Label[]): boolean {
  return findReservedEntityString(labels) === "world";
}

export function isReservedClusterLabels(labels: Label[]): boolean {
  return findReservedEntityString(labels) === "cluster";
}

export function isReservedUnknownLabels(labels: Label[]): boolean {
  return findReservedEntityString(labels) === "unknown";
}

export function isReservedInitLabels(labels: Label[]): boolean {
  return findReservedEntityString(labels) === "init";
}

export function isReservedUnmanagedLabels(labels: Label[]): boolean {
  return findReservedEntityString(labels) === "unmanaged";
}

export function isReservedLabels(labels: Label[]): boolean {
  return findReservedEntityString(labels) !== "";
}

export function isLabelListInNamespaces(
  labels: Label[],
  namespaces: string[]
): boolean {
  const namespaceLabel = findNamespaceFromLabels(labels);
  return namespaceLabel
    ? namespaces.indexOf(namespaceLabel) >= 0 || false
    : false;
}
