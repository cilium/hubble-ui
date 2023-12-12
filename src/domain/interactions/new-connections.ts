import * as mobx from 'mobx';

import { Endpoint } from './endpoints';
export { IPEndpoint, L7Endpoint } from './endpoints';

// NOTE: Connections and PartialConnections are two classes representing any
// NOTE: kind of links/connections where Endpoint of each connection is
// NOTE: parameterized to allow client-code to use any kind of Endpoint payload.
// NOTE: See some concrete Endpoint implementations in ./endpoints.ts.

export class PartialConnections<E extends Endpoint> {
  // NOTE: { senderId -> { receiverId -> Endpoint }}
  // NOTE: OR
  // NOTE: { receiverId -> { endpointId -> Endpoint }}
  public _connections: Map<string, Map<string, E>> = new Map();

  constructor() {
    mobx.makeAutoObservable(this, void 0, {
      autoBind: true,
    });
  }

  public get size(): number {
    return this._connections.size;
  }

  public get ref(): Map<string, Map<string, E>> {
    return this._connections;
  }

  public clear() {
    this._connections.clear();
  }

  public upsert(rid: string, eid: string, ep: E): boolean {
    if (!this._connections.has(rid)) {
      this._connections.set(rid, new Map());
    }

    const toReceiver = this._connections.get(rid);
    const isNewEndpoint = !toReceiver?.has(eid);

    if (isNewEndpoint) {
      toReceiver?.set(eid, ep);
    } else {
      toReceiver?.get(eid)?.update?.(ep);
    }

    return isNewEndpoint;
  }

  public upsertMap(rid: string, incomings: Map<string, E>) {
    if (!this._connections.has(rid)) {
      this._connections.set(rid, new Map(incomings));
      return;
    }

    const receiverIncomings = this._connections.get(rid);
    incomings.forEach((ep, epId) => {
      if (!receiverIncomings?.has(epId)) {
        receiverIncomings?.set(epId, ep);
        return;
      }

      receiverIncomings?.get(epId)?.update?.(ep);
    });
  }

  public get(rid: string): Map<string, E> | undefined {
    return this._connections.get(rid);
  }

  public has(rid: string, eid?: string): boolean {
    if (eid == null) return this._connections.has(rid);

    return !!this._connections.get(rid)?.has(eid);
  }

  public getInversed(): PartialConnections<E> {
    const inv = new PartialConnections<E>();

    this._connections.forEach((partial, senderId) => {
      partial.forEach((ep, receiverId) => {
        inv.upsert(receiverId, senderId, ep);
      });
    });

    return inv;
  }

  public forEach(cb: (receivers: Map<string, E>, senderId: string) => void) {
    this._connections.forEach(cb);
  }

  public get inversed(): PartialConnections<E> {
    return this.getInversed();
  }

  public get endpointMap(): Map<string, E> {
    const m = new Map<string, E>();

    this._connections.forEach(endpoints => {
      endpoints.forEach((ep, key) => {
        m.set(key, ep);
      });
    });

    return m;
  }
}

export class Connections<E extends Endpoint> {
  // NOTE: { senderId -> { receiverId -> { endpointId -> Endpoint }}}
  public _connections: Map<string, PartialConnections<E>> = new Map();

  constructor() {
    mobx.makeAutoObservable(this, void 0, {
      autoBind: true,
    });
  }

  public clear() {
    this._connections.clear();
  }

  public upsert(sid: string, rid: string, eid: string, ep: E): boolean {
    return !!this.ensureSenderId(sid).upsert(rid, eid, ep);
  }

  public upsertEndpoints(sid: string, rid: string, eps: Map<string, E>) {
    this.ensureSenderId(sid).upsertMap(rid, eps);
  }

  public get(senderId: string): PartialConnections<E> | undefined {
    return this._connections.get(senderId);
  }

  // NOTE: { receiverId -> { senderId -> { endpointId -> Endpoint }}}
  // NOTE: allows to quickly get if specified receiver got smth from sender
  public getInversed(): Connections<E> {
    const inv = new Connections<E>();

    this._connections.forEach((partial, senderId) => {
      partial._connections.forEach((endpoints, receiverId) => {
        endpoints.forEach((ep, endpointId) => {
          inv.upsert(receiverId, senderId, endpointId, ep);
        });
      });
    });

    return inv;
  }

  public forEach(cb: (receivers: PartialConnections<E>, senderId: string) => void) {
    this._connections.forEach(cb);
  }

  // NOTE: { receiverId -> { senderId > { endpointId -> Endpoint }}}
  public get inversed(): Connections<E> {
    return this.getInversed();
  }

  public get endpointList(): E[] {
    return Array.from(this.endpointMap.values());
  }

  // NOTE: just combine all senders' endpointMap into single one
  public get endpointMap(): Map<string, E> {
    const m: Map<string, E> = new Map();

    this._connections.forEach(senderConnections => {
      const senderMap = senderConnections.endpointMap;

      senderMap.forEach((ep, key) => {
        m.set(key, ep);
      });
    });

    return m;
  }

  private ensureSenderId(sid: string): PartialConnections<E> {
    if (!this._connections.has(sid)) {
      this._connections.set(sid, new PartialConnections<E>());
    }

    return this._connections.get(sid)!;
  }
}

export class GroupedPartialConnections<E extends Endpoint> {
  // { receiverId -> { port -> { kind -> { endpointId -> E }}}}
  private _connections: Map<string, Connections<E>>;

  constructor() {
    this._connections = new Map();

    mobx.makeAutoObservable(this, void 0, {
      autoBind: true,
    });
  }

  public clear() {
    this._connections.clear();
  }

  public get(rid: string): Connections<E> | undefined {
    return this._connections.get(rid);
  }

  public upsert(rid: string, port: string, kind: string, eid: string, ep: E) {
    return this.ensureReceiverId(rid).upsert(port, kind, eid, ep);
  }

  public forReceiver(rid: string): Connections<E> | undefined {
    return this._connections.get(rid);
  }

  public forEach(cb: (receiverPorts: Connections<E>, receiverId: string) => void) {
    this._connections.forEach(cb);
  }

  // NOTE: returns { receiverId -> { port -> { endpointId -> E }}}
  public ofKind(kind: string): Connections<E> {
    const kindConns = new Connections<E>();

    this._connections.forEach((ports, receiverId) => {
      ports.forEach((endpointKinds, port) => {
        const endpoints = endpointKinds.get(kind);
        if (endpoints == null) return;

        kindConns.upsertEndpoints(receiverId, port, endpoints);
      });
    });

    return kindConns;
  }

  private ensureReceiverId(rid: string): Connections<E> {
    if (!this._connections.has(rid)) {
      this._connections.set(rid, new Connections<E>());
    }

    return this._connections.get(rid)!;
  }
}
