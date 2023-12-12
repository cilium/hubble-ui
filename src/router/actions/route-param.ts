import _ from 'lodash';
import { Application } from '~/domain/common';
import { FilterEntry } from '~/domain/filtering/filter-entry';
import { Verdict } from '~/domain/hubble';

export enum RouteParam {
  Namespace = 'namespace',
  Verdicts = 'verdicts',
  FlowsFilter = 'flows-filter',
  HttpStatus = 'http-status',
}

export const routeParamSet = new Set(Object.values(RouteParam));

export type RouteParamValue = string | number | null | undefined;
export type RouteParamPair = [string, RouteParamValue];
export type RouteParamPairs = RouteParamPair[];

export type RouteParams = {
  app: Application;
  namespace: string | null;
  verdicts: Set<Verdict>;
  httpStatus: string | null;
  flowFilters: FilterEntry[];
};

export const parseParamName = (name?: any): RouteParam | null => {
  if (!name || !_.isString(name)) return null;

  return routeParamSet.has(name as any) ? (name as RouteParam) : null;
};

export class RouteParamAction {
  public static new(param: string, v?: RouteParamValue) {
    return new RouteParamAction(param, v);
  }

  public static fromPair(p: RouteParamPair): RouteParamAction {
    return RouteParamAction.new(p[0], p[1]);
  }

  public static fromSerializable(obj?: any): RouteParamAction | null {
    if (obj == null || !_.isObject(obj)) return null;

    const param = parseParamName((obj as any).param);
    if (param == null) return null;

    return RouteParamAction.new(param, (obj as any).value);
  }

  constructor(
    public readonly param: string,
    public readonly value?: RouteParamValue,
  ) {}

  public asSerializable(): any {
    return {
      param: this.param,
      value: this.value,
    };
  }
}
