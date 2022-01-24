import _ from 'lodash';
import { action, computed, makeAutoObservable } from 'mobx';

import { Flow } from '~/domain/flows';
import { Verdict } from '~/domain/hubble';
import { Filters, FilterEntry, FilterKind } from '~/domain/filtering';
import { Status } from '~/domain/status';
import { TransferState } from '~/domain/interactions';

// This store maintains data that is configured by control interfaces
export default class ControlStore {
  private _namespaces: Array<string> = [];

  public lastStatus: Status | null = null;
  public currentNamespace: string | null = null;
  public selectedTableFlow: Flow | null = null;
  public showCrossNamespaceActivity = true;

  public verdict: Verdict | null = null;
  public httpStatus: string | null = null;
  public flowFilters: FilterEntry[] = [];
  public showHost = false;
  public showKubeDns = false;
  public showRemoteNode = false;
  public showPrometheusApp = false;

  public transferState: TransferState = new TransferState();

  constructor() {
    makeAutoObservable(this, void 0, {
      autoBind: true,
    });
  }

  public clone(deep = false): ControlStore {
    const store = new ControlStore();
    const nss = this.namespaces;
    const selFlow = this.selectedTableFlow;
    const ffs = this.flowFilters;

    store.namespaces = deep ? _.cloneDeep(nss) : nss.slice();
    store.currentNamespace = this.currentNamespace;
    store.selectedTableFlow = selFlow ? selFlow.clone() : null;
    store.showCrossNamespaceActivity = this.showCrossNamespaceActivity;
    store.verdict = deep ? _.cloneDeep(this.verdict) : this.verdict;
    store.httpStatus = this.httpStatus;
    store.flowFilters = deep ? ffs.map(f => f.clone()) : ffs.slice();

    return store;
  }

  public reset() {
    this.currentNamespace = null;
    this.selectedTableFlow = null;
    this.verdict = null;
    this.httpStatus = null;
    this.flowFilters = [];
  }

  public setCurrentNamespace(ns: string | null) {
    this.currentNamespace = ns;
  }

  public addNamespace(ns: string) {
    const nsIdx = this._namespaces.findIndex((nss: string) => nss === ns);
    if (nsIdx !== -1) return;

    this._namespaces.push(ns);
  }

  public removeNamespace(ns: string) {
    const nsIdx = this._namespaces.findIndex((nss: string) => nss === ns);
    if (nsIdx === -1) return;

    this._namespaces.splice(nsIdx, 1);
  }

  public selectTableFlow(flow: Flow | null) {
    this.selectedTableFlow = flow;
  }

  public setCrossNamespaceActivity(v: boolean) {
    this.showCrossNamespaceActivity = v;
  }

  public setVerdict(v: Verdict | null) {
    this.verdict = v;
  }

  public setHttpStatus(st: string | null) {
    this.httpStatus = st;
  }

  public setFlowFilters(ffs: FilterEntry[]) {
    this.flowFilters = ffs;
  }

  public setShowHost(val: boolean): boolean {
    this.showHost = val;

    return val;
  }

  public toggleShowHost(): boolean {
    return this.setShowHost(!this.showHost);
  }

  public setShowKubeDns(val: boolean): boolean {
    this.showKubeDns = val;

    return val;
  }

  public toggleShowKubeDns(): boolean {
    return this.setShowKubeDns(!this.showKubeDns);
  }

  public setShowRemoteNode(val: boolean): boolean {
    this.showRemoteNode = val;

    return val;
  }

  public toggleShowRemoteNode(): boolean {
    return this.setShowRemoteNode(!this.showRemoteNode);
  }

  public setShowPrometheusApp(val: boolean): boolean {
    this.showPrometheusApp = val;

    return val;
  }

  public toggleShowPrometheusApp(): boolean {
    return this.setShowPrometheusApp(!this.showPrometheusApp);
  }

  public setFilters(f: Filters) {
    this.currentNamespace = f.namespace ?? null;
    this.verdict = f.verdict ?? null;
    this.httpStatus = f.httpStatus ?? null;
    this.flowFilters = f.filters || [];
    this.showHost = !f.skipHost;
    this.showKubeDns = !f.skipKubeDns;
    this.showRemoteNode = !f.skipRemoteNode;
    this.showPrometheusApp = !f.skipPrometheusApp;
  }

  public setStatus(st: Status) {
    this.lastStatus = st;
  }

  public get activeCardFilter() {
    return this.flowFilters.find(f => {
      return [FilterKind.Dns, FilterKind.Identity].includes(f.kind);
    });
  }

  public get namespaces() {
    return this._namespaces.slice().sort((a, b) => a.localeCompare(b));
  }

  set namespaces(namespaces: string[]) {
    this._namespaces = namespaces;
  }

  public get correctFlowFilters() {
    return this.flowFilters.filter(f => !f.isTCPFlag);
  }

  public get filters(): Filters {
    return Filters.fromObject({
      namespace: this.currentNamespace,
      verdict: this.verdict,
      httpStatus: this.httpStatus,
      filters: this.flowFilters,
      skipHost: !this.showHost,
      skipKubeDns: !this.showKubeDns,
      skipRemoteNode: !this.showRemoteNode,
      skipPrometheusApp: !this.showPrometheusApp,
    });
  }
}
