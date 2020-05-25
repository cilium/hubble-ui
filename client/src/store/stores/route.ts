import {
  createHistory,
  createMemorySource,
  globalHistory,
  History,
  NavigateOptions,
} from '@reach/router';
import { action, autorun, computed, observable, runInAction } from 'mobx';
import * as qs from 'query-string';

export enum RouteHistorySourceKind {
  Memory = 'memory',
  URL = 'url',
}

export default class RouteStore {
  @observable
  public history: History;

  @observable
  private location: History['location'];

  private cache: any = {};
  private static NAMESPACE_LS_KEY = '@hubble-ui/namespace';

  constructor(historySource: RouteHistorySourceKind) {
    this.history =
      historySource === 'url'
        ? globalHistory
        : createHistory(createMemorySource('/'));

    this.location = this.history.location;

    this.listen();
    this.restoreNamespace();
  }

  @computed get query() {
    if (this.cache.query != null) {
      return this.cache.query;
    }

    this.cache.query = qs.parse(this.location.search);
    this.cache.pathParts = (this.location.pathname || '/').split('/');
    return this.cache.query;
  }

  @computed get pathParts(): Array<string> {
    if (this.cache.pathParts) {
      return this.cache.pathParts;
    }

    const pp = this.location.pathname.split('/').slice(1);
    this.cache.pathParts = pp;

    return pp;
  }

  @computed get namespace(): string | null {
    return this.pathParts[0] || null;
  }

  @action.bound
  navigate(to: string, options?: NavigateOptions<{}>) {
    return this.history.navigate(to, options);
  }

  @action.bound
  private dropCache() {
    this.cache = {};
  }

  private listen() {
    this.history.listen(({ location, action }) => {
      // console.log('in history listen: ', location, action);
      runInAction(() => {
        this.dropCache();
        this.location = location;
      });
    });

    autorun(() => {
      if (this.namespace) {
        localStorage.setItem(RouteStore.NAMESPACE_LS_KEY, this.namespace);
      }
    });
  }

  private restoreNamespace() {
    if (this.namespace) return;

    const storedNamespace = localStorage.getItem(RouteStore.NAMESPACE_LS_KEY);
    if (!storedNamespace) return;

    this.navigate(`/${storedNamespace}`);
  }
}
