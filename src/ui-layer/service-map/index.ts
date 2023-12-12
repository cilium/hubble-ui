import * as mobx from 'mobx';

import { Store } from '~/store';
import { DataLayer } from '~/data-layer';
import { Router } from '~/router';
import { EventEmitter } from '~/utils/emitter';

import { ServiceCard } from '~/domain/service-map';
import { Application, Direction } from '~/domain/common';
import { FilterEntry } from '~/domain/filtering/filter-entry';

import { RefsCollector } from '~/ui/service-map/collector';
import { Options, CommonUtils } from '~/ui-layer/common';
import { StatusCenter } from '~/ui-layer/status-center';

import { ServiceMapPlacementStrategy, ServiceMapArrowStrategy } from './coordinates';

export enum Event {
  ArrowsDropped = 'arrows-dropped',
}

export type Handlers = {
  [Event.ArrowsDropped]: () => void;
};

export class ServiceMap extends EventEmitter<Handlers> {
  private readonly store: Store;
  private readonly dataLayer: DataLayer;
  private readonly statusCenter: StatusCenter;
  private readonly router: Router;

  public readonly collector: RefsCollector;
  public readonly placement: ServiceMapPlacementStrategy;
  public readonly arrows: ServiceMapArrowStrategy;

  @mobx.observable
  public isTimescapeFlowsPageLoading = false;

  @mobx.observable
  public isTimescapeFlowStatsLoading = false;

  @mobx.observable
  public isFullFlowLoading = false;

  @mobx.observable
  public isServiceMapLogsUploading = false;

  constructor(opts: Options) {
    super();

    this.store = opts.store;
    this.dataLayer = opts.dataLayer;
    this.statusCenter = opts.statusCenter;
    this.router = opts.router;

    this.collector = new RefsCollector(this.store.currentFrame);
    this.placement = new ServiceMapPlacementStrategy(this.store.currentFrame);
    this.arrows = new ServiceMapArrowStrategy(this.store.currentFrame, this.placement);

    mobx.makeObservable(this);

    this.setupEventHandlers();
  }

  public onArrowsDrop(fn: Handlers[Event.ArrowsDropped]): this {
    this.on(Event.ArrowsDropped, fn);
    return this;
  }

  @mobx.action
  public setFlowStatsLoading(state: boolean) {
    this.isTimescapeFlowStatsLoading = state;
  }

  @mobx.action
  public setFullFlowLoading(state: boolean) {
    this.isFullFlowLoading = state;
  }

  @mobx.action
  public setFlowsPageLoading(state: boolean) {
    this.isTimescapeFlowsPageLoading = state;
  }

  @mobx.action
  public setServiceMapLogsUploading(state: boolean) {
    this.isServiceMapLogsUploading = state;
  }

  public onCardSelect(card: ServiceCard) {
    this.dataLayer.serviceMap.toggleActiveCardFilterEntry(card.id);
    this.router.commit();
  }

  public onFilterEntriesChange(ff: FilterEntry[] | null) {
    this.dataLayer.controls.setFlowFilters(ff);
    this.router.commit();
  }

  public cardsMutationsObserved(_muts: MutationRecord[]) {
    this.collector.cardsMutationsObserved();
  }

  public toggleDetached() {
    console.log(`toggleDetached: dropping layout / collector for service map`);
    this.clearCoordinates();
  }

  public clearCoordinates() {
    this.collector.clear();
    this.placement.reset();
    this.arrows.reset();
  }

  public isCardActive(card: ServiceCard) {
    return this.store.controls.areSomeFilterEntriesEnabled(card.filterEntries);
  }

  public async appToggled(_prev: Application, next: Application, isChanged: boolean) {
    // if (!isChanged) return;

    switch (next) {
      case Application.ServiceMap: {
        // NOTE: This drop is needed to fix incorrect cards sizing after app switch
        mobx.runInAction(() => {
          this.clearCoordinates();
        });

        await this.dataLayer.serviceMap.appOpened();
        break;
      }
    }
  }

  private setupEventHandlers() {
    this.collector.onCoordsUpdated(coords => {
      // NOTE: This runInAction wrapping ensures that no reactions will be
      // triggered in between of those `set` calls. They will be called only
      // once, after arrows rebuild procedure.
      this.emit(Event.ArrowsDropped);
      mobx.runInAction(() => {
        // NOTE: We only set card dimensions here, so they are valid even if
        // card was rendered in invisible area with -100500 coords.
        this.placement.setCardHeights(coords.cards, 0.5);

        // NOTE: Access points are different, we don't need their dimensions
        // and store exact position of its center, even from invisible area with
        // -100500 coords. Thus we need to check if card was correctly placed
        // and if it wasn't, skip and wait for another coords.
        coords.accessPoints.forEach(apCoords => {
          const isCardPositioned = !!this.placement.cardsCoords.get(apCoords.cardId);
          if (!isCardPositioned) return;

          this.placement.setAccessPointCoords(apCoords.id, apCoords.bbox.center, 0.5);
        });

        coords.httpEndpoints.forEach(apCoords => {
          const isCardPositioned = !!this.placement.cardsCoords.get(apCoords.cardId);
          if (!isCardPositioned) return;

          this.placement.setHttpEndpointCoords(
            apCoords.cardId,
            apCoords.urlPath,
            apCoords.method,
            apCoords.bbox.center,
          );
        });

        this.arrows.rebuild();
      });
    });

    this.store.currentFrame.onFlushed(() => {
      this.clearCoordinates();
    });
  }
}
