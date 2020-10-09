import { AbstractAccessPoint } from '~/domain/cards';
import { IPProtocol, HubbleLink } from '~/domain/hubble';

export class AccessPoint implements AbstractAccessPoint {
  public readonly serviceId: string;
  public readonly port: number;
  public readonly protocol: IPProtocol;

  public static fromLink(link: HubbleLink): AccessPoint {
    // NOTE: it's probably worth to return two APs: source and destination
    return new AccessPoint(
      link.destinationId,
      link.destinationPort,
      link.ipProtocol,
    );
  }

  public static generateId(serviceId: string, port: number) {
    return `ap-${serviceId}-${port}`;
  }

  constructor(serviceId: string, port: number, protocol: IPProtocol) {
    this.serviceId = serviceId;
    this.port = port;
    this.protocol = protocol;
  }

  public clone(): AccessPoint {
    return new AccessPoint(this.serviceId, this.port, this.protocol);
  }

  public get id(): string {
    return AccessPoint.generateId(this.serviceId, this.port);
  }
}
