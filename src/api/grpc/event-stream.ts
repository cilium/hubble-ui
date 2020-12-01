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
  Flows as PBFlows,
} from '~backend/proto/ui/ui_pb';

import { Notification as PBNotification } from '~backend/proto/ui/notifications_pb';

import {
  Flow as PBFlow,
  FlowFilter,
  EventTypeFilter,
} from '~backend/proto/flow/flow_pb';

import { HubbleFlow } from '~/domain/hubble';
import { Flow } from '~/domain/flows';
import { CiliumEventTypes } from '~/domain/cilium';
import { ReservedLabel, SpecialLabel, Labels } from '~/domain/labels';
import {
  filterFlow,
  Filters,
  FilterEntry,
  FilterDirection,
  FilterKind,
} from '~/domain/filtering';
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
  public static readonly FlowsThrottleDelay: number = 250;

  private filters?: Filters;
  private stream: GRPCEventStream;
  private flowBuffer: Flow[] = [];
  private throttledFlowReceived: () => void = () => {
    return;
  };

  // TODO: add another params to handle filters
  public static buildRequest(
    opts: EventParams,
    filters: Filters,
  ): GetEventsRequest {
    const req = new GetEventsRequest();
    if (opts.flow) {
      req.addEventTypes(EventType.FLOW);
    }

    if (opts.flows) {
      req.addEventTypes(EventType.FLOWS);
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

    if (opts.status) {
      req.addEventTypes(EventType.STATUS);
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

  public static baseWhitelistFilter(filters?: Filters): FlowFilter {
    const wlFilter = new FlowFilter();

    const eventTypes: CiliumEventTypes[] = [];
    if (filters?.httpStatus) {
      // Filter by http status code allows only l7 event type
      eventTypes.push(CiliumEventTypes.L7);
      wlFilter.addHttpStatusCode(filters.httpStatus);
    } else {
      eventTypes.push(CiliumEventTypes.Drop, CiliumEventTypes.Trace);
    }

    eventTypes.forEach(eventTypeNumber => {
      const eventTypeFilter = new EventTypeFilter();
      eventTypeFilter.setType(eventTypeNumber);

      wlFilter.addEventType(eventTypeFilter);
    });

    if (filters?.verdict) {
      wlFilter.addVerdict(dataHelpers.verdictToPb(filters.verdict));
    }

    // TODO: code for handling tcp flags should be here
    // NOTE: 1.9.1 gets rid of that field, wait for the next release

    wlFilter.addReply(false);
    return wlFilter;
  }

  public static buildBlacklistFlowFilters(filters?: Filters): FlowFilter[] {
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

    return blFilters;
  }

  public static filterEntryWhitelistFilters(
    filters: Filters,
    filter: FilterEntry,
  ): FlowFilter[] {
    const { kind, direction, query } = filter;
    const wlFilters: FlowFilter[] = [];

    const podsInNamespace = `${filters.namespace}/`;
    const pod = filter.podNamespace
      ? `${filter.podNamespace}/${filter.query}`
      : `${filters.namespace}/${filter.query}`;

    if (filter.fromRequired) {
      // NOTE: this makes possible to catch flows [outside of ns] -> [ns]
      // NOTE: but flows [ns] -> [outside of ns] are lost...
      const toInside = EventStream.baseWhitelistFilter(filters);
      toInside.addDestinationPod(podsInNamespace);

      // NOTE: ...this filter fixes this last case
      const fromInside = EventStream.baseWhitelistFilter(filters);
      fromInside.addSourcePod(podsInNamespace);

      switch (kind) {
        case FilterKind.Label: {
          toInside.addSourceLabel(query);
          fromInside.addSourceLabel(query);
          break;
        }
        case FilterKind.Ip: {
          toInside.addSourceIp(query);
          fromInside.addSourceIp(query);
          break;
        }
        case FilterKind.Dns: {
          toInside.addSourceFqdn(query);
          fromInside.addSourceFqdn(query);
          break;
        }
        case FilterKind.Identity: {
          toInside.addSourceIdentity(+query);
          fromInside.addSourceIdentity(+query);
          break;
        }
        case FilterKind.Pod: {
          toInside.addSourcePod(pod);
          fromInside.clearSourcePodList();

          if (!pod.startsWith(podsInNamespace)) {
            fromInside.addDestinationPod(podsInNamespace);
          }
          fromInside.addSourcePod(pod);
          break;
        }
      }

      wlFilters.push(toInside, fromInside);
    }

    if (filter.toRequired) {
      // NOTE: this makes possible to catch flows [ns] -> [outside of ns]
      // NOTE: but flows [outside of ns] -> [ns] are lost...
      const fromInside = EventStream.baseWhitelistFilter(filters);
      fromInside.addSourcePod(podsInNamespace);

      // NOTE: ...this filter fixes this last case
      const toInside = EventStream.baseWhitelistFilter(filters);
      toInside.addDestinationPod(podsInNamespace);

      switch (kind) {
        case FilterKind.Label: {
          fromInside.addDestinationLabel(query);
          toInside.addDestinationLabel(query);
          break;
        }
        case FilterKind.Ip: {
          fromInside.addDestinationIp(query);
          toInside.addDestinationIp(query);
          break;
        }
        case FilterKind.Dns: {
          fromInside.addDestinationFqdn(query);
          toInside.addDestinationFqdn(query);
          break;
        }
        case FilterKind.Identity: {
          fromInside.addDestinationIdentity(+query);
          toInside.addDestinationIdentity(+query);
          break;
        }
        case FilterKind.Pod: {
          fromInside.addDestinationPod(pod);
          toInside.clearDestinationPodList();

          if (!pod.startsWith(podsInNamespace)) {
            toInside.addSourcePod(podsInNamespace);
          }
          toInside.addDestinationPod(pod);
          break;
        }
      }

      wlFilters.push(fromInside, toInside);
    }

    return wlFilters;
  }

  // Taken from previous FlowStream class
  public static buildFlowFilters(filters: Filters): FlowFilters {
    const namespace = filters?.namespace;

    const wlFilters: FlowFilter[] = [];
    const blFilters = EventStream.buildBlacklistFlowFilters(filters);

    const [wlSrcFilter, wlDstFilter] = [
      EventStream.baseWhitelistFilter(filters),
      EventStream.baseWhitelistFilter(filters),
    ];

    if (!filters.filters?.length) {
      wlSrcFilter.addSourcePod(`${namespace}/`);
      wlDstFilter.addDestinationPod(`${namespace}/`);

      wlFilters.push(wlSrcFilter, wlDstFilter);
      return [wlFilters, blFilters];
    }

    filters.filters.forEach(filter => {
      const feWlFilters = EventStream.filterEntryWhitelistFilters(
        filters,
        filter,
      );

      wlFilters.push(...feWlFilters);
    });

    return [wlFilters, blFilters];
  }

  constructor(stream: GRPCEventStream, filters?: Filters) {
    super();

    this.stream = stream;
    this.filters = filters;

    this.setupThrottledHandlers();
    this.setupEventHandlers();
  }

  private setupThrottledHandlers() {
    this.throttledFlowReceived = throttle(() => {
      this.emit(EventKind.Flows, this.flowBuffer.reverse());
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
        case EventCase.FLOWS:
          return this.onFlowsReceived(res.getFlows());
        case EventCase.SERVICE_STATE:
          return this.onServiceReceived(res.getServiceState());
        case EventCase.SERVICE_LINK_STATE:
          return this.onLinkReceived(res.getServiceLinkState());
        case EventCase.K8S_NAMESPACE_STATE:
          return this.onNamespaceReceived(res.getK8sNamespaceState());
        case EventCase.NOTIFICATION:
          return this.onNotificationReceived(res.getNotification());
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

  private onNotificationReceived(notif: PBNotification | undefined) {
    if (notif == null) return;

    const notification = dataHelpers.notifications.fromPb(notif);
    if (notification == null) {
      console.error('invalid notification pb received: ', notif);
      return;
    }

    this.emit(EventKind.Notification, notification);
  }

  private onFlowReceived(pbFlow: PBFlow | undefined) {
    if (pbFlow == null) return;

    const flow = dataHelpers.flowFromRelay(
      dataHelpers.hubbleFlowFromPb(pbFlow),
    );

    if (this.filters == null || filterFlow(flow, this.filters)) {
      this.flowBuffer.push(flow);
      this.throttledFlowReceived();
    }
  }

  private onFlowsReceived(pbFlows: PBFlows | undefined) {
    if (pbFlows == null) return;

    const pbFlowsList = pbFlows.getFlowsList();
    if (pbFlowsList.length === 0) return;

    pbFlowsList.forEach(pbFlow => {
      const flow = dataHelpers.flowFromRelay(
        dataHelpers.hubbleFlowFromPb(pbFlow),
      );
      if (this.filters == null || filterFlow(flow, this.filters)) {
        this.flowBuffer.push(flow);
      }
    });

    if (this.flowBuffer.length === 0) return;

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
