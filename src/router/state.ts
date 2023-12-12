import _ from 'lodash';

import * as utils from '~/utils';

import { StateParamsMap } from '~/router/transaction';

export class LocationState {
  public static empty(): LocationState {
    return new LocationState();
  }

  public static fromSerializable(ser?: any): LocationState {
    if (ser == null) return LocationState.empty();
    if (!_.isObject(ser)) return LocationState.empty();

    // NOTE: `id` field
    const obj = ser as any;
    const id = _.isString(obj.id) ? (obj.id as string) : void 0;
    if (id == null) return LocationState.empty();

    // NOTE: `params` field
    let state = LocationState.empty().setId(id);
    if (obj.params != null && _.isObject(obj.params)) {
      const params: StateParamsMap = new Map();

      for (const key of Object.keys(obj.params)) {
        params.set(key, obj.params[key]);
      }

      state = state.setParams(params);
    }

    return state;
  }

  public static fromHistoryState(_st?: any): LocationState {
    const st = _st == null ? utils.history.getCurrentHistoryState() : _st;
    const ser = LocationState.extractSerializable(st);

    return ser == null ? LocationState.empty() : LocationState.fromSerializable(ser);
  }

  public static getIdFromHistoryState(_st?: any): string | null | undefined {
    const st = _st == null ? utils.history.getCurrentHistoryState() : _st;
    const ser = LocationState.extractSerializable(st);

    return ser?.id;
  }

  public static extractSerializable(st?: any): any {
    if (st == null || !_.isObject(st)) return null;

    if ((st as any).hubbleUIState != null) {
      return (st as any).hubbleUIState;
    }

    if ((st as any).usr != null) {
      const usr = (st as any).usr as any;

      if (usr.hubbleUIState != null) return usr.hubbleUIState;
    }

    return null;
  }

  public static hasSerializable(st?: any): boolean {
    return LocationState.extractSerializable(st) != null;
  }

  private _id: string;
  private params?: StateParamsMap;

  constructor() {
    this._id = utils.crypto.randomBase36Hash();
  }

  public get id() {
    return this._id;
  }

  public clone(_deep?: boolean): LocationState {
    const cloned = new LocationState();
    cloned._id = this._id;
    cloned.params = this.params ? new Map(this.params) : void 0;

    return cloned;
  }

  public setId(id: string): LocationState {
    const cloned = this.clone();
    cloned._id = id;

    return cloned;
  }

  public setParams(p: StateParamsMap): LocationState {
    const cloned = this.clone();
    cloned.params = p;

    return cloned;
  }

  // NOTE: This method should return plain serializable object that would fit
  // history state requirements
  public asSerializable(): object {
    const ser: any = { id: this._id };

    if (this.params != null) {
      ser.params = {};

      this.params.forEach((value, param) => {
        ser.params[param] = value == null ? null : value;
      });
    }

    return ser;
  }
}
