import { makeAutoObservable } from 'mobx';

import { FeatureFlags } from '~/domain/features';

export class SettingsStore {
  private _flags: FeatureFlags;
  private _isFeatureFlagsSet = false;

  constructor(ffSet = false) {
    this._flags = FeatureFlags.default();
    this._isFeatureFlagsSet = ffSet;

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
