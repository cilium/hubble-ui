import _ from 'lodash';

import { Labels } from '~/domain/labels';
import { PodSelector, Workload } from '~/domain/hubble';

export enum Kind {
  Label = 'label',
  Ip = 'ip',
  Dns = 'dns',
  Identity = 'identity',
  Workload = 'workload',
  TCPFlag = 'tcp-flag',
  Pod = 'pod',
}

export enum Direction {
  From = 'from',
  To = 'to',
  Either = 'either',
}

export interface Params {
  kind: Kind;
  direction: Direction;
  query: string;
  meta?: string;
  negative?: boolean;
}

// TODO: write tests for parsing / serializing
export class FilterEntry {
  public kind: Kind;
  public direction: Direction;
  public query: string;
  public meta?: string;
  public negative: boolean;

  public static parseMany(src: any, sep = ','): FilterEntry[] {
    if (!src || !_.isString(src)) return [];

    return src.split(sep).reduce((acc, part) => {
      part = part.trim();
      if (!part) return acc;

      const entry = FilterEntry.parse(part);
      if (!entry) return acc;

      acc.push(entry);
      return acc;
    }, [] as FilterEntry[]);
  }

  public static parse(userInput: string): FilterEntry | null {
    if (userInput.length === 0) return null;

    const parts = FilterEntry.parseParts(userInput);
    if (parts == null) return null;

    const [direction, kind, rest, negative] = parts;
    const [query, meta] = FilterEntry.parseRest(kind, rest);

    return new FilterEntry({ kind, direction, query, meta, negative });
  }

  public static parseDirection(s: string): Direction | null {
    if (Object.values(Direction).includes(s as any)) return s as Direction;

    return null;
  }

  public static parseKind(kind: string): Kind | null {
    if (Object.values(Kind).includes(kind as any)) return kind as Kind;

    return null;
  }

  // NOTE: This function combines base with include/exclude
  // returning only unique entries
  public static combine(
    base: Iterable<FilterEntry> | null | undefined,
    include: FilterEntry[] | null | undefined = [],
    exclude: FilterEntry[] | null | undefined = [],
  ): [FilterEntry[], boolean] {
    const excludeHashes = new Set((exclude || []).map(f => f.toString()));
    const result: FilterEntry[] = [];
    let isChanged = false;

    for (const fe of base || []) {
      const key = fe.toString();
      if (excludeHashes.has(key)) {
        isChanged = true;
        continue;
      }

      result.push(fe);

      // NOTE: This will prevent duplicates
      excludeHashes.add(key);
    }

    for (const fe of include || []) {
      const key = fe.toString();
      if (excludeHashes.has(key)) continue;

      result.push(fe);
      excludeHashes.add(key);
      isChanged = true;
    }

    return [result, isChanged];
  }

  public static unique(base: Iterable<FilterEntry> | null | undefined): FilterEntry[] {
    const [result] = FilterEntry.combine(base);
    return result;
  }

  public static newTCPFlag(flag: string): FilterEntry {
    return new FilterEntry({
      kind: Kind.TCPFlag,
      query: flag,
      direction: Direction.Either,
      meta: '',
    });
  }

  public static newLabel(label: string): FilterEntry {
    return new FilterEntry({
      kind: Kind.Label,
      query: label,
      direction: Direction.Either,
      meta: '',
    });
  }

  public static newPod(podName: string): FilterEntry {
    return new FilterEntry({
      kind: Kind.Pod,
      query: podName,
      direction: Direction.Either,
      meta: '',
    });
  }

  public static newPodSelector(ps: PodSelector): FilterEntry {
    return FilterEntry.newPod(ps.pod).setMeta(ps.namespace || '');
  }

  public static newIdentity(identity: string): FilterEntry {
    return new FilterEntry({
      kind: Kind.Identity,
      query: identity,
      direction: Direction.Either,
      meta: '',
    });
  }

  public static newDNS(dns: string): FilterEntry {
    return new FilterEntry({
      kind: Kind.Dns,
      query: dns,
      direction: Direction.Either,
      meta: '',
    });
  }

  public static newIP(ip: string): FilterEntry {
    return new FilterEntry({
      kind: Kind.Ip,
      query: ip,
      direction: Direction.Either,
      meta: '',
    });
  }

  public static newWorkload(wl: Workload): FilterEntry {
    return new FilterEntry({
      kind: Kind.Workload,
      query: wl.name,
      direction: Direction.Either,
      meta: wl.kind,
    });
  }

  private static parseParts(userInput: string): [Direction, Kind, string, boolean] | null {
    // NOTE: This helper method simplifies the original parsing of raw userInput
    const negative: boolean = userInput[0] === '!';
    if (negative) userInput = userInput.substring(1);

    let firstColonIdx = userInput.indexOf(':');
    let direction = Direction.Either;
    if (firstColonIdx !== -1) {
      const dirPart = userInput.slice(0, firstColonIdx);
      const parsed = FilterEntry.parseDirection(dirPart);

      // NOTE: If dirPart is not a correct direction, firstColonIdx points to wrong position for
      // lates actions. To understand it, consider parsing this string: `workload=dep:app-dep`
      if (parsed != null) {
        direction = parsed;
      } else {
        firstColonIdx = -1;
      }
    }

    const firstEqualIdx = userInput.indexOf('=');
    if (firstEqualIdx === -1) {
      return [direction, Kind.Label, userInput.slice(firstColonIdx + 1), negative];
    }

    const kindPart = userInput.slice(firstColonIdx + 1, firstEqualIdx);
    const kind = FilterEntry.parseKind(kindPart);

    return kind == null
      ? [direction, Kind.Label, userInput.slice(firstColonIdx + 1), negative]
      : [direction, kind, userInput.slice(firstEqualIdx + 1), negative];
  }

  private static parseWorkloadQueryAndMeta(value: string): [string, string | undefined] {
    let sep = ':';
    let parts = value.split(sep);

    if (parts.length < 2) {
      sep = '/';
      parts = value.split(sep);
    }

    if (parts.length < 2) return [value, void 0];

    const kind = parts[0];
    const name = parts.slice(1).join(sep);

    // NOTE: Name is a query (visible part of filter in search line)
    return [name, kind];
  }

  private static parseRest(kind: Kind, rest: string): [string, string | undefined] {
    switch (kind) {
      case Kind.Workload:
        return FilterEntry.parseWorkloadQueryAndMeta(rest);
      default:
        return [rest, void 0];
    }
  }

  constructor({ kind, direction, query, meta, negative }: Params) {
    this.kind = kind;
    this.query = query;
    this.direction = direction;
    this.meta = meta;
    this.negative = negative || false;
  }

  public prepareLabel() {
    this.ensureLabelPrefix();
  }

  public setMeta(meta: string): FilterEntry {
    const fe = this.clone();
    fe.meta = meta;

    return fe;
  }

  public setQuery(q: string): FilterEntry {
    this.query = q;

    return this;
  }

  public setDirection(dir: Direction): FilterEntry {
    const fe = this.clone();
    fe.direction = dir;

    return fe;
  }

  public setKind(kind: Kind): FilterEntry {
    this.kind = kind;

    return this;
  }

  public toString(): string {
    return this.isWorkload
      ? `${this.negative ? '!' : ''}${this.direction}:${this.kind}=${this.meta}:${this.query}`
      : `${this.negative ? '!' : ''}${this.direction}:${this.kind}=${this.query}`;
  }

  public asWorkload(): Workload | undefined | null {
    if (!this.meta || !this.query) return null;

    return { kind: this.meta, name: this.query };
  }

  public clone(): FilterEntry {
    return new FilterEntry({
      kind: this.kind,
      direction: this.direction,
      query: this.query,
      meta: this.meta,
      negative: this.negative,
    });
  }

  public equals(rhs: FilterEntry): boolean {
    return (
      this.kind === rhs.kind &&
      this.direction === rhs.direction &&
      this.query === rhs.query &&
      this.negative === rhs.negative
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

  public get isWorkload(): boolean {
    return this.kind === Kind.Workload;
  }

  public get fromRequired(): boolean {
    return [Direction.Either, Direction.From].includes(this.direction);
  }

  public get toRequired(): boolean {
    return [Direction.Either, Direction.To].includes(this.direction);
  }

  public get bothRequired(): boolean {
    return this.direction === Direction.Either;
  }

  public get isFrom(): boolean {
    return this.direction === Direction.From;
  }

  public get isTo(): boolean {
    return this.direction === Direction.To;
  }

  public get isBoth(): boolean {
    return this.bothRequired;
  }

  public get isNegative(): boolean {
    return this.negative;
  }

  public get labelKeyValue(): [string, string] {
    const [key, ...rest] = this.query.split('=');

    return [key, rest.join('=')];
  }

  public get hasMeta(): boolean {
    return this.meta != null && this.meta.length > 0;
  }

  public get podNamespace(): string | null {
    return this.hasMeta ? this.meta! : null;
  }

  private ensureLabelPrefix() {
    if (!this.isLabel) return;
    this.query = Labels.ensureK8sPrefix(this.query);
  }
}
