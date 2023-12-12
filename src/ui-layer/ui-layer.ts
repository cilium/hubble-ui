import { DataLayer, Event as DLEvent } from '~/data-layer';
import { Router, Event as REvent } from '~/router';
import { Store } from '~/store';
import * as ui from '~/ui';

import { DataMode, TransferState } from '~/domain/interactions';
import { FeatureFlags } from '~/domain/features';
import { Application } from '~/domain/common';

import { StatusCenter } from './status-center';
import { Controls } from './controls';
import { ServiceMap } from './service-map';

import { CommonUtils, Options } from './common';
import { ConnectEvent } from '~/data-layer/connect-event';

export type BuildOptions = {
  router: Router;
  store: Store;
  dataLayer: DataLayer;
  isCSSVarsInjectionEnabled: boolean;
};

export class UILayer {
  public readonly statusCenter: StatusCenter;
  public readonly controls: Controls;
  public readonly serviceMap: ServiceMap;

  private readonly transferState: TransferState;

  public static new(opts: BuildOptions): UILayer {
    return new UILayer(opts.router, opts.store, opts.dataLayer, opts.isCSSVarsInjectionEnabled);
  }

  constructor(
    public router: Router,
    private store: Store,
    private dataLayer: DataLayer,
    private isCSSVarsInjectionEnabled: boolean,
  ) {
    this.transferState = dataLayer.transferState;
    this.statusCenter = new StatusCenter({
      maxNotifications: 100,
    });

    this.controls = new Controls(this.commonOpts);
    this.serviceMap = new ServiceMap(this.commonOpts);

    this.setupEventHandlers();
  }

  public get commonOpts(): Options {
    return {
      statusCenter: this.statusCenter,
      router: this.router,
      store: this.store,
      dataLayer: this.dataLayer,
      utils: this.utils,
    };
  }

  private get utils(): CommonUtils {
    return {};
  }

  public onMounted() {}

  public onBeforeMount() {
    this.injectCSSVars();
  }

  private injectCSSVars() {
    if (this.isCSSVarsInjectionEnabled) {
      ui.setCSSVars(ui.sizes);
      ui.setCSSVarsZIndex(ui.zIndex);
    }
  }

  private setupEventHandlers() {
    this.dataLayer.once(DLEvent.FeatureFlagsSet, ff => {
      console.log(`feature flags set: `, ff);
      this.trySetupEverything();
    });

    this.router.once(REvent.Initialized, () => {
      console.log(`router is initialized`);
      this.trySetupEverything();
    });

    this.dataLayer.serviceMap.onConnectEvent(ce => {
      this.handleConnectEvent(ce);
    });
  }

  private handleConnectEvent(ce: ConnectEvent) {
    if (ce.isSuccess && ce.isAllReconnected) {
      this.statusCenter.pushStreamsReconnected();
    } else if (ce.isAttemptDelay && ce.delay) {
      this.statusCenter.pushStreamsReconnectingDelay(ce.delay);
    } else if (ce.isFailed) {
      if (ce.attempt === 1) this.statusCenter.pushStreamsReconnecting();
      if (ce.error != null) {
        this.statusCenter.pushStreamsReconnectFailed(ce.error);
      }
    } else if (ce.isDisconnected) {
      this.statusCenter.pushStreamsReconnecting();
    }
  }

  private trySetupEverything() {
    const { uiSettings } = this.store;
    if (!uiSettings.isFeaturesSet || !this.router.isInitialized) {
      console.log(`trySetupEverything is prevented`);
      return;
    }

    this.setupEverything(this.store.uiSettings.featureFlags);
  }

  private setupEverything(ff: FeatureFlags) {
    // NOTE: The only thing `applyLocalParameters` doesnt do is setting current
    // application inside control store. This allows to decide whether we need
    // to switch there or not here, on higher level of responsibility.
    this.controls.setupControlStream();

    this.router.onLocationUpdated(async evt => {
      const app = this.router.getCurrentApplication();
      const [prevApp, isChanged] = this.store.controls.setCurrentApp(app);
      console.log('UILayer: onLocationUpdated: ', evt, prevApp, app, isChanged);

      // NOTE: Location is "detached" if it was changed not by application controls
      // i e for example by pressing "back" button in the browser
      if (evt.isDetached) {
        console.log(`updated location is detached, calling applyLocalParameters`);

        // NOTE: We reapply all the application parameters here and the main
        // complexity is to notify all other parts of UI of that, not triggering
        // recursive emits...
        await this.reapplyApplicationState();
      }

      await this.appToggled(prevApp, app, isChanged);
      this.controls.adjustTransferState(this.store.namespaces.current);
    });

    // NOTE: FiltersChanged event is not triggered on first application open
    this.dataLayer.controls.onFiltersChanged(async f => {
      console.log('UI layer: filters changed', f);
      await this.dataLayer.filtersChanged(f);
    });
  }

  private async reapplyApplicationState() {
    const filtersDiff = this.store.filtersDiff;
    this.applyLocalParameters();
    filtersDiff.step(this.store.filters);

    if (filtersDiff.changed) {
      console.log(`filters are changed after applyLocalParameters`, filtersDiff);
      await this.dataLayer.filtersChanged(filtersDiff);
    }

    this.serviceMap.toggleDetached();
  }

  private async appToggled(prevApp: Application, nextApp: Application, isChanged: boolean) {
    console.log(`appToggled`, prevApp, nextApp, isChanged);

    await this.serviceMap.appToggled(prevApp, nextApp, isChanged);
  }

  private applyLocalParameters(): void {
    const routeParams = this.router.getRouteParams();
    const storageParams = this.dataLayer.readLocalStorageParams();

    console.log(`applying local params: `, routeParams, storageParams);

    // NOTE: All these setters are used directly without DataLayer not to trigger
    // for example router to reemit events of params update. This is the initialization
    // of the app.
    this.store.controls.setShowHost(storageParams.isHostShown);
    this.store.controls.setShowKubeDns(storageParams.isKubeDNSShown);
    this.store.controls.setHttpStatus(routeParams.httpStatus);
    this.store.controls.setFlowFilters(routeParams.flowFilters);
    this.store.controls.setVerdicts(routeParams.verdicts);
    this.store.namespaces.setCurrent(routeParams.namespace);

    const dataMode = this.fixDataMode(storageParams.dataMode);
    this.transferState.setDataMode(dataMode);

    this.router.commit();
  }

  private fixDataMode(dataMode: DataMode | null): DataMode {
    return dataMode || DataMode.CiliumStreaming;
  }
}
