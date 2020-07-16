import {
  FlowsFilterEntry,
  FlowsFilterKind,
  FlowsFilterDirection,
} from '~/domain/flows';

export const expectFilterEntry = (
  entry: FlowsFilterEntry | null,
  expecations: [FlowsFilterKind, FlowsFilterDirection, string],
) => {
  expect(entry).toBeTruthy();

  expect(entry!.kind).toBe(expecations[0]);
  expect(entry!.direction).toBe(expecations[1]);
  expect(entry!.query).toBe(expecations[2]);
};

test('dumb test to have this module', () => {
  expect(1).toBe(1);
});
