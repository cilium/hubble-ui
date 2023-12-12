import { runInAction, makeAutoObservable } from 'mobx';
import { createBrowserHistory, createMemoryHistory, History } from 'history';
import qs from 'query-string';

import { FilterEntry } from '~/domain/filtering';
import { Verdict } from '~/domain/hubble';
import { Dictionary } from '~/domain/misc';

export enum RouteHistorySourceKind {
  Memory = 'memory',
  URL = 'url',
}

export enum RouteParam {
  Namespace = 'namespace',
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
  public history: History;

  private _location: History['location'];

  constructor(historySource: RouteHistorySourceKind) {
    makeAutoObservable(this, void 0, { autoBind: true });

    this.history = historySource === 'url' ? createBrowserHistory() : createMemoryHistory();

    this._location = this.history.location;

    this.listen();
  }

  get location() {
    return this._location;
  }

  get parts(): Array<string> {
    return this._location.pathname.split('/').slice(1);
  }

  get params() {
    return qs.parse(this._location.search);
  }

  get namespace(): string | null {
    const value = this.params[RouteParam.Namespace];
    if (typeof value !== 'string') return null;
    return value;
  }

  get verdict(): Verdict | null {
    const arr = this.params.verdict;
    if (arr == null) return null;

    const num = Array.isArray(arr) ? parseInt(arr[0] ?? '') : parseInt(arr);
    if (Number.isNaN(num)) {
      return null;
    }

    return Verdict[num] ? num : null;
  }

  get httpStatus(): string | null {
    const statuses = this.params[RouteParam.HttpStatus];
    if (statuses == null) return null;

    if (Array.isArray(statuses)) {
      return statuses[0];
    }

    return statuses;
  }

  get flowFilters(): FilterEntry[] {
    let filters = this.params[RouteParam.FlowsFilter];
    if (filters == null) return [];

    if (!Array.isArray(filters)) {
      filters = [filters];
    }

    return filters.reduce((acc, filter) => {
      filter?.split(',').forEach(part => {
        const ff = FilterEntry.parse(part);
        if (!ff) return;

        acc.push(ff);
      });

      return acc;
    }, [] as FilterEntry[]);
  }

  goto(to: string, opts?: { resetParams: boolean }) {
    if (opts?.resetParams || !this._location.search) {
      return this.history.push(to);
    }
    return this.history.push(`${to}${this._location.search}`);
  }

  setVerdict(v: Verdict | null) {
    this.setParam(RouteParam.Verdict, v);
  }

  setHttpStatus(st: string | null) {
    this.setParam(RouteParam.HttpStatus, st);
  }

  setFlowFilters(ff: string[]) {
    this.setParam(RouteParam.FlowsFilter, ff.length > 0 ? ff : null);
  }

  setNamespace(namespace: string) {
    this.setParam(RouteParam.Namespace, namespace);
  }

  gotoFn(cb: ReplacementFunction) {
    const transformed = cb(
      this.parts.slice(),
      this.params as Dictionary<string | string[]>,
      this.hash,
    );

    const qs = RouteStore.stringifyParams(transformed.params);

    const path = transformed.parts.filter(p => !!p).join('/');
    const query = qs.length > 0 ? '?' + qs : '';
    const hash = transformed.hash.length > 0 ? '#' + this.hash : '';

    this.history.push(`/${path}${query}${hash}`);
  }

  setParam(key: RouteParam, value?: string | string[] | number | null) {
    this.gotoFn((parts, params, hash) => {
      const hasLength = typeof value != 'number';
      if (value == null || (hasLength && !(value as string).length)) {
        delete params[key];
      } else {
        params[key] = String(value);
      }

      return { parts, params, hash };
    });
  }

  private listen() {
    this.history.listen(({ location }) => {
      runInAction(() => (this._location = location));
    });
  }

  private static stringifyParams(params: qs.ParsedQuery<string>) {
    return qs.stringify(params, {
      sort: (a, b) => a.localeCompare(b),
    });
  }

  get hash() {
    return (this._location.hash || '').slice(1);
  }

  get currentRoutePath(): string {
    const currentSearch = this._location.search;
    const search = currentSearch.length > 0 ? `?${currentSearch}` : '';
    const hash = this.hash.length > 0 ? `#${this.hash}` : '';

    let path = this._location.pathname;
    while (path.length > 0 && path[path.length - 1] === '/') {
      path = path.slice(0, -1);
    }

    return `${path}${search}${hash}`;
  }
}
