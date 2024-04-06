import { FilterEntry, FilterKind, FilterDirection } from '~/domain/filtering';

const parse = (
  testName: string,
  s: string,
  notNull: boolean,
  dir: FilterDirection,
  kind: FilterKind,
  query: string,
  meta?: string,
  negative = false,
) => {
  test(testName, () => {
    const e = FilterEntry.parse(s);
    if (!notNull) {
      expect(e).toBeNull();
      return;
    }

    if (e == null) return;

    expect(e.kind).toBe(kind);
    expect(e.direction).toBe(dir);
    expect(e.query).toBe(query);
    expect(e!.negative).toBe(negative);

    if (meta != null) {
      expect(e.meta).toBe(meta);
    }
  });
};

describe('correct strings parsing', () => {
  parse(
    'correct 1',
    'either:ip=127.0.0.1',
    true,
    FilterDirection.Either,
    FilterKind.Ip,
    '127.0.0.1',
  );

  parse('correct 2', 'from:ip=127.0.0.1', true, FilterDirection.From, FilterKind.Ip, '127.0.0.1');

  parse('correct 3', 'to:ip=127.0.0.1', true, FilterDirection.To, FilterKind.Ip, '127.0.0.1');

  parse(
    'correct 4',
    'either:dns=google.com',
    true,
    FilterDirection.Either,
    FilterKind.Dns,
    'google.com',
  );

  parse(
    'correct 5',
    'either:label=app=name',
    true,
    FilterDirection.Either,
    FilterKind.Label,
    'app=name',
  );

  parse(
    'correct 6',
    'from:label=app=name',
    true,
    FilterDirection.From,
    FilterKind.Label,
    'app=name',
  );

  parse('correct 7', 'to:label=app=name', true, FilterDirection.To, FilterKind.Label, 'app=name');

  parse(
    'correct 8',
    'from:dns=google.com',
    true,
    FilterDirection.From,
    FilterKind.Dns,
    'google.com',
  );

  parse('correct 9', 'to:dns=127.0.0.1', true, FilterDirection.To, FilterKind.Dns, '127.0.0.1');

  parse('correct 10', 'ip=127.0.0.1', true, FilterDirection.Either, FilterKind.Ip, '127.0.0.1');

  parse('correct 11', 'label=app=name', true, FilterDirection.Either, FilterKind.Label, 'app=name');

  parse('correct 12', 'dns=google.com', true, FilterDirection.Either, FilterKind.Dns, 'google.com');

  parse('correct 13', 'app=name', true, FilterDirection.Either, FilterKind.Label, 'app=name');

  parse('correct 14', 'identity=12345', true, FilterDirection.Either, FilterKind.Identity, '12345');

  parse('correct 15', 'from:pod=random', true, FilterDirection.From, FilterKind.Pod, 'random');

  parse('correct 16', 'to:pod=random', true, FilterDirection.To, FilterKind.Pod, 'random');

  parse('correct 17', 'either:pod=random', true, FilterDirection.Either, FilterKind.Pod, 'random');

  parse('correct 19', 'pod=random', true, FilterDirection.Either, FilterKind.Pod, 'random');

  parse(
    'correct 20',
    '!pod=random',
    true,
    FilterDirection.Either,
    FilterKind.Pod,
    'random',
    undefined,
    true,
  );

  parse(
    'correct 21',
    'to:workload=ds:app',
    true,
    FilterDirection.To,
    FilterKind.Workload,
    'app',
    'ds',
  );

  parse(
    'correct 22',
    'workload=dep:app-dep',
    true,
    FilterDirection.Either,
    FilterKind.Workload,
    'app-dep',
    'dep',
  );
});
