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
import * as hash from "object-hash";
import * as React from "react";
import {
  AppEndpoint,
  AppEndpointType,
  FlowDnsResponse,
  FlowHttpResponse,
  Label,
  Protocol
} from "../../graphqlTypes";
import { Node } from "../MapView/state/types";
import { AppEndpointIconType } from "./state/types";

const css = require("./state/endpointutils.scss");

export type Option = {
  readonly label?: string;
  readonly value?: string | number | boolean;
  readonly originalKey: string;
  readonly originalValue: string;
};

export type KV = {
  readonly key: string;
  readonly value: string;
};

export const PREFIXES = ["k8s:", "io.kubernetes.pod.", "covalent.io/"];
export const LABELS_SEPARATOR = ",";
export const LABELS_KV_SEPARATOR = ":";

export const normalizeLabelName = (name: string) =>
  PREFIXES.reduce((acc, val) => acc.replace(val, ""), name.toLowerCase());

export const getPrefix = (label: string) =>
  PREFIXES.find(prefix => label.startsWith(prefix));

export const hasPrefix = (label: string) =>
  PREFIXES.some(prefix => label.startsWith(prefix));

export const optionsToUrl = (options: Option[]) =>
  options
    .map(({ originalKey, originalValue }) => `${originalKey}:${originalValue}`)
    .join(LABELS_SEPARATOR);

export const urlToKV = (url: string): KV[] =>
  url
    .split(LABELS_SEPARATOR)
    .filter(part => part.length > 0)
    .map(part => {
      const prefix = getPrefix(part);
      if (prefix) {
        const unprefixed = part.substring(prefix.length);
        const [key, value] = unprefixed.split(LABELS_KV_SEPARATOR);
        return {
          key: `${prefix}${key}`,
          value
        };
      } else {
        const [key, value] = part.split(LABELS_KV_SEPARATOR);
        return {
          key,
          value
        };
      }
    });

export const urlToOptions = (url: string): Option[] =>
  urlToKV(url).map(kvToOption);

export const kvToOption = ({ key, value }: KV): Option => {
  const label = normalizeLabelName(`${key}${LABELS_KV_SEPARATOR}${value}`);
  return {
    label,
    value: label,
    originalKey: key,
    originalValue: value
  };
};

const NAMESPACE_LABEL = ["namespace"];

const RESERVED_LABELS_KEYS = ["app", "namespace", "name", "cluster"];

export function findLabelByKey(labels: Label[], findKey: string): Label | null {
  const label = labels.find(({ key }) => key === findKey);
  return label ? label : null;
}

export function findReservedLabel(labels: Label[]): Label | null {
  const label = labels.find(({ key }) => key.startsWith("k8s:reserved:"));
  return label ? label : null;
}

export function isReservedWorld(labels: Label[]): boolean {
  return Boolean(labels.find(({ key }) => key === "k8s:reserved:world"));
}

export function isReservedHost(labels: Label[]): boolean {
  return Boolean(labels.find(({ key }) => key === "k8s:reserved:host"));
}

export function findLabelNameByNormalizedKey(
  labels: Label[],
  key: string
): string | null {
  const label = labels.filter(l => normalizeLabelName(l.key) === key)[0];
  return label ? label.value : null;
}

export function getEndpointNameFromReservedLabel(
  labels: Label[]
): string | null {
  const label = labels.filter(l =>
    normalizeLabelName(l.key).startsWith("reserved:")
  )[0];
  return label ? label.key.replace("reserved:", "") : null;
}

export function getEndpointNameFromLabels(labels: Label[]): string {
  return (
    getEndpointNameFromReservedLabel(labels) ||
    findLabelNameByNormalizedKey(labels, "app") ||
    findLabelNameByNormalizedKey(labels, "name") ||
    findLabelNameByNormalizedKey(labels, "functionName") ||
    findLabelNameByNormalizedKey(labels, "k8s-app") ||
    "No app label"
  );
}

export function getEndpointNamespace(endpoint: AppEndpoint): string {
  let namespace = getEndpointNamespaceFromLabels(endpoint.labels);
  if (isWorldEndpoint(endpoint)) {
    namespace = endpoint.labels
      .map(({ key, value }) => `${key}:${value}`)
      .join(" ");
  } else {
    if (isCIDREndpoint(endpoint)) {
      namespace = endpoint.v4Cidrs
        ? endpoint.v4Cidrs.join(", ")
        : endpoint.v6Cidrs
        ? endpoint.v6Cidrs!.join(", ")
        : "no namespace";
    }
  }
  return namespace;
}

export function getEndpointNamespaceFromLabels(labels: Label[]): string {
  return findLabelNameByNormalizedKey(labels, "namespace") || "No namespace";
}

export function getEndpointVersionFromLabels(labels: Label[]): string | null {
  return findLabelNameByNormalizedKey(labels, "version") || null;
}

export function getExtraLabels(labels: Label[]): Label[] {
  return labels.filter(
    l => RESERVED_LABELS_KEYS.indexOf(normalizeLabelName(l.key)) === -1
  );
}

export function withoutNamespaceLabel(labels: Label[]): Label[] {
  return labels.filter(
    l => NAMESPACE_LABEL.indexOf(normalizeLabelName(l.key)) === -1
  );
}

export const extractApplicationProtocol = (protocols: Protocol[]) => {
  if (protocols.length === 0) {
    return null;
  }
  const someNonHttpProtocol = protocols.find(protocol => {
    if (!protocol.applicationProtocol) {
      return false;
    }
    return protocol.applicationProtocol.toLowerCase() !== "http";
  });
  if (someNonHttpProtocol && someNonHttpProtocol.applicationProtocol) {
    return someNonHttpProtocol.applicationProtocol.toLowerCase();
  }
  const firstProtocol = protocols[0];
  if (firstProtocol && firstProtocol.applicationProtocol) {
    return firstProtocol.applicationProtocol.toLowerCase();
  }
  return null;
};

export const extractEndpointLogoInfo = (endpoint: AppEndpoint) => {
  if (endpoint.icon) {
    const [type, id] = endpoint.icon.split("/");
    return {
      id,
      type: type as AppEndpointIconType
    };
  } else {
    const appLabel = endpoint.labels.filter(
      label => label.key === "k8s:app"
    )[0];
    if (appLabel) {
      if (
        appLabel.value === "covalent-exporter" ||
        appLabel.value === "covalent-agent"
      ) {
        return {
          id: "covalent",
          type: AppEndpointIconType.PROTOCOL
        };
      }
    } else if (isWorldEndpoint(endpoint)) {
      return {
        id: "world",
        type: AppEndpointIconType.PROTOCOL
      };
    } else if (isHostEndpoint(endpoint)) {
      return {
        id: "host",
        type: AppEndpointIconType.PROTOCOL
      };
    } else if (isCIDREndpoint(endpoint)) {
      if (endpoint.name.toLowerCase().includes("aws")) {
        return {
          id: "aws",
          type: AppEndpointIconType.PROTOCOL
        };
      }
    } else if (isDNSEndpoint(endpoint)) {
      return {
        id: "globe_with_meridians",
        type: AppEndpointIconType.EMOJI
      };
    }
    const applicationProtocol = extractApplicationProtocol(endpoint.protocols);
    return {
      id: applicationProtocol ? applicationProtocol : "kubernetes",
      type: AppEndpointIconType.PROTOCOL
    };
  }
};

export const addFlowsFilterLabelKeyPrefixes = (str: string): string => {
  let result = str;

  if (
    !str.includes("ip") &&
    !str.includes("dns") &&
    !str.includes("security-id") &&
    !str.includes("reserved")
  ) {
    result = `k8s:${result}`;
  }

  if (str.includes("namespace")) {
    result = result.replace(/namespace/i, `${PREFIXES[1]}namespace`);
  }

  return result;
};

export const processFunctionName = (
  functionName?: string | null,
  applicationProtocol?: string | null,
  dnsResponse?: FlowDnsResponse | null | undefined,
  httpResponse?: FlowHttpResponse | null | undefined
) => {
  if (!functionName && !dnsResponse && !httpResponse) {
    return "";
  }
  let processedFunctionName: string | JSX.Element = functionName || "";
  const loweredApplicationProtocol = (
    applicationProtocol || ""
  ).toLocaleLowerCase();
  switch (loweredApplicationProtocol) {
    case "http":
    case "couchdb":
      if (loweredApplicationProtocol === "http" && httpResponse) {
        processedFunctionName = processHttpResponse(httpResponse);
      } else {
        processedFunctionName = processHttpFunctionName2(processedFunctionName);
      }
      break;
    case "kafka":
      processedFunctionName = processKafkaFunctionName(processedFunctionName);
      break;
    case "elasticsearch":
      processedFunctionName = processElasticsearchFunctionName(
        processedFunctionName
      );
      break;
    case "grpc":
      processedFunctionName = processGRPCFunctionName(processedFunctionName);
      break;
    case "dns":
      if (dnsResponse) {
        processedFunctionName = processDnsResponse(dnsResponse);
      }
      break;
    default:
      break;
  }
  return processedFunctionName;
};

export const isWorldOrHostNode = (node: Node) => {
  return isWorldOrHostEndpoint(node.endpoint);
};
export const isWorldOrHostEndpoint = (endpoint: AppEndpoint) => {
  return isWorldEndpoint(endpoint) || isHostEndpoint(endpoint);
};

export const isWorldEndpoint = (endpoint: AppEndpoint) => {
  return endpoint.labels.some(l => l.key === "reserved:world");
};
export const isHostEndpoint = (endpoint: AppEndpoint) => {
  return endpoint.labels.some(l => l.key === "reserved:host");
};
export const isInitEndpoint = (endpoint: AppEndpoint) => {
  return endpoint.labels.some(l => l.key === "reserved:init");
};

export const isClusterNode = (node: Node) => isClusterEndpoint(node.endpoint);
export const isClusterEndpoint = (endpoint: AppEndpoint) =>
  endpoint.labels.some(l => l.key === "reserved:cluster");

export const isCIDRNode = (node: Node) => isCIDREndpoint(node.endpoint);
export const isCIDREndpoint = (endpoint: AppEndpoint) =>
  Boolean(endpoint.v4Cidrs && endpoint.v4Cidrs.length) ||
  Boolean(endpoint.v6Cidrs && endpoint.v6Cidrs.length);

export const isDNSNode = (node: Node) => isDNSEndpoint(node.endpoint);
export const isDNSEndpoint = (endpoint: AppEndpoint) =>
  Boolean(endpoint.type && endpoint.type === AppEndpointType.DNS);

export const isFQDNSNode = (node: Node) => isFQDNSEndpoint(node.endpoint);
export const isFQDNSEndpoint = (endpoint: AppEndpoint) =>
  Boolean(endpoint.dnsName);

export const isIngressNode = (node: Node) => {
  return isIngressEndpoint(node.endpoint);
};
export const isIngressEndpoint = (endpoint: AppEndpoint) => {
  return endpoint.labels.some(
    ({ key }) => key === "reserved:host" || key === "reserved:world"
  );
};

export const isEgressNode = (node: Node) => {
  return isEgressEndpoint(node.endpoint);
};
export const isEgressEndpoint = (endpoint: AppEndpoint) => {
  return Boolean(
    endpoint &&
      (endpoint.dnsName ||
        (endpoint.v4Cidrs && endpoint.v4Cidrs.length) ||
        (endpoint.v6Cidrs && endpoint.v6Cidrs.length))
  );
};

export const isOutsideManagedNode = (node: Node) => {
  return isOutsideManagedEndpoint(node.endpoint);
};
export const isOutsideManagedEndpoint = (endpoint: AppEndpoint) => {
  return Boolean(
    endpoint.type && endpoint.type === AppEndpointType.OUTSIDE_MANAGED
  );
};

export const isSourceReservedWorldNode = (node: Node) => {
  return isSourceReservedWorldEndpoint(node.endpoint);
};
export const isSourceReservedWorldEndpoint = (endpoint: AppEndpoint) => {
  return Boolean(
    endpoint.type && endpoint.type === AppEndpointType.SOURCE_RESERVED_WORLD
  );
};

export const isCIDRAllowAllNode = (node: Node) => {
  return isCIDRAllowAllEndpoint(node.endpoint);
};
export const isCIDRAllowAllEndpoint = (endpoint: AppEndpoint) => {
  return Boolean(
    endpoint.type && endpoint.type === AppEndpointType.CIDR_ALLOW_ALL
  );
};

export const isTopNode = (node: Node) => isTopEnpoint(node.endpoint);
export const isTopEnpoint = (endpoint: AppEndpoint) => {
  return (
    isCIDREndpoint(endpoint) ||
    isCIDRAllowAllEndpoint(endpoint) ||
    isDNSEndpoint(endpoint) ||
    isFQDNSEndpoint(endpoint)
  );
};

export const isLeftNode = (node: Node) => {
  return isLeftEndpoint(node.endpoint);
};
export const isLeftEndpoint = (endpoint: AppEndpoint) => {
  return (
    isWorldOrHostEndpoint(endpoint) || isSourceReservedWorldEndpoint(endpoint)
  );
};

export const isBottomNode = (node: Node) => {
  return isBottomEndpoint(node.endpoint);
};
export const isBottomEndpoint = (endpoint: AppEndpoint) => {
  return (
    (isOutsideManagedEndpoint(endpoint) && !isWorldOrHostEndpoint(endpoint)) ||
    isClusterEndpoint(endpoint)
  );
};

export const isInAppEndpoint = (endpoint: AppEndpoint) => {
  return (
    !isBottomEndpoint(endpoint) &&
    !isLeftEndpoint(endpoint) &&
    !isTopEnpoint(endpoint)
  );
};

const cleanRegexp = (str: string) => {
  return str
    .replace(/^\^/g, "")
    .replace(/\$$/g, "")
    .replace(/^((GET)|(PUT)|(DELETE)|(POST))\$ \^\//g, "$1 /");
};

const replaceMap = [
  [
    "[[:xdigit:]]{8}-[[:xdigit:]]{4}-[[:xdigit:]]{4}-[[:xdigit:]]{4}-[[:xdigit:]]{12}",
    "uuid"
  ],
  [
    ".*\\.(:?html|js|js\\.map|css\\.map|jpg|jpeg|gif|png|ico|css|woff)",
    "static"
  ],
  ["[[:word:]]", "id"]
];

export const splitLabelToKeyValue = (label: string) => {
  const splited = label.trim().split(":");
  const key = splited.slice(0, splited.length - 1);
  const value = splited[splited.length - 1];
  return {
    key: key.join(":").trim(),
    value: typeof value === "string" ? value.trim() : ""
  };
};

export const processHttpFunctionName2 = (name: string) => {
  const processedParts: JSX.Element[] = [];
  let [method, path] = name.split(" ");
  if (!path) {
    path = method;
    method = "";
  } else if (path.startsWith("|")) {
    return name;
  } else {
    method = cleanRegexp(method);
  }
  const splited = path.split("/");
  splited.forEach((part, index) => {
    let processedPart = cleanRegexp(part.trim());
    let was = false;
    replaceMap.forEach(([from, to], index2) => {
      if (processedPart.indexOf(from) >= 0) {
        was = true;
        processedPart = processedPart.replace(from, to);
        processedParts.push(
          <span
            key={`${from}:${index}:${index2}`}
            className={css.symbolPart}
            title={`Regexp: ${from}`}
          >
            {to}
          </span>
        );
      }
    });
    if (!was) {
      processedParts.push(
        <span key={`${processedPart}:${index}`}>{processedPart}</span>
      );
    }
    if (index < splited.length - 1) {
      processedParts.push(<span key={`/:${index}`}>/</span>);
    }
  });
  return (
    <span>
      {method ? `${method} ` : ""}
      {processedParts}
    </span>
  );
};

export const processHttpFunctionName = (name: string) => {
  const splited = name.split(" ");
  // const [method, path] = name.split(" ");
  const parts = cleanRegexp(name).split("/");
  const processedParts: JSX.Element[] = [];
  parts.forEach((part: string, index: Number) => {
    if (
      part ===
      "[[:xdigit:]]{8}-[[:xdigit:]]{4}-[[:xdigit:]]{4}-[[:xdigit:]]{4}-[[:xdigit:]]{12}"
    ) {
      processedParts.push(
        <span
          key={`${part}:${index}`}
          className={css.symbolPart}
          title="Regexp: [[:xdigit:]]{8}-[[:xdigit:]]{4}-[[:xdigit:]]{4}-[[:xdigit:]]{4}-[[:xdigit:]]{12}"
        >
          :uuid
        </span>
      );
      index !== parts.length - 1 &&
        processedParts.push(<span key={`/:${index}`}>/</span>);
    } else if (
      part ===
      ".*\\.(:?html|js|js\\.map|css\\.map|jpg|jpeg|gif|png|ico|css|woff)"
    ) {
      processedParts.push(
        <span
          key={`${part}:${index}`}
          className={css.symbolPart}
          title="Regexp: .*\\.(:?html|js|js\\.map|css\\.map|jpg|jpeg|gif|png|ico|css|woff)"
        >
          static files
        </span>
      );
      index !== parts.length - 1 &&
        processedParts.push(<span key={`/:${index}`}>/</span>);
    } else if (part.indexOf("[[:word:]]") !== -1) {
      const wordParts = part.split("[[:word:]]");
      wordParts.shift(); // remove space
      if (wordParts.length === 0) {
        processedParts.push(
          <span
            key={`word:${index}`}
            title="Regexp: [[:word:]]"
            className={css.symbolPart}
          >
            word
          </span>
        );
      }
      wordParts.forEach((wp, index2) => {
        processedParts.push(
          <span
            key={`word:${index}:${index2}`}
            className={css.symbolPart}
            title=""
          >
            word
          </span>
        );
        processedParts.push(<span key={`${wp}:${index}`}>{wp}</span>);
      });
      index !== parts.length - 1 &&
        processedParts.push(<span key={`/:${index}`}>/</span>);
    } else {
      processedParts.push(<span key={`${part}:${index}`}>{part}</span>);
      index !== parts.length - 1 &&
        processedParts.push(<span key={`/:${index}`}>/</span>);
    }
  });
  return (
    <span>
      {/* {[cleanRegexp(method), " ", ...processedParts]} */}
      {processedParts}
    </span>
  );
};

export const processKafkaFunctionName = (name: string) => {
  const [a, b, c] = name.split(" ");
  return (
    <span>
      {a.toUpperCase()} {c}
    </span>
  );
};

export const processElasticsearchFunctionName = (name: string) => {
  return <span>{cleanRegexp(name)}</span>;
};

export const processDnsResponse = (dnsResponse: FlowDnsResponse) => {
  return (
    <span>
      <span style={{ opacity: 0.8 }}>{dnsResponse.rcode}</span>{" "}
      {dnsResponse.query}
    </span>
  );
};

export const HTTP_STATUS_MESSAGES = {
  100: "Continue",
  101: "Switching Protocol",
  102: "Processing",
  103: "Early Hints",
  200: "OK",
  201: "Created",
  202: "Accepted",
  203: "Non-Authoritative Information",
  204: "No Content",
  205: "Reset Content",
  206: "Partial Content",
  207: "Multi-Status",
  208: "Already Reported",
  226: "IM Used ",
  300: "Multiple Choice",
  301: "Moved Permanently",
  302: "Found",
  303: "See Other",
  304: "Not Modified",
  305: "Use Proxy ",
  306: "Unused",
  307: "Temporary Redirect",
  308: "Permanent Redirect",
  400: "Bad Request",
  401: "Unauthorized",
  402: "Payment Required",
  403: "Forbidden",
  404: "Not Found",
  405: "Method Not Allowed",
  406: "Not Acceptable",
  407: "Proxy Authentication Required",
  408: "Request Timeout",
  409: "Conflict",
  410: "Gone",
  411: "Length Required",
  412: "Precondition Failed",
  413: "Payload Too Large",
  414: "URI Too Long",
  415: "Unsupported Media Type",
  416: "Requested Range Not Satisfiable",
  417: "Expectation Failed",
  418: "I'm a teapot",
  421: "Misdirected Request",
  422: "Unprocessable Entity",
  423: "Locked",
  424: "Failed Dependency",
  425: "Too Early",
  426: "Upgrade Required",
  428: "Precondition Required",
  429: "Too Many Requests",
  431: "Request Header Fields Too Large",
  451: "Unavailable For Legal Reasons",
  500: "Internal Server Error",
  501: "Not Implemented",
  502: "Bad Gateway",
  503: "Service Unavailable",
  504: "Gateway Timeout",
  505: "HTTP Version Not Supported",
  506: "Variant Also Negotiates",
  507: "Insufficient Storage",
  508: "Loop Detected",
  510: "Not Extended",
  511: "Network Authentication Required"
};

export const processHttpResponse = (httpResponse: FlowHttpResponse) => {
  const httpStatusMessage = HTTP_STATUS_MESSAGES[httpResponse.code];
  const preLabel = httpResponse.code === 0 ? "→" : "←";
  return (
    <span>
      <span style={{ opacity: 0.5 }}>{preLabel}</span>{" "}
      <span style={{ opacity: 0.8 }}>{httpResponse.method}</span>{" "}
      {httpResponse.code === 0 ? "" : httpResponse.code}{" "}
      {httpStatusMessage ? httpStatusMessage : ""} {httpResponse.url}
    </span>
  );
};

export const processGRPCFunctionName = (name: string) => {
  const [method, path] = name.split(" ");
  if (method && path) {
    const [_, servicePath, func] = path.split("/");
    if (servicePath && func) {
      const service = servicePath.split(".").pop();
      if (service) {
        return (
          <span>
            {service} {cleanRegexp(func)}
          </span>
        );
      } else {
        return <span>{cleanRegexp(name)}</span>;
      }
    } else {
      return <span>{cleanRegexp(name)}</span>;
    }
  } else {
    return <span>{cleanRegexp(name)}</span>;
  }
};

export interface VisibleModeMapping {
  readonly mode: "hidden" | "fogged";
  readonly mapping: { [key: string]: boolean };
}

export const buildEndpointFilterHash = (endpoint: AppEndpoint) =>
  buildElementFilterHash(
    endpoint.id,
    getEndpointNamespace(endpoint),
    endpoint.dnsName,
    null
  );

export const buildElementFilterHash = (
  id: string | null | undefined,
  namespace: string | null | undefined,
  destinationDnsName: string | null | undefined,
  destinationIpAddress: string | null | undefined
) =>
  `${id}_${hash([
    namespace,
    destinationDnsName ? destinationDnsName : null,
    destinationIpAddress ? destinationIpAddress : null
  ])}`;

export const endpointsNamesShortener = (endpoints: AppEndpoint[]) => {
  const shortands: { [key: string]: string } = {};
  endpoints.forEach((fixedEndpoint, i) => {
    endpoints.forEach((currentEndpoint, j) => {
      if (i === j || fixedEndpoint.name === currentEndpoint.name) {
        return;
      }
      const lcp = longestCommonPrefix(
        fixedEndpoint.name.split("-")[0],
        currentEndpoint.name.split("-")[0]
      );
      if (lcp.length <= 5) {
        return;
      }
      [fixedEndpoint.name, currentEndpoint.name].forEach(title => {
        if (lcp.length < title.length) {
          if (!shortands[title] || shortands[title].length < lcp.length) {
            shortands[title] = lcp;
          }
        }
      });
    });
  });
  return shortands;
};

export const longestCommonPrefix = (string1: string, string2: string) => {
  let lcp = "";
  for (let i = 0; i < Math.min(string1.length, string2.length); i++) {
    if (string1[i] === string2[i]) {
      lcp += string1[i];
    }
  }
  return lcp;
};

export const longestCommonSubstring = (string1: string, string2: string) => {
  // Convert strings to arrays to treat unicode symbols length correctly.
  // For example:
  // '𐌵'.length === 2
  // [...'𐌵'].length === 1
  const s1 = [...string1];
  const s2 = [...string2];

  // Init the matrix of all substring lengths to use Dynamic Programming approach.
  const substringMatrix = Array(s2.length + 1)
    .fill(null)
    .map(() => {
      return Array(s1.length + 1).fill(null);
    });

  // Fill the first row and first column with zeros to provide initial values.
  for (let columnIndex = 0; columnIndex <= s1.length; columnIndex += 1) {
    substringMatrix[0][columnIndex] = 0;
  }

  for (let rowIndex = 0; rowIndex <= s2.length; rowIndex += 1) {
    substringMatrix[rowIndex][0] = 0;
  }

  // Build the matrix of all substring lengths to use Dynamic Programming approach.
  let longestSubstringLength = 0;
  let longestSubstringColumn = 0;
  let longestSubstringRow = 0;

  for (let rowIndex = 1; rowIndex <= s2.length; rowIndex += 1) {
    for (let columnIndex = 1; columnIndex <= s1.length; columnIndex += 1) {
      if (s1[columnIndex - 1] === s2[rowIndex - 1]) {
        substringMatrix[rowIndex][columnIndex] =
          substringMatrix[rowIndex - 1][columnIndex - 1] + 1;
      } else {
        substringMatrix[rowIndex][columnIndex] = 0;
      }

      // Try to find the biggest length of all common substring lengths
      // and to memorize its last character position (indices)
      if (substringMatrix[rowIndex][columnIndex] > longestSubstringLength) {
        longestSubstringLength = substringMatrix[rowIndex][columnIndex];
        longestSubstringColumn = columnIndex;
        longestSubstringRow = rowIndex;
      }
    }
  }

  if (longestSubstringLength === 0) {
    // Longest common substring has not been found.
    return "";
  }

  // Detect the longest substring from the matrix.
  let longestSubstring = "";

  while (substringMatrix[longestSubstringRow][longestSubstringColumn] > 0) {
    longestSubstring = s1[longestSubstringColumn - 1] + longestSubstring;
    longestSubstringRow -= 1;
    longestSubstringColumn -= 1;
  }

  return longestSubstring;
};
