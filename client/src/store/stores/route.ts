import { globalHistory, History, HistoryLocation } from '@reach/router';
import { observable, runInAction } from 'mobx';
import * as qs from 'query-string';

export default class RouteStore {
  @observable
  public location: HistoryLocation = window.location as HistoryLocation;
  public history: History;

  private cache: any = {};

  constructor() {
    this.history = globalHistory;

    this.history.listen(({ location, action }) => {
      console.log('in history listen: ', location, action);
      runInAction(() => {
        this.location = location;
        this.dropCache();
      });
    });
  }

  get query() {
    if (this.cache.query != null) {
      return this.cache.query;
    }

    this.cache.query = qs.parse(this.location.search);
    this.cache.pathParts = (this.location.pathname || '/').split('/');
    return this.cache.query;
  }

  get pathParts(): Array<string> {
    if (this.cache.pathParts) {
      return this.cache.pathParts;
    }

    const pp = this.location.pathname.split('/').slice(1);
    this.cache.pathParts = pp;

    return pp;
  }

  private dropCache() {
    this.cache = {};
  }
}
