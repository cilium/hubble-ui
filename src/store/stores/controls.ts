import _ from 'lodash';
import { action, observable, computed } from 'mobx';

import { Flow, FlowsFilterEntry, FlowsFilterKind } from '~/domain/flows';
import { Verdict } from '~/domain/hubble';
import { Filters } from '~/domain/filtering';

// This store maintains data that is configured by control interfaces
export default class ControlStore {
  @observable private _namespaces: Array<string> = [];

  @observable currentNamespace: string | null = null;
  @observable selectedTableFlow: Flow | null = null;
  @observable showCrossNamespaceActivity = true;
  @observable verdict: Verdict | null = null;
  @observable httpStatus: string | null = null;
  @observable flowFilters: FlowsFilterEntry[] = [];
  @observable showHost = false;
  @observable showKubeDns = false;
  @observable showRemoteNode = false;
  @observable showPrometheusApp = false;

  clone(deep = false): ControlStore {
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

  @action.bound
  setCurrentNamespace(ns: string | null) {
    this.currentNamespace = ns;
  }

  @action.bound
  addNamespace(ns: string) {
    const nsIdx = this._namespaces.findIndex((nss: string) => nss === ns);
    if (nsIdx !== -1) return;

    this._namespaces.push(ns);
  }

  @action.bound
  removeNamespace(ns: string) {
    const nsIdx = this._namespaces.findIndex((nss: string) => nss === ns);
    if (nsIdx === -1) return;

    this._namespaces.splice(nsIdx, 1);
  }

  @action.bound
  selectTableFlow(flow: Flow | null) {
    this.selectedTableFlow = flow;
  }

  @action.bound
  setCrossNamespaceActivity(v: boolean) {
    this.showCrossNamespaceActivity = v;
  }

  @action.bound
  setVerdict(v: Verdict | null) {
    this.verdict = v;
  }

  @action.bound
  setHttpStatus(st: string | null) {
    this.httpStatus = st;
  }

  @action.bound
  setFlowFilters(ffs: FlowsFilterEntry[]) {
    this.flowFilters = ffs;
  }

  @action.bound
  setShowHost(val: boolean): boolean {
    this.showHost = val;

    return val;
  }

  @action.bound
  toggleShowHost(): boolean {
    return this.setShowHost(!this.showHost);
  }

  @action.bound
  setShowKubeDns(val: boolean): boolean {
    this.showKubeDns = val;

    return val;
  }

  @action.bound
  toggleShowKubeDns(): boolean {
    return this.setShowKubeDns(!this.showKubeDns);
  }

  @action.bound
  setShowRemoteNode(val: boolean): boolean {
    this.showRemoteNode = val;

    return val;
  }

  @action.bound
  toggleShowRemoteNode(): boolean {
    return this.setShowRemoteNode(!this.showRemoteNode);
  }

  @action.bound
  setShowPrometheusApp(val: boolean): boolean {
    this.showPrometheusApp = val;

    return val;
  }

  @action.bound
  toggleShowPrometheusApp(): boolean {
    return this.setShowPrometheusApp(!this.showPrometheusApp);
  }

  @computed
  get activeCardFilter() {
    return this.flowFilters.find(f => {
      return [FlowsFilterKind.Dns, FlowsFilterKind.Identity].includes(f.kind);
    });
  }

  @computed
  get namespaces() {
    return this._namespaces.slice().sort((a, b) => a.localeCompare(b));
  }

  set namespaces(namespaces: string[]) {
    this._namespaces = namespaces;
  }

  @computed
  get fastFlowFilters() {
    return this.flowFilters.slice();
  }

  @computed
  get defaultFilters(): Required<Filters> {
    return {
      namespace: null,
      verdict: null,
      httpStatus: null,
      filters: [],
      skipHost: !this.showHost,
      skipKubeDns: !this.showKubeDns,
      skipRemoteNode: !this.showRemoteNode,
      skipPrometheusApp: !this.showPrometheusApp,
    };
  }

  @computed
  get dataFilters(): Required<Filters> {
    return {
      namespace: this.currentNamespace,
      verdict: this.verdict,
      httpStatus: this.httpStatus,
      filters: this.flowFilters,
      skipHost: !this.showHost,
      skipKubeDns: !this.showKubeDns,
      skipRemoteNode: !this.showRemoteNode,
      skipPrometheusApp: !this.showPrometheusApp,
    };
  }

  @computed
  get mainFilters() {
    return {
      namespace: this.currentNamespace,
      skipHost: !this.showHost,
      skipKubeDns: !this.showKubeDns,
      skipRemoteNode: !this.showRemoteNode,
      skipPrometheusApp: !this.showPrometheusApp,
    };
  }

  @computed
  get isDefault(): boolean {
    return (
      this.verdict == null &&
      this.httpStatus == null &&
      this.flowFilters.length === 0 &&
      !this.showHost &&
      !this.showKubeDns &&
      !this.showRemoteNode &&
      !this.showPrometheusApp
    );
  }
}
