import * as mobx from 'mobx';

import { Store } from '~/store';
import { EventEmitter } from '~/utils/emitter';
import { BackendAPI } from '~/api/customprotocol';
import * as storage from '~/storage/local';

import { FeatureFlags } from '~/domain/features';
import { DataMode, TransferState } from '~/domain/interactions';
import { FiltersDiff } from '~/domain/filtering';
import { setupDebugProp } from '~/domain/misc';

import { fn } from '~/utils';

import { StorageParameters, Options } from './common';
import { Controls } from './controls';
import { ServiceMap } from './service-map';

export enum Event {
  FeatureFlagsSet = 'feature-flags-set',
}

export type Handlers = {
  [Event.FeatureFlagsSet]: (ff: FeatureFlags) => void;
};

export type BuildOptions = {
  store: Store;
  customProtocolBaseURL: string;
  customProtocolRequestTimeout: number;
  customProtocolMessagesInJSON: boolean;
  customProtocolCORSEnabled: boolean;
};

export class DataLayer extends EventEmitter<Handlers> {
  public readonly controls: Controls;
  public readonly serviceMap: ServiceMap;
  public readonly transferState: TransferState;

  public static readonly QueryParamsHeaderName = 'x-hubble-ui-page-query';

  public static new(opts: BuildOptions): DataLayer {
    const backendAPI = new BackendAPI({
      baseURL: opts.customProtocolBaseURL,
      requestTimeout: opts.customProtocolRequestTimeout,
      cors: opts.customProtocolCORSEnabled,
      corsHeaders: [],
      headersMutator: fn.once(h => {
        const qs = window.location.search;
        const search = qs.startsWith('?') ? qs.slice(1) : qs;

        h.append(DataLayer.QueryParamsHeaderName, search);
      }),
      useJSON: opts.customProtocolMessagesInJSON,
    });

    return new DataLayer(opts.store, backendAPI);
  }

  constructor(
    private store: Store,
    private backendAPI: BackendAPI,
  ) {
    super(true);

    this.transferState = new TransferState();
    this.controls = new Controls(this.commonOpts);
    this.serviceMap = new ServiceMap(this.commonOpts);

    this.setupEventHandlers();
    this.setupDebugProps();

    mobx.makeObservable(this);
  }

  private get commonOpts(): Options {
    return {
      store: this.store,
      backendAPI: this.backendAPI,
      transferState: this.transferState,
    };
  }

  public async dropDataFetch() {
    await this.serviceMap.dropDataFetch();
  }

  public async filtersChanged(f: FiltersDiff) {
    await Promise.all([this.serviceMap.filtersChanged(f)]);
  }

  public readLocalStorageParams(): StorageParameters {
    return {
      isHostShown: storage.getShowHost(),
      isKubeDNSShown: storage.getShowKubeDns(),
      isAggregationOff: storage.getIsAggregationOff(),
      dataMode: storage.getDataMode(),
    };
  }

  public setFeatureFlags(ff: FeatureFlags) {
    this.store.setFeatures(ff);
    this.emit(Event.FeatureFlagsSet, ff);
  }

  public onFeatureFlagsSet(fn: Handlers[Event.FeatureFlagsSet]): this {
    this.on(Event.FeatureFlagsSet, fn);
    return this;
  }

  public async switchToDataMode(dm: DataMode) {
    await this.serviceMap.switchToDataMode(dm);
  }

  private setupEventHandlers() {
    // NOTE: This event is thrown by ServiceMap data layer when for example
    // card is selected and we need to update flow filters in search bar
    this.serviceMap.onFlowFiltersShouldBeChanged(fe => {
      this.controls.setFlowFilters(fe);
    });
  }

  private setupDebugProps() {
    setupDebugProp({
      stopFetches: async () => {
        await this.controls.stopFetches();
        await this.serviceMap.dropDataFetch();
      },
    });
  }
}
