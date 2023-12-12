import { RouteAction, RouteParamValue, StateParamValue } from './actions';
import { extractPathname } from './utils';

export type PathnameContainer = {
  pathname: string;
};

export type StateParamsMap = Map<string, StateParamValue>;

export class TransactionRunner {
  private path: string;
  private searchParams: URLSearchParams;
  private stateParams: StateParamsMap;

  constructor(
    loc: PathnameContainer | undefined,
    searchParams: URLSearchParams,
    stateParams?: StateParamsMap,
  ) {
    this.path = loc?.pathname || '/';
    this.searchParams = new URLSearchParams(searchParams);
    this.stateParams = stateParams ? new Map(stateParams) : new Map();
  }

  public do(action: RouteAction): this {
    action
      .tapPath(path => this.pathStep(path))
      .tapParam((param, value) => this.paramStep(param, value))
      .tapDropSearchParams(() => this.dropParams())
      .tapStateParam((param, value) => this.stateParamStep(param, value));

    return this;
  }

  public doMany(actions: Iterable<RouteAction>): this {
    for (const act of actions) {
      this.do(act);
    }

    return this;
  }

  public finish(): [string, URLSearchParams, StateParamsMap] {
    const path = this.path;
    const searchParams = this.searchParams;
    const stateParams = this.stateParams;

    this.path = '/';
    this.searchParams = new URLSearchParams();
    this.stateParams = new Map();

    return [path, searchParams, stateParams];
  }

  private pathStep(path: string) {
    this.path = extractPathname(path, this.path);
  }

  private paramStep(param: string, value: RouteParamValue) {
    if (value == null) {
      this.searchParams.delete(param);
    } else {
      this.searchParams.set(param, value.toString());
    }
  }

  private stateParamStep(param: string, value: StateParamValue) {
    if (value == null) {
      // NOTE: It's important to record this intention to drop the param
      this.stateParams.set(param, null);
    } else {
      this.stateParams.set(param, value);
    }
  }

  private dropParams() {
    this.searchParams = new URLSearchParams();
  }
}
