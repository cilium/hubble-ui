import _ from 'lodash';
import { ClientReadableStream } from 'grpc-web';

import {
  GetEventsRequest,
  GetEventsResponse,
  RelayEventType,
  RelayEventFilter,
  ServiceState,
  ServiceLinkState,
  K8sNamespaceState,
} from '~common/proto/relay/relay_pb';

import { Flow, FlowFilter, EventTypeFilter } from '~common/proto/flow/flow_pb';

import { HubbleFlow } from '~/domain/hubble';
import { FlowsFilterDirection, FlowsFilterKind } from '~/domain/flows';
import { CiliumEventTypes } from '~/domain/cilium';
import { ReservedLabel } from '~/domain/labels';
import * as dataHelpers from '~/domain/helpers';

import { EventEmitter } from '~/utils/emitter';
import {
  IEventStream,
  EventParams,
  EventStreamHandlers,
  EventKind,
  DataFilters,
} from '~/api/general/event-stream';

import { NamespaceChange } from '~/api/general/event-stream';

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
    filters?: DataFilters,
  ): GetEventsRequest {
    const req = new GetEventsRequest();

    if (opts.flows) {
      req.addEventTypes(RelayEventType.FLOW);
    }

    if (opts.namespaces) {
      req.addEventTypes(RelayEventType.K8S_NAMESPACE_STATE);
    }

    if (opts.services) {
      req.addEventTypes(RelayEventType.SERVICE_STATE);
    }

    if (opts.serviceLinks) {
      req.addEventTypes(RelayEventType.SERVICE_LINK_STATE);
    }

    const [wlFlowFilters, blFlowFilters] = EventStream.buildFlowFilters(
      filters,
    );

    const ffToEventFilter = (ff: FlowFilter) => {
      const filter = new RelayEventFilter();
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
  public static buildFlowFilters(filters?: DataFilters): FlowFilters {
    const [wlSrcFilter, wlDstFilter] = [new FlowFilter(), new FlowFilter()];
    const [blSrcFilter, blDstFilter] = [new FlowFilter(), new FlowFilter()];

    const eventTypes = [CiliumEventTypes.L7];
    if (filters?.httpStatus) {
      // Filter by http status code allows only l7 event type
      wlSrcFilter.addHttpStatusCode(filters.httpStatus);
      wlDstFilter.addHttpStatusCode(filters.httpStatus);
    } else {
      eventTypes.push(CiliumEventTypes.DROP, CiliumEventTypes.TRACE);
    }

    eventTypes.forEach(eventTypeNumber => {
      const eventTypeFilter = new EventTypeFilter();
      eventTypeFilter.setType(eventTypeNumber);

      wlSrcFilter.addEventType(eventTypeFilter);
      wlDstFilter.addEventType(eventTypeFilter);
    });

    wlSrcFilter.addSourcePod(`${filters?.namespace}/`);
    wlDstFilter.addDestinationPod(`${filters?.namespace}/`);

    if (filters?.verdict) {
      // TODO: replace "as any" with `verdictToPb`
      wlSrcFilter.addVerdict(dataHelpers.verdictToPb(filters.verdict));
      wlDstFilter.addVerdict(dataHelpers.verdictToPb(filters.verdict));
    }

    filters?.filters.forEach(filter => {
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
          }
          break;
        }
      }
    });

    wlSrcFilter.addReply(false);
    wlDstFilter.addReply(false);

    blSrcFilter.addSourceLabel(ReservedLabel.Unknown);
    blDstFilter.addDestinationLabel(ReservedLabel.Unknown);

    const wlFilters: FlowFilter[] = [wlSrcFilter, wlDstFilter];
    const blFilters: FlowFilter[] = [blSrcFilter, blDstFilter];

    return [wlFilters, blFilters];
  }

  constructor(stream: GRPCEventStream) {
    super();

    this.stream = stream;

    this.setupThrottledHandlers();
    this.setupEventHandlers();
  }

  private setupThrottledHandlers() {
    this.throttledFlowReceived = _.throttle(() => {
      this.emit(EventKind.Flows, this.flowBuffer);
      this.flowBuffer = [];
    });
  }

  private setupEventHandlers() {
    this.stream.on('data', (res: GetEventsResponse) => {
      const eventKind = res.getEventCase();

      switch (eventKind) {
        case EventCase.EVENT_NOT_SET:
          return;
        case EventCase.FLOW:
          return this.onFlowReceived(res.getFlow()!);
        case EventCase.SERVICE_STATE:
          return this.onServiceReceived(res.getServiceState()!);
        case EventCase.SERVICE_LINK_STATE:
          return this.onLinkReceived(res.getServiceLinkState()!);
        case EventCase.K8S_NAMESPACE_STATE:
          return this.onNamespaceReceived(res.getK8sNamespaceState()!);
      }
    });
  }

  private onFlowReceived(flow: Flow) {
    const hubbleFlow = dataHelpers.hubbleFlowFromPb(flow);

    this.flowBuffer.push(hubbleFlow);
    this.throttledFlowReceived();
  }

  private onServiceReceived(sstate: ServiceState) {
    const svc = sstate.getService();
    const ch = sstate.getType();

    if (!svc || !ch) return;

    const service = dataHelpers.relayServiceFromPb(svc);
    const change = dataHelpers.stateChangeFromPb(ch);

    this.emit(EventKind.Service, { service, change });
  }

  private onLinkReceived(link: ServiceLinkState) {
    const linkObj = link.getServiceLink();
    const ch = link.getType();

    if (!linkObj || !ch) return;

    this.emit(EventKind.ServiceLink, {
      serviceLink: dataHelpers.relayServiceLinkFromPb(linkObj),
      change: dataHelpers.stateChangeFromPb(ch),
    });
  }

  private onNamespaceReceived(ns: K8sNamespaceState) {
    const nsObj = ns.getNamespace();
    const change = ns.getType();

    if (!nsObj || !change) return;

    this.emit(EventKind.Namespace, {
      name: nsObj.getName(),
      change: dataHelpers.stateChangeFromPb(change),
    });
  }

  public async stop() {
    this.stream.cancel();
  }

  public get flowsDelay() {
    return EventStream.FlowsThrottleDelay;
  }
}
