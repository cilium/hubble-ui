import { API } from '~/api/general';
import * as mockData from '~/api/__mocks__/data';
import { GeneralStreamEventKind } from '~/api/general/stream';

import { HubbleFlow } from '~/domain/hubble';
import { Filters } from '~/domain/filtering';
import { EventEmitter } from '~/utils/emitter';
import {
  EventParamsSet,
  EventKind as EventStreamEventKind,
  NamespaceChange,
  ServiceChange,
  ServiceLinkChange,
  IEventStream,
  DataFilters,
} from '~/api/general/event-stream';

import { Store, StoreFrame } from '~/store';
import { StateChange } from '~/domain/misc';

export enum EventKind {
  StreamError = 'stream-error',
  StreamEnd = 'stream-end',
  FlowsDiff = 'flows-diff',
  StoreMocked = 'store-mocked',
  NamespaceAdded = 'namespace-added',
}

type Events = {
  [EventKind.StreamError]: () => void;
  [EventKind.StreamEnd]: () => void;
  [EventKind.FlowsDiff]: (diff: number) => void;
  [EventKind.StoreMocked]: () => void;
  [EventKind.NamespaceAdded]: (namespace: string) => void;
};

interface StreamDescriptor {
  stream: IEventStream;
  dataFilters?: DataFilters;
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
  }

  public setupMock() {
    this.store.setup(mockData);
    this.store.controls.setCurrentNamespace(mockData.selectedNamespace);
    this.store.controls.setCrossNamespaceActivity(true);

    this.emit(EventKind.StoreMocked);
  }

  public setupMainStream(namespace: string) {
    const store = this.store;

    const streamParams = { ...store.controls.mainFilters, namespace };
    const stream = this.api.v1.getEventStream(EventParamsSet.All, streamParams);

    this.setupGeneralEventHandlers(stream);
    this.setupNamespaceEventHandlers(stream);
    this.setupServicesEventHandlers(stream, store.mainFrame);

    this.mainStream = { stream, dataFilters: streamParams };
  }

  public dropMainStream() {
    if (this.mainStream == null) return;

    this.mainStream.stream.stop();
    this.offAllStreamEvents(this.mainStream.stream);
    this.mainStream = null;
  }

  public setupFilteringFrame(namespace: string) {
    const store = this.store;
    const streamParams = { ...store.controls.dataFilters, namespace };

    const secondaryFrame = store.currentFrame.filter(streamParams as Filters);
    store.pushFrame(secondaryFrame);

    const stream = this.api.v1.getEventStream(EventParamsSet.All, streamParams);
    this.setupGeneralEventHandlers(stream);
    this.setupNamespaceEventHandlers(stream);
    this.setupServicesEventHandlers(stream, secondaryFrame);

    this.filteringStream = { stream, dataFilters: streamParams };
  }

  public dropFilteringFrame() {
    if (this.filteringStream == null) return;

    this.filteringStream.stream.stop();
    this.offAllStreamEvents(this.filteringStream.stream);
    this.filteringStream = null;
    this.store.squashFrames();
  }

  public setupInitialStream() {
    const stream = this.api.v1.getEventStream(EventParamsSet.Namespaces);

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

  private setupServicesEventHandlers(stream: IEventStream, frame: StoreFrame) {
    stream.on(EventStreamEventKind.Service, (svcChange: ServiceChange) => {
      frame.applyServiceChange(svcChange.service, svcChange.change);
    });

    stream.on(EventStreamEventKind.Flows, (flows: HubbleFlow[]) => {
      const { flowsDiffCount } = frame.addFlows(flows);

      this.emit(EventKind.FlowsDiff, flowsDiffCount);
    });

    stream.on(EventStreamEventKind.ServiceLink, (link: ServiceLinkChange) => {
      frame.applyServiceLinkChange(link.serviceLink, link.change);
    });
  }

  private setupGeneralEventHandlers(stream: IEventStream) {
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

  public get flowsDelay(): number | undefined {
    return this.mainStream?.stream.flowsDelay;
  }

  public get currentNamespace(): string | undefined {
    return this.mainStream?.dataFilters?.namespace;
  }

  public get hasFilteringStream(): boolean {
    return this.filteringStream != null;
  }
}
