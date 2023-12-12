import { EventEmitter } from '~/utils/emitter';
import { Store } from '~/store';
import * as storage from '~/storage/local';
import { BackendAPI, ControlStream } from '~/api/customprotocol';

import { ConnectionState, DataMode, TransferState } from '~/domain/interactions';
import { FilterEntry, FiltersDiff } from '~/domain/filtering';
import { Verdict } from '~/domain/hubble';
import { Diff } from '~/domain/diff';

import { Options } from './common';

export enum Event {
  CurrentNamespaceChanged = 'current-namespace-changed',
  AggregationChanged = 'aggregation-changed',
  VerdictsChanged = 'verdicts-changed',
  FiltersChanged = 'filters-changed',
  ShowHostChanged = 'show-host-changed',
  ShowKubeDNSChanged = 'show-kube-dns-changed',
  ShowRemoteNodeChanged = 'show-remote-node-changed',
  ShowPrometheusAppChanged = 'show-prometheus-app-changed',
  HTTPStatusChanged = 'http-status-changed',
  FlowFiltersChanged = 'flow-filters-changed',
}

export type Handlers = {
  [Event.CurrentNamespaceChanged]: (_: Diff<string>) => void;
  [Event.FiltersChanged]: (f: FiltersDiff) => void;
  [Event.VerdictsChanged]: (v: Diff<Set<Verdict>>) => void;
  [Event.ShowHostChanged]: (e: Diff<boolean>) => void;
  [Event.ShowKubeDNSChanged]: (e: Diff<boolean>) => void;
  [Event.ShowRemoteNodeChanged]: (e: Diff<boolean>) => void;
  [Event.ShowPrometheusAppChanged]: (e: Diff<boolean>) => void;
  [Event.HTTPStatusChanged]: (st: Diff<string>) => void;
  [Event.FlowFiltersChanged]: (ff: Diff<FilterEntry[]>) => void;
};

export class Controls extends EventEmitter<Handlers> {
  private store: Store;
  private backendAPI: BackendAPI;
  private transferState: TransferState;

  private controlStream?: ControlStream;

  constructor(opts: Options) {
    super(true);

    this.store = opts.store;
    this.backendAPI = opts.backendAPI;
    this.transferState = opts.transferState;

    this.setupEventHandlers();
  }

  public ensureControlStream() {
    if (this.controlStream != null) return this.controlStream;

    this.controlStream = this.backendAPI
      .controlStream()
      .onNamespaceChanges(nsChanges => {
        nsChanges.forEach(nsChange => {
          const { namespace: nsDescriptor, change } = nsChange;
          this.store.applyNamespaceChange(nsDescriptor, change);
        });
      })
      .onNotification(notif => {
        // NOTE: This thing updates flow rate and more...
        if (notif.status != null) {
          this.transferState.setDeploymentStatus(notif.status);
        }
      });

    return this.controlStream;
  }

  public async stopFetches() {
    this.controlStream?.offAllEvents();
    await this.controlStream?.stop();
  }

  public setCurrentNamespace(ns?: string | null): this {
    const prev = this.store.namespaces.current?.namespace;
    if (prev === ns) return this;

    this.store.namespaces.setCurrent(ns);
    this.store.controls.resetUserSelected();
    this.store.flush({ globalFrame: true });

    this.emit(Event.CurrentNamespaceChanged, Diff.new(prev).step(ns));
    return this;
  }

  public toggleVerdict(v: Verdict | null): this {
    const prevVerdicts = new Set(this.store.controls.verdicts);
    const nextVerdicts = this.store.controls.toggleVerdict(v);

    const diff = Diff.new(prevVerdicts).setComparator(FiltersDiff.verdictsEqual).step(nextVerdicts);
    if (!diff.changed) return this;

    this.emit(Event.VerdictsChanged, diff);
    return this;
  }

  public toggleShowHost() {
    const isActive = this.store.controls.toggleShowHost();
    storage.saveShowHost(isActive);

    this.emit(Event.ShowHostChanged, Diff.new(!isActive).step(isActive));
  }

  public toggleShowKubeDNS() {
    const isActive = this.store.controls.toggleShowKubeDns();
    storage.saveShowKubeDns(isActive);

    this.emit(Event.ShowKubeDNSChanged, Diff.new(!isActive).step(isActive));
  }

  public toggleShowRemoteNode() {
    const isActive = this.store.controls.toggleShowRemoteNode();
    storage.saveShowRemoteNode(isActive);

    this.emit(Event.ShowRemoteNodeChanged, Diff.new(!isActive).step(isActive));
  }

  public toggleShowPrometheusApp() {
    const isActive = this.store.controls.toggleShowPrometheusApp();
    storage.saveShowPrometheusApp(isActive);

    this.emit(Event.ShowPrometheusAppChanged, Diff.new(!isActive).step(isActive));
  }

  public setHTTPStatus(st: string | null) {
    const prev = this.store.controls.setHttpStatus(st);
    if (prev === st) return;

    this.emit(Event.HTTPStatusChanged, Diff.new(prev).step(st));
  }

  // NOTE: This should be the only method who is responsible for changing flow filters
  public setFlowFilters(ff: FilterEntry[] | null) {
    const normalized = this.normalizeFilterEntries(ff || []);
    const unique = FilterEntry.unique(normalized);

    const prev = this.store.controls.setFlowFilters(unique);
    const isChanged = !FiltersDiff.filterEntriesEqual(prev, unique);
    if (!isChanged) return;

    this.emit(
      Event.FlowFiltersChanged,
      Diff.new(prev).setComparator(FiltersDiff.filterEntriesEqual).step(unique),
    );
  }

  public setDataMode(dm: DataMode, cs?: ConnectionState) {
    const isChanged = this.transferState.setDataMode(dm);
    if (isChanged) {
      storage.saveDataMode(dm);
    }

    if (cs != null) {
      this.transferState.setConnectionState(cs);
      return;
    }

    if (this.transferState.isCiliumStreaming) {
      this.transferState.setReceiving();
    }
  }

  public onCurrentNamespaceChanged(fn: Handlers[Event.CurrentNamespaceChanged]): this {
    this.on(Event.CurrentNamespaceChanged, fn);
    return this;
  }

  public onFiltersChanged(fn: Handlers[Event.FiltersChanged]): this {
    this.on(Event.FiltersChanged, fn);
    return this;
  }

  public onVerdictsChanged(fn: Handlers[Event.VerdictsChanged]): this {
    this.on(Event.VerdictsChanged, fn);
    return this;
  }

  public onShowHostChanged(fn: Handlers[Event.ShowHostChanged]): this {
    this.on(Event.ShowHostChanged, fn);
    return this;
  }

  public onShowKubeDNSChanged(fn: Handlers[Event.ShowKubeDNSChanged]): this {
    this.on(Event.ShowKubeDNSChanged, fn);
    return this;
  }

  public onShowPrometheusAppChanged(fn: Handlers[Event.ShowPrometheusAppChanged]): this {
    this.on(Event.ShowPrometheusAppChanged, fn);
    return this;
  }

  public onHTTPStatusChanged(fn: Handlers[Event.HTTPStatusChanged]): this {
    this.on(Event.HTTPStatusChanged, fn);
    return this;
  }

  public onFlowFiltersChanged(fn: Handlers[Event.FlowFiltersChanged]): this {
    this.on(Event.FlowFiltersChanged, fn);
    return this;
  }

  private setupEventHandlers() {
    this.onCurrentNamespaceChanged(nsDiff => {
      const fd = this.store.filtersDiff.tap(d => d.namespace.replace(nsDiff));
      this.emit(Event.FiltersChanged, fd);
    });

    this.onVerdictsChanged(diff => {
      const fd = this.store.filtersDiff.tap(d => d.verdicts.replace(diff));
      this.emit(Event.FiltersChanged, fd);
    });

    this.onShowHostChanged(diff => {
      const fd = this.store.filtersDiff.tap(d => {
        return d.skipHost.replace(diff).invert();
      });

      this.emit(Event.FiltersChanged, fd);
    });

    this.onShowKubeDNSChanged(diff => {
      const fd = this.store.filtersDiff.tap(d => {
        return d.skipKubeDns.replace(diff).invert();
      });

      this.emit(Event.FiltersChanged, fd);
    });

    this.onShowPrometheusAppChanged(diff => {
      const fd = this.store.filtersDiff.tap(d => {
        return d.skipPrometheusApp.replace(diff).invert();
      });

      this.emit(Event.FiltersChanged, fd);
    });

    this.onHTTPStatusChanged(diff => {
      const fd = this.store.filtersDiff.tap(d => d.httpStatus.replace(diff));

      this.emit(Event.FiltersChanged, fd);
    });

    this.onFlowFiltersChanged(diff => {
      const fd = this.store.filtersDiff.tap(d => d.filters.replace(diff));
      this.emit(Event.FiltersChanged, fd);
    });
  }

  private normalizeFilterEntries(ff: Iterable<FilterEntry>): FilterEntry[] | null {
    if (ff == null) return null;

    const normalized: FilterEntry[] = [];
    const services = this.store.currentFrame.services;

    for (let filter of ff) {
      // NOTE: Filtering by TCP flags is not supported?
      if (filter.isTCPFlag) continue;

      const card = services.byFilterEntry(filter);
      if (card != null) {
        filter = filter.clone().setMeta(filter.meta || card.getFilterEntryMeta(filter) || '');
      }

      normalized.push(filter);
    }

    return normalized;
  }
}
