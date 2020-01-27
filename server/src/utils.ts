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
import { Request } from "express";
import * as jspb from "google-protobuf";
import * as moment from "moment";
import * as url from "url";
import { IClusterInfo } from "./configDb";
import {
  AppEndpoint,
  CiliumEndpoint,
  DiscoverFilterEnum,
  Endpoint,
  Flow,
  Label,
  Protocol,
  ProtocolInput,
  RejectedReason
} from "./graphqlTypes";
import {
  CIDR_LABEL,
  CLUSTER_LABEL,
  removeUnnecessaryLabel
} from "./shared/builders";
import { isLabelListInNamespaces } from "./shared/checkers";
import { protocolId } from "./shared/generators";

export { CLUSTER_LABEL, CIDR_LABEL, removeUnnecessaryLabel };

// Exported for unit testing
export const quayResponseCache = new Map<string, SoftwareVersion | null>();

export function protocolToString(protocol: number): string {
  switch (protocol) {
    case 1:
      return "ICMP";
    case 6:
      return "TCP";
    case 17:
      return "UDP";
    case 58:
      return "IPv6-ICMP";
    default:
      return protocol.toString();
  }
}

// Copied from:
// https://github.com/cilium/cilium/blob/6d14ec4d1ac747b063f656e48fae76e7ef85682d/pkg/monitor/api/drop.go#L27
const dropReasons = new Map<number, [RejectedReason, string]>([
  [132, [RejectedReason.INVALID_SOURCE_IP, "Invalid source ip"]],
  [133, [RejectedReason.POLICY_DENIED_L3, "Policy denied (L3)"]],
  [134, [RejectedReason.INVALID_PACKET, "Invalid packet"]],
  [
    135,
    [
      RejectedReason.CT_TRUNCATED_OR_INVALID_HEADER,
      "CT: Truncated or invalid header"
    ]
  ],
  [137, [RejectedReason.CT_UNKNOWN_L4_PROTOCOL, "CT: Unknown L4 protocol"]],
  [139, [RejectedReason.UNSUPPORTED_L3_PROTOCOL, "Unsupported L3 protocol"]],
  [140, [RejectedReason.MISSED_TAIL_CALL, "Missed tail call"]],
  [141, [RejectedReason.ERROR_WRITING_TO_PACKET, "Error writing to packet"]],
  [142, [RejectedReason.UNKNOWN_L4_PROTOCOL, "Unknown L4 protocol"]],
  [143, [RejectedReason.UNKNOWN_ICMPV4_CODE, "Unknown ICMPv4 code"]],
  [144, [RejectedReason.UNKNOWN_ICMPV4_TYPE, "Unknown ICMPv4 type"]],
  [145, [RejectedReason.UNKNOWN_ICMPV6_CODE, "Unknown ICMPv6 code"]],
  [146, [RejectedReason.UNKNOWN_ICMPV6_TYPE, "Unknown ICMPv6 type"]],
  [
    147,
    [RejectedReason.ERROR_RETREIVING_TUNNEL_KEY, "Error retrieving tunnel key"]
  ],
  [
    150,
    [RejectedReason.UNKNOWN_L3_TARGET_ADDRESS, "Unknown L3 target address"]
  ],
  [151, [RejectedReason.STALE_OR_UNROUTABLE_IP, "Stale or unroutable IP"]],
  [
    153,
    [
      RejectedReason.ERROR_CORRECTING_L3_CHECKSUM,
      "Error while correcting L3 checksum"
    ]
  ],
  [
    154,
    [
      RejectedReason.ERROR_CORRECTING_L4_CHECKSUM,
      "Error while correcting L4 checksum"
    ]
  ],
  [155, [RejectedReason.CT_MAP_INSERTION_FAILED, "CT: Map insertion failed"]],
  [156, [RejectedReason.INVALID_IPV6_HEADER, "Invalid IPv6 extension header"]],
  [
    157,
    [
      RejectedReason.IP_FRAGMENTATION_NOT_SUPPORTED,
      "IP fragmentation not supported"
    ]
  ],
  [
    158,
    [RejectedReason.SERVICE_BACKEND_NOT_FOUND, "Service backend not found"]
  ],
  [
    160,
    [
      RejectedReason.NO_TUNNEL_ENCAPSULATION_ENDPOINT,
      "No tunnel/encapsulation endpoint (datapath BUG!)"
    ]
  ],
  [
    163,
    [
      RejectedReason.UNKNOWN_CONNECTION_TRACKING_STATE,
      "Unknown connection tracking state"
    ]
  ],
  [164, [RejectedReason.LOCAL_HOST_UNREACHABLE, "Local host is unreachable"]],
  [
    165,
    [
      RejectedReason.NO_CONFIGURATION,
      "No configuration available to perform policy decision"
    ]
  ],
  [166, [RejectedReason.UNSUPPORTED_L2_PROTOCOL, "Unsupported L2 protocol"]],
  [167, [RejectedReason.NO_MAPPING_FOR_NAT, "No mapping for NAT masquerade"]],
  [
    168,
    [
      RejectedReason.UNSUPPORTED_NAT_PROTOCOL,
      "Unsupported protocol for NAT masquerade"
    ]
  ]
]);

export const L34ForwardingStatusDetails = [...dropReasons.entries()].reduce(
  (accum, curr) => {
    accum.set(curr[0], curr[1][1]);
    return accum;
  },
  new Map<number, string>()
);

const IntToRejectedReasonMap = [...dropReasons.entries()].reduce(
  (accum, curr) => {
    accum.set(curr[0], curr[1][0]);
    return accum;
  },
  new Map<number, RejectedReason>()
);

const RejectedReasonToIntMap = [...dropReasons.entries()].reduce(
  (accum, curr) => {
    accum.set(curr[1][0], curr[0]);
    return accum;
  },
  new Map<RejectedReason, number>()
);

// See L34ForwardingStatusDetails for more details on all possible values that Cilium sets
export function rejectedReasonToInt(reason: RejectedReason): number {
  return RejectedReasonToIntMap.get(reason) || -1;
}

export function IntToRejectedReason(reasonInt: number): RejectedReason | null {
  return IntToRejectedReasonMap.get(reasonInt) || null;
}

export function stringToLabel(val: string): Label {
  const [key, value] = val.split("=", 2);
  // Set value to an empty string in case the value is missing (e.g. "reserved:host")
  return value ? { key, value } : { key, value: "" };
}

export function labelToString(label: Label): string {
  return label.value ? `${label.key}=${label.value}` : label.key;
}

interface Tag {
  name: string;
  reversion: boolean;
  end_ts: number;
  start_ts: number;
  docker_image_id: string;
  manifest_digest: string;
}

interface QuayRepoTagResponse {
  has_additional: boolean;
  tags: [Tag];
}

interface QuayRepoLabelResponse {
  labels: [Label];
}

export class SoftwareVersion {
  major: number;
  minor: number;
  patch: string;
  constructor(major: number, minor: number, patch: string) {
    this.major = major;
    this.minor = minor;
    this.patch = patch;
  }
  // Returns true if this version is a more recent version than v2.
  isGreaterThan(compareWithVersion: SoftwareVersion): boolean {
    if (this.major > compareWithVersion.major) {
      return true;
    } else if (this.major === compareWithVersion.major) {
      if (this.minor > compareWithVersion.minor) {
        return true;
      } else if (this.minor === compareWithVersion.minor) {
        if (this.patch > compareWithVersion.patch) {
          return true;
        }
      }
    }
    return false;
  }
  public toString = (): string => {
    return `${this.major}.${this.minor}.${this.patch}`;
  };
}

export function parseVersionFromPodResponseWithPodList(
  repoName: string,
  info: IClusterInfo
): SoftwareVersion {
  try {
    for (let pod of info.podList.getPodsList()) {
      for (let container of pod.getSpec()!.getContainersList()) {
        let matches = container
          .getImage()
          .match(
            `^quay.io/covalent/${repoName}:(\\d+)+\\.(\\d+)\\.(\\d+T\\d+)$`
          );
        if (matches != null) {
          return new SoftwareVersion(+matches[1], +matches[2], matches[3]);
        }
      }
    }
  } catch (err) {
    throw err;
  }
  throw new Error(`Pod with name: ${repoName} was not found in the response`);
}

export const inDynamicPortRange = (port: Number): boolean =>
  port >= 32768 && port <= 65535;

export const isValidEndpointPair = (
  src: Endpoint | AppEndpoint,
  dst: Endpoint | AppEndpoint,
  namespaces: string[],
  cluster: string,
  destinationL4Protocol: string
): boolean =>
  isEndpointInCluster(src as Endpoint, cluster) &&
  isEndpointInCluster(dst as Endpoint, cluster) &&
  (isLabelListInNamespaces(src.labels, namespaces) ||
    isLabelListInNamespaces(dst.labels, namespaces)) &&
  (destinationL4Protocol === "TCP" || destinationL4Protocol === "UDP");

export function isEndpointInCluster(
  endpoint: Endpoint,
  cluster: string
): boolean {
  const clusterLabel = endpoint.labels.find(
    label => label.key === CLUSTER_LABEL
  );
  return clusterLabel ? clusterLabel.value === cluster : false;
}

export function protocolWithId(
  appEndpoint: AppEndpoint,
  protocolInput: ProtocolInput
): Protocol {
  return {
    ...(protocolInput as Protocol),
    id: protocolId(appEndpoint, protocolInput)
  };
}

export function isCidrEndpoint(endpoint: AppEndpoint): boolean {
  return (
    (!!endpoint.v4Cidrs && endpoint.v4Cidrs.length > 0) ||
    (!!endpoint.v6Cidrs && endpoint.v6Cidrs.length > 0)
  );
}

export function getIpAddress(endpoint: AppEndpoint): string {
  return endpoint.v4Cidrs && endpoint.v4Cidrs.length === 1
    ? endpoint.v4Cidrs[0]
    : endpoint.v6Cidrs && endpoint.v6Cidrs.length === 1
    ? endpoint.v6Cidrs[0]
    : "";
}

export const getRequestFullUrl = (req: Request, nodeEnv, pintobox) => {
  var re = /covalent.io/gi;
  return url.format({
    protocol: pintobox || nodeEnv !== "production" ? "http" : "https",
    // Use the host header for pintobox. req.hostname doesn't include the port.
    host: pintobox
      ? req.get("host")
      : req.hostname.replace(re, "isovalent.com"),
    pathname: req.originalUrl
  });
};

export function mapToLabelList(labelMap: jspb.Map<string, string>): Label[] {
  let labels: Label[] = [];
  labelMap.forEach((value: string, key: string) => {
    labels.push({ key: key, value: value });
  });
  return labels;
}

export function getTcpFlagsAsStringSet(tcpControlBits: number): Set<string> {
  const result = new Set<string>();
  tcpControlBits & 0x0001 && result.add("FIN");
  tcpControlBits & 0x0002 && result.add("SYN");
  tcpControlBits & 0x0004 && result.add("RST");
  tcpControlBits & 0x0008 && result.add("PSH");
  tcpControlBits & 0x0010 && result.add("ACK");
  tcpControlBits & 0x0020 && result.add("URG");
  tcpControlBits & 0x0040 && result.add("ECE");
  tcpControlBits & 0x0080 && result.add("CWR");
  tcpControlBits & 0x0100 && result.add("NS");
  return result;
}

export function getDiscoverFilterByCallback(
  deploymentId: string,
  filterBy: DiscoverFilterEnum
): (flow: Flow) => boolean {
  return {
    [DiscoverFilterEnum.INBOUND]: flow =>
      flow.destinationDeploymentId === deploymentId &&
      flow.sourceDeploymentId !== deploymentId,
    [DiscoverFilterEnum.OUTBOUND]: flow =>
      flow.sourceDeploymentId === deploymentId &&
      flow.destinationDeploymentId !== deploymentId,
    [DiscoverFilterEnum.INTRA_APP]: flow =>
      flow.sourceDeploymentId === deploymentId &&
      flow.destinationDeploymentId === deploymentId
  }[filterBy];
}

export function getForwardingStatusDetailsAsStringSet(
  forwardingStatusDetails: number[],
  statuses: Map<number, string>
): Set<string> {
  return (forwardingStatusDetails || [])
    .filter(status => statuses.has(status))
    .reduce((accum, curr) => {
      accum.add(statuses.get(curr)!);
      return accum;
    }, new Set<string>());
}

export function getTimeIntervals(
  from: moment.Moment,
  to: moment.Moment,
  numIntervals: number
): number[] {
  const start = from.utc().unix();
  const end = to.utc().unix();
  const range = Math.max(Math.ceil((end - start) / numIntervals), 1);
  const result: number[] = [];
  for (let i = 0, curr = start; curr < end; i++, curr += range) {
    result.push(curr);
  }
  return result;
}

export async function cepJsonToGraphqlType(
  json: string
): Promise<CiliumEndpoint[]> {
  return cepToGraphqlType(JSON.parse(json));
}

export async function cepToGraphqlType(cep: any): Promise<CiliumEndpoint[]> {
  return cep.items
    .filter(cep => {
      return Boolean(
        cep.metadata &&
          cep.status &&
          cep.status.identity &&
          cep.status.identity.labels &&
          cep.status.networking &&
          cep.status.networking.addressing
      );
    })
    .map(
      (cep): CiliumEndpoint => {
        return {
          name: cep.metadata.name,
          endpointId: cep.status.id.toString(),
          namespace: cep.metadata.namespace,
          identityId: String(cep.status.identity.id),
          identityLabels: cep.status.identity.labels.map(label => {
            const [k, v] = label.split("=", 2);
            return { key: k, value: v || "" };
          }),
          ipv4Addresses: cep.status.networking.addressing
            .filter(address => address.ipv4)
            .map(address => address.ipv4),
          ipv6Addresses: cep.status.networking.addressing
            .filter(address => address.ipv6)
            .map(address => address.ipv6),
          logMessage: "",
          failingControllers: [],
          ingress: null,
          egress: null
        };
      }
    );
}
