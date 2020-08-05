import { Labels } from '~/domain/labels';

export enum FlowsFilterKind {
  Label = 'label',
  Ip = 'ip',
  Dns = 'dns',
  Identity = 'identity',
  TCPFlag = 'tcp-flag',
  Pod = 'pod',
}

export enum FlowsFilterDirection {
  From = 'from',
  To = 'to',
  Both = 'both',
}

export interface Params {
  kind: FlowsFilterKind;
  direction: FlowsFilterDirection;
  query: string;
  meta?: string;
}

// TODO: write tests for parsing / serializing
export class FlowsFilterEntry {
  public kind: FlowsFilterKind;
  public direction: FlowsFilterDirection;
  public query: string;
  public meta?: string;

  public static parseFull(userInput: string): FlowsFilterEntry | null {
    let [rawDirection] = userInput.split(':');
    rawDirection = rawDirection || '';

    const [rawKind] = userInput.slice(rawDirection.length + 1).split('=');
    if (!rawKind) return null;

    const rawQuery = userInput.slice(rawDirection.length + rawKind.length + 2);

    const direction = FlowsFilterEntry.parseDirection(rawDirection);
    if (!direction) return null;

    const kind = FlowsFilterEntry.parseKind(rawKind);
    if (!kind) return null;

    const query = FlowsFilterEntry.parseQuery(kind, rawQuery);
    if (!query) return null;

    return new FlowsFilterEntry({ kind, direction, query });
  }

  public static parse(userInput: string): FlowsFilterEntry | null {
    if (userInput.length === 0) return null;

    let kind: FlowsFilterKind = FlowsFilterKind.Label;
    let direction: FlowsFilterDirection = FlowsFilterDirection.Both;
    let query: string = userInput;
    let parts = userInput.split(':');
    let rest: string[] = [];

    const [rawDirection, ...firstRest] = parts;
    const parsedDirection = FlowsFilterEntry.parseDirection(rawDirection);
    if (parsedDirection) {
      direction = parsedDirection;
      rest = firstRest;
    } else {
      rest = [rawDirection].concat(firstRest);
    }

    const kindWithQuery = rest.join(':');
    parts = kindWithQuery.split('=');
    if (parts.length < 2) {
      query = FlowsFilterEntry.parseQuery(kind, parts[0] || '');
      return new FlowsFilterEntry({ kind, direction, query });
    }

    const [rawKind, ...secondRest] = parts;
    const parsedKind = FlowsFilterEntry.parseKind(rawKind);
    if (parsedKind) {
      kind = parsedKind;
      rest = secondRest;
    } else {
      rest = [rawKind].concat(secondRest);
    }

    query = FlowsFilterEntry.parseQuery(kind, rest.join('='));
    return new FlowsFilterEntry({ kind, direction, query });
  }

  public static parseDirection(s: string): FlowsFilterDirection | null {
    switch (s) {
      case FlowsFilterDirection.From:
      case FlowsFilterDirection.To:
      case FlowsFilterDirection.Both:
        return s;
    }

    return null;
  }

  public static parseKind(kind: string): FlowsFilterKind | null {
    switch (kind) {
      case FlowsFilterKind.Label:
      case FlowsFilterKind.Ip:
      case FlowsFilterKind.Dns:
      case FlowsFilterKind.Identity:
      case FlowsFilterKind.TCPFlag:
      case FlowsFilterKind.Pod:
        return kind;
    }

    return null;
  }

  public static parseQuery(kind: FlowsFilterKind, query: string): string {
    const normalized = query
      .trim()
      .replace(/^(from:|to:|both:)/g, '')
      .trim();

    switch (kind) {
      case FlowsFilterKind.Label: {
        return normalized.replace(/^label=/g, '');
      }
      case FlowsFilterKind.Ip: {
        return normalized.replace(/^ip=/g, '');
      }
      case FlowsFilterKind.Dns: {
        return normalized.replace(/^dns=/g, '');
      }
      case FlowsFilterKind.Identity: {
        return normalized.replace(/^identity=/g, '');
      }
      case FlowsFilterKind.TCPFlag: {
        return normalized.replace(/^tcp-flag=/g, '');
      }
      case FlowsFilterKind.Pod: {
        return normalized.replace(/^pod=/g, '');
      }
    }
  }

  public static newTCPFlag(flag: string): FlowsFilterEntry {
    return new FlowsFilterEntry({
      kind: FlowsFilterKind.TCPFlag,
      query: flag,
      direction: FlowsFilterDirection.Both,
      meta: '',
    });
  }

  public static newLabel(label: string): FlowsFilterEntry {
    return new FlowsFilterEntry({
      kind: FlowsFilterKind.Label,
      query: label,
      direction: FlowsFilterDirection.Both,
      meta: '',
    });
  }

  public static newPod(podName: string): FlowsFilterEntry {
    return new FlowsFilterEntry({
      kind: FlowsFilterKind.Pod,
      query: podName,
      direction: FlowsFilterDirection.Both,
      meta: '',
    });
  }

  public static newIdentity(identity: string): FlowsFilterEntry {
    return new FlowsFilterEntry({
      kind: FlowsFilterKind.Identity,
      query: identity,
      direction: FlowsFilterDirection.Both,
      meta: '',
    });
  }

  public static newDNS(dns: string): FlowsFilterEntry {
    return new FlowsFilterEntry({
      kind: FlowsFilterKind.Dns,
      query: dns,
      direction: FlowsFilterDirection.Both,
      meta: '',
    });
  }

  public static newIP(ip: string): FlowsFilterEntry {
    return new FlowsFilterEntry({
      kind: FlowsFilterKind.Ip,
      query: ip,
      direction: FlowsFilterDirection.Both,
      meta: '',
    });
  }

  constructor({ kind, direction, query, meta }: Params) {
    this.kind = kind;
    this.query = query;
    this.direction = direction;
    this.meta = meta;
  }

  public prepareLabel() {
    this.ensureLabelPrefix();
  }

  public setMeta(meta: string): FlowsFilterEntry {
    this.meta = meta;

    return this;
  }

  public setQuery(q: string): FlowsFilterEntry {
    this.query = q;

    return this;
  }

  public setDirection(dir: FlowsFilterDirection): FlowsFilterEntry {
    this.direction = dir;

    return this;
  }

  public setKind(kind: FlowsFilterKind): FlowsFilterEntry {
    this.kind = kind;

    return this;
  }

  public toString(): string {
    return `${this.direction}:${this.kind}=${this.query}`;
  }

  public clone(): FlowsFilterEntry {
    return new FlowsFilterEntry({
      kind: this.kind,
      direction: this.direction,
      query: this.query,
      meta: this.meta,
    });
  }

  public equals(rhs: FlowsFilterEntry): boolean {
    return (
      this.kind === rhs.kind &&
      this.direction === rhs.direction &&
      this.query === rhs.query
    );
  }

  public get isDNS(): boolean {
    return this.kind === FlowsFilterKind.Dns;
  }

  public get isIdentity(): boolean {
    return this.kind === FlowsFilterKind.Identity;
  }

  public get isLabel(): boolean {
    return this.kind === FlowsFilterKind.Label;
  }

  public get isIp(): boolean {
    return this.kind === FlowsFilterKind.Ip;
  }

  public get isTCPFlag(): boolean {
    return this.kind === FlowsFilterKind.TCPFlag;
  }

  public get isPod(): boolean {
    return this.kind === FlowsFilterKind.Pod;
  }

  public get labelKeyValue(): [string, string] {
    const [key, ...rest] = this.query.split('=');

    return [key, rest.join('=')];
  }

  private ensureLabelPrefix() {
    if (!this.isLabel) return;
    this.query = Labels.ensureK8sPrefix(this.query);
  }
}
