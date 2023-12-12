import { Stream, StreamOptions, StreamEvent } from '~/api/customprotocol-core';

import * as uipb from '~backend/proto/ui/ui_pb';

import { Notification as PBNotification } from '~backend/proto/ui/notifications_pb';

import * as helpers from '~/domain/helpers';
import { NamespaceChange } from '~/domain/events';
import { Notification } from '~/domain/notifications';

export enum Event {
  NamespaceChanges = 'ns-changes',
  Notification = 'notification',
}

export type Handlers = {
  [Event.NamespaceChanges]: (nsCh: NamespaceChange[]) => void;
  [Event.Notification]: (n: Notification) => void;
};

export type Options = StreamOptions & {};

export class ControlStream extends Stream<Handlers> {
  constructor(opts: Options) {
    super(opts);

    this.setupEventHandlers();
  }

  public onNamespaceChanges(fn: Handlers[Event.NamespaceChanges]): this {
    this.on(Event.NamespaceChanges, fn);
    return this;
  }

  public onNotification(fn: Handlers[Event.Notification]): this {
    this.on(Event.Notification, fn);
    return this;
  }

  private setupEventHandlers() {
    this.on(StreamEvent.Message, msg => {
      const resp = uipb.GetControlStreamResponse.fromBinary(msg.body);

      switch (resp.event.oneofKind) {
        case 'namespaces':
          return this.emitNamespaces(resp.event.namespaces);
        case 'notification':
          return this.emitNotification(resp.event.notification);
        case undefined:
        default:
          return;
      }
    });
  }

  private emitNamespaces(nss?: uipb.GetControlStreamResponse_NamespaceStates) {
    const changes = nss?.namespaces.reduce((acc, ns) => {
      const nsDesc = helpers.namespaces.fromPb(ns.namespace);
      if (nsDesc == null) return acc;

      return acc.concat({
        namespace: nsDesc,
        change: helpers.stateChangeFromPb(ns.type),
      });
    }, [] as NamespaceChange[]);

    if (!changes?.length) return;

    this.emit(Event.NamespaceChanges, changes);
  }

  private emitNotification(notif?: PBNotification) {
    if (!notif) return;

    const notification = helpers.notifications.fromPb(notif);
    if (notification == null) {
      console.error('invalid notification pb received: ', notif);
      return;
    }

    this.emit(Event.Notification, notification);
  }
}
