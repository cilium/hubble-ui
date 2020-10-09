import {
  createHistory,
  createMemorySource,
  globalHistory,
  History,
  NavigateOptions,
} from '@reach/router';
import { action, computed, observable, runInAction } from 'mobx';
import * as qs from 'query-string';

import { FlowsFilterEntry } from '~/domain/flows';
import { Verdict } from '~/domain/hubble';
import { Dictionary } from '~/domain/misc';

import { Route } from './route';
export { Route };

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

  @observable
  private routes: Route[];

  constructor(historySource: RouteHistorySourceKind, routes?: Route[]) {
    this.routes = routes || [];

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
    const route = this.currentRoute;
    if (route == null) return null;

    const match = route.matches(this.currentRoutePath);
    if (!match || match === true) return null;

    const ns = (match as any).namespace;
    if (ns == null) return null;

    if (this.hash.length > 0) {
      return ns.slice(0, ns.indexOf('#'));
    }

    return ns;
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
  setNamespace(namespace: string) {
    const route = this.currentRoute;
    // console.log('setNamespace route: ', route);
    if (route == null) return;

    const newUrl = route.reverse({ namespace });
    if (!newUrl) return;

    this.gotoFn((_, params, hash) => {
      return { parts: newUrl.split('/'), params, hash };
    });
  }

  @action.bound
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

  private buildRoutesMap(routes: Route[]): Map<string, Route> {
    const routesMap: Map<string, Route> = new Map();

    routes.forEach(route => {
      routesMap.set(route.name, route);
    });

    return routesMap;
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

  @computed
  get currentRoutePath(): string {
    const currentSearch = this.location.search;
    const search = currentSearch.length > 0 ? `?${currentSearch}` : '';
    const hash = this.hash.length > 0 ? `#${this.hash}` : '';

    let path = this.location.pathname;
    while (path.length > 0 && path[path.length - 1] === '/') {
      path = path.slice(0, -1);
    }

    return `${path}${search}${hash}`;
  }

  @computed
  get currentRoute(): Route | undefined {
    return this.routes.find(r => {
      return !!r.matches(this.currentRoutePath);
    });
  }
}
