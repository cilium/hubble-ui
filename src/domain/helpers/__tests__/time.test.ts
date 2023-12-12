import { toLatencyString, Time } from '../time';

const runLatencyStringTests = (tests: [Time, string][]) => {
  tests.forEach(pair => {
    const [t, expectStr] = pair;

    test(`${t.seconds} s, ${t.nanos} ns as ${expectStr}`, () => {
      const iec = toLatencyString(t, 2);
      expect(iec).toBe(expectStr);
    });
  });
};

describe('toHumanString', () => {
  runLatencyStringTests([
    [{ seconds: 0, nanos: 0 }, '0 ns'],
    [{ seconds: 0, nanos: 400 }, '400 ns'],
    [{ seconds: 0, nanos: 4000 }, '4.00 µs'],
    [{ seconds: 0, nanos: 400 * 1000 }, '400.00 µs'],
    [{ seconds: 0, nanos: 4000 * 1000 }, '4.00 ms'],
    [{ seconds: 0, nanos: 4000 * 1000 * 100 }, '400.00 ms'],
    [{ seconds: 0, nanos: 9000 * 1000 * 100 }, '900.00 ms'],
    [{ seconds: 0, nanos: 1e9 }, '1.00 s'],
    [{ seconds: 0, nanos: 1000 * 1e9 }, '1000.00 s'],
    [{ seconds: 1, nanos: 0 }, '1.00 s'],
    [{ seconds: 1, nanos: 500 * 1e6 }, '1.50 s'],
    [{ seconds: 1, nanos: 1e9 }, '2.00 s'],
    [{ seconds: 5, nanos: 1e3 }, '5.00 s'],
  ]);
});
