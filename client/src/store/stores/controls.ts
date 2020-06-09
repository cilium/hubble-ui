import _ from 'lodash';
import { action, observable } from 'mobx';

import { Flow, FlowsFilterEntry } from '~/domain/flows';
import { Verdict } from '~/domain/hubble';

// This store maintains data that is configured by control interfaces
export default class ControlStore {
  @observable namespaces: Array<string> = [];
  @observable currentNamespace: string | null = null;
  @observable selectedTableFlow: Flow | null = null;
  @observable showCrossNamespaceActivity = false;
  @observable verdict: Verdict | null = null;
  @observable httpStatus: string | null = null;
  @observable flowFilters: FlowsFilterEntry[] = [];

  @action.bound
  setCurrentNamespace(ns: string | null) {
    this.currentNamespace = ns;
  }

  @action.bound
  addNamespace(ns: string) {
    const nsIdx = this.namespaces.findIndex((nss: string) => nss === ns);
    if (nsIdx !== -1) return;

    this.namespaces.push(ns);
  }

  @action.bound
  removeNamespace(ns: string) {
    const nsIdx = this.namespaces.findIndex((nss: string) => nss === ns);
    if (nsIdx === -1) return;

    this.namespaces.splice(nsIdx, 1);
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
}
