import { RouteParamValue, RouteParamAction } from './route-param';
import { RoutePathAction } from './route-path';
import { StateParamAction, StateParamValue } from './state-param';

export class RouteAction {
  // NOTE: Only one of this action fields will be handled
  public routeParam: RouteParamAction | null = null;
  public routePath: RoutePathAction | null = null;
  public shouldDropSearchParams: boolean | null = null;
  public stateParam: StateParamAction | null = null;

  public static param(act: RouteParamAction): RouteAction {
    const ract = new RouteAction();
    ract.routeParam = act;

    return ract;
  }

  public static path(act: RoutePathAction): RouteAction {
    const ract = new RouteAction();
    ract.routePath = act;

    return ract;
  }

  public static stateParam(act: StateParamAction): RouteAction {
    const ract = new RouteAction();
    ract.stateParam = act;

    return ract;
  }

  public static dropSearchParams(): RouteAction {
    const ract = new RouteAction();
    ract.shouldDropSearchParams = true;

    return ract;
  }

  public tapPath(cb: (_: string) => void): this {
    if (this.routePath == null) return this;

    cb(this.routePath.path);
    return this;
  }

  public tapParam(cb: (p: string, v: RouteParamValue) => void): this {
    if (this.routeParam == null) return this;

    cb(this.routeParam.param, this.routeParam.value);
    return this;
  }

  public tapDropSearchParams(cb: () => void): this {
    if (!this.shouldDropSearchParams) return this;

    cb();
    return this;
  }

  public tapStateParam(cb: (p: string, v: StateParamValue) => void): this {
    if (this.stateParam == null) return this;

    cb(this.stateParam.param, this.stateParam.value);
    return this;
  }
}
