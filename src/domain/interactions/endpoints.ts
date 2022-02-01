import * as mobx from 'mobx';

import { getIpWeight } from '~/domain/misc';
import { WrappedLayer7 } from '~/domain/layer7';
import { IPProtocol, HubbleLink, L7Kind } from '~/domain/hubble';
import { Flow } from '~/domain/flows';
import * as l7helpers from '~/domain/helpers/l7';

// TODO: semantics of `update` method could be extended (?)
export interface Endpoint {
  id: string;

  update?: (e: Endpoint) => void;
}

export class IPEndpoint implements Endpoint {
  public _ip: string;
  public _ports: Set<number>;

  constructor(ip: string, ports?: Set<number>) {
    this._ip = ip;
    this._ports = ports ?? new Set();

    mobx.makeAutoObservable(this, void 0, {
      autoBind: true,
    });
  }

  public get id(): string {
    const ports =
      this._ports.size === 0 ? '' : `:${[...this._ports].join(',')}`;

    return `${this._ip}${ports}`;
  }

  public get ip(): string {
    return this._ip;
  }

  public get ipWeight(): number {
    return getIpWeight(this._ip);
  }

  public get ports(): Set<number> {
    return new Set(this._ports);
  }

  public get portsArray(): number[] {
    return [...this._ports];
  }

  public addPort(port: number): boolean {
    const isNew = !this._ports.has(port);
    this._ports.add(port);

    return isNew;
  }

  public removePort(port: number): boolean {
    const removed = this._ports.has(port);
    this._ports.delete(port);

    return removed;
  }

  public hasPort(port: number): boolean {
    return this._ports.has(port);
  }

  public update(e: Endpoint) {
    if (!(e instanceof IPEndpoint)) return;

    e.ports.forEach(port => {
      this._ports.add(port);
    });
  }
}

export class L7Endpoint implements Endpoint {
  private l7: WrappedLayer7;

  constructor(l7: WrappedLayer7) {
    this.l7 = l7;

    mobx.makeAutoObservable(this, void 0, {
      autoBind: true,
    });
  }

  public get ref(): WrappedLayer7 {
    return this.l7;
  }

  public get id(): string {
    return l7helpers.getEndpointId(this.l7);
  }
}

export class ServiceEndpoint implements Endpoint {
  public serviceId: string;
  public port: number;
  public l4Protocol: IPProtocol;
  public l7Protocol: L7Kind | null = null;

  public static fromLink(link: HubbleLink): ServiceEndpoint {
    // NOTE: it's probably worth to return two APs: source and destination
    return new ServiceEndpoint(
      link.destinationId,
      link.destinationPort,
      link.ipProtocol,
    );
  }

  public static generateId(serviceId: string, port: number | string) {
    return `ap-${serviceId}-${port}`;
  }

  public static destinationId(flow: Flow): string | null {
    if (flow.destinationPort == null) return null;

    return ServiceEndpoint.generateId(
      flow.destinationServiceId,
      flow.destinationPort,
    );
  }

  constructor(serviceId: string, port: number, protocol: IPProtocol) {
    this.serviceId = serviceId;
    this.port = port;
    this.l4Protocol = protocol;

    mobx.makeAutoObservable(this, void 0, {
      autoBind: true,
    });
  }

  public clone(): ServiceEndpoint {
    const ep = new ServiceEndpoint(this.serviceId, this.port, this.l4Protocol);
    ep.accumulateL7Protocol(this.l7Protocol);

    return ep;
  }

  public accumulateL7Protocol(l7Protocol: L7Kind | null): this {
    if (this.l7Protocol != null && l7Protocol == null) return this;

    this.l7Protocol = l7Protocol;
    return this;
  }

  public get id(): string {
    return ServiceEndpoint.generateId(this.serviceId, this.port);
  }
}
