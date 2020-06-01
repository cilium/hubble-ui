import { chunks } from './../chunks';

const runEmptyTest = (num: number, size: number, overlap: number) => {
  test(`of empty array ${num}`, () => {
    const cb = jest.fn();

    chunks([], size, overlap).forEach(cb);

    expect(cb.mock.calls.length).toBe(0);
  });
};

describe('chunks', () => {
  runEmptyTest(1, 5, 0);
  runEmptyTest(2, 0, 0);
  runEmptyTest(3, 0, 100);
  runEmptyTest(4, 100, 100);
  runEmptyTest(5, 1, 1);
  runEmptyTest(6, -5, -100);
  runEmptyTest(7, -5, 0);
  runEmptyTest(8, 0, -100);

  describe('array of 3', () => {
    const arr = [4, 9, 17];

    test('window = 1, overlap = 0', () => {
      const cb = jest.fn();

      chunks(arr, 1, 0).forEach(cb);

      expect(cb.mock.calls.length).toBe(3);
      expect(cb.mock.calls[0][0]).toStrictEqual([4]);
      expect(cb.mock.calls[0][1]).toBe(0);
      expect(cb.mock.calls[0][2]).toBe(false);

      expect(cb.mock.calls[1][0]).toStrictEqual([9]);
      expect(cb.mock.calls[1][1]).toBe(1);
      expect(cb.mock.calls[1][2]).toBe(false);

      expect(cb.mock.calls[2][0]).toStrictEqual([17]);
      expect(cb.mock.calls[2][1]).toBe(2);
      expect(cb.mock.calls[2][2]).toBe(true);
    });

    test('window = 2, overlap = 0', () => {
      const cb = jest.fn();

      chunks(arr, 2, 0).forEach(cb);

      expect(cb.mock.calls.length).toBe(1);
      expect(cb.mock.calls[0][0]).toStrictEqual([4, 9]);
      expect(cb.mock.calls[0][1]).toBe(0);
      expect(cb.mock.calls[0][2]).toBe(true);
    });

    test('window = 3, overlap = 0', () => {
      const cb = jest.fn();

      chunks(arr, 3, 0).forEach(cb);

      expect(cb.mock.calls.length).toBe(1);
      expect(cb.mock.calls[0][0]).toStrictEqual([4, 9, 17]);
      expect(cb.mock.calls[0][1]).toBe(0);
      expect(cb.mock.calls[0][2]).toBe(true);
    });

    test('window = 2, overlap = 1', () => {
      const cb = jest.fn();

      chunks(arr, 2, 1).forEach(cb);

      expect(cb.mock.calls.length).toBe(2);
      expect(cb.mock.calls[0][0]).toStrictEqual([4, 9]);
      expect(cb.mock.calls[0][1]).toBe(0);
      expect(cb.mock.calls[0][2]).toBe(false);

      expect(cb.mock.calls[1][0]).toStrictEqual([9, 17]);
      expect(cb.mock.calls[1][1]).toBe(1);
      expect(cb.mock.calls[1][2]).toBe(true);
    });

    test('window = 3, overlap = 1', () => {
      const cb = jest.fn();

      chunks(arr, 3, 1).forEach(cb);

      expect(cb.mock.calls.length).toBe(1);
      expect(cb.mock.calls[0][0]).toStrictEqual([4, 9, 17]);
      expect(cb.mock.calls[0][1]).toBe(0);
      expect(cb.mock.calls[0][2]).toBe(true);
    });

    test('window = 3, overlap = 2', () => {
      const cb = jest.fn();

      chunks(arr, 3, 2).forEach(cb);

      expect(cb.mock.calls.length).toBe(1);
      expect(cb.mock.calls[0][0]).toStrictEqual([4, 9, 17]);
      expect(cb.mock.calls[0][1]).toBe(0);
      expect(cb.mock.calls[0][2]).toBe(true);
    });

    test('window = 1, overlap = 1', () => {
      const cb = jest.fn();

      expect(() => {
        chunks(arr, 1, 1).forEach(() => {
          return;
        });
      }).toThrow();
    });

    test('window = 100, overlap = 100', () => {
      const cb = jest.fn();

      expect(() => {
        chunks(arr, 100, 100).forEach(() => {
          return;
        });
      }).toThrow();
    });
  });
});
