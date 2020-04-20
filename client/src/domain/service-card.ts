import { Service, ApplicationKind } from './service-map';
import { KV } from '~/domain/misc';
import { reserved } from './cilium';

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

  // TODO: this will probably changed with new backend API
  // For now it's a part of legacy code
  public get appLabel(): string | undefined {
    const label = this.service.labels.find(l => l.key === ServiceCard.AppLabel);
    if (!label) return undefined;

    return label.value;
  }

  public get isCovalentRelated(): boolean {
    return this.service.labels.some(l => {
      const isExporter = l.value === 'covalent-exporter';
      const isAgent = l.value === 'covalent-agent';

      return isExporter || isAgent;
    });
  }

  public get id() {
    return this.service.id;
  }

  public get caption(): string {
    return this.appLabel || 'Unknown App';
  }

  public get labels(): Array<KV> {
    return this.service.labels;
  }

  public get isWorld(): boolean {
    return this.service.labels.some(l => l.key === reserved.world.label);
  }

  public get isHost(): boolean {
    return this.service.labels.some(l => l.key === reserved.host.label);
  }

  public get isInit(): boolean {
    return this.service.labels.some(l => l.key === reserved.init.label);
  }

  public get isCIDR(): boolean {
    return false;
    // return (
    //   Boolean(endpoint.v4Cidrs && endpoint.v4Cidrs.length) ||
    //   Boolean(endpoint.v6Cidrs && endpoint.v6Cidrs.length)
    // );
  }

  public get isDNS(): boolean {
    return false;
    // return endpoint.type && endpoint.type === AppEndpointType.DNS;
  }

  public get isAWS(): boolean {
    return (this.appProtocol || '').toLowerCase().includes('aws');
  }
}

export default ServiceCard;
