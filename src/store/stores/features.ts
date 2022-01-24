import { makeAutoObservable } from 'mobx';
import { FeatureFlags } from '~/domain/features';

export default class FeaturesStore {
  private _flags: FeatureFlags;
  private _isSet = false;

  constructor() {
    this._flags = FeatureFlags.default();

    makeAutoObservable(this);
  }

  public set(features: FeatureFlags) {
    this._flags = features;
    this._isSet = true;
  }

  public get isSet() {
    return this._isSet;
  }
}
