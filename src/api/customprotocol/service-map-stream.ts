import { Stream, StreamOptions, StreamEvent, Message } from '~/api/customprotocol-core';
import { EventParams } from '~/api/general/event-stream';

import * as uipb from '~backend/proto/ui/ui_pb';
import * as flowpb from '~backend/proto/flow/flow_pb';
import * as notifpb from '~backend/proto/ui/notifications_pb';

import { ProtoFactory } from '~/factories/proto';
import * as helpers from '~/domain/helpers';
import { NamespaceChange, ServiceChange, ServiceLinkChange } from '~/domain/events';
import { Notification } from '~/domain/notifications';
import { Filters } from '~/domain/filtering';
import { Flow } from '~/domain/flows';

export enum Event {
  Flows = 'flows',
  Services = 'services',
  ServiceLinks = 'service-links',
  Namespaces = 'namespaces',
  Notifications = 'notifications',
}

export type Handlers = {
  [Event.Flows]: (f: Flow[]) => void;
  [Event.Services]: (svcs: ServiceChange[]) => void;
  [Event.ServiceLinks]: (l: ServiceLinkChange[]) => void;
  [Event.Notifications]: (n: Notification[]) => void;
  [Event.Namespaces]: (nsCh: NamespaceChange[]) => void;
};

export type Options = StreamOptions & {
  filters?: Filters;
  eventParams?: EventParams;
};

export class ServiceMapStream extends Stream<Handlers> {
  private filters?: Filters;
  private eventParams?: EventParams;

  constructor(opts: Options) {
    super(opts);

    this.filters = opts.filters;
    this.eventParams = opts.eventParams;
    this.setupEventHandlers();
  }

  public async updateEventFlags(eventParams: Partial<EventParams>) {
    const mergedEventParams = Object.assign({}, this.eventParams, eventParams);

    await this.send(msg => {
      const filters = this.filters || Filters.default();
      const req = ProtoFactory.getEventsRequestFromFilters(filters, mergedEventParams);

      const bytes = uipb.GetEventsRequest.toBinary(req);
      return msg.setBodyBytes(bytes);
    }).then(() => (this.eventParams = mergedEventParams));

    return this;
  }

  public getEventParams(): EventParams | null {
    return this.eventParams || null;
  }

  public onServices(fn: Handlers[Event.Services]): this {
    this.on(Event.Services, fn);
    return this;
  }

  public onServiceLinks(fn: Handlers[Event.ServiceLinks]): this {
    this.on(Event.ServiceLinks, fn);
    return this;
  }

  public onFlows(fn: Handlers[Event.Flows]): this {
    this.on(Event.Flows, fn);
    return this;
  }

  public onNamespaces(fn: Handlers[Event.Namespaces]): this {
    this.on(Event.Namespaces, fn);
    return this;
  }

  public onNotifications(fn: Handlers[Event.Notifications]): this {
    this.on(Event.Notifications, fn);
    return this;
  }

  private setupEventHandlers() {
    this.on(StreamEvent.Message, msg => {
      const resp = uipb.GetEventsResponse.fromBinary(msg.body);

      let flows: flowpb.Flow[] = [];
      const svcs: uipb.ServiceState[] = [];
      const links: uipb.ServiceLinkState[] = [];
      const nss: uipb.NamespaceState[] = [];
      const notifs: notifpb.Notification[] = [];

      resp.events.forEach(evt => {
        switch (evt.event.oneofKind) {
          case undefined:
            return;
          case 'flow':
            const f = evt.event.flow;
            if (f != null) flows.push(f);
            return;
          case 'flows':
            flows = flows.concat(evt.event.flows?.flows || []);
            return;
          case 'serviceState':
            const svc = evt.event.serviceState;
            if (svc != null) svcs.push(svc);
            return;
          case 'serviceLinkState':
            const link = evt.event.serviceLinkState;
            if (link != null) links.push(link);
            return;
          case 'namespaceState':
            const ns = evt.event.namespaceState;
            if (ns != null) nss.push(ns);
            return;
          case 'notification':
            const n = evt.event.notification;
            if (n != null) notifs.push(n);
            return;
        }
      });

      this.emitEverything(flows, svcs, links, nss, notifs);
    });
  }

  private emitEverything(
    flows: flowpb.Flow[],
    svcs: uipb.ServiceState[],
    links: uipb.ServiceLinkState[],
    nss: uipb.NamespaceState[],
    notifs: notifpb.Notification[],
  ) {
    if (flows.length > 0) {
      this.emitFlows(flows);
    }

    if (svcs.length > 0) {
      this.emitServices(svcs);
    }

    if (links.length > 0) {
      this.emitServiceLinks(links);
    }

    if (nss.length > 0) {
      this.emitNamespaces(nss);
    }

    if (notifs.length > 0) {
      this.emitNotifications(notifs);
    }
  }

  private emitNotifications(pbNotifs: notifpb.Notification[]) {
    const notifs = pbNotifs.reduce((acc, pbNotif) => {
      const notif = helpers.notifications.fromPb(pbNotif);
      if (notif == null) return acc;

      return acc.concat(notif);
    }, [] as Notification[]);

    this.emit(Event.Notifications, notifs);
  }

  private emitNamespaces(pbNamespaces: uipb.NamespaceState[]) {
    const nss = pbNamespaces.reduce((acc, pbNs) => {
      const nsDesc = helpers.namespaces.fromPb(pbNs.namespace);
      const change = pbNs.type;

      if (!nsDesc || !change) return acc;

      return acc.concat({
        namespace: nsDesc,
        change: helpers.stateChangeFromPb(change),
      });
    }, [] as NamespaceChange[]);

    this.emit(Event.Namespaces, nss);
  }

  private emitServiceLinks(pbLinks: uipb.ServiceLinkState[]) {
    const links = pbLinks.reduce((acc, pbLink) => {
      const linkObj = pbLink.serviceLink;
      const ch = pbLink.type;

      if (!linkObj || !ch) return acc;

      return acc.concat({
        serviceLink: helpers.relayServiceLinkFromPb(linkObj),
        change: helpers.stateChangeFromPb(ch),
      });
    }, [] as ServiceLinkChange[]);

    this.emit(Event.ServiceLinks, links);
  }

  private emitServices(pbSvcs: uipb.ServiceState[]) {
    const svcs = pbSvcs.reduce((acc, pbSvc) => {
      const svc = pbSvc.service;
      const ch = pbSvc.type;

      if (!svc || !ch) return acc;

      const service = helpers.relayServiceFromPb(svc);
      const change = helpers.stateChangeFromPb(ch);

      return acc.concat({ service, change });
    }, [] as ServiceChange[]);

    this.emit(Event.Services, svcs);
  }

  private emitFlows(pbFlows: flowpb.Flow[]) {
    const flows = pbFlows.map(pbFlow => {
      const hubbleFlow = helpers.flows.hubbleFlowFromPb(pbFlow);
      const flow = new Flow(hubbleFlow);

      return flow;
    });

    this.emit(Event.Flows, flows);
  }

  protected messageBuilder(msg: Message, isFirst: boolean): Message {
    if (!isFirst) return msg;

    const filters = this.filters || Filters.default();
    const req = ProtoFactory.getEventsRequestFromFilters(filters, this.eventParams);
    const bytes = uipb.GetEventsRequest.toBinary(req);

    return msg.setBodyBytes(bytes);
  }
}
