import _ from 'lodash';
import { action, observable, computed } from 'mobx';

import { AbstractCard } from '~/domain/cards';
import { HubbleService } from '~/domain/hubble';
import { Link } from '~/domain/link';
import { Labels, LabelsProps } from '~/domain/labels';
import { KV } from '~/domain/misc';

import { ApplicationKind } from './types';
import { AccessPoint } from './access-point';

// This entity maintains ONLY THE DATA of service card
export class ServiceCard extends AbstractCard {
  public static readonly AppLabel = 'k8s:app';

  private _labelsProps: LabelsProps | null;

  @observable
  private _accessPoints: Map<string, AccessPoint>;

  public service: HubbleService;

  constructor(service: HubbleService) {
    super();

    this.service = service;
    this._labelsProps = null;
    this._accessPoints = new Map();
  }

  public get id(): string {
    return this.service.id;
  }

  @computed
  public get accessPoints(): Map<string, AccessPoint> {
    return new Map(this._accessPoints);
  }

  public static fromService(srvc: HubbleService): ServiceCard {
    return new ServiceCard(srvc);
  }

  @action.bound
  public addAccessPoint(ap: AccessPoint) {
    if (this._accessPoints.get(ap.id) != null) return;

    this._accessPoints.set(ap.id, ap);
  }

  @action.bound
  public addAccessPointFromLink(link: Link) {
    const ap = AccessPoint.fromLink(link.hubbleLink);
    return this.addAccessPoint(ap);
  }

  @action.bound
  public dropAccessPoints(): this {
    this._accessPoints = new Map();
    return this;
  }

  public clone(): ServiceCard {
    const card = new ServiceCard(_.cloneDeep(this.service));

    this._accessPoints.forEach(ap => {
      card.addAccessPoint(ap.clone());
    });

    return card;
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

  public get isCovalentRelated(): boolean {
    return this.service.labels.some(l => {
      const isExporter = l.value === 'covalent-exporter';
      const isAgent = l.value === 'covalent-agent';

      return isExporter || isAgent;
    });
  }

  public get caption(): string {
    if (this.isWorld && this.domain) {
      return this.domain;
    }
    return this.appLabel || 'Unknown App';
  }

  public get domain(): string | null {
    if (this.service.dnsNames.length === 0) return null;

    // TODO: better algorithm for getting domain name?
    return this.service.dnsNames[0];
  }

  public get labels(): Array<KV> {
    return this.service.labels;
  }

  public get namespace(): string | null {
    return Labels.findNamespaceInLabels(this.labels);
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
