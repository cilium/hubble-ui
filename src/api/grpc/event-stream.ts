import { ClientReadableStream } from 'grpc-web';

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

import { Flow as PBFlow, FlowFilter } from '~backend/proto/flow/flow_pb';
import {
  EventStream as IEventStream,
  EventParams,
  EventKind,
} from '~/api/general/event-stream';
import { GRPCStream, GRPCStreamEvent, Options } from '~/api/grpc/stream';
import { Handlers } from '~/api/general/event-stream';
import * as common from '~/api/grpc/common';

import { Flow } from '~/domain/flows';
import { filterFlow, Filters } from '~/domain/filtering';
import * as helpers from '~/domain/helpers';

import { ThrottledEmitter } from '~/utils/throttled-emitter';

import EventCase = GetEventsResponse.EventCase;
type GRPCEventStream = ClientReadableStream<GetEventsResponse>;

export class EventStream
  extends GRPCStream<GetEventsResponse, Handlers>
  implements IEventStream
{
  public static readonly FlowsThrottleDelay: number = 1000;

  private _filters?: Filters;
  private flowsThrottler: ThrottledEmitter<Flow>;

  public static buildRequest(
    opts: EventParams,
    filters: Filters,
  ): GetEventsRequest {
    const req = new GetEventsRequest();

    if (opts.flows) {
      req.addEventTypes(EventType.FLOWS);
    }

    if (opts.flow) {
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

    if (opts.status) {
      req.addEventTypes(EventType.STATUS);
    }

    const [wlFlowFilters, blFlowFilters] = common.buildFlowFilters(filters);

    const wlFilters = wlFlowFilters.map(flowFilterToEventFilter);
    const blFilters = blFlowFilters.map(flowFilterToEventFilter);

    req.setWhitelistList(wlFilters);
    req.setBlacklistList(blFilters);

    return req;
  }

  constructor(
    stream: GRPCEventStream,
    filters?: Filters,
    opts?: Options<GetEventsResponse>,
  ) {
    super(stream, opts);

    this._filters = filters;
    this.flowsThrottler = new ThrottledEmitter(EventStream.FlowsThrottleDelay);

    this.setupEventHandlers();
  }

  public onFlow(cb: Handlers[EventKind.Flow]) {
    this.on(EventKind.Flow, cb);
  }

  public onFlows(cb: Handlers[EventKind.Flows]) {
    this.on(EventKind.Flows, cb);
  }

  public onRawFlow(cb: Handlers[EventKind.RawFlow]) {
    this.on(EventKind.RawFlow, cb);
  }

  public onNamespaceChange(cb: Handlers[EventKind.Namespace]) {
    this.on(EventKind.Namespace, cb);
  }

  public onServiceChange(cb: Handlers[EventKind.Service]) {
    this.on(EventKind.Service, cb);
  }

  public onServiceLinkChange(cb: Handlers[EventKind.ServiceLink]) {
    this.on(EventKind.ServiceLink, cb);
  }

  public onNotification(cb: Handlers[EventKind.Notification]) {
    this.on(EventKind.Notification, cb);
  }

  private setupEventHandlers() {
    this.on(GRPCStreamEvent.Data, (res: GetEventsResponse) => {
      const eventKind = res.getEventCase();

      switch (eventKind) {
        case EventCase.EVENT_NOT_SET:
          return;
        case EventCase.FLOW:
          return this.emitFlow(res.getFlow());
        case EventCase.FLOWS:
          return this.emitFlows(res.getFlows());
        case EventCase.SERVICE_STATE:
          return this.emitServiceChange(res.getServiceState());
        case EventCase.SERVICE_LINK_STATE:
          return this.emitLinkChange(res.getServiceLinkState());
        case EventCase.K8S_NAMESPACE_STATE:
          return this.emitNamespaceChange(res.getK8sNamespaceState());
        case EventCase.NOTIFICATION:
          return this.emitNotification(res.getNotification());
      }
    });

    this.flowsThrottler.on(flows => {
      this.emit(EventKind.Flows, flows);
    });
  }

  private emitNotification(notif: PBNotification | undefined) {
    if (notif == null) return;

    const notification = helpers.notifications.fromPb(notif);
    if (notification == null) {
      console.error('invalid notification pb received: ', notif);
      return;
    }

    this.emit(EventKind.Notification, notification);
  }

  private emitFlow(pbFlow: PBFlow | undefined) {
    if (pbFlow == null) return;

    const hubbleFlow = helpers.flows.hubbleFlowFromPb(pbFlow);
    const flow = new Flow(hubbleFlow);

    if (this.filters == null || filterFlow(flow, this.filters)) {
      this.flowsThrottler.emit(flow);
      this.emit(EventKind.RawFlow, hubbleFlow);
    }
  }

  private emitFlows(pbFlows: PBFlows | undefined) {
    if (pbFlows == null) return;

    const pbFlowsList = pbFlows.getFlowsList();
    if (pbFlowsList.length === 0) return;

    pbFlowsList.forEach(pbFlow => {
      const hubbleFlow = helpers.flows.hubbleFlowFromPb(pbFlow);
      const flow = new Flow(hubbleFlow);
      if (this.filters == null || filterFlow(flow, this.filters)) {
        this.flowsThrottler.emit(flow);
        this.emit(EventKind.RawFlow, hubbleFlow);
      }
    });
  }

  private emitServiceChange(sstate: ServiceState | undefined) {
    if (sstate == null) return;

    const svc = sstate.getService();
    const ch = sstate.getType();

    if (!svc || !ch) return;

    const service = helpers.relayServiceFromPb(svc);
    const change = helpers.stateChangeFromPb(ch);

    this.emit(EventKind.Service, { service, change });
  }

  private emitLinkChange(link: ServiceLinkState | undefined) {
    if (link == null) return;

    const linkObj = link.getServiceLink();
    const ch = link.getType();

    if (!linkObj || !ch) return;

    this.emit(EventKind.ServiceLink, {
      serviceLink: helpers.relayServiceLinkFromPb(linkObj),
      change: helpers.stateChangeFromPb(ch),
    });
  }

  private emitNamespaceChange(ns: K8sNamespaceState | undefined) {
    if (ns == null) return;
    const change = ns.getType();
    const namespace = ns.getNamespace();

    if (!change || !namespace) return;

    this.emit(EventKind.Namespace, {
      namespace: namespace.getName(),
      change: helpers.stateChangeFromPb(change),
    });
  }

  public get flowsDelay() {
    return EventStream.FlowsThrottleDelay;
  }

  public get filters(): Filters | undefined {
    return this._filters;
  }
}

const flowFilterToEventFilter = (flowFilter: FlowFilter) => {
  const filter = new EventFilter();
  filter.setFlowFilter(flowFilter);
  return filter;
};
