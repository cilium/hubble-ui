import { segmentsIntersection, XY } from '~/domain/geometry';

const testSegments = (caption: string, p: [XY, XY, XY, XY], expected: XY | null) => {
  const r1 = segmentsIntersection(p[0], p[1], p[2], p[3]);
  const r2 = segmentsIntersection(p[1], p[0], p[3], p[2]);
  const r3 = segmentsIntersection(p[2], p[3], p[0], p[1]);
  const r4 = segmentsIntersection(p[3], p[2], p[1], p[0]);

  test(`${caption} / normal`, () => {
    if (expected === null) {
      expect(r1).toBeNull();
      return;
    }

    expect(r1).toBeTruthy();
    expect(r1!.x).toBeCloseTo(expected.x);
    expect(r1!.y).toBeCloseTo(expected.y);
  });

  test(`${caption} / reversed segments`, () => {
    if (expected === null) {
      expect(r2).toBeNull();
      return;
    }

    expect(r2).toBeTruthy();
    expect(r2!.x).toBeCloseTo(expected.x);
    expect(r2!.y).toBeCloseTo(expected.y);
  });

  test(`${caption} / commutative`, () => {
    if (expected === null) {
      expect(r3).toBeNull();
      return;
    }

    expect(r3).toBeTruthy();
    expect(r3!.x).toBeCloseTo(expected.x);
    expect(r3!.y).toBeCloseTo(expected.y);
  });

  test(`${caption} / commutative + reversed`, () => {
    if (expected === null) {
      expect(r4).toBeNull();
      return;
    }

    expect(r4).toBeTruthy();
    expect(r4!.x).toBeCloseTo(expected.x);
    expect(r4!.y).toBeCloseTo(expected.y);
  });
};

describe('segments mode', () => {
  testSegments(
    'vertical x horizontal 1',
    [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 5, y: 5 },
      { x: 5, y: -5 },
    ],
    { x: 5, y: 0 },
  );

  testSegments(
    'vertical x horizontal 2',
    [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 0, y: 5 },
      { x: 0, y: -5 },
    ],
    { x: 0, y: 0 },
  );

  testSegments(
    'vertical x horizontal 3',
    [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 0, y: 0 },
      { x: 0, y: -10 },
    ],
    { x: 0, y: 0 },
  );

  testSegments(
    'parallel (horizontal)',
    [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 0, y: 5 },
      { x: 10, y: 5 },
    ],
    null,
  );

  testSegments(
    'parallel (vertical)',
    [
      { x: 0, y: 0 },
      { x: 0, y: 10 },
      { x: 5, y: 0 },
      { x: 5, y: 10 },
    ],
    null,
  );

  testSegments(
    'parallel (horizontal - exact match)',
    [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 0, y: 0 },
      { x: 10, y: 0 },
    ],
    null,
  );

  testSegments(
    'parallel (vertical - exact match)',
    [
      { x: 0, y: 0 },
      { x: 0, y: 10 },
      { x: 0, y: 0 },
      { x: 0, y: 10 },
    ],
    null,
  );

  testSegments(
    'regular 1',
    [
      { x: 0, y: 0 },
      { x: 10, y: 10 },
      { x: 0, y: 10 },
      { x: 10, y: 0 },
    ],
    { x: 5, y: 5 },
  );

  testSegments(
    'regular 2 (negative values)',
    [
      { x: -100, y: -100 },
      { x: -90, y: -90 },
      { x: -100, y: -90 },
      { x: -90, y: -100 },
    ],
    { x: -95, y: -95 },
  );

  testSegments(
    'regular 3 (no intersection)',
    [
      { x: 0, y: 0 },
      { x: 100, y: 100 },
      { x: 100, y: 0 },
      { x: 105, y: 0 },
    ],
    null,
  );

  testSegments(
    'regular 4',
    [
      { x: 1520, y: 1117 },
      { x: 2080, y: 1117 },
      { x: 2120, y: 1167 },
      { x: 1440, y: 843 },
    ],
    { x: 2015.06, y: 1117 },
  );

  testSegments(
    'regular 5',
    [
      { x: 2080, y: 1117 },
      { x: 2080, y: 1364 },
      { x: 2120, y: 1167 },
      { x: 1440, y: 843 },
    ],
    { x: 2080, y: 1147.9411764705883 },
  );

  testSegments(
    'regular 6',
    [
      { x: 1520, y: 1117 },
      { x: 1520, y: 1364 },
      { x: 2120, y: 1167 },
      { x: 1440, y: 843 },
    ],
    null,
  );
});
