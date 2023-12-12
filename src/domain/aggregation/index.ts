export enum AggregatorType {
  Unknown = 'unknown',
  Connection = 'connection',
  Identity = 'identity',
}

// NOTE: these numbers are taken from observer.proto
export enum StateChange {
  Unspec = 'unspecified',
  New = 'new',
  Established = 'established',
  FirstError = 'first-error',
  Error = 'error',
  Closed = 'closed',
}

export const AggregatorTypeSet = new Set(Object.values(AggregatorType));
export const StateChangeSet = new Set(Object.values(StateChange));

export interface Aggregator {
  type: AggregatorType;
  ignoreSourcePort: boolean;
}

export type TypeKey = keyof typeof AggregatorType;
export type StateChangeKey = keyof typeof StateChange;

export class Aggregation {
  public readonly aggregators: Aggregator[];
  public readonly stateChange: StateChange;

  public static default(): Aggregation {
    const aggregators = [
      {
        type: AggregatorType.Identity,
        ignoreSourcePort: false,
      },
    ];

    return new Aggregation(aggregators, StateChange.New);
  }

  public static parseAggregatorType(str: string): AggregatorType | null {
    if (AggregatorTypeSet.has(str as any)) return str as AggregatorType;

    return null;
  }

  public static parseStateChange(str: string): StateChange | null {
    if (StateChangeSet.has(str as any)) return str as StateChange;

    return null;
  }

  constructor(aggregators: Aggregator[], stateChange: StateChange) {
    this.aggregators = aggregators;
    this.stateChange = stateChange;
  }

  public clone(deep?: boolean): Aggregation {
    deep = deep ?? false;

    const aggregators = deep
      ? this.aggregators.map(agg => {
          return {
            type: agg.type,
            ignoreSourcePort: agg.ignoreSourcePort,
          };
        })
      : this.aggregators.slice();

    return new Aggregation(aggregators, this.stateChange);
  }

  public equals(rhs: Aggregation): boolean {
    if (this.stateChange !== rhs.stateChange) return false;
    if (this.aggregators.length !== rhs.aggregators.length) return false;

    const keys = new Set();

    this.aggregators.forEach(agg => {
      keys.add(`${agg.type}/${agg.ignoreSourcePort}`);
    });

    for (const agg of rhs.aggregators) {
      const elem = `${agg.type}/${agg.ignoreSourcePort}`;

      if (!keys.has(elem)) return false;
    }

    return true;
  }

  public setStateChange(stateChange: StateChange): Aggregation {
    return new Aggregation(this.aggregators, stateChange);
  }

  public setAggregators(aggregators: Aggregator[]): Aggregation {
    return new Aggregation(aggregators, this.stateChange);
  }

  public setAggreatorTypes(types: AggregatorType[]): Aggregation {
    const aggregators = types.map(type => {
      return { type, ignoreSourcePort: false };
    });

    return new Aggregation(aggregators, this.stateChange);
  }

  public setBoth(aggregators: Aggregator[], stateChange: StateChange): Aggregation {
    return new Aggregation(aggregators, stateChange);
  }

  public toggleAggregatorType(aggType: AggregatorType): Aggregation {
    const aggregators = this.aggregators.filter(agg => agg.type !== aggType);

    if (aggregators.length === this.aggregators.length) {
      aggregators.push({ type: aggType, ignoreSourcePort: false });

      return new Aggregation(aggregators, this.stateChange);
    }

    return new Aggregation(aggregators, this.stateChange);
  }

  public hasStateChange(stateChange: StateChange): boolean {
    return this.stateChange === stateChange;
  }

  public hasAggregatorType(type: AggregatorType): boolean {
    return this.aggregators.some(agg => agg.type === type);
  }

  public get aggregatorTypes(): AggregatorType[] {
    return this.aggregators.map(agg => agg.type);
  }
}
