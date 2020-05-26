import {
  createHistory,
  createMemorySource,
  globalHistory,
  History,
  NavigateOptions,
} from '@reach/router';
import { action, computed, observable, reaction, runInAction } from 'mobx';
import * as qs from 'query-string';
import { FlowsFilterEntry, FlowsFilterUtils } from '~/domain/flows';
import { Verdict } from '~/domain/hubble';

export enum RouteHistorySourceKind {
  Memory = 'memory',
  URL = 'url',
}

export default class RouteStore {
  @observable
  public history: History;

  @observable
  private location: History['location'];

  private static readonly NAMESPACE_LS_KEY = '@hubble-ui/namespace';

  constructor(historySource: RouteHistorySourceKind) {
    this.history =
      historySource === 'url'
        ? globalHistory
        : createHistory(createMemorySource('/'));

    this.location = this.history.location;

    this.listen();
    this.restoreNamespace();
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
    const verdict = this.params['verdict'] as string | null | undefined;
    return verdict ? parseInt(verdict) : null;
  }

  @computed get httpStatus(): string | null {
    const httpStatus = this.params['http-status'] as string | null | undefined;
    return httpStatus ? httpStatus : null;
  }

  @computed get flowFilters(): FlowsFilterEntry[] {
    let filters = this.params['flows-filter'] as string | string[];
    if (filters == null) return [];
    if (typeof filters === 'string') filters = [filters];
    return filters.map(FlowsFilterUtils.createFilterObject);
  }

  @action.bound
  goto(to: string, opts?: NavigateOptions<{}> & { resetParams: boolean }) {
    if (opts?.resetParams || !this.location.search) {
      return this.history.navigate(to, opts);
    }
    return this.history.navigate(`${to}${this.location.search}`, opts);
  }

  @action.bound
  setParam(key: string, value?: string | string[] | number | null) {
    const nextParamsObj = { ...this.params };

    if (value == null || (Array.isArray(value) && value.length === 0)) {
      delete nextParamsObj[key];
    } else {
      nextParamsObj[key] = typeof value === 'number' ? String(value) : value;
    }

    const nextSearch = RouteStore.stringifyParams(nextParamsObj);
    if (this.location.search === nextSearch) return;

    if (!nextSearch) {
      return this.goto(this.location.pathname, { resetParams: true });
    }

    const nextUrl = `${this.location.pathname}?${nextSearch}`;
    return this.goto(nextUrl, { resetParams: true });
  }

  private listen() {
    this.history.listen(({ location }) => {
      runInAction(() => (this.location = location));
    });

    reaction(
      () => this.namespace,
      namespace => {
        if (!namespace) return;
        localStorage.setItem(RouteStore.NAMESPACE_LS_KEY, namespace);
      },
    );
  }

  private restoreNamespace() {
    if (this.namespace) return;

    const storedNamespace = localStorage.getItem(RouteStore.NAMESPACE_LS_KEY);
    if (!storedNamespace) return;

    this.goto(`/${storedNamespace}`);
  }

  private static stringifyParams(params: qs.ParsedQuery<string>) {
    return qs.stringify(params, {
      sort: (a, b) => a.localeCompare(b),
    });
  }
}
