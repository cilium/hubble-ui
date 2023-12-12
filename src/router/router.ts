import _ from 'lodash';
import { Location, NavigateOptions } from 'react-router-dom';

import { EventEmitter } from '~/utils/emitter';

import { Application } from '~/domain/common';
import * as dhelpers from '~/domain/helpers';

import { DataLayer } from '~/data-layer';
import { FilterEntry } from '~/domain/filtering';

import {
  RouteAction,
  RouteParam,
  RouteParamAction,
  RouteParams,
  RouteParamPairs,
  RoutePathAction,
  RouteParamValue,
} from './actions';
import { LocationState } from './state';
import { TransactionRunner } from './transaction';

export enum RouterKind {
  Memory = 'memory',
  Browser = 'browser',
}

export enum ApplicationPath {
  ServiceMap = '/',
}

export enum Event {
  Commit = 'commit',
  LocationUpdated = 'location-updated',
  Initialized = 'initialized',
}

export type LocationUpdatedEvent = {
  location: Location;

  // NOTE: New location is detached, if the user moves along existing history states
  isDetached: boolean;
  hubbleUIState?: LocationState | null;
};

export type CommitOptions = NavigateOptions & {};

export type Handlers = {
  [Event.Commit]: (path: string, searchParams: URLSearchParams, opts?: CommitOptions) => void;
  [Event.LocationUpdated]: (_: LocationUpdatedEvent) => void;
  [Event.Initialized]: () => void;
};

// NOTE: It is important to make every operation that imples location change
// to have LocationState as its `state` prop. That allows the outer code to
// understand if location change was intentional or not.
export class Router extends EventEmitter<Handlers> {
  private location?: Location;
  private searchParams: URLSearchParams = new URLSearchParams();

  private _isLocationInitialized = false;
  private _isSearchParamsInitialized = false;
  private _latestLocationStateFootprint?: string | null;

  private _transaction: RouteAction[] = [];

  constructor(
    private kind: RouterKind,
    private dataLayer: DataLayer,
  ) {
    super(true);

    this.setupEventHandlers();
  }

  public get isInMemory() {
    return this.kind === RouterKind.Memory;
  }

  public get isInitialized() {
    return this._isLocationInitialized && this._isSearchParamsInitialized;
  }

  public get pathParts(): string[] {
    return this.location?.pathname.split('/').slice(1) || [];
  }

  public searchParamsUpdated(params: URLSearchParams) {
    console.log('searchParamsUpdated', params.toString());
    this.searchParams = params;

    this.updateInitializedFields(this._isLocationInitialized, true);
  }

  public locationUpdated(loc: Location) {
    this.location = loc;
    this.updateInitializedFields(true, this._isSearchParamsInitialized);

    const app = this.getApplicationByPath(loc.pathname);
    const hubbleUIState = LocationState.hasSerializable(loc.state)
      ? LocationState.fromHistoryState(loc.state)
      : void 0;

    const isDetached =
      hubbleUIState == null || hubbleUIState.id !== this._latestLocationStateFootprint;

    console.log('locationUpdated: ', loc, app, hubbleUIState, isDetached);
    this.emit(Event.LocationUpdated, {
      location: loc,
      hubbleUIState,
      isDetached,
    });

    this._latestLocationStateFootprint = hubbleUIState?.id;
  }

  public getRouteParams(): RouteParams {
    const ns = this.searchParams.get(RouteParam.Namespace);
    const verdicts = dhelpers.verdict.parseManySet(this.searchParams.get(RouteParam.Verdicts), '-');
    const httpStatus = this.searchParams.get(RouteParam.HttpStatus);
    const flowFilters = FilterEntry.parseMany(this.searchParams.get(RouteParam.FlowsFilter));

    const app = this.getCurrentApplication();

    return {
      namespace: ns,
      verdicts,
      httpStatus,
      flowFilters,
      app,
    };
  }

  public getCurrentApplication(): Application {
    return this.getApplicationByPath(this.pathParts[0]);
  }

  public goto(path: string, paramPairs: RouteParamPairs = []): this {
    this._transaction.push(RouteAction.path(RoutePathAction.new(path)));
    console.log(`route path action added: `, path);
    this.updateRouteParams(paramPairs);

    return this;
  }

  public openApplication(app: Application): this {
    return this.goto(this.getApplicationPathByApp(app));
  }

  public dropSearchParams() {
    this._transaction.push(RouteAction.dropSearchParams());
  }

  public commit(_commitOpts?: CommitOptions): this {
    const actions = this._transaction.splice(0, this._transaction.length);
    if (actions.length === 0) return this;

    const [path, searchParams, stateParams] = new TransactionRunner(
      this.location,
      this.searchParams,
    )
      .doMany(actions)
      .finish();

    const state = LocationState.empty().setParams(stateParams);
    this._latestLocationStateFootprint = state.id;
    // debugger;
    console.log(`LocationState will be pushed with id: `, state.id);

    // NOTE: Every commit will create a new entry in history and mark it with keyed state
    // so that external code could properly react on location changed event.
    const opts = this.fixNavigateOptions({ state: state.asSerializable() });
    this.emit(Event.Commit, path, searchParams, opts);
    return this;
  }

  public onCommit(fn: Handlers[Event.Commit]): this {
    this.on(Event.Commit, fn);
    return this;
  }

  public onLocationUpdated(fn: Handlers[Event.LocationUpdated]): this {
    this.on(Event.LocationUpdated, fn);
    return this;
  }

  public onInitialized(fn: Handlers[Event.Initialized]): this {
    this.on(Event.Initialized, fn);
    return this;
  }

  private setupEventHandlers() {
    // NOTE: Be careful when subscribing to dataLayer.controls.onFiltersChanged event, because
    // wrong set op in that handlers against router can cause infinite recursion cycle.

    this.dataLayer.controls.onCurrentNamespaceChanged(diff => {
      this.updateRouteParam(RouteParam.Namespace, diff.after);
    });

    this.dataLayer.controls.onVerdictsChanged(diff => {
      const param = dhelpers.verdict.join(diff.after, '-');
      this.updateRouteParam(RouteParam.Verdicts, !!param ? param : null);
    });

    this.dataLayer.controls.onHTTPStatusChanged(diff => {
      this.updateRouteParam(RouteParam.HttpStatus, diff.after);
    });

    this.dataLayer.controls.onFlowFiltersChanged(diff => {
      const str = diff.after?.map(f => f.toString()).join(',') || null;
      this.updateRouteParam(RouteParam.FlowsFilter, str);
    });
  }

  private updateRouteParams(pairs: RouteParamPairs) {
    if (pairs.length === 0) return;

    const actions = pairs.map(pair => RouteAction.param(RouteParamAction.fromPair(pair)));
    console.log(`adding route params actions`, actions);
    this._transaction = this._transaction.concat(actions);
  }

  private updateRouteParam(param: RouteParam, v?: RouteParamValue) {
    return this.updateRouteParams([[param, v]]);
  }

  // private updateStateParams(pairs: StateParamPairs) {
  //   if (pairs.length === 0) return;
  //
  //   const actions = pairs.map(pair => RouteAction.stateParam(StateParamAction.fromPair(pair)));
  //   console.log(`adding state param actions`, actions);
  //   this._transaction = this._transaction.concat(actions);
  // }
  //
  // private updateStateParam(param: StateParam, v?: StateParamValue) {
  //   return this.updateStateParams([[param, v]]);
  // }
  //
  private getApplicationPathByApp(app: Application): ApplicationPath {
    switch (app) {
      case Application.ServiceMap:
        return ApplicationPath.ServiceMap;
      default:
        console.error(`cannot match application "${app}" to route`);
        return ApplicationPath.ServiceMap;
    }
  }

  private getApplicationByPath(p: string | null): Application {
    const firstPart = (p || '').split('/').find(part => part.trim().length > 0) || '';

    switch (firstPart) {
      case '':
      case ApplicationPath.ServiceMap:
        return Application.ServiceMap;
      default:
        return Application.ServiceMap;
    }
  }

  private fixNavigateOptions(opts?: NavigateOptions): NavigateOptions {
    const newStateData = opts?.state
      ? { hubbleUIState: opts.state }
      : { hubbleUIState: LocationState.empty().asSerializable() };

    return { ...(opts || {}), state: newStateData };
  }

  private updateInitializedFields(locInited: boolean, spInited: boolean) {
    // NOTE: This method is used to determine the moment when router is initialized
    // and its data can be reliably used by the outer code. Particularly, this is
    // used in ServiceMapApp to wait, until route params can be used to initialize
    // the app inner data.
    const isLocFirstTimeInited = !this._isLocationInitialized && locInited;
    this._isLocationInitialized ||= locInited;

    const isSPFirstTimeInited = !this._isSearchParamsInitialized && spInited;
    this._isSearchParamsInitialized ||= spInited;

    const allInited = this._isLocationInitialized && this._isSearchParamsInitialized;

    if (allInited && (isLocFirstTimeInited || isSPFirstTimeInited)) {
      this.emit(Event.Initialized);
    }
  }
}
