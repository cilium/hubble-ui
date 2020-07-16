import * as combinations from '../combinations';

describe('combinations', () => {
  test('test 1', () => {
    const combs = combinations.arrays([2, 2]).asArray();
    expect(combs).toStrictEqual([
      [0, 0],
      [0, 1],
      [1, 0],
      [1, 1],
    ]);
    const cb = jest.fn();

    combinations.arrays([2, 2]).forEach(cb);

    expect(cb.mock.calls.length).toBe(4);
    expect(cb.mock.calls[0][0]).toStrictEqual([0, 0]);
    expect(cb.mock.calls[0][1]).toStrictEqual(0);
    expect(cb.mock.calls[0][2]).toStrictEqual(4);

    expect(cb.mock.calls[1][0]).toStrictEqual([0, 1]);
    expect(cb.mock.calls[1][1]).toStrictEqual(1);
    expect(cb.mock.calls[1][2]).toStrictEqual(4);

    expect(cb.mock.calls[2][0]).toStrictEqual([1, 0]);
    expect(cb.mock.calls[2][1]).toStrictEqual(2);
    expect(cb.mock.calls[2][2]).toStrictEqual(4);

    expect(cb.mock.calls[3][0]).toStrictEqual([1, 1]);
    expect(cb.mock.calls[3][1]).toStrictEqual(3);
    expect(cb.mock.calls[3][2]).toStrictEqual(4);
  });

  test('test 2', () => {
    const combs = combinations.arrays([1, 2]).asArray();
    expect(combs).toStrictEqual([
      [0, 0],
      [0, 1],
    ]);

    const cb = jest.fn();
    combinations.arrays([1, 2]).forEach(cb);

    expect(cb.mock.calls.length).toBe(2);
    expect(cb.mock.calls[0][0]).toStrictEqual([0, 0]);
    expect(cb.mock.calls[0][1]).toStrictEqual(0);
    expect(cb.mock.calls[0][2]).toStrictEqual(2);

    expect(cb.mock.calls[1][0]).toStrictEqual([0, 1]);
    expect(cb.mock.calls[1][1]).toStrictEqual(1);
    expect(cb.mock.calls[1][2]).toStrictEqual(2);
  });

  test('test 3', () => {
    const combs = combinations.arrays([1, 1]).asArray();
    expect(combs).toStrictEqual([[0, 0]]);

    const cb = jest.fn();
    combinations.arrays([1, 1]).forEach(cb);

    expect(cb.mock.calls.length).toBe(1);
    expect(cb.mock.calls[0][0]).toStrictEqual([0, 0]);
    expect(cb.mock.calls[0][1]).toStrictEqual(0);
    expect(cb.mock.calls[0][2]).toStrictEqual(1);
  });

  test('test 4', () => {
    const combs = combinations.arrays([0, 0]).asArray();
    expect(combs).toStrictEqual([]);

    const cb = jest.fn();
    combinations.arrays([0, 0]).forEach(cb);

    expect(cb.mock.calls.length).toBe(0);
  });

  test('test 5', () => {
    const combs = combinations.arrays([2, 1, 2]).asArray();
    expect(combs).toStrictEqual([
      [0, 0, 0],
      [0, 0, 1],
      [1, 0, 0],
      [1, 0, 1],
    ]);

    const cb = jest.fn();
    combinations.arrays([2, 1, 2]).forEach(cb);

    expect(cb.mock.calls.length).toBe(4);
    expect(cb.mock.calls[0][0]).toStrictEqual([0, 0, 0]);
    expect(cb.mock.calls[0][1]).toStrictEqual(0);
    expect(cb.mock.calls[0][2]).toStrictEqual(4);

    expect(cb.mock.calls[1][0]).toStrictEqual([0, 0, 1]);
    expect(cb.mock.calls[1][1]).toStrictEqual(1);
    expect(cb.mock.calls[1][2]).toStrictEqual(4);

    expect(cb.mock.calls[2][0]).toStrictEqual([1, 0, 0]);
    expect(cb.mock.calls[2][1]).toStrictEqual(2);
    expect(cb.mock.calls[2][2]).toStrictEqual(4);

    expect(cb.mock.calls[3][0]).toStrictEqual([1, 0, 1]);
    expect(cb.mock.calls[3][1]).toStrictEqual(3);
    expect(cb.mock.calls[3][2]).toStrictEqual(4);
  });
});
