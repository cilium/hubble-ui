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
import { Label } from "../../../graphqlTypes";
import { findNamespaceFromLabels } from "../../../shared/finders";
import {
  findLabelByKey,
  findReservedLabel,
  normalizeLabelName
} from "../../App/utils";

const NAMESPACE_KEY = "k8s:io.kubernetes.pod.namespace";
const reservedKeys = [
  NAMESPACE_KEY,
  "k8s:io.cilium.k8s.policy.cluster",
  "k8s:io.cilium.k8s.policy.serviceaccount"
];

export function getFlowServicetTitle(
  labels: Label[],
  ipAddress: string | null | undefined,
  dnsName: string | null | undefined,
  groupByNamespace: boolean
): string {
  if (groupByNamespace) {
    const namespace = labels.find(({ key }) => key === NAMESPACE_KEY);
    if (namespace) {
      return `namespace=${namespace.value}`;
    }
  }

  const reservedLabel = findReservedLabel(labels);
  if (reservedLabel) {
    return buildTitle(reservedLabel);
  }

  const nameLabel =
    findLabelByKey(labels, "k8s:app") ||
    findLabelByKey(labels, "k8s:name") ||
    findLabelByKey(labels, "k8s:functionName") ||
    findLabelByKey(labels, "k8s:k8s-app");
  if (nameLabel) {
    return buildTitle(nameLabel);
  }

  const includesNameLabel = labels.find(
    ({ key }) => key !== NAMESPACE_KEY && key.includes("name")
  );
  if (includesNameLabel) {
    return buildTitle(includesNameLabel);
  }

  const dnsOrIpAddress = dnsName || ipAddress;
  if (dnsOrIpAddress) {
    return dnsOrIpAddress;
  }

  const firstLabel = labels.find(({ key }) => !reservedKeys.includes(key));
  if (firstLabel) {
    return buildTitle(firstLabel);
  }

  return "untitled";
}

export function getFlowServiceSubtitle(
  labels: Label[],
  groupByNamespace: boolean
): string | null {
  if (groupByNamespace) {
    return null;
  }
  const namespace = findNamespaceFromLabels(labels);
  if (namespace) {
    return namespace;
  }
  const reserved = labels.find(({ key }) => key.startsWith("reserved:"));
  if (reserved) {
    return buildTitle(reserved);
  }
  return null;
}

const buildTitle = (label: Label) => {
  let title = normalizeLabelName(label.key);
  if (label.value) {
    title = `${title}=${label.value}`;
  }
  return title;
};
