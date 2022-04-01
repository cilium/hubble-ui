import { svg } from '~/components/ServiceMapArrowRenderer/helpers';
import { Vec2 } from '~/domain/geometry';

interface ArcProps {
  sweep: 0 | 1;
  large: 0 | 1;
}

type P = [number, number];
type Exps = [ArcProps, ArcProps, ArcProps];

const parseArcLine = (line: string): ArcProps => {
  const parts = line.split(' ');

  return {
    sweep: parts[5] === '1' ? 1 : 0,
    large: parts[4] === '1' ? 1 : 0,
  };
};

const testArc = (testName: string, s: P, e: P, expectations: Exps) => {
  const start = Vec2.from(s[0], s[1]);
  const end = Vec2.from(e[0], e[1]);

  const lines = svg
    .arrowHandlePath([start, end])
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0);

  const aArc = parseArcLine(lines[2]);
  const bArc = parseArcLine(lines[4]);
  const eArc = parseArcLine(lines[6]);

  test(testName, () => {
    expect(lines.length).toBe(8);

    expect(aArc.sweep).toBe(expectations[0].sweep);
    expect(aArc.large).toBe(expectations[0].large);

    expect(bArc.sweep).toBe(expectations[1].sweep);
    expect(bArc.large).toBe(expectations[1].large);

    expect(eArc.sweep).toBe(expectations[2].sweep);
    expect(eArc.large).toBe(expectations[2].large);
  });
};

describe('arcs', () => {
  testArc(
    'horizontal center -> right',
    [0, 0],
    [10, 0],
    [
      { large: 0, sweep: 0 },
      { large: 0, sweep: 0 },
      { large: 0, sweep: 0 },
    ],
  );

  testArc(
    'horizontal center -> top',
    [0, 0],
    [0, -10],
    [
      { large: 0, sweep: 0 },
      { large: 0, sweep: 0 },
      { large: 0, sweep: 0 },
    ],
  );

  testArc(
    'horizontal center -> left',
    [0, 0],
    [-10, 0],
    [
      { large: 0, sweep: 1 },
      { large: 0, sweep: 1 },
      { large: 0, sweep: 1 },
    ],
  );

  testArc(
    'horizontal center -> bottom',
    [0, 0],
    [0, 10],
    [
      { large: 0, sweep: 1 },
      { large: 0, sweep: 1 },
      { large: 0, sweep: 1 },
    ],
  );

  testArc(
    'horizontal center -> top right',
    [0, 0],
    [10, -10],
    [
      { large: 0, sweep: 0 },
      { large: 0, sweep: 0 },
      { large: 0, sweep: 0 },
    ],
  );

  testArc(
    'horizontal center -> top left',
    [0, 0],
    [-10, -10],
    [
      { large: 0, sweep: 1 },
      { large: 0, sweep: 1 },
      { large: 0, sweep: 1 },
    ],
  );

  testArc(
    'horizontal center -> bottom left',
    [0, 0],
    [-10, 10],
    [
      { large: 0, sweep: 1 },
      { large: 0, sweep: 1 },
      { large: 0, sweep: 1 },
    ],
  );

  testArc(
    'horizontal center -> bottom right',
    [0, 0],
    [10, 10],
    [
      { large: 0, sweep: 0 },
      { large: 0, sweep: 0 },
      { large: 0, sweep: 0 },
    ],
  );
});
