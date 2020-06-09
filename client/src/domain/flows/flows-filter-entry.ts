export enum FlowsFilterKind {
  Label = 'label',
  Ip = 'ip',
  Dns = 'dns',
}

export enum FlowsFilterDirection {
  From = 'from',
  To = 'to',
  Both = 'both',
}

// TODO: write tests for parsing / serializing
export class FlowsFilterEntry {
  public kind: FlowsFilterKind;
  public query: string;
  public direction: FlowsFilterDirection;

  public static parseFull(filter: string): FlowsFilterEntry | null {
    let [rawDirection] = filter.split(':');
    rawDirection = rawDirection || '';

    const [rawKind] = filter.slice(rawDirection.length + 1).split('=');
    if (!rawKind) return null;

    const rawQuery = filter.slice(rawDirection.length + rawKind.length + 2);

    const direction = FlowsFilterEntry.parseDirection(rawDirection);
    if (!direction) return null;

    const kind = FlowsFilterEntry.parseKind(rawKind);
    if (!kind) return null;

    const query = FlowsFilterEntry.parseQuery(rawQuery);
    if (!query) return null;

    return new FlowsFilterEntry(kind, query, direction);
  }

  public static parse(filter: string): FlowsFilterEntry | null {
    if (filter.length === 0) return null;

    let kind: FlowsFilterKind = FlowsFilterKind.Label;
    let direction: FlowsFilterDirection = FlowsFilterDirection.Both;
    let query: string = filter;
    let parts = filter.split(':');
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
      return new FlowsFilterEntry(kind, query, direction);
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
    return new FlowsFilterEntry(kind, query, direction);
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
        return s;
    }

    return null;
  }

  public static parseQuery(s: string): string {
    return s
      .replace(/^(from:|to:|both:)/g, '')
      .replace(/^(label=|ip=|dns=)/g, '')
      .trim();
  }

  constructor(kind: FlowsFilterKind, query: string, dir: FlowsFilterDirection) {
    this.kind = kind;
    this.query = query;
    this.direction = dir;
  }

  public toString(): string {
    return `${this.direction}:${this.kind}=${this.query}`;
  }
}
