import {
  createHistory,
  createMemorySource,
  globalHistory,
  History,
  NavigateOptions,
} from '@reach/router';
import { action, computed, observable, reaction, runInAction } from 'mobx';
import * as qs from 'query-string';

import { FlowsFilterEntry } from '~/domain/flows';
import { Verdict } from '~/domain/hubble';

import { Dictionary } from '~/domain/misc';

export enum RouteHistorySourceKind {
  Memory = 'memory',
  URL = 'url',
}

export enum RouteParam {
  Verdict = 'verdict',
  FlowsFilter = 'flows-filter',
  HttpStatus = 'http-status',
}

type ReplacementFunction = (
  parts: string[],
  params: Dictionary<string | string[]>,
  hash: string,
) => {
  parts: string[];
  params: Dictionary<string | string[]>;
  hash: string;
};

export default class RouteStore {
  @observable
  public history: History;

  @observable
  private location: History['location'];

  constructor(historySource: RouteHistorySourceKind) {
    this.history =
      historySource === 'url'
        ? globalHistory
        : createHistory(createMemorySource('/'));

    this.location = this.history.location;

    this.listen();
  }

  @computed get parts(): Array<string> {
    return this.location.pathname.split('/').slice(1);
  }

  @computed get params() {
    return qs.parse(this.location.search);
  }

  @computed get namespace(): string | null {
    return this.parts[0] || null;
  }

  @computed get verdict(): Verdict | null {
    const arr = this.params.verdict;
    if (arr == null) return null;

    const num = Array.isArray(arr) ? parseInt(arr[0]) : parseInt(arr);
    if (Number.isNaN(num)) {
      return null;
    }

    return Verdict[num] ? num : null;
  }

  @computed get httpStatus(): string | null {
    const statuses = this.params['http-status'];
    if (statuses == null) return null;

    if (Array.isArray(statuses)) {
      return statuses[0];
    }

    return statuses;
  }

  @computed get flowFilters(): FlowsFilterEntry[] {
    let filters = this.params['flows-filter'];
    if (filters == null) return [];

    if (!Array.isArray(filters)) {
      filters = [filters];
    }

    return filters.reduce((acc, filter) => {
      const ff = FlowsFilterEntry.parse(filter);
      if (!ff) return acc;

      acc.push(ff);
      return acc;
    }, [] as FlowsFilterEntry[]);
  }

  @action.bound
  goto(to: string, opts?: NavigateOptions<{}> & { resetParams: boolean }) {
    if (opts?.resetParams || !this.location.search) {
      return this.history.navigate(to, opts);
    }

    return this.history.navigate(`${to}${this.location.search}`, opts);
  }

  @action.bound
  setVerdict(v: Verdict | null) {
    this.setParam(RouteParam.Verdict, v);
  }

  @action.bound
  setHttpStatus(st: string | null) {
    this.setParam(RouteParam.HttpStatus, st);
  }

  @action.bound
  setFlowFilters(ff: string[]) {
    this.setParam(RouteParam.FlowsFilter, ff.length > 0 ? ff : null);
  }

  @action.bound
  setNamespace(ns: string) {
    this.gotoFn((parts, params, hash) => {
      parts = [ns].concat(parts.slice(1));

      return { parts, params, hash };
    });
  }

  @action.bound
  gotoFn(cb: ReplacementFunction) {
    const parts = this.parts;

    const transformed = cb(
      this.parts.slice(),
      this.params as Dictionary<string | string[]>,
      this.hash,
    );

    const qs = RouteStore.stringifyParams(transformed.params);

    const path = transformed.parts.join('/');
    const query = qs.length > 0 ? '?' + qs : '';
    const hash = transformed.hash.length > 0 ? '#' + this.hash : '';

    console.log(`gotoFn: `, path, query, hash);
    this.history.navigate(`/${path}${query}${hash}`);
  }

  @action.bound
  setParam(key: RouteParam, value?: string | string[] | number | null) {
    this.gotoFn((parts, params, hash) => {
      const hasLength = typeof value != 'number';
      if (value == null || (hasLength && !(value as string).length)) {
        delete params[key];
      } else {
        params[key] = String(value!);
      }

      return { parts, params, hash };
    });
  }

  private listen() {
    this.history.listen(({ location }) => {
      runInAction(() => (this.location = location));
    });
  }

  private static stringifyParams(params: qs.ParsedQuery<string>) {
    return qs.stringify(params, {
      sort: (a, b) => a.localeCompare(b),
    });
  }

  @computed
  get hash() {
    return this.location.hash.slice(1);
  }
}
