import { API } from '~/api/general';
import * as mockData from '~/api/__mocks__/data';
import { GrpcWrappedError } from '~/api/grpc/error';
import {
  ControlStream as IControlStream,
  NotificationStream as INotificationStream,
} from '~/api/general/control-stream';

import { Notification } from '~/domain/notifications';
import { FiltersDiff } from '~/domain/filtering';
import { Flow } from '~/domain/flows';
import { StateChange, setupDebugProp } from '~/domain/misc';
import { DataMode } from '~/domain/interactions';
import {
  NamespaceChange,
  ServiceChange,
  ServiceLinkChange,
} from '~/domain/events';

import { EventEmitter } from '~/utils/emitter';
import {
  EventParamsSet,
  EventStream as IEventStream,
  FlowsStream as IFlowsStream,
} from '~/api/general/event-stream';

import { Store, StoreFrame } from '~/store';
import { RegularStream } from '~/api/general/stream-utils';
import { EventKind, StreamKind } from './common';

// NOTE: NamespaceAdded is the only namespace-related event, cz
// NOTE: store.applyNamespaceChange is invoked directly when namespace event
// NOTE: occurs
type Events = {
  [EventKind.StreamError]: (err: GrpcWrappedError, _: StreamKind) => void;
  [EventKind.StreamEnd]: (_: StreamKind) => void;
  [EventKind.StreamsReconnecting]: () => void;
  [EventKind.StreamsReconnected]: () => void;
  [EventKind.FlowsDiff]: (frame: StoreFrame, diff: number) => void;
  [EventKind.StoreMocked]: () => void;
  [EventKind.NamespaceAdded]: (namespace: string) => void;
  [EventKind.Notification]: (notif: Notification) => void;
  [EventKind.DataModeSwitched]: () => void;
};

export class DataManager extends EventEmitter<Events> {
  private api: API;
  private store: Store;

  // NOTE: this is an initial stream, which fetches control information to make
  // NOTE: UI works independent of what app is opened
  private controlStream: IControlStream | null = null;

  // NOTE: this stream starts when namespace is selected and we are going to
  // NOTE: receive events for service map application
  private eventStream: IEventStream | null = null;

  private reconnectingStreams: Set<StreamKind> = new Set();

  constructor(api: API, store: Store) {
    super();

    this.api = api;
    this.store = store;

    setupDebugProp({
      stopAllStreams: () => {
        this.stopAllStreams();
      },
    });
  }

  public setupMock() {
    this.store.controls.setCurrentNamespace(mockData.selectedNamespace);
    this.store.controls.setCrossNamespaceActivity(true);
    this.store.setup(mockData);

    this.emit(EventKind.StoreMocked);
  }

  public featuresChanged() {
    this.setCurrentTransferState();
    this.resetControlStream();
    this.resetDataStreams();
  }

  // NOTE: this is a primary method to call on namespace change
  public async namespaceChanged(newNamespace: string | null) {
    console.log('in namespaceChanged: ', newNamespace);
    this.dropDataStreams();
    this.store.flush({ globalFrame: true });
    this.setupDataStream(newNamespace);
  }

  public setCurrentTransferState() {
    // NOTE: do nothing because reconnecting is managed inside of event callbacks
    if (this.reconnectingStreams.size > 0) return;

    this.transferState.switchToRealtimeStreaming();

    if (this.transferState.isDisabled) {
      this.transferState.switchToRealtimeStreaming();
    } else {
      this.transferState.setStable();
    }
  }

  // NOTE: call this method when data stream should be considered to adjust
  public filtersChanged(changes?: FiltersDiff) {
    console.log('filtersChanged: ', changes, this.transferState);

    if (changes?.namespace.changed) {
      this.namespaceChanged(changes.namespace.after ?? null);
      this.setCurrentTransferState();
      return;
    }

    this.dropDataStreams();

    if (changes?.podFiltersChanged) {
      this.store.flush({ globalFrame: true });
    }

    this.store.resetCurrentFrame(this.store.filters);
    this.setupDataStream();

    this.setCurrentTransferState();
  }

  public setupControlStream() {
    console.log('setting up control stream');
    const stream = this.api.v1.getControlStream();
    this.controlStream = stream;

    this.setupControlStreamHandlers(stream);
  }

  public setupEventStream(namespace?: string | null) {
    console.log('setting up service-map event stream, ns: ' + namespace);
    const filters = this.store.filters.clone().setNamespace(namespace || null);
    const stream = this.api.v1.getEventStream(
      EventParamsSet.AllButNamespaces,
      filters,
    );

    this.setupGeneralEventHandlers(stream, StreamKind.ServiceMap);
    this.setupNotificationEventHandlers(stream);
    this.setupServicesEventHandlers(stream, this.store.currentFrame);
    this.setupNamespaceEventHandlers(stream);

    this.eventStream = stream;
  }

  public async setupDataStream(ns?: string | null) {
    if (ns == null) {
      ns = this.store.filters.namespace;

      if (ns == null) {
        console.info(
          'Unknown state: trying to setup data stream when no in clusterwide ' +
            'mode and no namespace is set. Data stream will not be set up.',
        );
        return;
      }
    }

    this.setupEventStream(ns);
  }

  public setupCurrentNamespaceEventStream() {
    this.setupEventStream(this.store.controls.currentNamespace);
  }

  // public switchToLiveMode(ns?: string | null) {
  //   ns = ns || this.store.filters.namespace;

  //   this.dropDataStreams();
  //   this.dropControlStream();

  //   this.store.flush();
  //   this.store.controls.setDataMode(DataMode.RealtimeStreaming);

  //   this.setupControlStream();
  //   this.setupDataStream(ns);

  //   this.emit(EventKind.DataModeSwitched);
  // }

  public dropEventStream() {
    this.eventStream?.stop(true);
    this.eventStream = null;
  }

  public dropControlStream() {
    this.controlStream?.stop(true);
    this.controlStream = null;
  }

  public resetControlStream() {
    this.dropControlStream();
    this.setupControlStream();
  }

  public resetDataStreams() {
    this.dropDataStreams();
    this.setupDataStream();
  }

  public stopAllStreams() {
    this.dropControlStream();
    this.dropEventStream();
  }

  private dropDataStreams() {
    // console.log('dropping data streams');
    if (this.eventStream != null) {
      this.dropEventStream();
    }
  }

  private setupControlStreamHandlers(stream: IControlStream) {
    this.setupGeneralEventHandlers(stream, StreamKind.Control);
    this.setupNotificationEventHandlers(stream);

    stream.onNamespaceChange(nsChange => {
      const { namespace, change } = nsChange;
      this.store.applyNamespaceChange(namespace, change);

      if (nsChange.change === StateChange.Added) {
        this.emit(EventKind.NamespaceAdded, namespace);
      }
    });
  }

  private setupNamespaceEventHandlers(stream: IEventStream) {
    stream.onNamespaceChange((nsChange: NamespaceChange) => {
      const { namespace, change } = nsChange;
      this.store.applyNamespaceChange(namespace, change);

      if (nsChange.change === StateChange.Added) {
        this.emit(EventKind.NamespaceAdded, namespace);
      }
    });
  }

  private setupServicesEventHandlers(stream: IEventStream, frame: StoreFrame) {
    stream.onServiceChange((svcChange: ServiceChange) => {
      frame.applyServiceChange(svcChange.service, svcChange.change);
    });

    this.setupFlowsEventHandler(stream, frame);

    stream.onServiceLinkChange((link: ServiceLinkChange) => {
      frame.applyServiceLinkChange(link.serviceLink, link.change);
    });
  }

  private setupFlowsEventHandler(stream: IFlowsStream, _frame?: StoreFrame) {
    const frame = _frame ?? this.store.currentFrame;

    stream.onFlows((flows: Flow[]) => {
      const { flowsDiffCount } = frame.addFlows(flows);

      flows.forEach(f => {
        if (f.http == null) return;

        console.log('flow.http: ', f.http, f);
      });
      this.emit(EventKind.FlowsDiff, frame, flowsDiffCount);
    });
  }

  private setupNotificationEventHandlers(stream: INotificationStream) {
    stream.onNotification(notif => {
      if (notif.status != null) {
        this.transferState.setDeploymentStatus(notif.status);
      }

      this.emit(EventKind.Notification, notif);
    });
  }

  private setupGeneralEventHandlers(stream: RegularStream, kind: StreamKind) {
    stream.onError(err => {
      console.error(`${kind} stream error: `, err);
      this.emit(EventKind.StreamError, err, kind);
    });

    stream.onEnd(() => {
      this.emit(EventKind.StreamEnd, kind);
    });

    stream.onReconnectingStarted(() => {
      this.reconnectingStreams.add(kind);
      this.emit(EventKind.StreamsReconnecting);
    });

    stream.onReconnectingSuccess(() => {
      this.reconnectingStreams.delete(kind);

      if (this.reconnectingStreams.size === 0) {
        this.emit(EventKind.StreamsReconnected);
        this.setCurrentTransferState();
      }
    });

    stream.onReconnectingFailed(() => {
      this.transferState.setReconnectFailed();
    });

    stream.onReconnectingDelay(di => {
      // NOTE: this works because Set maintains insertion order
      if ([...this.reconnectingStreams][0] !== kind) return;

      this.transferState.setWaitingForReconnect(di.remaining);
    });
  }

  public get flowsDelay(): number | undefined {
    return this.eventStream?.flowsDelay;
  }

  public get hasEventStream(): boolean {
    return !!this.eventStream;
  }

  public get hasControlStream(): boolean {
    return !!this.controlStream;
  }

  public get transferState() {
    return this.store.controls.transferState;
  }
}
