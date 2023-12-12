import {
  Aggregation,
  AggregatorType,
  Aggregator,
  StateChange,
  StateChangeKey,
  TypeKey,
  StateChangeSet,
  AggregatorTypeSet,
} from '~/domain/aggregation';

import * as combinations from '~/utils/iter-tools/combinations';

const nextElem = (idx: number, arr: any[]) => {
  return arr[(idx + 1) % arr.length];
};

describe('sanity check', () => {
  test('default value', () => {
    const aggregation = Aggregation.default();

    expect(aggregation.stateChange).toBe(StateChange.New);
    expect(aggregation.aggregators.length).toBe(1);

    expect(aggregation.aggregators[0]).toEqual({
      type: AggregatorType.Identity,
      ignoreSourcePort: false,
    });
  });

  test('aggregator types parsing', () => {
    const parsed1 = [...AggregatorTypeSet].map(Aggregation.parseAggregatorType);
    const parsed2 = [...AggregatorTypeSet].map(s => {
      return Aggregation.parseAggregatorType(`A${s}`);
    });
    const parsed3 = [...AggregatorTypeSet].map(s => {
      return Aggregation.parseAggregatorType(s.toUpperCase());
    });

    expect(parsed1).toEqual(expect.arrayContaining([...AggregatorTypeSet]));
    expect(parsed2.some(p => p != null)).toBe(false);
    expect(parsed3.some(p => p != null)).toBe(false);
  });

  test('stateChange types parsing', () => {
    const parsed1 = [...StateChangeSet].map(Aggregation.parseStateChange);
    const parsed2 = [...StateChangeSet].map(s => {
      return Aggregation.parseStateChange(`A${s}`);
    });
    const parsed3 = [...StateChangeSet].map(s => {
      return Aggregation.parseStateChange(s.toUpperCase());
    });

    expect(parsed1).toEqual(expect.arrayContaining([...StateChangeSet]));
    expect(parsed2.some(p => p != null)).toBe(false);
    expect(parsed3.some(p => p != null)).toBe(false);
  });

  test('shallow clone 1', () => {
    const agg1 = Aggregation.default();
    const agg2 = agg1.clone();

    expect(agg1.stateChange).toBe(agg2.stateChange);
    expect(agg1.aggregators.length).toBe(agg2.aggregators.length);
    expect(agg2.aggregators[0]).toEqual(agg1.aggregators[0]);
  });

  test('shallow clone 2', () => {
    const agg1 = Aggregation.default();
    const agg2 = agg1.clone();

    expect(agg2.aggregators[0] == agg1.aggregators[0]).toBe(true);
  });

  test('deep clone 1', () => {
    const agg1 = Aggregation.default();
    const agg2 = agg1.clone(true);

    expect(agg1.stateChange).toBe(agg2.stateChange);
    expect(agg1.aggregators.length).toBe(agg2.aggregators.length);
    expect(agg2.aggregators[0]).toEqual(agg1.aggregators[0]);
  });

  test('deep clone 2', () => {
    const agg1 = Aggregation.default();
    const agg2 = agg1.clone(true);

    expect(agg2.aggregators[0] == agg1.aggregators[0]).toBe(false);
    expect(agg2.aggregators[0]).toEqual(agg1.aggregators[0]);
  });
});

describe('equality', () => {
  const types = [...AggregatorTypeSet];
  const sChanges = [...StateChangeSet];
  const ignoreSourcePorts = [false, true];

  combinations
    .arrays([ignoreSourcePorts.length, types.length, sChanges.length])
    .forEach(([idx1, idx2, idx3]) => {
      const ignoreSourcePort = ignoreSourcePorts[idx1];
      const type = types[idx2];
      const stateChange = sChanges[idx3];

      const agg1 = new Aggregation([{ type, ignoreSourcePort }], stateChange);
      const agg2 = new Aggregation(
        [
          {
            type: nextElem(idx2, types),
            ignoreSourcePort: nextElem(idx1, ignoreSourcePorts),
          },
        ],
        nextElem(idx3, sChanges),
      );

      test(`self-equality ${ignoreSourcePort} ${type} ${stateChange}`, () => {
        expect(agg1.equals(agg1.clone(true))).toBe(true);
      });

      test(`inequality ${ignoreSourcePort} ${type} ${stateChange}`, () => {
        expect(agg1.equals(agg2)).toBe(false);
      });
    });
});
