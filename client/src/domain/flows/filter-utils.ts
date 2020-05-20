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

export interface FlowsFilterEntry {
  kind: FlowsFilterKind;
  query: string;
  direction: FlowsFilterDirection;
}

export class FlowsFilterUtils {
  public static createFilterObject = (query: string): FlowsFilterEntry => {
    const getDirection = (query: string): FlowsFilterDirection => {
      if (query.startsWith('from:')) {
        return FlowsFilterDirection.From;
      } else if (query.startsWith('to:')) {
        return FlowsFilterDirection.To;
      }
      return FlowsFilterDirection.Both;
    };

    const getKind = (query: string): FlowsFilterKind => {
      if (query.startsWith('label=')) {
        return FlowsFilterKind.Label;
      } else if (query.startsWith('ip=')) {
        return FlowsFilterKind.Ip;
      } else if (query.startsWith('dns=')) {
        return FlowsFilterKind.Dns;
      } else {
        return FlowsFilterKind.Label;
      }
    };

    const cleanUp = (query: string) => {
      return query
        .replace(/^(from:|to:|both:)/g, '')
        .replace(/^(label=|ip=|dns=)/g, '')
        .trim();
    };

    const direction = getDirection(query);
    const kind = getKind(query.substring(direction.length + 1));

    return {
      kind,
      direction,
      query: cleanUp(query),
    };
  };

  public static createFilterString = (filter: FlowsFilterEntry): string => {
    return `${filter.direction}:${filter.kind}=${filter.query}`;
  };
}
