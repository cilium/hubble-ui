import { Disposer } from '~/utils/disposer';

describe('disposer helper function', () => {
  for (let disposersNum = 1; disposersNum <= 10; ++disposersNum) {
    const d = Disposer.new();
    const disposerFns: jest.Mock[] = [];

    for (let di = 0; di < disposersNum; ++di) {
      const fn = jest.fn();
      disposerFns.push(fn);

      d.chain(fn);
    }

    test(`disposer with ${disposersNum} disposer functions`, () => {
      d();

      const allRun = disposerFns.every(fn => {
        return fn.mock.calls.length === 1;
      });

      expect(allRun).toBe(true);
    });
  }
});
