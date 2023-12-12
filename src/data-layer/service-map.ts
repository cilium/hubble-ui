import { BackendAPI, ServiceMapStream } from '~/api/customprotocol';
import { EventParams } from '~/api/general/event-stream';

import { Flow } from '~/domain/flows';
import { FilterEntry, FiltersDiff } from '~/domain/filtering';
import { DataMode, TransferState } from '~/domain/interactions';
import { StreamKind } from '~/domain/interactions/reconnect-state';

import { ConnectEvent } from './connect-event';
import { Options } from './common';

import { Store, StoreFrame } from '~/store';
import { Retries } from '~/utils/retry';
import { EventEmitter } from '~/utils/emitter';

import { NamespaceDescriptor } from '~/domain/namespaces';

export enum Event {
  FlowsDiff = 'flows-diff-count',
  FlowFiltersShouldBeChanged = 'filter-entries-should-be-changed',
  ConnectEvent = 'connect-event',
}

export type Handlers = {
  [Event.FlowsDiff]: (dc: number, f: StoreFrame) => void;
  [Event.FlowFiltersShouldBeChanged]: (fe: FilterEntry[]) => void;
  [Event.ConnectEvent]: (rs: ConnectEvent) => void;
};

export class ServiceMap extends EventEmitter<Handlers> {
  private backendAPI: BackendAPI;
  private store: Store;
  private transferState: TransferState;

  private streamFlags?: Partial<EventParams>;
  private stream: ServiceMapStream | null = null;
  private streamRetries: Retries = Retries.newExponential();

  constructor(opts: Options) {
    super(true);

    this.store = opts.store;
    this.backendAPI = opts.backendAPI;
    this.transferState = opts.transferState;
  }

  public get isAppActive(): boolean {
    return this.stream != null;
  }

  public onFlowsDiffCount(fn: Handlers[Event.FlowsDiff]): this {
    this.on(Event.FlowsDiff, fn);
    return this;
  }

  public onFlowFiltersShouldBeChanged(fn: Handlers[Event.FlowFiltersShouldBeChanged]): this {
    this.on(Event.FlowFiltersShouldBeChanged, fn);
    return this;
  }

  public onConnectEvent(fn: Handlers[Event.ConnectEvent]): this {
    this.on(Event.ConnectEvent, fn);
    return this;
  }

  public async switchToDataMode(dm: DataMode) {
    await this.resetDataFetch(dm);
  }

  public async resetDataFetch(dm?: DataMode) {
    const dataMode = dm || this.transferState.dataMode;

    await this.dropDataFetch();
    await this.ensureDataFetch(dataMode);
  }

  public async ensureDataFetch(forDataMode?: DataMode) {
    const dm = forDataMode || this.transferState.dataMode;
    console.log(`service map: ensuring data fetch for mode: ${dm}`);

    if (dm === DataMode.CiliumStreaming) {
      this.ensureLiveStream();
    }
  }

  public async appOpened() {
    const dataMode = this.transferState.isDisabled
      ? this.pickDataModeForNamespace(this.store.namespaces.current)
      : this.transferState.dataMode;

    await this.ensureDataFetch(dataMode);
  }

  public async dropDataFetch() {
    if (this.stream != null) {
      this.stream.offAllEvents();
      await this.stream.stop();

      this.stream = null;
    }

    this.transferState.dropReconnectState(StreamKind.Event);
    this.streamRetries.reset();
  }

  public ensureLiveStream(): ServiceMapStream {
    console.log('ensuring service map data stream');
    if (this.stream != null) return this.stream;

    this.stream = this.backendAPI
      .serviceMapStream(this.store.filters, this.streamFlags)
      .onServices(svcs => this.store.currentFrame.applyServiceChanges(svcs))
      .onServiceLinks(links => this.store.currentFrame.applyServiceLinkChanges(links))
      .onFlows(flows => this.handleFlows(this.store.currentFrame, flows))
      .onReconnectAttemptFailed((att, err) => this.handleReconnectFail(att, err))
      .onReconnectAttempt((att, d) => this.handleReconnectDelay(att, d))
      .onReconnected(attempt => this.handleReconnected(attempt))
      .onTerminated(isStopped => this.handleTerminated(isStopped))
      .run();

    return this.stream;
  }

  public handleReconnectFail(attempt: number, err: any) {
    this.transferState.updateReconnectState(StreamKind.Event, old => ({
      ...old,
      attempt,
      lastError: err,
    }));

    this.emit(Event.ConnectEvent, ConnectEvent.newFailed().setAttempt(attempt).setError(err));
  }

  public handleReconnectDelay(attempt: number, delay: number) {
    this.transferState.updateReconnectState(StreamKind.Event, old => ({
      ...old,
      attempt,
      delay,
    }));

    this.emit(
      Event.ConnectEvent,
      ConnectEvent.newAttemptDelay().setAttempt(attempt).setDelay(delay),
    );
  }

  public handleReconnected(att: number) {
    if (att === 1) return;

    const states = this.transferState.reconnectStates;
    const isAllReconnected = states.size === 1 && states.has(StreamKind.Event);

    this.transferState.dropReconnectState(StreamKind.Event);
    this.streamRetries.reset();

    this.emit(
      Event.ConnectEvent,
      ConnectEvent.newSuccess().setAttempt(att).setAllReconnected(isAllReconnected),
    );
  }

  public async handleTerminated(isStopped: boolean) {
    // NOTE: isStopped set to true can be only in case when entire stream was
    // forced to stop, for example when filters are changed..
    if (isStopped) {
      this.transferState.dropReconnectState(StreamKind.Event);
      this.streamRetries.reset();
      return;
    }

    if (this.stream == null) {
      console.error('unreachable: stream just terminated, but it is null');
      return;
    }

    // NOTE: When isStopped set to false, it means that stream was terminated
    // by backend and we probably need to try to recreate it...
    this.emit(Event.ConnectEvent, ConnectEvent.newDisconnected());

    // NOTE: Stream was terminated, so we don't need to call .stop() on it
    this.stream.terminate().offAllEvents();
    this.stream = null;

    // NOTE: Recreate stream with exact last params used (including possible
    // policies enabled)
    const nextDelay = this.streamRetries.nextDelay();
    const state = this.transferState.updateReconnectState(StreamKind.Event, old => ({
      ...old,
      attempt: (old?.attempt || 0) + 1,
      delay: nextDelay,
    }));

    this.emit(
      Event.ConnectEvent,
      ConnectEvent.newAttemptDelay().setAttempt(state.attempt).setDelay(nextDelay),
    );

    await this.streamRetries.wait();
    if (this.transferState.reconnectStates.get(StreamKind.Event) == null) {
      // NOTE: We are here if `dropDataFetch` was called during the wait
      this.streamRetries.reset();
      return;
    }

    this.ensureLiveStream();
  }

  public async enablePoliciesFetch() {
    this.streamFlags = Object.assign({}, this.streamFlags, { policies: true });

    if (this.stream != null) {
      // NOTE: Means that we already have stream setup and thus we are not
      // in timescape only mode
      await this.stream.updateEventFlags(this.streamFlags);
    } else {
      await this.ensureDataFetch();
    }
  }

  public async filtersChanged(f: FiltersDiff) {
    // NOTE: The idea is to react on filters change if only app is active
    // in the background/foreground.
    if (!this.isAppActive) return;

    // NOTE: Stream is supposed to be null if ServiceMap wasn't ever opened
    await this.dropDataFetch();

    if (f.podFiltersChanged || f.namespace.changed) {
      this.store.flush({ globalFrame: true });
    }

    // NOTE: This call will take from global frame only that data that matches
    // current set of filters
    console.log(`right before resetCurrentFrame`);
    this.store.resetCurrentFrame(this.store.filters, { preserveActiveCards: true });

    await this.ensureDataFetch();
  }

  public toggleActiveCardFilterEntry(cardId: string) {
    const services = this.store.currentFrame.services;
    const card = services.byId(cardId);
    if (card == null) return;

    const isActive = this.store.controls.areSomeFilterEntriesEnabled(card.filterEntries);
    const [include, exclude] = !isActive ? [card.filterEntries, []] : [[], card.filterEntries];

    const [flowFilters, isChanged] = FilterEntry.combine(
      this.store.controls.filteredFlowFilters,
      include,
      exclude,
    );

    if (!isChanged) return;
    this.emit(Event.FlowFiltersShouldBeChanged, flowFilters);
  }

  private pickDataModeForNamespace(ns?: NamespaceDescriptor | null): DataMode {
    return DataMode.CiliumStreaming;
  }

  private handleFlows(frame: StoreFrame, flows: Flow[]) {
    const { flowsDiffCount } = frame.addFlows(flows);

    this.emit(Event.FlowsDiff, flowsDiffCount, frame);
  }
}
