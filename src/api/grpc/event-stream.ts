import { throttle } from 'lodash';
import { ClientReadableStream, Status, Error as GRPCError } from 'grpc-web';

import {
  GetEventsRequest,
  GetEventsResponse,
  EventType,
  EventFilter,
  ServiceState,
  ServiceLinkState,
  K8sNamespaceState,
} from '~backend/proto/ui/ui_pb';

import { Flow, FlowFilter, EventTypeFilter } from '~backend/proto/flow/flow_pb';

import { HubbleFlow } from '~/domain/hubble';
import { FlowsFilterDirection, FlowsFilterKind } from '~/domain/flows';
import { CiliumEventTypes } from '~/domain/cilium';
import { ReservedLabel, SpecialLabel, Labels } from '~/domain/labels';
import { Filters } from '~/domain/filtering';
import * as dataHelpers from '~/domain/helpers';

import { EventEmitter } from '~/utils/emitter';
import {
  IEventStream,
  EventParams,
  EventStreamHandlers,
  EventKind,
} from '~/api/general/event-stream';
import { GeneralStreamEventKind } from '~/api/general/stream';

import EventCase = GetEventsResponse.EventCase;

type GRPCEventStream = ClientReadableStream<GetEventsResponse>;
type FlowFilters = [FlowFilter[], FlowFilter[]];

export class EventStream extends EventEmitter<EventStreamHandlers>
  implements IEventStream {
  public static readonly FlowsThrottleDelay: number = 5000;

  private stream: GRPCEventStream;
  private flowBuffer: HubbleFlow[] = [];
  private throttledFlowReceived: () => void = () => {
    return;
  };

  // TODO: add another params to handle filters
  public static buildRequest(
    opts: EventParams,
    filters?: Filters,
  ): GetEventsRequest {
    const req = new GetEventsRequest();

    if (opts.flows) {
      req.addEventTypes(EventType.FLOW);
    }

    if (opts.namespaces) {
      req.addEventTypes(EventType.K8S_NAMESPACE_STATE);
    }

    if (opts.services) {
      req.addEventTypes(EventType.SERVICE_STATE);
    }

    if (opts.serviceLinks) {
      req.addEventTypes(EventType.SERVICE_LINK_STATE);
    }

    const [wlFlowFilters, blFlowFilters] = EventStream.buildFlowFilters(
      filters,
    );

    const ffToEventFilter = (ff: FlowFilter) => {
      const filter = new EventFilter();
      filter.setFlowFilter(ff);

      return filter;
    };

    const wlFilters = wlFlowFilters.map(ffToEventFilter);
    const blFilters = blFlowFilters.map(ffToEventFilter);

    req.setWhitelistList(wlFilters);
    req.setBlacklistList(blFilters);

    return req;
  }

  // Taken from previous FlowStream class
  public static buildFlowFilters(filters?: Filters): FlowFilters {
    const namespace = filters?.namespace;

    // *** whitelist filters section ***
    const [wlSrcFilter, wlDstFilter] = [new FlowFilter(), new FlowFilter()];

    const eventTypes: CiliumEventTypes[] = [];
    if (filters?.httpStatus) {
      // Filter by http status code allows only l7 event type
      eventTypes.push(CiliumEventTypes.L7);
      wlSrcFilter.addHttpStatusCode(filters.httpStatus);
      wlDstFilter.addHttpStatusCode(filters.httpStatus);
    } else {
      eventTypes.push(CiliumEventTypes.Drop, CiliumEventTypes.Trace);
    }

    eventTypes.forEach(eventTypeNumber => {
      const eventTypeFilter = new EventTypeFilter();
      eventTypeFilter.setType(eventTypeNumber);

      wlSrcFilter.addEventType(eventTypeFilter);
      wlDstFilter.addEventType(eventTypeFilter);
    });

    if (filters?.verdict) {
      wlSrcFilter.addVerdict(dataHelpers.verdictToPb(filters.verdict));
      wlDstFilter.addVerdict(dataHelpers.verdictToPb(filters.verdict));
    }

    let shouldAddPodFilter = true;
    filters?.filters?.forEach(filter => {
      if (filter.kind === FlowsFilterKind.Label) {
        if (Labels.isReservedKey(filter.query)) {
          shouldAddPodFilter = false;
        }
      }

      switch (filter.direction) {
        case FlowsFilterDirection.Both: {
          switch (filter.kind) {
            case FlowsFilterKind.Label: {
              wlSrcFilter.addSourceLabel(filter.query);
              wlDstFilter.addDestinationLabel(filter.query);
              break;
            }
            case FlowsFilterKind.Ip: {
              wlSrcFilter.addSourceIp(filter.query);
              wlDstFilter.addDestinationIp(filter.query);
              break;
            }
            case FlowsFilterKind.Dns: {
              wlSrcFilter.addSourceFqdn(filter.query);
              wlDstFilter.addDestinationFqdn(filter.query);
              break;
            }
            case FlowsFilterKind.Identity: {
              wlSrcFilter.addSourceIdentity(+filter.query);
              wlDstFilter.addDestinationIdentity(+filter.query);
              break;
            }
            case FlowsFilterKind.Pod: {
              wlSrcFilter.addSourcePod(`${namespace}/${filter.query}`);
              wlDstFilter.addDestinationPod(`${namespace}/${filter.query}`);
              shouldAddPodFilter = false;
              break;
            }
          }
          break;
        }
        case FlowsFilterDirection.From: {
          switch (filter.kind) {
            case FlowsFilterKind.Label: {
              wlSrcFilter.addSourceLabel(filter.query);
              wlDstFilter.addSourceLabel(filter.query);
              break;
            }
            case FlowsFilterKind.Ip: {
              wlSrcFilter.addSourceIp(filter.query);
              wlDstFilter.addSourceIp(filter.query);
              break;
            }
            case FlowsFilterKind.Dns: {
              wlSrcFilter.addSourceFqdn(filter.query);
              wlDstFilter.addSourceFqdn(filter.query);
              break;
            }
            case FlowsFilterKind.Identity: {
              wlSrcFilter.addSourceIdentity(+filter.query);
              wlDstFilter.addSourceIdentity(+filter.query);
              break;
            }
            case FlowsFilterKind.Pod: {
              wlSrcFilter.addSourcePod(`${namespace}/${filter.query}`);
              wlDstFilter.addSourcePod(`${namespace}/${filter.query}`);
              shouldAddPodFilter = false;
              break;
            }
          }
          break;
        }
        case FlowsFilterDirection.To: {
          switch (filter.kind) {
            case FlowsFilterKind.Label: {
              wlSrcFilter.addDestinationLabel(filter.query);
              wlDstFilter.addDestinationLabel(filter.query);
              break;
            }
            case FlowsFilterKind.Ip: {
              wlSrcFilter.addDestinationIp(filter.query);
              wlDstFilter.addDestinationIp(filter.query);
              break;
            }
            case FlowsFilterKind.Dns: {
              wlSrcFilter.addDestinationFqdn(filter.query);
              wlDstFilter.addDestinationFqdn(filter.query);
              break;
            }
            case FlowsFilterKind.Identity: {
              wlSrcFilter.addDestinationIdentity(+filter.query);
              wlDstFilter.addDestinationIdentity(+filter.query);
              break;
            }
            case FlowsFilterKind.Pod: {
              wlSrcFilter.addDestinationPod(`${namespace}/${filter.query}`);
              wlDstFilter.addDestinationPod(`${namespace}/${filter.query}`);
              shouldAddPodFilter = false;
              break;
            }
          }
          break;
        }
      }
    });

    if (shouldAddPodFilter) {
      wlSrcFilter.addSourcePod(`${namespace}/`);
      wlDstFilter.addDestinationPod(`${namespace}/`);
    }

    wlSrcFilter.addReply(false);
    wlDstFilter.addReply(false);
    const wlFilters: FlowFilter[] = [wlSrcFilter, wlDstFilter];

    // *** blacklist filters section ***
    const blFilters: FlowFilter[] = [];

    // filter out reserved:unknown
    const [blSrcUnknownLabelFilter, blDstUnknownLabelFilter] = [
      new FlowFilter(),
      new FlowFilter(),
    ];
    blSrcUnknownLabelFilter.addSourceLabel(ReservedLabel.Unknown);
    blDstUnknownLabelFilter.addDestinationLabel(ReservedLabel.Unknown);
    blFilters.push(blSrcUnknownLabelFilter, blDstUnknownLabelFilter);

    if (filters?.skipHost) {
      // filter out reserved:host
      const [blSrcHostLabelFilter, blDstHostLabelFilter] = [
        new FlowFilter(),
        new FlowFilter(),
      ];
      blSrcHostLabelFilter.addSourceLabel(ReservedLabel.Host);
      blDstHostLabelFilter.addDestinationLabel(ReservedLabel.Host);
      blFilters.push(blSrcHostLabelFilter, blDstHostLabelFilter);
    }

    if (filters?.skipKubeDns) {
      // filter out kube-dns
      const [blSrcKubeDnsFilter, blDstKubeDnsFilter] = [
        new FlowFilter(),
        new FlowFilter(),
      ];
      blSrcKubeDnsFilter.addSourceLabel(SpecialLabel.KubeDNS);
      blDstKubeDnsFilter.addDestinationLabel(SpecialLabel.KubeDNS);
      blDstKubeDnsFilter.addDestinationPort('53');
      blFilters.push(blSrcKubeDnsFilter, blDstKubeDnsFilter);
    }

    if (filters?.skipRemoteNode) {
      // filter out reserved:remote-node
      const [blSrcRemoteNodeLabelFilter, blDstRemoteNodeLabelFilter] = [
        new FlowFilter(),
        new FlowFilter(),
      ];
      blSrcRemoteNodeLabelFilter.addSourceLabel(ReservedLabel.RemoteNode);
      blDstRemoteNodeLabelFilter.addDestinationLabel(ReservedLabel.RemoteNode);
      blFilters.push(blSrcRemoteNodeLabelFilter, blDstRemoteNodeLabelFilter);
    }

    if (filters?.skipPrometheusApp) {
      // filter out prometheus app
      const [blSrcPrometheusFilter, blDstPrometheusFilter] = [
        new FlowFilter(),
        new FlowFilter(),
      ];
      blSrcPrometheusFilter.addSourceLabel(SpecialLabel.PrometheusApp);
      blDstPrometheusFilter.addDestinationLabel(SpecialLabel.PrometheusApp);
      blFilters.push(blSrcPrometheusFilter, blDstPrometheusFilter);
    }

    // filter out intermediate dns requests
    const [blSrcLocalDnsFilter, blDstLocalDnsFilter] = [
      new FlowFilter(),
      new FlowFilter(),
    ];
    blSrcLocalDnsFilter.addSourceFqdn('*.cluster.local*');
    blDstLocalDnsFilter.addDestinationFqdn('*.cluster.local*');
    blFilters.push(blSrcLocalDnsFilter, blDstLocalDnsFilter);

    // filter out icmp flows
    const [blICMPv4Filter, blICMPv6Filter] = [
      new FlowFilter(),
      new FlowFilter(),
    ];
    blICMPv4Filter.addProtocol('ICMPv4');
    blICMPv6Filter.addProtocol('ICMPv6');
    blFilters.push(blICMPv4Filter, blICMPv6Filter);

    return [wlFilters, blFilters];
  }

  constructor(stream: GRPCEventStream) {
    super();

    this.stream = stream;

    this.setupThrottledHandlers();
    this.setupEventHandlers();
  }

  private setupThrottledHandlers() {
    this.throttledFlowReceived = throttle(() => {
      this.emit(EventKind.Flows, this.flowBuffer);
      this.flowBuffer = [];
    }, this.flowsDelay);
  }

  private setupEventHandlers() {
    this.stream.on(GeneralStreamEventKind.Data, (res: GetEventsResponse) => {
      const eventKind = res.getEventCase();

      switch (eventKind) {
        case EventCase.EVENT_NOT_SET:
          return;
        case EventCase.FLOW:
          return this.onFlowReceived(res.getFlow());
        case EventCase.SERVICE_STATE:
          return this.onServiceReceived(res.getServiceState());
        case EventCase.SERVICE_LINK_STATE:
          return this.onLinkReceived(res.getServiceLinkState());
        case EventCase.K8S_NAMESPACE_STATE:
          return this.onNamespaceReceived(res.getK8sNamespaceState());
      }
    });

    this.stream.on(GeneralStreamEventKind.Status, (st: Status) => {
      this.emit(GeneralStreamEventKind.Status, st);
    });

    this.stream.on(GeneralStreamEventKind.Error, (e: GRPCError) => {
      this.emit(GeneralStreamEventKind.Error, e);
    });

    this.stream.on(GeneralStreamEventKind.End, () => {
      this.emit(GeneralStreamEventKind.End);
    });
  }

  private onFlowReceived(flow: Flow | undefined) {
    if (flow == null) return;

    const hubbleFlow = dataHelpers.hubbleFlowFromPb(flow);

    this.flowBuffer.push(hubbleFlow);
    this.throttledFlowReceived();
  }

  private onServiceReceived(sstate: ServiceState | undefined) {
    if (sstate == null) return;

    const svc = sstate.getService();
    const ch = sstate.getType();

    if (!svc || !ch) return;

    const service = dataHelpers.relayServiceFromPb(svc);
    const change = dataHelpers.stateChangeFromPb(ch);

    this.emit(EventKind.Service, { service, change });
  }

  private onLinkReceived(link: ServiceLinkState | undefined) {
    if (link == null) return;

    const linkObj = link.getServiceLink();
    const ch = link.getType();

    if (!linkObj || !ch) return;

    this.emit(EventKind.ServiceLink, {
      serviceLink: dataHelpers.relayServiceLinkFromPb(linkObj),
      change: dataHelpers.stateChangeFromPb(ch),
    });
  }

  private onNamespaceReceived(ns: K8sNamespaceState | undefined) {
    if (ns == null) return;

    const nsObj = ns.getNamespace();
    const change = ns.getType();

    if (!nsObj || !change) return;

    this.emit(EventKind.Namespace, {
      name: nsObj.getName(),
      change: dataHelpers.stateChangeFromPb(change),
    });
  }

  public async stop(dropEventHandlers?: boolean) {
    dropEventHandlers = dropEventHandlers ?? false;
    if (dropEventHandlers) {
      this.offAllEvents();
    }

    this.stream.cancel();
  }

  public get flowsDelay() {
    return EventStream.FlowsThrottleDelay;
  }
}
