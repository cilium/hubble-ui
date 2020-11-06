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
  private mainStream: StreamDescriptor | null = null;
  private filteringStream: StreamDescriptor | null = null;

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

  public setupMainStream(namespace: string) {
    const store = this.store;
    const streamParams = store.controls.mainFilters
      .clone()
      .setNamespace(namespace);

    const stream = this.api.v1.getEventStream(
      {
        ...EventParamsSet.All,
        status: true,
      },
      streamParams,
    );

    this.setupGeneralEventHandlers(stream);
    this.setupNamespaceEventHandlers(stream);
    this.setupServicesEventHandlers(stream, store.mainFrame);

    this.mainStream = { stream, filters: streamParams };
  }

  public dropMainStream() {
    if (this.mainStream == null) return;

    this.mainStream.stream.stop();
    this.offAllStreamEvents(this.mainStream.stream);
    this.mainStream = null;
  }

  public setupFilteringFrame(namespace: string) {
    const store = this.store;
    const streamParams = store.controls.filters.clone().setNamespace(namespace);

    const secondaryFrame = store
      .createFrame()
      .applyFrame(store.currentFrame, streamParams);

    store.pushFrame(secondaryFrame);

    const stream = this.api.v1.getEventStream(EventParamsSet.All, streamParams);
    this.setupGeneralEventHandlers(stream);
    this.setupNamespaceEventHandlers(stream);
    this.setupServicesEventHandlers(stream, secondaryFrame, streamParams);

    this.filteringStream = { stream, filters: streamParams };
  }

  public dropFilteringFrame() {
    if (this.filteringStream == null) return;

    this.filteringStream.stream.stop();
    this.offAllStreamEvents(this.filteringStream.stream);
    this.filteringStream = null;
    this.store.squashFrames();
  }

  public setupInitialStream() {
    console.log('setting up initial stream');
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
    if (this.mainStream) {
      this.dropMainStream();
      this.store.flush();
    }

    this.dropInitialStream();
    this.setupMainStream(namespace);
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
    if (this.mainStream) {
      this.mainStream.stream.stop();
      this.offAllStreamEvents(this.mainStream.stream);
    }

    if (this.initialStream) {
      this.initialStream.stream.stop();
      this.offAllStreamEvents(this.initialStream.stream);
    }

    if (this.filteringStream) {
      this.filteringStream.stream.stop();
      this.offAllStreamEvents(this.filteringStream.stream);
    }
  }

  public get flowsDelay(): number | undefined {
    return this.mainStream?.stream.flowsDelay;
  }

  public get currentNamespace(): string | undefined {
    return this.mainStream?.filters?.namespace || undefined;
  }

  public get hasFilteringStream(): boolean {
    return this.filteringStream != null;
  }

  public get hasInitialStream(): boolean {
    return this.initialStream != null;
  }

  public get filtersChanged(): boolean {
    if (this.filteringStream != null && this.filteringStream.filters) {
      return !this.store.controls.filters.equals(this.filteringStream.filters);
    }

    if (this.mainStream != null && this.mainStream.filters) {
      return !this.store.controls.filters.equals(this.mainStream.filters);
    }

    return false;
  }
}
