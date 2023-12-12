import { Line2, XY } from '~/domain/geometry';

const runThroughPoints = (endings: XY[]) => {
  const start = { x: 0, y: 0 };

  endings.forEach(end => {
    const line = Line2.throughPoints(start, end);

    test(`line 0,0 -> ${end.x.toFixed(2)},${end.y.toFixed(2)}`, () => {
      expect(line.direction.length()).toBeCloseTo(1);
    });
  });
};

describe('Line2 direction', () => {
  const DIAG_ONE = Math.sqrt(2);

  runThroughPoints([
    { x: 0, y: 1 },
    { x: 0, y: -1 },
    { x: -1, y: 0 },
    { x: 1, y: 0 },

    { x: DIAG_ONE, y: DIAG_ONE },
    { x: -DIAG_ONE, y: DIAG_ONE },
    { x: -DIAG_ONE, y: -DIAG_ONE },
    { x: DIAG_ONE, y: -DIAG_ONE },
  ]);
});
