import { toHumanString, Units } from '../numbers';

const runHumanStringTests = (tests: [number, string, string][]) => {
  tests.forEach(t => {
    const [num, iecExpect, metricExpect] = t;

    test(`${num}`, () => {
      const iec = toHumanString(num, Units.BytesIEC, 2);
      expect(iec).toBe(iecExpect);

      const metric = toHumanString(num, Units.BytesMetric, 2);
      expect(metric).toBe(metricExpect);
    });
  });
};

describe('toHumanString', () => {
  runHumanStringTests([
    [512, '512 B', '512 B'],
    [1024, '1.00 KiB', '1.02 kB'],
    [1024 ** 2, '1.00 MiB', '1.05 MB'],
    [1024 ** 3, '1.00 GiB', '1.07 GB'],
    [1024 ** 4, '1.00 TiB', '1.10 TB'],
  ]);
});
