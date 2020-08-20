import {
  FlowsFilterEntry,
  FlowsFilterKind,
  FlowsFilterDirection,
} from '~/domain/flows';

const parse = (
  testName: string,
  s: string,
  notNull: boolean,
  dir: FlowsFilterDirection,
  kind: FlowsFilterKind,
  query: string,
) => {
  test(testName, () => {
    const e = FlowsFilterEntry.parse(s);
    if (!notNull) {
      expect(e).toBeNull();
    }

    expect(e!.kind).toBe(kind);
    expect(e!.direction).toBe(dir);
    expect(e!.query).toBe(query);
  });
};

describe('correct strings parsing', () => {
  parse(
    'correct 1',
    'both:ip=127.0.0.1',
    true,
    FlowsFilterDirection.Both,
    FlowsFilterKind.Ip,
    '127.0.0.1',
  );

  parse(
    'correct 2',
    'from:ip=127.0.0.1',
    true,
    FlowsFilterDirection.From,
    FlowsFilterKind.Ip,
    '127.0.0.1',
  );

  parse(
    'correct 3',
    'to:ip=127.0.0.1',
    true,
    FlowsFilterDirection.To,
    FlowsFilterKind.Ip,
    '127.0.0.1',
  );

  parse(
    'correct 4',
    'both:dns=google.com',
    true,
    FlowsFilterDirection.Both,
    FlowsFilterKind.Dns,
    'google.com',
  );

  parse(
    'correct 5',
    'both:label=app=name',
    true,
    FlowsFilterDirection.Both,
    FlowsFilterKind.Label,
    'app=name',
  );

  parse(
    'correct 6',
    'from:label=app=name',
    true,
    FlowsFilterDirection.From,
    FlowsFilterKind.Label,
    'app=name',
  );

  parse(
    'correct 7',
    'to:label=app=name',
    true,
    FlowsFilterDirection.To,
    FlowsFilterKind.Label,
    'app=name',
  );

  parse(
    'correct 8',
    'from:dns=google.com',
    true,
    FlowsFilterDirection.From,
    FlowsFilterKind.Dns,
    'google.com',
  );

  parse(
    'correct 9',
    'to:dns=127.0.0.1',
    true,
    FlowsFilterDirection.To,
    FlowsFilterKind.Dns,
    '127.0.0.1',
  );

  parse(
    'correct 10',
    'ip=127.0.0.1',
    true,
    FlowsFilterDirection.Both,
    FlowsFilterKind.Ip,
    '127.0.0.1',
  );

  parse(
    'correct 11',
    'label=app=name',
    true,
    FlowsFilterDirection.Both,
    FlowsFilterKind.Label,
    'app=name',
  );

  parse(
    'correct 12',
    'dns=google.com',
    true,
    FlowsFilterDirection.Both,
    FlowsFilterKind.Dns,
    'google.com',
  );

  parse(
    'correct 13',
    'app=name',
    true,
    FlowsFilterDirection.Both,
    FlowsFilterKind.Label,
    'app=name',
  );

  parse(
    'correct 14',
    'identity=12345',
    true,
    FlowsFilterDirection.Both,
    FlowsFilterKind.Identity,
    '12345',
  );
});
