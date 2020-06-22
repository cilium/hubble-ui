import { throttle } from 'lodash';
import { ClientReadableStream, Status, Error as GRPCError } from 'grpc-web';

import {
  GetEventsRequest,
  GetEventsResponse,
  RelayEventType,
  RelayEventFilter,
  ServiceState,
  ServiceLinkState,
  K8sNamespaceState,
} from '~/proto/relay/relay_pb';

import { Flow, FlowFilter, EventTypeFilter } from '~/proto/flow/flow_pb';

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

import EventCase = GetEventsResponse.EventCase;
import { GeneralStreamEventKind } from '../general/stream';

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
            case FlowsFilterKind.Identity: {
              wlSrcFilter.addSourceIdentity(+filter.query);
              wlDstFilter.addDestinationIdentity(+filter.query);
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
