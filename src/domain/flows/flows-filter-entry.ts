export enum FlowsFilterKind {
  Label = 'label',
  Ip = 'ip',
  Dns = 'dns',
  Identity = 'identity',
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

    const query = FlowsFilterEntry.parseQuery(rawQuery);
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
      query = parts[0] || '';
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

    query = rest.join('=');
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

  public static parseKind(s: string): FlowsFilterKind | null {
    switch (s) {
      case FlowsFilterKind.Label:
      case FlowsFilterKind.Ip:
      case FlowsFilterKind.Dns:
      case FlowsFilterKind.Identity:
        return s;
    }

    return null;
  }

  public static parseQuery(s: string): string {
    return s
      .replace(/^(from:|to:|both:)/g, '')
      .replace(/^(label=|ip=|dns=|identity=)/g, '')
      .trim();
  }

  constructor({ kind, direction, query, meta }: Params) {
    this.kind = kind;
    this.query = query;
    this.direction = direction;
    this.meta = meta;
  }

  public setMeta(meta: string): FlowsFilterEntry {
    this.meta = meta;

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

  public get labelKeyValue(): [string, string] {
    const [key, ...rest] = this.query.split('=');

    return [key, rest.join('=')];
  }
}
