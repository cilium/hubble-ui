import _ from 'lodash';
import { makeAutoObservable } from 'mobx';

import { Flow } from '~/domain/flows';
import { Verdict } from '~/domain/hubble';
import { Filters, FilterEntry } from '~/domain/filtering';

import { Application } from '~/domain/common';

// This store maintains data that is configured by control interfaces
export class ControlStore {
  public currentApp: Application = Application.ServiceMap;
  public selectedTableFlow: Flow | null = null;
  public showCrossNamespaceActivity = true;

  public verdicts = new Set<Verdict>();
  public httpStatus: string | null = null;
  public flowFilters: FilterEntry[] = [];
  public showHost = false;
  public showKubeDns = false;
  public showRemoteNode = false;
  public showPrometheusApp = false;

  constructor() {
    makeAutoObservable(this, void 0, {
      autoBind: true,
    });
  }

  clone(deep = false): ControlStore {
    const store = new ControlStore();

    const selFlow = this.selectedTableFlow;
    const ffs = this.flowFilters;

    store.selectedTableFlow = selFlow ? selFlow.clone() : null;
    store.showCrossNamespaceActivity = this.showCrossNamespaceActivity;
    store.verdicts = deep ? _.cloneDeep(this.verdicts) : this.verdicts;
    store.httpStatus = this.httpStatus;
    store.flowFilters = deep ? ffs.map(f => f.clone()) : ffs.slice();
    store.currentApp = this.currentApp;

    return store;
  }

  resetUserSelected() {
    this.selectedTableFlow = null;
    this.verdicts = new Set();
    this.httpStatus = null;
    this.flowFilters = [];
  }

  setCurrentApp(app: Application): [Application, boolean] {
    const prev = this.currentApp;
    const isChanged = prev !== app;
    this.currentApp = app;

    return [prev, isChanged];
  }

  selectTableFlow(flow: Flow | null) {
    this.selectedTableFlow = flow;
  }

  setCrossNamespaceActivity(v: boolean) {
    this.showCrossNamespaceActivity = v;
  }

  public toggleVerdict(verdict: Verdict | null): Set<Verdict> {
    const nextVerdicts = verdict == null ? new Set<Verdict>() : new Set([verdict]);

    this.verdicts = nextVerdicts;
    return this.verdicts;
  }

  setVerdicts(verdicts: Set<Verdict>) {
    this.verdicts = verdicts;
  }

  setHttpStatus(st: string | null): string | null {
    const prev = this.httpStatus;
    this.httpStatus = st;

    return prev;
  }

  setFlowFilters(ffs: FilterEntry[]): FilterEntry[] {
    const prev = this.flowFilters.slice();
    this.flowFilters = ffs;

    return prev;
  }

  setShowHost(val: boolean): boolean {
    this.showHost = val;

    return val;
  }

  toggleShowHost(): boolean {
    return this.setShowHost(!this.showHost);
  }

  setShowKubeDns(val: boolean): boolean {
    this.showKubeDns = val;

    return val;
  }

  toggleShowKubeDns(): boolean {
    return this.setShowKubeDns(!this.showKubeDns);
  }

  setShowRemoteNode(val: boolean): boolean {
    this.showRemoteNode = val;

    return val;
  }

  toggleShowRemoteNode(): boolean {
    return this.setShowRemoteNode(!this.showRemoteNode);
  }

  setShowPrometheusApp(val: boolean): boolean {
    this.showPrometheusApp = val;

    return val;
  }

  toggleShowPrometheusApp(): boolean {
    return this.setShowPrometheusApp(!this.showPrometheusApp);
  }

  setFilters(f: Filters) {
    this.verdicts = f.verdicts ?? new Set();
    this.httpStatus = f.httpStatus ?? null;
    this.flowFilters = f.filters || [];
    this.showHost = !f.skipHost;
    this.showKubeDns = !f.skipKubeDns;
    this.showRemoteNode = !f.skipRemoteNode;
    this.showPrometheusApp = !f.skipPrometheusApp;
  }

  public areSomeFilterEntriesEnabled(filterEntries: FilterEntry[]): boolean {
    const currentKeys = new Set(this.filteredFlowFilters.map(fe => fe.toString()));

    for (const fe of filterEntries) {
      const key = fe.toString();

      if (currentKeys.has(key)) return true;
    }

    return false;
  }

  public get filteredFlowFilters() {
    return this.flowFilters.filter(f => !f.isTCPFlag);
  }

  public get activeVerdict(): Verdict | null {
    for (const v of this.verdicts) {
      return v;
    }

    return null;
  }

  get app() {
    return {
      isServiceMap: this.currentApp === Application.ServiceMap,
    };
  }
}
