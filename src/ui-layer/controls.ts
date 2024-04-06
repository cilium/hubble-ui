import * as mobx from 'mobx';

import { DataLayer } from '~/data-layer';
import { ApplicationPath, Router } from '~/router';
import * as storage from '~/storage/local';
import { Store } from '~/store';

import { Application } from '~/domain/common';
import { NamespaceChange } from '~/domain/events';
import { Verdict } from '~/domain/hubble';
import { DataMode } from '~/domain/interactions';
import { StateChange } from '~/domain/misc';
import { NamespaceDescriptor } from '~/domain/namespaces';
import { Notification } from '~/domain/notifications';
import { FilterEntry } from '~/domain/filtering/filter-entry';

import { Options } from './common';
import { StatusCenter } from './status-center';

export class Controls {
  private store: Store;
  private router: Router;
  private dataLayer: DataLayer;
  private statusCenter: StatusCenter;

  constructor(opts: Options) {
    this.store = opts.store;
    this.router = opts.router;
    this.dataLayer = opts.dataLayer;
    this.statusCenter = opts.statusCenter;

    this.setupEventHandlers();

    mobx.makeObservable(this);
  }

  @mobx.computed
  public get isHostShown() {
    return this.store.controls.showHost;
  }

  public namespaceChanged(ns: string | null) {
    console.log(`UILayer.controls namespaceChanged`);
    // TODO: Actually, we need to drop only those filter entries, which don't make sense on
    // namespace change and leave all others there.
    this.dataLayer.controls.setFlowFilters(null);
    this.dataLayer.controls.setCurrentNamespace(ns);

    const current = this.store.namespaces.current;
    if (ns !== current?.namespace) return;

    this.openApplicationByNamespace(current);
    this.router.commit();
  }

  public toggleVerdict(verdict: Verdict | null) {
    this.dataLayer.controls.toggleVerdict(verdict);
    this.router.commit();
  }

  public toggleShowHost() {
    this.dataLayer.controls.toggleShowHost();
  }

  public toggleShowKubeDNS() {
    this.dataLayer.controls.toggleShowKubeDNS();
  }

  public toggleShowRemoteNode() {
    this.dataLayer.controls.toggleShowRemoteNode();
  }

  public toggleShowPrometheusApp() {
    this.dataLayer.controls.toggleShowPrometheusApp();
  }

  public setFlowFilters(ff: FilterEntry[] | null) {
    this.dataLayer.controls.setFlowFilters(ff);
    this.router.commit();
  }

  public applicationChanged(app: Application) {
    this.openApplication(app);
    this.router.commit();
  }

  public setupControlStream() {
    this.dataLayer.controls
      .ensureControlStream()
      .onNotification(notif => {
        this.statusCenter.push(notif);
      })
      .onNamespaceChanges(changes => this.handleNamespaceChanges(changes))
      .onErrors(errs => {
        this.statusCenter.pushControlStreamErrors(errs);
      })
      .run();
  }

  private openApplication(app: Application) {
    // NOTE: Do not call `store.controls.setCurrentApp` here, it would disallow
    // UILayer to detect application change.
    this.router.openApplication(app);
  }

  public adjustTransferState(ns?: NamespaceDescriptor | null) {
    let targetMode = DataMode.Disabled;
    if (ns != null) {
      targetMode = DataMode.CiliumStreaming;
    }

    this.dataLayer.controls.setDataMode(targetMode);
  }

  private setupEventHandlers() {}

  private handleNamespaceChanges(changes: NamespaceChange[]) {
    this.checkIfCurrentNamespaceNotObserved(changes);
  }

  private checkIfCurrentNamespaceNotObserved(changes: NamespaceChange[]) {
    const currentNs = this.store.namespaces.currentRaw;
    if (currentNs == null) return;

    const currentNamespaceChange = changes.find(ch => {
      return ch.change === StateChange.Added && ch.namespace.namespace === currentNs;
    });

    if (currentNamespaceChange == null) return;

    // TODO: Smth is wrong with all this logic
    const nsDesc = this.store.namespaces.get(currentNs);
    if (nsDesc == null) {
      this.statusCenter.pushNamespaceIsNotObserved(currentNs);
      storage.deleteLastNamespace();
    } else {
      this.statusCenter.pushNamespaceIsObserved(nsDesc);
      this.adjustTransferState(nsDesc);
    }
  }

  private openApplicationByNamespace(nsDesc?: NamespaceDescriptor | null) {
    const { controls } = this.store;
    const currentAppProps = controls.app;

    let targetApp = Application.ServiceMap;
    if (nsDesc == null) {
      targetApp = Application.ServiceMap;
    } else if (currentAppProps.isServiceMap) {
      targetApp = Application.ServiceMap;
    } else {
      targetApp = controls.currentApp;
    }

    console.log('openApplicationByNamespace: ', targetApp, nsDesc, currentAppProps);
    this.openApplication(targetApp);
  }
}
