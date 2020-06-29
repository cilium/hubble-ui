import _ from 'lodash';
import { action, observable, computed } from 'mobx';

import { Flow, FlowsFilterEntry, FlowsFilterKind } from '~/domain/flows';
import { Verdict } from '~/domain/hubble';

// This store maintains data that is configured by control interfaces
export default class ControlStore {
  @observable private _namespaces: Array<string> = [];

  @observable currentNamespace: string | null = null;
  @observable selectedTableFlow: Flow | null = null;
  @observable showCrossNamespaceActivity = false;
  @observable verdict: Verdict | null = null;
  @observable httpStatus: string | null = null;
  @observable flowFilters: FlowsFilterEntry[] = [];
  @observable showHost = false;
  @observable showKubeDns = false;

  @computed get namespaces() {
    return this._namespaces.slice().sort((a, b) => a.localeCompare(b));
  }

  set namespaces(namespaces: string[]) {
    this._namespaces = namespaces;
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

  @computed
  get activeCardFilter() {
    return this.flowFilters.find(f => {
      return [FlowsFilterKind.Dns, FlowsFilterKind.Identity].includes(f.kind);
    });
  }
}
