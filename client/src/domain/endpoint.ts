import { IEndpoint, KV, Protocol } from './mocked-data';
export { IEndpoint };

export enum ApplicationKind {
  HTTP = 'http',
  GRPC = 'grpc',
  ElasticSearch = 'elasticsearch',
  Kafka = 'kafka',
  Zookeeper = 'zookeeper',
}

export class Endpoint implements IEndpoint {
  public static readonly AppLabel = 'k8s:app';

  public id: string;
  public labels: Array<KV>;
  public egressEnforcement = false;
  public ingressEnforcement = false;
  public visibilityPolicy = false;

  constructor(obj: IEndpoint) {
    this.id = obj.id;
    this.labels = obj.labels;

    this.egressEnforcement = obj.egressEnforcement;
    this.ingressEnforcement = obj.ingressEnforcement;
    this.visibilityPolicy = obj.visibilityPolicy;
  }

  public static fromObject(obj: IEndpoint): Endpoint {
    return new Endpoint(obj);
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
    const label = this.labels.find(l => l.key === Endpoint.AppLabel);
    if (!label) return undefined;

    return label.value;
  }

  public get isCovalentRelated(): boolean {
    return this.labels.some(l => {
      const isExporter = l.value === 'covalent-exporter';
      const isAgent = l.value === 'covalent-agent';

      return isExporter || isAgent;
    });
  }

  public get caption(): string {
    return this.appLabel || 'Unknown App';
  }

  public get isWorld(): boolean {
    return this.labels.some(l => l.key === 'reserved:world');
  }

  public get isHost(): boolean {
    return this.labels.some(l => l.key === 'reserved:host');
  }

  public get isInit(): boolean {
    return this.labels.some(l => l.key === 'reserved:init');
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

export default Endpoint;
