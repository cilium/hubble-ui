import { chunks } from '../chunks';

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
      expect(cb.mock.calls[0][2]).toBe(3);

      expect(cb.mock.calls[1][0]).toStrictEqual([9]);
      expect(cb.mock.calls[1][1]).toBe(1);
      expect(cb.mock.calls[1][2]).toBe(3);

      expect(cb.mock.calls[2][0]).toStrictEqual([17]);
      expect(cb.mock.calls[2][1]).toBe(2);
      expect(cb.mock.calls[2][2]).toBe(3);
    });

    test('window = 2, overlap = 0', () => {
      const cb = jest.fn();

      chunks(arr, 2, 0).forEach(cb);

      expect(cb.mock.calls.length).toBe(1);
      expect(cb.mock.calls[0][0]).toStrictEqual([4, 9]);
      expect(cb.mock.calls[0][1]).toBe(0);
      expect(cb.mock.calls[0][2]).toBe(1);
    });

    test('window = 3, overlap = 0', () => {
      const cb = jest.fn();

      chunks(arr, 3, 0).forEach(cb);

      expect(cb.mock.calls.length).toBe(1);
      expect(cb.mock.calls[0][0]).toStrictEqual([4, 9, 17]);
      expect(cb.mock.calls[0][1]).toBe(0);
      expect(cb.mock.calls[0][2]).toBe(1);
    });

    test('window = 2, overlap = 1', () => {
      const cb = jest.fn();

      chunks(arr, 2, 1).forEach(cb);

      expect(cb.mock.calls.length).toBe(2);
      expect(cb.mock.calls[0][0]).toStrictEqual([4, 9]);
      expect(cb.mock.calls[0][1]).toBe(0);
      expect(cb.mock.calls[0][2]).toBe(2);

      expect(cb.mock.calls[1][0]).toStrictEqual([9, 17]);
      expect(cb.mock.calls[1][1]).toBe(1);
      expect(cb.mock.calls[1][2]).toBe(2);
    });

    test('window = 3, overlap = 1', () => {
      const cb = jest.fn();

      chunks(arr, 3, 1).forEach(cb);

      expect(cb.mock.calls.length).toBe(1);
      expect(cb.mock.calls[0][0]).toStrictEqual([4, 9, 17]);
      expect(cb.mock.calls[0][1]).toBe(0);
      expect(cb.mock.calls[0][2]).toBe(1);
    });

    test('window = 3, overlap = 2', () => {
      const cb = jest.fn();

      chunks(arr, 3, 2).forEach(cb);

      expect(cb.mock.calls.length).toBe(1);
      expect(cb.mock.calls[0][0]).toStrictEqual([4, 9, 17]);
      expect(cb.mock.calls[0][1]).toBe(0);
      expect(cb.mock.calls[0][2]).toBe(1);
    });

    test('window = 1, overlap = 1', () => {
      expect(() => {
        chunks(arr, 1, 1).forEach(() => {
          return;
        });
      }).toThrow();
    });

    test('window = 100, overlap = 100', () => {
      expect(() => {
        chunks(arr, 100, 100).forEach(() => {
          return;
        });
      }).toThrow();
    });
  });

  describe('array of 16', () => {
    const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];

    test('window = 1, overlap = 0', () => {
      const cb = jest.fn();

      chunks(arr, 1, 0).forEach(cb);

      expect(cb.mock.calls.length).toBe(16);
      expect(cb.mock.calls[0][2]).toBe(16);
      expect(cb.mock.calls[15][2]).toBe(16);
    });

    test('window = 2, overlap = 1', () => {
      const cb = jest.fn();

      chunks(arr, 2, 1).forEach(cb);

      expect(cb.mock.calls.length).toBe(15);
      expect(cb.mock.calls[0][2]).toBe(15);
      expect(cb.mock.calls[14][2]).toBe(15);
    });

    test('window = 3, overlap = 1', () => {
      const cb = jest.fn();

      chunks(arr, 3, 1).forEach(cb);

      expect(cb.mock.calls.length).toBe(7);
      expect(cb.mock.calls[0][2]).toBe(7);
      expect(cb.mock.calls[6][2]).toBe(7);
    });

    test('window = 4, overlap = 1', () => {
      const cb = jest.fn();

      chunks(arr, 4, 1).forEach(cb);

      expect(cb.mock.calls.length).toBe(5);
      expect(cb.mock.calls[0][2]).toBe(5);
      expect(cb.mock.calls[4][2]).toBe(5);
    });

    test('window = 5, overlap = 1', () => {
      const cb = jest.fn();

      chunks(arr, 5, 1).forEach(cb);

      expect(cb.mock.calls.length).toBe(3);
      expect(cb.mock.calls[0][2]).toBe(3);
      expect(cb.mock.calls[2][2]).toBe(3);
    });

    test('window = 6, overlap = 1', () => {
      const cb = jest.fn();

      chunks(arr, 6, 1).forEach(cb);

      expect(cb.mock.calls.length).toBe(3);
      expect(cb.mock.calls[0][2]).toBe(3);
      expect(cb.mock.calls[1][2]).toBe(3);
      expect(cb.mock.calls[2][2]).toBe(3);
    });

    test('window = 7, overlap = 1', () => {
      const cb = jest.fn();

      chunks(arr, 7, 1).forEach(cb);

      expect(cb.mock.calls.length).toBe(2);
      expect(cb.mock.calls[0][2]).toBe(2);
      expect(cb.mock.calls[1][2]).toBe(2);
    });

    test('window = 8, overlap = 1', () => {
      const cb = jest.fn();

      chunks(arr, 8, 1).forEach(cb);

      expect(cb.mock.calls.length).toBe(2);
      expect(cb.mock.calls[0][2]).toBe(2);
      expect(cb.mock.calls[1][2]).toBe(2);
    });

    test('window = 9, overlap = 1', () => {
      const cb = jest.fn();

      chunks(arr, 9, 1).forEach(cb);

      expect(cb.mock.calls.length).toBe(1);
      expect(cb.mock.calls[0][2]).toBe(1);
    });

    test('window = 10, overlap = 1', () => {
      const cb = jest.fn();

      chunks(arr, 10, 1).forEach(cb);

      expect(cb.mock.calls.length).toBe(1);
      expect(cb.mock.calls[0][2]).toBe(1);
    });

    test('window = 11, overlap = 1', () => {
      const cb = jest.fn();

      chunks(arr, 11, 1).forEach(cb);

      expect(cb.mock.calls.length).toBe(1);
      expect(cb.mock.calls[0][2]).toBe(1);
    });

    test('window = 12, overlap = 1', () => {
      const cb = jest.fn();

      chunks(arr, 12, 1).forEach(cb);

      expect(cb.mock.calls.length).toBe(1);
      expect(cb.mock.calls[0][2]).toBe(1);
    });

    test('window = 13, overlap = 1', () => {
      const cb = jest.fn();

      chunks(arr, 13, 1).forEach(cb);

      expect(cb.mock.calls.length).toBe(1);
      expect(cb.mock.calls[0][2]).toBe(1);
    });

    test('window = 14, overlap = 1', () => {
      const cb = jest.fn();

      chunks(arr, 14, 1).forEach(cb);

      expect(cb.mock.calls.length).toBe(1);
      expect(cb.mock.calls[0][2]).toBe(1);
    });

    test('window = 15, overlap = 1', () => {
      const cb = jest.fn();

      chunks(arr, 15, 1).forEach(cb);

      expect(cb.mock.calls.length).toBe(1);
      expect(cb.mock.calls[0][2]).toBe(1);
    });

    test('window = 16, overlap = 1', () => {
      const cb = jest.fn();

      chunks(arr, 16, 1).forEach(cb);

      expect(cb.mock.calls.length).toBe(1);
      expect(cb.mock.calls[0][2]).toBe(1);
    });

    test('window = 4, overlap = 2', () => {
      const cb = jest.fn();

      chunks(arr, 4, 2).forEach(cb);

      expect(cb.mock.calls.length).toBe(7);
      for (let i = 0; i < 7; ++i) {
        expect(cb.mock.calls[i][2]).toBe(7);
      }
    });
  });
});
