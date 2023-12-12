import { makeAutoObservable } from 'mobx';

import { NamespaceDescriptor } from '~/domain/namespaces';
import { StateChange } from '~/domain/misc';

export class NamespaceStore {
  // private _seenNamespaces: Map<string, boolean> = new Map();
  private _relayNamespaces: Map<string, NamespaceDescriptor> = new Map();
  private _currentNamespace: string | null = null;

  constructor() {
    makeAutoObservable(this, void 0, {
      autoBind: true,
    });
  }

  public clear() {
    this._relayNamespaces.clear();
  }

  public clone(): NamespaceStore {
    const s = new NamespaceStore();

    this._relayNamespaces.forEach(desc => {
      s.set(desc);
    });

    s.setCurrent(this._currentNamespace);
    return s;
  }

  public setCurrent(ns?: string | null): boolean {
    this._currentNamespace = ns ?? null;
    return this.current != null;
  }

  public set(ns: NamespaceDescriptor, isCurrent?: boolean): void {
    if (ns.relay) {
      this._relayNamespaces.set(ns.namespace, ns);
    }

    if (isCurrent != null) {
      this.setCurrent(ns.namespace);
    }
  }

  public get(ns: string | null | undefined): NamespaceDescriptor | null {
    if (ns == null) return null;

    const relayNs = this._relayNamespaces.get(ns);

    return {
      namespace: ns,
      relay: relayNs != null,
    };
  }

  public has(ns: NamespaceDescriptor): boolean {
    return this._relayNamespaces.has(ns.namespace);
  }

  public add(nsd: NamespaceDescriptor[]) {
    nsd.forEach(d => {
      this.set(d);
    });
  }

  public addRelayNamespaces(nss: string[]) {
    nss.forEach(ns => {
      this.set({ namespace: ns, relay: true });
    });
  }

  public applyChange(ns: NamespaceDescriptor, ch: StateChange) {
    this.set(ns);
  }

  public get relayNamespaces(): NamespaceDescriptor[] {
    return [...this._relayNamespaces.values()].sort((a, b) => {
      return a.namespace.toLowerCase() < b.namespace.toLowerCase() ? -1 : 1;
    });
  }

  public get combinedNamespaces(): NamespaceDescriptor[] {
    const map: { [key: string]: NamespaceDescriptor } = {};

    [...this.relayNamespaces].forEach(ns => {
      if (!map[ns.namespace]) map[ns.namespace] = { ...ns };

      map[ns.namespace].relay ||= ns.relay;
    });

    return Object.values(map);
  }

  public get current(): NamespaceDescriptor | null {
    return this.get(this._currentNamespace);
  }

  public get currentRaw(): string | null {
    return this._currentNamespace;
  }

  public get isSet(): boolean {
    return this.current != null;
  }
}

export default NamespaceStore;
