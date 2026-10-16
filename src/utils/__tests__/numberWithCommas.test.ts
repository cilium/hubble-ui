import { numberWithCommas } from '../numbers';

describe('numberWithCommas', () => {
  test.each([
    [123, '123'],
    [1234, '1,234'],
    [123456, '123,456'],
    [-123, '-123'],
    [-1234, '-1,234'],
    [-123456, '-123,456'],
    [-123456789, '-123,456,789'],
  ])('%p -> %p', (input, expected) => {
    expect(numberWithCommas(input)).toBe(expected);
  });
});
