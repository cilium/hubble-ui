import _ from 'lodash';
import { action, observable, computed, makeObservable } from 'mobx';

import { AbstractCard } from '~/domain/cards';
import { HubbleService, Workload } from '~/domain/hubble';
import { Link } from '~/domain/link';
import { Labels, LabelsProps, ReservedLabel, SpecialLabel } from '~/domain/labels';
import { FilterEntry } from '~/domain/filtering';
import { L7Endpoint, ServiceEndpoint } from '~/domain/interactions/endpoints';
import { Connections } from '~/domain/interactions/new-connections';
import { KV } from '~/domain/misc';
import * as dhelpers from '~/domain/helpers';

import { MapUtils } from '~/utils/iter-tools/map';
import { ApplicationKind } from './types';

// This entity maintains ONLY THE DATA of service card
export class ServiceCard extends AbstractCard {
  public static readonly UNKNOWN_APPNAME = 'Unknown App';

  public static fromService(srvc: HubbleService): ServiceCard {
    return new ServiceCard(srvc);
  }

  @observable
  private _accessPoints: Map<string, ServiceEndpoint>;
  private _labelsProps: LabelsProps | null;

  @observable
  private _identity: number;

  public service: HubbleService;

  constructor(service: HubbleService) {
    super();

    this.service = service;
    this._labelsProps = null;
    this._accessPoints = new Map();
    this._identity = service.identity;

    makeObservable(this);
  }

  @action.bound
  public setIdentity(identity: number): boolean {
    const isChanged = this._identity !== identity;
    this._identity = identity;

    return isChanged;
  }

  @action.bound
  public upsertAccessPoint(ap: ServiceEndpoint) {
    const existing = this._accessPoints.get(ap.id);
    if (existing == null) {
      this._accessPoints.set(ap.id, ap);
      return;
    }

    existing.update(ap);
  }

  @action.bound
  public upsertAccessPointFromLink(link: Link) {
    const ap = ServiceEndpoint.fromLink(link.hubbleLink);
    return this.upsertAccessPoint(ap);
  }

  @action.bound
  public updateAccessPointsL7(l7endpoints: Connections<L7Endpoint>) {
    l7endpoints.forEach((kinds, port) => {
      const apId = ServiceEndpoint.generateId(this.service.id, port);

      MapUtils.new(kinds.ref).mapKeys(l7kind => {
        const parsedL7Kind = dhelpers.l7.parseL7Kind(l7kind);
        if (parsedL7Kind == null) return;

        this._accessPoints.get(apId)?.accumulateL7Protocol(parsedL7Kind);
      });
    });
  }

  @action.bound
  public dropAccessPoints(): this {
    this._accessPoints = new Map();
    return this;
  }

  public clone(): ServiceCard {
    const card = new ServiceCard(_.cloneDeep(this.service));

    this._accessPoints.forEach(ap => {
      card.upsertAccessPoint(ap.clone());
    });

    card.setIdentity(this.identity);

    return card;
  }

  public get id(): string {
    return this.service.id;
  }

  public get identity(): number {
    return this._identity;
  }

  public hasWorkload(target: Workload): boolean {
    for (const wl of this.service.workloads) {
      if (dhelpers.workload.equals(wl, target)) return true;
    }

    return false;
  }

  public get workload(): Workload | null {
    const wls = this.service.workloads;

    return wls.length > 0 ? wls[0] : null;
  }

  // NOTE: One service map card can be found using different filter entries
  @computed
  public get filterEntries(): FilterEntry[] {
    const result = [];

    if (this.identity > 0) {
      result.push(FilterEntry.newIdentity(this.identity.toString()));
    }

    if (this.workload != null) {
      result.push(FilterEntry.newWorkload(this.workload));
    }

    if (this.isDNS) {
      result.push(FilterEntry.newDNS(this.caption));
    }

    if (this.isIngress) {
      result.push(FilterEntry.newLabel(ReservedLabel.Ingress));
    }

    if (this.isWorld) {
      result.push(FilterEntry.newLabel(ReservedLabel.World));
    }

    if (this.isKubeDNS) {
      result.push(FilterEntry.newLabel(Labels.normalizeKey(SpecialLabel.KubeDNS)));
    }

    return result;
  }

  public getFilterEntryMeta(fe: FilterEntry): string | null | undefined {
    return fe.isIdentity
      ? this.caption
      : fe.isWorkload
        ? this.workload?.kind
        : fe.isDNS
          ? this.domain
          : null || null;
  }

  @computed
  public get accessPoints(): Map<string, ServiceEndpoint> {
    return new Map(this._accessPoints);
  }

  public get appProtocol(): ApplicationKind | undefined {
    const appLbl = this.appLabel;
    if (appLbl == null) return undefined;

    for (const key of Object.keys(ApplicationKind)) {
      const value = (ApplicationKind as any)[key];
      if (value === appLbl) {
        return value as ApplicationKind;
      }
    }

    return undefined;
  }

  private get labelsProps(): LabelsProps {
    if (this._labelsProps === null) {
      this._labelsProps = Labels.detect(this.service.labels);
    }

    return this._labelsProps;
  }

  public get appLabel(): string | null {
    return this.labelsProps.appName || null;
  }

  public get clusterName(): string | null {
    return this.labelsProps.clusterName || null;
  }

  @computed
  public get isCovalentRelated(): boolean {
    return this.service.labels.some(l => {
      const isExporter = l.value === 'covalent-exporter';
      const isAgent = l.value === 'covalent-agent';

      return isExporter || isAgent;
    });
  }

  @computed
  public get caption(): string {
    if (this.isWorld && this.domain) {
      return this.domain;
    }

    if (this.isIngress) return 'Ingress';

    return this.appName;
  }

  @computed
  public get appName(): string {
    const appLabel = this.appLabel;
    if (appLabel != null) return appLabel;

    const workloadName = this.workloadName;
    if (!!workloadName) return workloadName;

    return ServiceCard.UNKNOWN_APPNAME;
  }

  @computed
  public get workloadName(): string | null {
    if (this.service.workloads.length === 0) return null;

    const named = this.service.workloads.find(w => w.name.length > 0);
    return named?.name || null;
  }

  @computed
  public get hasClearAppName(): boolean {
    const appName = this.appName;

    return (
      appName !== ServiceCard.UNKNOWN_APPNAME && appName !== 'unmanaged' && appName !== 'unknown'
    );
  }

  @computed
  public get domain(): string | null {
    if (this.service.dnsNames.length === 0) return null;

    // TODO: better algorithm for getting domain name?
    return this.service.dnsNames[0];
  }

  public get labels(): Array<KV> {
    return this.service.labels;
  }

  @computed
  public get networks(): Array<string> {
    return Labels.findNetworksInLabels(this.service.labels);
  }

  @computed
  public get namespace(): string | null {
    return this.service.namespace || Labels.findNamespaceInLabels(this.labels);
  }

  public get isWorld(): boolean {
    return this.labelsProps.isWorld;
  }

  public get isHost(): boolean {
    return this.labelsProps.isHost;
  }

  public get isInit(): boolean {
    return this.labelsProps.isInit;
  }

  public get isRemoteNode(): boolean {
    return this.labelsProps.isRemoteNode;
  }

  public get isIngress(): boolean {
    return this.labelsProps.isIngress;
  }

  public get isKubeDNS(): boolean {
    return this.labelsProps.isKubeDNS;
  }
  public get isCIDR(): boolean {
    return false;
    // return (
    //   Boolean(endpoint.v4Cidrs && endpoint.v4Cidrs.length) ||
    //   Boolean(endpoint.v6Cidrs && endpoint.v6Cidrs.length)
    // );
  }

  public get hasDNS(): boolean {
    return this.service.dnsNames.length > 0;
  }

  public get isDNS(): boolean {
    return this.isWorld && this.hasDNS;
  }

  public get isAWS(): boolean {
    return (this.appProtocol || '').toLowerCase().includes('aws');
  }

  public get isPrometheusApp(): boolean {
    return this.labelsProps.isPrometheusApp;
  }
}

export default ServiceCard;
