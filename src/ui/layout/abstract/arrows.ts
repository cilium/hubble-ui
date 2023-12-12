import { computed, action, observable, makeObservable } from 'mobx';

import { XY } from '~/domain/geometry';

export abstract class Arrow {
  @observable
  public _points: XY[] = [];

  @action
  public addPoint(p: XY): this {
    this._points.push(p);
    return this;
  }

  constructor() {
    makeObservable(this);
  }

  public get id(): string {
    throw new Error('not implemented');
  }

  @computed
  public get points(): XY[] {
    return this._points.slice();
  }

  @computed
  public get start(): XY | undefined {
    return this.points.at(0);
  }

  @computed
  public get end(): XY | undefined {
    return this.points.at(-1);
  }
}

// { arrowId -> Arrow }
export type ArrowsMap = Map<string, Arrow>;

// NOTE: The purpose of any ArrowsStrategy is to provide map of arrows
// NOTE: { arrowId -> Arrow }, which is basically an info about arrows coords
// NOTE: and it's identifier. Look and shape on concrete arrows is determined by
// NOTE: conrete ArrowRenderer and it's parts.
export abstract class ArrowStrategy {
  @observable
  protected _arrows: ArrowsMap = new Map();

  constructor() {
    makeObservable(this);
  }

  @computed
  public get arrows(): ArrowsMap {
    return new Map(this._arrows);
  }

  @action.bound
  public reset() {
    this._arrows.clear();
  }
}
