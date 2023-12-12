import * as mobx from 'mobx';

import { getIpWeight } from '~/domain/misc';
import { WrappedLayer7 } from '~/domain/layer7';
import { IPProtocol, HubbleLink, L7Kind, Verdict } from '~/domain/hubble';
import { Link } from '~/domain/link';
import { Method as HttpMethod } from '~/domain/http';
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
    const ports = this._ports.size === 0 ? '' : `:${[...this._ports].join(',')}`;

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
  private _verdicts: Set<Verdict>;

  public static generateId(method: HttpMethod, pathname: string): string {
    return l7helpers.httpIdFromParts(method, pathname);
  }

  constructor(l7: WrappedLayer7) {
    this.l7 = l7;
    this._verdicts = new Set();

    mobx.makeAutoObservable(this, void 0, {
      autoBind: true,
    });
  }

  public update(e: Endpoint) {
    if (!(e instanceof L7Endpoint)) return;

    e.verdicts.forEach(v => {
      this._verdicts.add(v);
    });
  }

  public addVerdict(v: Verdict) {
    this._verdicts.add(v);
  }

  public get ref(): WrappedLayer7 {
    return this.l7;
  }

  public get id(): string {
    return l7helpers.getEndpointId(this.l7);
  }

  public get verdicts(): Set<Verdict> {
    return new Set(this._verdicts);
  }
}
export class ServiceEndpoint implements Endpoint {
  public serviceId: string;
  public port: number;
  public l4Protocol: IPProtocol;
  public l7Protocol: L7Kind | null = null;
  public verdicts: Set<Verdict> = new Set();

  public static fromLink(link: HubbleLink | Link): ServiceEndpoint {
    // NOTE: it's probably worth to return two APs: source and destination
    const verdicts = link instanceof Link ? link.verdicts : new Set([link.verdict]);
    return new ServiceEndpoint(link.destinationId, link.destinationPort, link.ipProtocol, verdicts);
  }

  public static generateId(serviceId: string, port: number | string) {
    return `ap-${serviceId}-${port}`;
  }

  constructor(serviceId: string, port: number, protocol: IPProtocol, verdicts?: Iterable<Verdict>) {
    this.serviceId = serviceId;
    this.port = port;
    this.l4Protocol = protocol;

    if (verdicts != null) {
      for (const v of verdicts) {
        this.verdicts.add(v);
      }
    }

    mobx.makeAutoObservable(this, void 0, {
      autoBind: true,
    });
  }

  public update(e: Endpoint) {
    if (!(e instanceof ServiceEndpoint)) return;
    if (e.l7Protocol != null && this.l7Protocol == null) {
      this.l7Protocol = e.l7Protocol;
    }

    e.verdicts.forEach(v => this.verdicts.add(v));
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
