import { Labels } from '~/domain/labels';

export enum Kind {
  Label = 'label',
  Ip = 'ip',
  Dns = 'dns',
  Identity = 'identity',
  TCPFlag = 'tcp-flag',
  Pod = 'pod',
}

export enum Direction {
  From = 'from',
  To = 'to',
  Both = 'both',
}

export interface Params {
  kind: Kind;
  direction: Direction;
  query: string;
  meta?: string;
}

// TODO: write tests for parsing / serializing
export class FilterEntry {
  public kind: Kind;
  public direction: Direction;
  public query: string;
  public meta?: string;

  public static parseFull(userInput: string): FilterEntry | null {
    let [rawDirection] = userInput.split(':');
    rawDirection = rawDirection || '';

    const [rawKind] = userInput.slice(rawDirection.length + 1).split('=');
    if (!rawKind) return null;

    const rawQuery = userInput.slice(rawDirection.length + rawKind.length + 2);

    const direction = FilterEntry.parseDirection(rawDirection);
    if (!direction) return null;

    const kind = FilterEntry.parseKind(rawKind);
    if (!kind) return null;

    const query = FilterEntry.parseQuery(kind, rawQuery);
    if (!query) return null;

    return new FilterEntry({ kind, direction, query });
  }

  public static parse(userInput: string): FilterEntry | null {
    if (userInput.length === 0) return null;

    let kind: Kind = Kind.Label;
    let direction: Direction = Direction.Both;
    let query: string = userInput;
    let parts = userInput.split(':');
    let rest: string[] = [];

    const [rawDirection, ...firstRest] = parts;
    const parsedDirection = FilterEntry.parseDirection(rawDirection);
    if (parsedDirection) {
      direction = parsedDirection;
      rest = firstRest;
    } else {
      rest = [rawDirection].concat(firstRest);
    }

    const kindWithQuery = rest.join(':');
    parts = kindWithQuery.split('=');
    if (parts.length < 2) {
      query = FilterEntry.parseQuery(kind, parts[0] || '');
      return new FilterEntry({ kind, direction, query });
    }

    const [rawKind, ...secondRest] = parts;
    const parsedKind = FilterEntry.parseKind(rawKind);
    if (parsedKind) {
      kind = parsedKind;
      rest = secondRest;
    } else {
      rest = [rawKind].concat(secondRest);
    }

    query = FilterEntry.parseQuery(kind, rest.join('='));
    return new FilterEntry({ kind, direction, query });
  }

  public static parseDirection(s: string): Direction | null {
    if (Object.values(Direction).includes(s as any)) return s as Direction;

    return null;
  }

  public static parseKind(kind: string): Kind | null {
    if (Object.values(Kind).includes(kind as any)) return kind as Kind;

    return null;
  }

  public static parseQuery(kind: Kind, query: string): string {
    const normalized = query
      .trim()
      .replace(/^(from:|to:|both:)/g, '')
      .trim();

    switch (kind) {
      case Kind.Label: {
        return normalized.replace(/^label=/g, '');
      }
      case Kind.Ip: {
        return normalized.replace(/^ip=/g, '');
      }
      case Kind.Dns: {
        return normalized.replace(/^dns=/g, '');
      }
      case Kind.Identity: {
        return normalized.replace(/^identity=/g, '');
      }
      case Kind.TCPFlag: {
        return normalized.replace(/^tcp-flag=/g, '');
      }
      case Kind.Pod: {
        return normalized.replace(/^pod=/g, '');
      }
    }
  }

  public static newTCPFlag(flag: string): FilterEntry {
    return new FilterEntry({
      kind: Kind.TCPFlag,
      query: flag,
      direction: Direction.Both,
      meta: '',
    });
  }

  public static newLabel(label: string): FilterEntry {
    return new FilterEntry({
      kind: Kind.Label,
      query: label,
      direction: Direction.Both,
      meta: '',
    });
  }

  public static newPod(podName: string): FilterEntry {
    return new FilterEntry({
      kind: Kind.Pod,
      query: podName,
      direction: Direction.Both,
      meta: '',
    });
  }

  public static newIdentity(identity: string): FilterEntry {
    return new FilterEntry({
      kind: Kind.Identity,
      query: identity,
      direction: Direction.Both,
      meta: '',
    });
  }

  public static newDNS(dns: string): FilterEntry {
    return new FilterEntry({
      kind: Kind.Dns,
      query: dns,
      direction: Direction.Both,
      meta: '',
    });
  }

  public static newIP(ip: string): FilterEntry {
    return new FilterEntry({
      kind: Kind.Ip,
      query: ip,
      direction: Direction.Both,
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

  public setMeta(meta: string): FilterEntry {
    this.meta = meta;

    return this;
  }

  public setQuery(q: string): FilterEntry {
    this.query = q;

    return this;
  }

  public setDirection(dir: Direction): FilterEntry {
    this.direction = dir;

    return this;
  }

  public setKind(kind: Kind): FilterEntry {
    this.kind = kind;

    return this;
  }

  public toString(): string {
    return `${this.direction}:${this.kind}=${this.query}`;
  }

  public clone(): FilterEntry {
    return new FilterEntry({
      kind: this.kind,
      direction: this.direction,
      query: this.query,
      meta: this.meta,
    });
  }

  public equals(rhs: FilterEntry): boolean {
    return (
      this.kind === rhs.kind &&
      this.direction === rhs.direction &&
      this.query === rhs.query
    );
  }

  public get isDNS(): boolean {
    return this.kind === Kind.Dns;
  }

  public get isIdentity(): boolean {
    return this.kind === Kind.Identity;
  }

  public get isLabel(): boolean {
    return this.kind === Kind.Label;
  }

  public get isIp(): boolean {
    return this.kind === Kind.Ip;
  }

  public get isTCPFlag(): boolean {
    return this.kind === Kind.TCPFlag;
  }

  public get isPod(): boolean {
    return this.kind === Kind.Pod;
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
