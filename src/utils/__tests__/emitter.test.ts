import { EventEmitter } from '../emitter';

interface Test {
  name: string;
  emit: Array<{ eventName: string; args: any[] }>;
  emitAfter?: Array<{ eventName: string; args: any[] }>;
}

const runTests = (tests: Test[]) => {
  tests.forEach(t => {
    test(t.name, () => {
      const ee = new EventEmitter<any>(true);
      const cb = jest.fn();

      t.emit.forEach(evt => {
        ee.emit(evt.eventName, ...evt.args);
      });

      // NOTE: notice that we .emit() and only after that call .on()
      ee.on(t.emit[0].eventName, cb);
      expect(cb.mock.calls.length).toBe(t.emit.length);

      t.emit.forEach((evt, idx) => {
        expect(cb.mock.calls[idx]).toEqual(evt.args);
      });

      if (!t.emitAfter?.length) return;
      t.emitAfter.forEach(evt => {
        ee.emit(evt.eventName, ...evt.args);
      });

      expect(cb.mock.calls.length).toBe(t.emit.length + t.emitAfter.length);
      t.emitAfter.forEach((evt, idx) => {
        expect(cb.mock.calls[t.emit.length + idx]).toEqual(evt.args);
      });
    });

    test(`${t.name} (once)`, () => {
      const ee = new EventEmitter<any>(true);
      const cb = jest.fn();

      t.emit.forEach(evt => {
        ee.emit(evt.eventName, ...evt.args);
      });

      ee.once(t.emit[0].eventName, cb);
      expect(cb.mock.calls.length).toBe(1);
      expect(cb.mock.calls[0]).toEqual(t.emit[0].args);

      if (!t.emitAfter?.length) return;
      t.emitAfter.forEach(evt => {
        ee.emit(evt.eventName, ...evt.args);
      });

      expect(cb.mock.calls.length).toBe(1);
    });
  });
};

describe('caching mode', () => {
  const tests: Test[] = [
    {
      name: 'handler is called after event is fired',
      emit: [{ eventName: 'event', args: [0xcafe] }],
    },
    {
      name: 'handler is called multiple times after event is fired',
      emit: [
        { eventName: 'event', args: [0xcafe1] },
        { eventName: 'event', args: [0xcafe2, 0xcafe3] },
      ],
    },
    {
      name: 'emitter continues operate as normal after cached emit',
      emit: [{ eventName: 'event', args: [0xcafe] }],
      emitAfter: [{ eventName: 'event', args: [0xcafe1] }],
    },
  ];

  runTests(tests);

  test('recursive emit in once handler', () => {
    const ee = new EventEmitter<any>(true);
    const cb = jest.fn();

    ee.once('event', () => {
      cb();
      ee.emit('event', 'this event should not be handled');
    });

    ee.emit('event');
    expect(cb.mock.calls.length).toBe(1);
  });
});
