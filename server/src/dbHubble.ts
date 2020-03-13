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
import * as dns from "dns";
import { Timestamp } from "google-protobuf/google/protobuf/timestamp_pb";
import * as hash from "object-hash";
import * as URL from "url";
import { FlowsFiltersExtensionsCallback, IDatabase } from "./db";
import {
  Flow,
  FlowConnection,
  FlowDnsResponse,
  FlowEdge,
  FlowHttpResponse,
  FlowMetricsResponse,
  ForwardingStatus,
  Label,
  UserFlowArgs,
  UserFlowsArgs
} from "./graphqlTypes";
import {
  EventTypeFilter,
  Flow as HubbleFlow,
  FlowFilter,
  FlowType,
  L7FlowType,
  Verdict
} from "./hubble_proto/flow/flow_pb";
import { ObserverClient } from "./hubble_proto/observer/observer_grpc_pb";
import {
  GetFlowsRequest,
  GetFlowsResponse
} from "./hubble_proto/observer/observer_pb";
import { getEnvConfig } from "./server/getEnvConfig";
import * as k8s from "./server/k8s";
import { findNamespaceFromLabels } from "./shared/finders";
import { IContext } from "./types";
import { stringToLabel } from "./utils";

const grpc = require("grpc");

export class DatabaseHubble implements IDatabase {
  constructor() {}

  async initialize(): Promise<void> {}

  async getFlow(context: IContext, args: UserFlowArgs): Promise<Flow> {
    const flows = await this.getFlows(
      context,
      { filterBy: { labels: args.labels } },
      { processL7: false }
    );
    const flow = flows.edges.find(f => f.node.id === args.id);
    if (!flow) {
      throw new Error(`Flow not found: ${args.id}`);
    }
    return flow.node;
  }

  static async argsToGetFlowsRequest(
    args: UserFlowsArgs,
    filtersExtensionsCallback?: FlowsFiltersExtensionsCallback
  ): Promise<GetFlowsRequest> {
    const req: GetFlowsRequest = new GetFlowsRequest();

    let srcFilterAdded = false;
    let dstFilterAdded = false;
    const srcWhitelistBaseFilter = new FlowFilter();
    const dstWhitelistBaseFilter = new FlowFilter();

    // Codes from https://github.com/cilium/cilium/blob/456cc96dbba3e48668eec00584213c376e2f8db6/pkg/monitor/api/types.go#L29
    // Without event type filter hubble crushes when filtering with source/destinationPodList
    const eventTypes = [129 /* l7 */];
    if (args.filterBy && args.filterBy.httpStatusCode) {
      // Filter by http status code allows only l7 event type
      srcWhitelistBaseFilter.addHttpStatusCode(args.filterBy.httpStatusCode);
      dstWhitelistBaseFilter.addHttpStatusCode(args.filterBy.httpStatusCode);
    } else {
      eventTypes.push(1 /* drop */, 4 /* trace */);
    }
    eventTypes.forEach(eventTypeNumber => {
      const eventTypeFilter = new EventTypeFilter();
      eventTypeFilter.setType(eventTypeNumber);
      srcWhitelistBaseFilter.addEventType(eventTypeFilter);
      dstWhitelistBaseFilter.addEventType(eventTypeFilter);
    });

    if (args.filterBy) {
      if (args.filterBy.after) {
        const since = new Timestamp();
        since.fromDate(new Date(args.filterBy.after));
        req.setSince(since);
        const until = new Timestamp();
        until.fromDate(new Date());
        req.setUntil(until);
      } else {
        req.setNumber(1000);
      }

      if (args.filterBy.forwardingStatus) {
        switch (args.filterBy.forwardingStatus) {
          case ForwardingStatus.FORWARDED:
            srcWhitelistBaseFilter.addVerdict(Verdict.FORWARDED);
            dstWhitelistBaseFilter.addVerdict(Verdict.FORWARDED);
            break;
          case ForwardingStatus.DROPPED:
            srcWhitelistBaseFilter.addVerdict(Verdict.DROPPED);
            dstWhitelistBaseFilter.addVerdict(Verdict.DROPPED);
            break;
          default:
            throw new Error(
              `Unsupported forwarding status: ${args.filterBy.forwardingStatus}`
            );
        }
      }

      if (args.filterBy.sourceIpAddress) {
        srcWhitelistBaseFilter.addSourceIp(args.filterBy.sourceIpAddress);
        dstWhitelistBaseFilter.addSourceIp(args.filterBy.sourceIpAddress);
        srcFilterAdded = true;
      }

      if (args.filterBy.destinationIpAddress) {
        dstWhitelistBaseFilter.addDestinationIp(
          args.filterBy.destinationIpAddress
        );
        srcWhitelistBaseFilter.addDestinationIp(
          args.filterBy.destinationIpAddress
        );
        dstFilterAdded = true;
      }

      if (args.filterBy.destinationDnsName) {
        dstWhitelistBaseFilter.addDestinationFqdn(
          args.filterBy.destinationDnsName
        );
        srcWhitelistBaseFilter.addDestinationFqdn(
          args.filterBy.destinationDnsName
        );
        dstFilterAdded = true;
      }

      if (args.filterBy.labels) {
        const namespace = findNamespaceFromLabels(args.filterBy.labels);
        if (namespace) {
          if (!srcFilterAdded) {
            srcWhitelistBaseFilter.addSourcePod(`${namespace}/`);
          }
          if (!dstFilterAdded) {
            dstWhitelistBaseFilter.addDestinationPod(`${namespace}/`);
          }
        }
      } else {
        if (args.filterBy.sourceLabels && !srcFilterAdded) {
          const sourceNamespace = findNamespaceFromLabels(
            args.filterBy.sourceLabels
          );
          if (sourceNamespace) {
            srcWhitelistBaseFilter.addSourcePod(`${sourceNamespace}/`);
          }
        }
        if (args.filterBy.destinationLabels && !dstFilterAdded) {
          const destinationNamespace = findNamespaceFromLabels(
            args.filterBy.destinationLabels
          );
          if (destinationNamespace) {
            dstWhitelistBaseFilter.addDestinationPod(
              `${destinationNamespace}/`
            );
          }
        }
      }
    }

    const srcBlacklistReservedUnknownFilter = new FlowFilter();
    const dstBlacklistReservedUnknownFilter = new FlowFilter();
    srcBlacklistReservedUnknownFilter.addSourceLabel("reserved:unknown");
    dstBlacklistReservedUnknownFilter.addDestinationLabel("reserved:unknown");

    args.filterBy?.excludeLabels?.forEach(({ key, value }) => {
      let excludeLabel = `${key}`;
      if (value) {
        excludeLabel += `=${value}`;
      }
      srcBlacklistReservedUnknownFilter.addSourceLabel(excludeLabel);
      dstBlacklistReservedUnknownFilter.addDestinationLabel(excludeLabel);
    });

    const whitelistFilters: FlowFilter[] = [
      srcWhitelistBaseFilter,
      dstWhitelistBaseFilter
    ];
    const blacklistFilters: FlowFilter[] = [
      srcBlacklistReservedUnknownFilter,
      dstBlacklistReservedUnknownFilter
    ];

    if (filtersExtensionsCallback) {
      const filtersExtensions = filtersExtensionsCallback();
      whitelistFilters.push(
        ...filtersExtensions.srcWhitelistFilters,
        ...filtersExtensions.dstWhitelistFilters
      );
      blacklistFilters.push(
        ...filtersExtensions.srcBlacklistFilters,
        ...filtersExtensions.dstBlacklistFilters
      );
    }

    req.setWhitelistList(whitelistFilters);
    req.setBlacklistList(blacklistFilters);

    return req;
  }

  async getHubbleClients(context: IContext): Promise<ObserverClient[]> {
    const { hubbleService, hubblePort, hubblePeerEnabled } = getEnvConfig();
    return new Promise((resolve, reject) => {
      const start = Date.now();
      context.logger.debug(`Searching hubble clients...`);
      if (hubblePeerEnabled) {
        resolve([
          new ObserverClient(
            `${hubbleService}:${hubblePort}`,
            grpc.credentials.createInsecure()
          )
        ]);
        context.logger.debug(
          `Found 1 hubble client in ${Date.now() - start}ms`
        );
      } else {
        const options = {
          hints: dns.ADDRCONFIG,
          all: true
        };
        dns.lookup(
          hubbleService || "hubble-grpc",
          options,
          (err, addresses: dns.LookupAddress[]) => {
            if (err) {
              context.logger.error(err);
              return reject(err);
            }
            const ipAdresses = addresses.map(addr =>
              addr.family === 6 ? `[${addr.address}]` : addr.address
            );
            resolve(
              ipAdresses.map(
                ip =>
                  new ObserverClient(
                    `${ip}:${hubblePort}`,
                    grpc.credentials.createInsecure()
                  )
              )
            );
            context.logger.debug(
              `Found ${addresses.length} hubble client(s) in ${Date.now() -
                start}ms`
            );
          }
        );
      }
    });
  }

  async getFlows(
    context: IContext,
    args: UserFlowsArgs,
    options: {
      processL7: boolean;
      flowsFiltersExtensionsCallback?: FlowsFiltersExtensionsCallback;
    }
  ): Promise<FlowConnection> {
    const startGetFlows = Date.now();
    context.logger.debug(`Starting to fetch flows...`);
    if (!args.filterBy || !args.filterBy.labels) {
      throw new Error("Need namespace specified");
    }

    const namespace = findNamespaceFromLabels(args.filterBy.labels);
    if (!namespace) {
      throw new Error("Need namespace specified");
    }
    try {
      const hasAccess = await k8s.getHasAccessToNamespace(
        context.user.token,
        namespace
      );
      if (!hasAccess) {
        throw new Error(`Forbidden access to this ${namespace} namespace`);
      }
    } catch (error) {
      throw new Error(error);
    }
    const edges: FlowEdge[] = [];
    const req = await DatabaseHubble.argsToGetFlowsRequest(
      args,
      options.flowsFiltersExtensionsCallback
    );
    const clients = await this.getHubbleClients(context);
    const seenIds = new Set();
    return Promise.all(
      clients.map(
        (client, clientIndex) =>
          new Promise(async (resolve, reject) => {
            context.logger.debug(
              `Fetching flows from client #${clientIndex}...`
            );
            const flowsStream = client.getFlows(req);
            const startClientGetFlows = Date.now();

            flowsStream.on("end", () => {
              context.logger.debug(
                `Fetched flows from client #${clientIndex} in ${Date.now() -
                  startClientGetFlows}ms`
              );
              resolve();
            });

            flowsStream.on("close", () => {
              context.logger.debug(
                `Client #${clientIndex} closes stream, fetched flows in ${Date.now() -
                  startClientGetFlows}ms`
              );
              resolve();
            });

            flowsStream.on("error", err => {
              reject(new Error(`from hubble: ${err ? err.toString() : ""}`));
            });

            flowsStream.on("data", (res: GetFlowsResponse) => {
              context.logger.trace(
                { flow: res.toObject() },
                "Received a response from Hubble"
              );
              if (!res.hasFlow()) {
                return;
              }
              const flow = res.getFlow()!;

              let sourceLabels = buildSourceLabels(flow);
              let destinationLabels = buildDestinationLabels(flow);

              if (sourceLabels.length === 0 || destinationLabels.length === 0) {
                return;
              }

              if (!checkFilterByLabel(args, sourceLabels, destinationLabels)) {
                return;
              }

              let {
                destinationPort,
                destinationL4Protocol
              } = buildDestinationPortAndL4Protocol(flow);

              let {
                sourcePort,
                sourceL4Protocol
              } = buildSourcePortAndL4Protocol(flow);

              if (
                destinationPort === 0 ||
                (flow.getType() === FlowType.L3_L4 && flow.getReply())
              ) {
                return;
              }

              const forwardingStatus = buildForwardingStatus(flow);
              const dnsResponse = buildDnsResponse(flow);
              const { httpResponse, metricsResponse } = buildL7Response(flow);

              let sourceDnsName =
                flow.getSourceNamesList().length > 0
                  ? flow.getSourceNamesList()[0]
                  : "";
              let sourcePodName =
                (flow.hasSource() && flow.getSource()!.getPodName()) || null;
              let sourceIpAddress = flow.hasIp()
                ? flow.getIp()!.getSource()
                : "";
              let destinationDnsName =
                flow.getDestinationNamesList().length > 0
                  ? flow.getDestinationNamesList()[0]
                  : "";
              let destinationPodName =
                (flow.hasDestination() &&
                  flow.getDestination()!.getPodName()) ||
                null;
              let destinationIpAddress = flow.hasIp()
                ? flow.getIp()!.getDestination()
                : "";
              const destinationL7Protocol = dnsResponse
                ? "DNS"
                : httpResponse
                ? "HTTP"
                : undefined;

              if (options.processL7 && flow.getType() === FlowType.L7) {
                if (!flow.getReply()) {
                  return;
                }
                [sourceLabels, destinationLabels] = [
                  destinationLabels,
                  sourceLabels
                ];
                [sourcePort, destinationPort] = [destinationPort, sourcePort];
                [sourceL4Protocol, destinationL4Protocol] = [
                  destinationL4Protocol,
                  sourceL4Protocol
                ];
                [sourceDnsName, destinationDnsName] = [
                  destinationDnsName,
                  sourceDnsName
                ];
                [sourcePodName, destinationPodName] = [
                  destinationDnsName,
                  sourcePodName
                ];
                [sourceIpAddress, destinationIpAddress] = [
                  destinationIpAddress,
                  sourceIpAddress
                ];
              }

              const timestamp = flow.getTime()
                ? flow.getTime()!.toDate()
                : null;

              const id = hash([
                sourcePodName,
                sourceLabels,
                destinationPodName,
                destinationDnsName,
                destinationLabels,
                destinationL4Protocol,
                destinationPort,
                destinationL7Protocol,
                forwardingStatus,
                dnsResponse ? [dnsResponse.query, dnsResponse.rcode] : null,
                httpResponse
                  ? [
                      httpResponse.url,
                      httpResponse.protocol,
                      httpResponse.method,
                      httpResponse.code
                    ]
                  : null
              ]);

              // avoid duplicate flows
              if (seenIds.has(id)) {
                return;
              } else {
                seenIds.add(id);
              }

              edges.push({
                cursor: "",
                node: {
                  id,
                  hash: id,
                  sourceSecurityId: 1,
                  sourceDeploymentId: "1",
                  sourceLabels,
                  sourceIpAddress,
                  sourcePodName,
                  destinationSecurityId: 2,
                  destinationDeploymentId: "2",
                  destinationLabels,
                  destinationIpAddress,
                  destinationPodName,
                  destinationDnsName,
                  destinationL4Protocol,
                  destinationL7Protocol,
                  destinationPort,
                  destinationFunctionName: "",
                  timestamp,
                  forwardingStatus,
                  dnsResponse,
                  httpResponse,
                  metricsResponse,
                  tcpControlBits: [],
                  forwardingStatusDetails: [],
                  direction: null,
                  requestOrResponse: buildRequestOrResponse(flow),
                  ciliumEventSubType: buildCiliumEventSubType(flow),
                  rejectedReason: null,
                  rejectedReasonMessage: null,
                  appModelInfo: null
                } as Flow
              });
            });
          })
      )
    ).then(() => {
      context.logger.debug(
        `Fetched all flows in ${Date.now() - startGetFlows}ms`
      );
      edges.sort((a, b) => {
        return +new Date(b.node.timestamp) - +new Date(a.node.timestamp);
      });
      return {
        edges: edges,
        pageInfo: {
          startCursor: "",
          endCursor: "",
          hasPreviousPage: false,
          hasNextPage: false
        }
      };
    });
  }
}

function buildForwardingStatus(flow: HubbleFlow): ForwardingStatus {
  switch (flow.getVerdict()) {
    case Verdict.FORWARDED:
      return ForwardingStatus.FORWARDED;
    case Verdict.DROPPED:
      return ForwardingStatus.DROPPED;
    default:
      return ForwardingStatus.UNDEFINED_POLICY_DECISION;
  }
}

function buildSourceLabels(flow: HubbleFlow) {
  return flow.getSource()
    ? flow
        .getSource()!
        .getLabelsList()
        .sort()
        .map(l => stringToLabel(l))
    : [];
}

function buildDestinationLabels(flow: HubbleFlow) {
  return flow.getDestination()
    ? flow
        .getDestination()!
        .getLabelsList()
        .sort()
        .map(l => stringToLabel(l))
    : [];
}

function checkFilterByLabel(
  args: UserFlowsArgs,
  sourceLabels: Label[],
  destinationLabels: Label[]
) {
  if (
    args.filterBy &&
    args.filterBy.labels &&
    args.filterBy.labels.length > 0
  ) {
    if (
      !args.filterBy.labels.every(
        label =>
          sourceLabels.some(
            l => label.key === l.key && label.value === l.value
          ) ||
          destinationLabels.some(
            l => label.key === l.key && label.value === l.value
          )
      )
    ) {
      return false;
    }
  }
  return true;
}

function buildDnsResponse(flow: HubbleFlow) {
  const grpcDnsResponse =
    flow.hasL7() && flow.getL7()!.hasDns()
      ? flow.getL7()!.getDns()!
      : undefined;
  let dnsResponse: FlowDnsResponse | undefined = undefined;
  if (grpcDnsResponse) {
    const query = grpcDnsResponse.getQuery();
    if (
      flow.getL7()!.getType() === L7FlowType.RESPONSE &&
      !query.endsWith(".local.")
    ) {
      dnsResponse = {
        __typename: "FlowDnsResponse",
        query,
        rcode: grpcDnsResponse.getRcode().toString(),
        ips: grpcDnsResponse.getIpsList()
      };
    }
  }

  return dnsResponse;
}

function buildL7Response(flow: HubbleFlow) {
  const grpcl7 = flow.hasL7() ? flow.getL7()! : undefined;
  const grpcHttpResponse =
    grpcl7 && grpcl7.hasHttp() ? grpcl7.getHttp()! : undefined;
  let httpResponse: FlowHttpResponse | undefined = undefined;
  let metricsResponse: FlowMetricsResponse | undefined = undefined;
  if (grpcHttpResponse) {
    const fullUrl = grpcHttpResponse.getUrl();
    const urlPath = URL.parse(fullUrl).path;
    httpResponse = {
      __typename: "FlowHttpResponse",
      code: grpcHttpResponse.getCode(),
      method: grpcHttpResponse.getMethod(),
      protocol: grpcHttpResponse.getProtocol(),
      url: urlPath ? urlPath : fullUrl,
      headers: grpcHttpResponse.getHeadersList().map(header => ({
        key: header.getKey(),
        value: header.getValue()
      }))
    };
  }
  if (grpcl7) {
    metricsResponse = {
      __typename: "FlowMetricsResponse",
      latencyMs: +(grpcl7.getLatencyNs() / 1000000).toFixed(2)
    };
  }
  return { httpResponse, metricsResponse };
}

function buildDestinationPortAndL4Protocol(flow: HubbleFlow) {
  let destinationPort: number | undefined;
  let destinationL4Protocol = "";
  if (flow.hasL4()) {
    if (flow.getL4()!.hasTcp()) {
      destinationPort = flow
        .getL4()!
        .getTcp()!
        .getDestinationPort();
      destinationL4Protocol = "TCP";
    } else if (flow.getL4()!.hasUdp()) {
      destinationPort = flow
        .getL4()!
        .getUdp()!
        .getDestinationPort();
      destinationL4Protocol = "UDP";
    }
  }
  return { destinationPort, destinationL4Protocol };
}

function buildSourcePortAndL4Protocol(flow: HubbleFlow) {
  let sourcePort: number | undefined;
  let sourceL4Protocol = "";
  if (flow.hasL4()) {
    if (flow.getL4()!.hasTcp()) {
      sourcePort = flow
        .getL4()!
        .getTcp()!
        .getSourcePort();
      sourceL4Protocol = "TCP";
    } else if (flow.getL4()!.hasUdp()) {
      sourcePort = flow
        .getL4()!
        .getUdp()!
        .getSourcePort();
      sourceL4Protocol = "UDP";
    }
  }
  return { sourcePort, sourceL4Protocol };
}

function buildRequestOrResponse(flow: HubbleFlow) {
  return flow.getReply() ? "response" : "request";
}

const CILIUM_EVENT_SUBTYPES = {
  0: "to-endpoint",
  1: "to-proxy",
  2: "to-host",
  3: "to-stack",
  4: "to-overlay",
  5: "from-endpoint",
  6: "from-proxy",
  7: "from-host",
  8: "from-stack",
  9: "from-overlay",
  10: "from-network"
};

function buildCiliumEventSubType(flow: HubbleFlow) {
  const eventType = flow.getEventType();
  if (!eventType) {
    return "unknown";
  }
  return CILIUM_EVENT_SUBTYPES[eventType.getSubType()];
}
