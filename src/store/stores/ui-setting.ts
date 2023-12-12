import { makeAutoObservable } from 'mobx';

import { FeatureFlags } from '~/domain/features';

export default class SettingsStore {
  private _flags: FeatureFlags;
  private _isFeatureFlagsSet = false;

  constructor() {
    this._flags = FeatureFlags.default();

    makeAutoObservable(this);
  }

  public setFeatures(features: FeatureFlags) {
    this._flags = features;
    this._isFeatureFlagsSet = true;
  }

  public get isFeaturesSet() {
    return this._isFeatureFlagsSet;
  }

  public get featureFlags() {
    return this._flags;
  }
}
