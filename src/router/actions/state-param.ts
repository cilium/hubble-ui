import _ from 'lodash';

export enum StateParam {
  PodPrefilter = 'pod-prefilter',
}

export const stateParamSet = new Set(Object.values(StateParam));

export type StateParamValue = string | number | null | undefined;
export type StateParamPair = [string, StateParamValue];
export type StateParamPairs = Array<[string, StateParamValue]>;

export const parseParamName = (name?: any): StateParam | null => {
  if (!name || !_.isString(name)) return null;

  return stateParamSet.has(name as any) ? (name as StateParam) : null;
};

export class StateParamAction {
  public static new(param: string, v?: StateParamValue) {
    return new StateParamAction(param, v);
  }

  public static fromPair(p: StateParamPair) {
    return StateParamAction.new(p[0], p[1]);
  }

  constructor(
    public readonly param: string,
    public readonly value?: StateParamValue,
  ) {}

  public asSerializable(): object {
    return {
      param: this.param,
      value: this.value,
    };
  }
}
