import _ from 'lodash';

import { Service, Link, ApplicationKind, Interactions } from './service-map';
import { KV } from './misc';
import { reserved } from './cilium';
import { Labels } from './labels';

// This entity maintains ONLY THE DATA of service card
export class ServiceCard {
  public static readonly AppLabel = 'k8s:app';

  public service: Service;

  constructor(service: Service) {
    this.service = service;
  }

  public static fromService(srvc: Service): ServiceCard {
    return new ServiceCard(srvc);
  }

  public clone(): ServiceCard {
    return new ServiceCard(_.cloneDeep(this.service));
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

  public get appLabel(): string | null {
    return Labels.findAppNameInLabels(this.service.labels);
  }

  public get isCovalentRelated(): boolean {
    return this.service.labels.some(l => {
      const isExporter = l.value === 'covalent-exporter';
      const isAgent = l.value === 'covalent-agent';

      return isExporter || isAgent;
    });
  }

  public get id(): string {
    return this.service.id;
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
    return Labels.isWorld(this.service.labels);
  }

  public get isHost(): boolean {
    return Labels.isHost(this.service.labels);
  }

  public get isInit(): boolean {
    return Labels.isInit(this.service.labels);
  }

  public get isRemoteNode(): boolean {
    return Labels.isRemoteNode(this.service.labels);
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
}

export default ServiceCard;
