import _ from 'lodash';
import { API } from '~/api/general';
import * as mockData from '~/api/__mocks__/data';
import { GeneralStreamEventKind } from '~/api/general/stream';
import { Notification } from '~/api/general/event-stream';

import { HubbleFlow } from '~/domain/hubble';
import { Filters, filterFlow } from '~/domain/filtering';
import { Flow } from '~/domain/flows';
import { flowFromRelay } from '~/domain/helpers';
import { StateChange, setupDebugProp } from '~/domain/misc';

import { EventEmitter } from '~/utils/emitter';
import {
  EventParamsSet,
  EventKind as EventStreamEventKind,
  NamespaceChange,
  ServiceChange,
  ServiceLinkChange,
  IEventStream,
} from '~/api/general/event-stream';

import { Store, StoreFrame } from '~/store';

export enum EventKind {
  StreamError = 'stream-error',
  StreamEnd = 'stream-end',
  FlowsDiff = 'flows-diff',
  StoreMocked = 'store-mocked',
  NamespaceAdded = 'namespace-added',
  Notification = 'notification',
}

type Events = {
  [EventKind.StreamError]: () => void;
  [EventKind.StreamEnd]: () => void;
  [EventKind.FlowsDiff]: (frame: StoreFrame, diff: number) => void;
  [EventKind.StoreMocked]: () => void;
  [EventKind.NamespaceAdded]: (namespace: string) => void;
  [EventKind.Notification]: (notif: Notification) => void;
};

interface StreamDescriptor {
  stream: IEventStream;
  filters?: Filters;
}

export class DataManager extends EventEmitter<Events> {
  private api: API;
  private store: Store;

  private initialStream: StreamDescriptor | null = null;
  private currentStream: StreamDescriptor | null = null;

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

  public setupCurrentStream(namespace: string) {
    const store = this.store;
    const filters = store.controls.filters.clone().setNamespace(namespace);

    this.store.resetCurrentFrame(filters);

    const stream = this.api.v1.getEventStream(EventParamsSet.All, filters);
    this.setupGeneralEventHandlers(stream);
    this.setupNamespaceEventHandlers(stream);
    this.setupServicesEventHandlers(stream, store.currentFrame);

    this.currentStream = { stream, filters };
  }

  public dropCurrentStream() {
    if (this.currentStream == null) return;

    this.currentStream.stream.stop();
    this.offAllStreamEvents(this.currentStream.stream);
    this.currentStream = null;
  }

  public setupInitialStream() {
    const stream = this.api.v1.getEventStream({
      ...EventParamsSet.Namespaces,
      status: true,
    });

    this.setupGeneralEventHandlers(stream);
    this.setupNamespaceEventHandlers(stream);

    this.initialStream = { stream };
  }

  public dropInitialStream() {
    if (this.initialStream == null) return;

    this.initialStream.stream.stop();
    this.offAllStreamEvents(this.initialStream.stream);
    this.initialStream = null;
  }

  public resetNamespace(namespace: string) {
    if (this.currentStream) {
      this.dropCurrentStream();
    }

    this.store.flush();
    this.dropInitialStream();
    this.setupCurrentStream(namespace);
  }

  private setupNamespaceEventHandlers(stream: IEventStream) {
    stream.on(EventStreamEventKind.Namespace, (nsChange: NamespaceChange) => {
      this.store.applyNamespaceChange(nsChange.name, nsChange.change);

      if (nsChange.change === StateChange.Added) {
        this.emit(EventKind.NamespaceAdded, nsChange.name);
      }
    });
  }

  private setupServicesEventHandlers(
    stream: IEventStream,
    frame: StoreFrame,
    filters?: Filters,
  ) {
    stream.on(EventStreamEventKind.Service, (svcChange: ServiceChange) => {
      frame.applyServiceChange(svcChange.service, svcChange.change);
    });

    stream.on(EventStreamEventKind.Flows, (flows: Flow[]) => {
      const { flowsDiffCount } = frame.addFlows(flows);
      this.emit(EventKind.FlowsDiff, frame, flowsDiffCount);
    });

    stream.on(EventStreamEventKind.ServiceLink, (link: ServiceLinkChange) => {
      frame.applyServiceLinkChange(link.serviceLink, link.change);
    });
  }

  private setupGeneralEventHandlers(stream: IEventStream) {
    stream.on(EventStreamEventKind.Notification, notif => {
      this.emit(EventKind.Notification, notif);
    });

    stream.on(GeneralStreamEventKind.Error, () => {
      this.emit(EventKind.StreamError);
    });

    stream.on(GeneralStreamEventKind.End, () => {
      this.emit(EventKind.StreamEnd);
    });
  }

  private offAllStreamEvents(stream: IEventStream) {
    stream.offAllEvents();
  }

  private stopAllStreams() {
    if (this.initialStream) {
      this.initialStream.stream.stop();
      this.offAllStreamEvents(this.initialStream.stream);
    }

    if (this.currentStream) {
      this.currentStream.stream.stop();
      this.offAllStreamEvents(this.currentStream.stream);
    }
  }

  public get flowsDelay(): number | undefined {
    if (this.initialStream != null) {
      return this.initialStream.stream.flowsDelay;
    }

    return this.currentStream?.stream.flowsDelay;
  }

  public get currentNamespace(): string | undefined {
    return this.currentStream?.filters?.namespace || undefined;
  }

  public get hasCurrentStream(): boolean {
    return this.currentStream != null;
  }

  public get hasInitialStream(): boolean {
    return this.initialStream != null;
  }
}
