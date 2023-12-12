import { configure, autorun, toJS, makeAutoObservable } from 'mobx';

import { Filters, FilterEntry, FiltersDiff } from '~/domain/filtering';
import { ServiceCard, ServiceMap } from '~/domain/service-map';
import { StateChange } from '~/domain/misc';
import { setupDebugProp } from '~/domain/misc';
import { HubbleService, HubbleLink, HubbleFlow } from '~/domain/hubble';
import { NamespaceDescriptor } from '~/domain/namespaces';

import { ControlStore } from './controls';
import { NamespaceStore } from './namespace';
import { SettingsStore } from './ui-settings';

import { StoreFrame, EventKind as FrameEvent } from '~/store/frame';
import { FeatureFlags } from '~/domain/features';

configure({ enforceActions: 'observed' });

export type FlushOptions = {
  namespaces?: boolean;
  globalFrame?: boolean;
  preserveActiveCards?: boolean;
};

export type Props = {};

export class Store {
  public controls: ControlStore;

  public globalFrame: StoreFrame;

  public currentFrame: StoreFrame;

  public namespaces: NamespaceStore;

  public uiSettings: SettingsStore;

  constructor(_props?: Props) {
    makeAutoObservable(this, void 0, { autoBind: true });

    this.controls = new ControlStore();
    this.namespaces = new NamespaceStore();
    this.uiSettings = new SettingsStore(true);

    this.globalFrame = StoreFrame.emptyWithShared(this.controls, this.namespaces);
    this.currentFrame = StoreFrame.emptyWithShared(this.controls, this.namespaces);

    this.setupEventHandlers();
    this.setupDebugTools();
  }

  public get filters(): Filters {
    return Filters.fromObject({
      namespace: this.namespaces.current?.namespace,
      verdicts: this.controls.verdicts,
      httpStatus: this.controls.httpStatus,
      filters: this.controls.flowFilters,
      skipHost: !this.controls.showHost,
      skipKubeDns: !this.controls.showKubeDns,
      skipRemoteNode: !this.controls.showRemoteNode,
      skipPrometheusApp: !this.controls.showPrometheusApp,
    });
  }

  public get filtersDiff(): FiltersDiff {
    return FiltersDiff.fromFilters(this.filters).setUnchanged();
  }

  public get availableNamespaces(): NamespaceDescriptor[] {
    return this.namespaces.combinedNamespaces;
  }

  public get currentNamespace(): NamespaceDescriptor | null {
    return this.namespaces.current;
  }

  public setup({
    services,
    flows,
    links,
  }: {
    services: HubbleService[];
    flows: HubbleFlow[];
    links: HubbleLink[];
  }) {
    this.currentFrame.services.set(services);
    this.currentFrame.services.extractAccessPoints(links);
    this.currentFrame.interactions.addHubbleLinks(links);
    this.currentFrame.interactions.setHubbleFlows(flows, { sort: true });
  }

  public resetCurrentFrame(filters: Filters, flushOpts?: FlushOptions) {
    this.currentFrame.flush(flushOpts);
    this.currentFrame.applyFrame(this.globalFrame, filters);
  }

  public applyNamespaceChange(ns: NamespaceDescriptor, change: StateChange) {
    this.namespaces.applyChange(ns, change);
  }

  public setFeatures(features: FeatureFlags) {
    this.uiSettings.setFeatures(features);
  }

  public applyServiceMapFromLogFile(serviceMap: ServiceMap) {
    if (!this.controls.app.isServiceMap) {
      console.warn('service map extension is not implemented for non-ServiceMap mode');

      return;
    }

    this.extendServiceMap(serviceMap);
  }

  public extendServiceMap(serviceMap: ServiceMap) {
    return this.currentFrame.extendServiceMap(serviceMap);
  }

  public flush(opts?: FlushOptions) {
    if (opts?.globalFrame) console.log(`flushing global frame`);
    this.controls.selectTableFlow(null);

    if (!!opts?.globalFrame) {
      this.globalFrame.flush(opts);
    }

    this.currentFrame.flush(opts);
  }

  public getActiveServices(): ServiceCard[] {
    return this.currentFrame.services.cardsList.filter(card => {
      return this.currentFrame.controls.areSomeFilterEntriesEnabled(card.filterEntries);
    });
  }

  // D E B U G
  public setupDebugTools() {
    setupDebugProp({
      printMapData: () => {
        this.printMapData();
      },
      // printLayoutData: () => {
      // this.printLayoutData();
      // },
      getFlowsFromTable: () => {
        return this.getFlowsFromTable();
      },
      dropMapData: () => {
        this.currentFrame.flush({ namespaces: false });
      },
      mobxToJs: (obj: any) => toJS(obj),
    });
  }

  private setupEventHandlers() {
    const wrongChanges = [StateChange.Unknown, StateChange.Deleted];

    this.currentFrame.on(FrameEvent.ServicesSet, svcs => {
      this.globalFrame.setServices(svcs);
    });

    this.currentFrame.on(FrameEvent.FlowsAdded, flows => {
      this.globalFrame.addFlows(flows);
    });

    this.currentFrame.on(FrameEvent.LinksChanged, _links => {
      const links = _links.filter(l => !wrongChanges.includes(l.change));
      if (links.length === 0) return;

      this.globalFrame.applyServiceLinkChanges(links);
    });

    this.currentFrame.on(FrameEvent.ServiceChange, svcChanges => {
      const changes = svcChanges.filter(ch => !wrongChanges.includes(ch.change));
      if (changes.length === 0) return;

      this.globalFrame.applyServiceChanges(changes);
    });
  }

  private printMapData() {
    const data = {
      services: this.currentFrame.services.cardsList.map(c => c.service),
      links: this.currentFrame.interactions.links.map(l => l.hubbleLink),
    };

    console.log(JSON.stringify(data, null, 2));
  }

  // TODO: Recreate this mechanics in a proper place
  // private printLayoutData() {
  //   const data = {
  //     cardsBBoxes: this.placement.cardsBBoxes,
  //     accessPointCoords: this.placement.accessPointCoords,
  //     arrows: this.arrows.arrowsMap,
  //     connections: this.currentFrame.interactions.connections,
  //   };
  //
  //   console.log(JSON.stringify(data, null, 2));
  //   console.log(data);
  // }

  private getFlowsFromTable() {
    return this.currentFrame.interactions.flows.map(f => toJS(f.ref));
  }
}
