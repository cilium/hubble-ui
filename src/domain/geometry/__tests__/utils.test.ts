import { utils } from '~/domain/geometry';

describe('pointSideOfLine', () => {
  const center = { x: 0, y: 0 };

  test('line center -> right', () => {
    let result = utils.pointSideOfLine(center, { x: 10, y: 0 }, { x: 5, y: 0 });
    expect(result).toBe(0);

    result = utils.pointSideOfLine(center, { x: 10, y: 0 }, { x: 100, y: 0 });
    expect(result).toBe(0);

    result = utils.pointSideOfLine(center, { x: 10, y: 0 }, { x: 5, y: 5 });
    expect(result).toBe(1);

    result = utils.pointSideOfLine(center, { x: 10, y: 0 }, { x: 5, y: -5 });
    expect(result).toBe(-1);
  });

  test('line center -> left', () => {
    let result = utils.pointSideOfLine(center, { x: -10, y: 0 }, { x: 5, y: 0 });
    expect(result).toBe(0);

    result = utils.pointSideOfLine(center, { x: -10, y: 0 }, { x: 5, y: 5 });
    expect(result).toBe(-1);

    result = utils.pointSideOfLine(center, { x: -10, y: 0 }, { x: 5, y: -5 });
    expect(result).toBe(1);
  });

  test('line center -> top', () => {
    let result = utils.pointSideOfLine(center, { x: 0, y: -10 }, { x: 0, y: -5 });
    expect(result).toBe(0);

    result = utils.pointSideOfLine(center, { x: 0, y: -10 }, { x: 5, y: -5 });
    expect(result).toBe(1);

    result = utils.pointSideOfLine(center, { x: 0, y: -10 }, { x: -5, y: -5 });
    expect(result).toBe(-1);
  });

  test('line center -> bottom', () => {
    let result = utils.pointSideOfLine(center, { x: 0, y: 10 }, { x: 0, y: 5 });
    expect(result).toBe(0);

    result = utils.pointSideOfLine(center, { x: 0, y: 10 }, { x: -5, y: 5 });
    expect(result).toBe(1);

    result = utils.pointSideOfLine(center, { x: 0, y: 10 }, { x: 5, y: 5 });
    expect(result).toBe(-1);
  });

  test('line center -> top left', () => {
    let result = utils.pointSideOfLine(center, { x: -10, y: -10 }, { x: -5, y: -5 });
    expect(result).toBe(0);

    result = utils.pointSideOfLine(center, { x: -10, y: -10 }, { x: -5, y: -100 });
    expect(result).toBe(1);

    result = utils.pointSideOfLine(center, { x: -10, y: -10 }, { x: -5, y: 100 });
    expect(result).toBe(-1);
  });
});
