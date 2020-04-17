import { observable, autorun } from 'mobx';
import {
  createHistory,
  History,
  globalHistory,
  HistoryLocation,
} from '@reach/router';

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
      this.location = location;

      this.dropCache();
    });
  }

  get query() {
    if (this.cache.query != null) {
      return this.cache.query;
    }

    this.cache.query = qs.parse(this.location.search);
    return this.cache.query;
  }

  private dropCache() {
    this.cache = {};
  }
}
