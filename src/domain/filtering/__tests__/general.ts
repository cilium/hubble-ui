import { FilterEntry, FilterKind, FilterDirection } from '~/domain/filtering';

export const expectFilterEntry = (
  entry: FilterEntry | null,
  expecations: [FilterKind, FilterDirection, string],
) => {
  expect(entry).toBeTruthy();

  expect(entry!.kind).toBe(expecations[0]);
  expect(entry!.direction).toBe(expecations[1]);
  expect(entry!.query).toBe(expecations[2]);
};

test('dumb test to have this module', () => {
  expect(1).toBe(1);
});
