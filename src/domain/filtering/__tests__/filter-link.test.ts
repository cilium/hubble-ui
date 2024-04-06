import {
  Filters,
  FiltersObject,
  filterLink,
  filterLinkByEntry,
  FilterEntry,
} from '~/domain/filtering';

import { Verdict } from '~/domain/hubble';
import { Link } from '~/domain/link';
import { Flow } from '~/domain/flows';
import { Dictionary } from '~/domain/misc';
import { links } from '~/testing/data';

const runUnusedFiltersTests = (filters: FiltersObject[], links: Dictionary<Link>) => {
  Object.keys(links).forEach((linkName: string) => {
    const link = links[linkName];

    filters.forEach((f: FiltersObject, fidx: number) => {
      test(`unused filter fields test, link: ${linkName}, filters: ${fidx + 1}`, () => {
        const stay = filterLink(link, Filters.fromObject(f));
        expect(stay).toBe(true);
      });
    });
  });
};

const testFilterEntry = (
  captionFn: (linkName: string, testNum: number) => string,
  entry: FilterEntry,
  expected: boolean,
  links: Dictionary<Link>,
) => {
  Object.keys(links).forEach((linkName: string, lidx: number) => {
    const link = links[linkName];
    const caption = captionFn(linkName, lidx + 1);

    test(caption, () => {
      const result = filterLinkByEntry(link, entry);

      expect(result).toBe(expected);
    });
  });
};

describe('filterLink', () => {
  const tcpForwarded = Link.fromHubbleLink(links.tcpForwarded);
  const tcpDropped = Link.fromHubbleLink(links.tcpDropped);
  const tcpUnknown = Link.fromHubbleLink(links.tcpUnknown);
  const tcpError = Link.fromHubbleLink(links.tcpError);
  const tcpForwardedToItself = Link.fromHubbleLink(links.tcpForwardedToItself);
  const tcpDroppedToItself = Link.fromHubbleLink(links.tcpDroppedToItself);
  const { tcpForwardedDropped, tcpMixed } = links;

  test('verdict > matches 1', () => {
    const filters: Filters = Filters.fromObject({
      verdicts: new Set([Verdict.Forwarded]),
    });

    const stay = filterLink(tcpForwarded, filters);
    expect(stay).toBe(true);
  });

  test('verdict > matches 2', () => {
    const filters: Filters = Filters.fromObject({
      verdicts: new Set([Verdict.Dropped]),
    });

    const stay = filterLink(tcpDropped, filters);
    expect(stay).toBe(true);
  });

  test('verdict > matches 3', () => {
    const filters: Filters = Filters.fromObject({
      verdicts: new Set([Verdict.Error]),
    });

    const stay = filterLink(tcpError, filters);
    expect(stay).toBe(true);
  });

  test('verdict > matches 4', () => {
    const filters: Filters = Filters.fromObject({
      verdicts: new Set([Verdict.Unknown]),
    });

    const stay = filterLink(tcpUnknown, filters);
    expect(stay).toBe(true);
  });

  test('verdict > matches 5', () => {
    const filters: Filters = Filters.fromObject({
      verdicts: new Set([Verdict.Forwarded]),
    });

    const stay = filterLink(tcpForwardedDropped, filters);
    expect(stay).toBe(true);
  });

  test('verdict > matches 6', () => {
    const filters: Filters = Filters.fromObject({
      verdicts: new Set([Verdict.Dropped]),
    });

    const stay = filterLink(tcpForwardedDropped, filters);
    expect(stay).toBe(true);
  });

  test('verdict > matches 7', () => {
    const filters: Filters = Filters.fromObject({
      verdicts: new Set([Verdict.Forwarded]),
    });

    const stay = filterLink(tcpMixed, filters);
    expect(stay).toBe(true);
  });

  test('verdict > matches 8', () => {
    const filters: Filters = Filters.fromObject({
      verdicts: new Set([Verdict.Dropped]),
    });

    const stay = filterLink(tcpMixed, filters);
    expect(stay).toBe(true);
  });

  test('verdict > matches 9', () => {
    const filters: Filters = Filters.fromObject({
      verdicts: new Set([Verdict.Error]),
    });

    const stay = filterLink(tcpMixed, filters);
    expect(stay).toBe(true);
  });

  test('verdict > matches 10', () => {
    const filters: Filters = Filters.fromObject({
      verdicts: new Set([Verdict.Unknown]),
    });

    const stay = filterLink(tcpMixed, filters);
    expect(stay).toBe(true);
  });

  test('verdict > doesnt match 1', () => {
    const filters: Filters = Filters.fromObject({
      verdicts: new Set([Verdict.Forwarded]),
    });

    const stay = filterLink(tcpDropped, filters);
    expect(stay).toBe(false);
  });

  test('verdict > doesnt match 2', () => {
    const filters: Filters = Filters.fromObject({
      verdicts: new Set([Verdict.Unknown]),
    });

    const stay = filterLink(tcpDropped, filters);
    expect(stay).toBe(false);
  });

  test('verdict > doesnt match 3', () => {
    const filters: Filters = Filters.fromObject({
      verdicts: new Set([Verdict.Error]),
    });

    const stay = filterLink(tcpDropped, filters);
    expect(stay).toBe(false);
  });

  test('verdict > doesnt match 4', () => {
    const filters: Filters = Filters.fromObject({
      verdicts: new Set([Verdict.Dropped]),
    });

    const stay = filterLink(tcpForwarded, filters);
    expect(stay).toBe(false);
  });

  test('verdict > doesnt match 5', () => {
    const filters: Filters = Filters.fromObject({
      verdicts: new Set([Verdict.Unknown]),
    });

    const stay = filterLink(tcpForwarded, filters);
    expect(stay).toBe(false);
  });

  test('verdict > doesnt match 6', () => {
    const filters: Filters = Filters.fromObject({
      verdicts: new Set([Verdict.Error]),
    });

    const stay = filterLink(tcpForwarded, filters);
    expect(stay).toBe(false);
  });

  test('verdict > doesnt match 7', () => {
    const filters: Filters = Filters.fromObject({
      verdicts: new Set([Verdict.Error]),
    });

    const stay = filterLink(tcpForwardedDropped, filters);
    expect(stay).toBe(false);
  });

  test('verdict > doesnt match 8', () => {
    const filters: Filters = Filters.fromObject({
      verdicts: new Set([Verdict.Unknown]),
    });

    const stay = filterLink(tcpForwardedDropped, filters);
    expect(stay).toBe(false);
  });

  testFilterEntry(
    (linkName: string, n: number) => `identity > to matches ${n} (${linkName})`,
    FilterEntry.parse(`to:identity=dst-456`)!,
    true,
    {
      tcpForwarded,
      tcpDropped,
      tcpUnknown,
      tcpError,
      tcpForwardedDropped,
      tcpMixed,
    },
  );

  testFilterEntry(
    (linkName: string, n: number) => `identity > to doesnt match ${n} (${linkName})`,
    FilterEntry.parse(`to:identity=dst-456-wrong`)!,
    false,
    {
      tcpForwarded,
      tcpDropped,
      tcpUnknown,
      tcpError,
      tcpForwardedDropped,
      tcpMixed,
    },
  );

  testFilterEntry(
    (linkName: string, n: number) => `identity > negative > to match ${n} (${linkName})`,
    FilterEntry.parse(`!to:identity=dst-456`)!,
    true,
    {
      tcpForwarded,
      tcpDropped,
      tcpUnknown,
      tcpError,
      tcpForwardedDropped,
      tcpMixed,
    },
  );

  testFilterEntry(
    (linkName: string, n: number) => `identity > negative > to doesnt match ${n} (${linkName})`,
    FilterEntry.parse(`!to:identity=dst-456-wrong`)!,
    true,
    {
      tcpForwarded,
      tcpDropped,
      tcpUnknown,
      tcpError,
      tcpForwardedDropped,
      tcpMixed,
    },
  );

  testFilterEntry(
    (linkName: string, n: number) => `identity > to matches ${n} (${linkName})`,
    FilterEntry.parse(`to:identity=src-123`)!,
    true,
    {
      tcpForwardedToItself,
      tcpDroppedToItself,
    },
  );

  testFilterEntry(
    (linkName: string, n: number) => `identity > to doesnt match ${n} (${linkName})`,
    FilterEntry.parse(`to:identity=src-123-wrong`)!,
    false,
    {
      tcpForwardedToItself,
      tcpDroppedToItself,
    },
  );

  testFilterEntry(
    (linkName: string, n: number) => `identity > from matches ${n} (${linkName})`,
    FilterEntry.parse(`from:identity=src-123`)!,
    true,
    {
      tcpForwarded,
      tcpDropped,
      tcpUnknown,
      tcpError,
      tcpForwardedToItself,
      tcpDroppedToItself,
      tcpForwardedDropped,
      tcpMixed,
    },
  );

  testFilterEntry(
    (linkName: string, n: number) => `identity > from doesnt match ${n} (${linkName})`,
    FilterEntry.parse(`from:identity=src-123-wrong`)!,
    false,
    {
      tcpForwarded,
      tcpDropped,
      tcpUnknown,
      tcpError,
      tcpForwardedToItself,
      tcpDroppedToItself,
      tcpForwardedDropped,
      tcpMixed,
    },
  );

  testFilterEntry(
    (linkName: string, n: number) => `identity > either matches ${n} (${linkName})`,
    FilterEntry.parse(`either:identity=src-123`)!,
    true,
    {
      tcpForwarded,
      tcpDropped,
      tcpUnknown,
      tcpError,
      tcpForwardedToItself,
      tcpDroppedToItself,
      tcpForwardedDropped,
      tcpMixed,
    },
  );

  testFilterEntry(
    (linkName: string, n: number) => `identity > either doesnt match ${n} (${linkName})`,
    FilterEntry.parse(`either:identity=src-123-wrong`)!,
    false,
    {
      tcpForwarded,
      tcpDropped,
      tcpUnknown,
      tcpError,
      tcpForwardedToItself,
      tcpDroppedToItself,
      tcpForwardedDropped,
      tcpMixed,
    },
  );

  // These filters don't work for links since they don't have enough information
  // to decide drop or not to drop, hence links are always passed
  runUnusedFiltersTests(
    [
      { namespace: 'random-ns' },
      { httpStatus: '200' },
      { httpStatus: '200+' },
      { httpStatus: '400' },
      { skipHost: true },
      { skipHost: false },
      { skipKubeDns: true },
      { skipKubeDns: false },
      { skipHost: true, skipKubeDns: true },
      { skipHost: true, skipKubeDns: true, namespace: 'random-ns' },
      {
        skipHost: true,
        skipKubeDns: true,
        namespace: 'random-ns',
        httpStatus: '200',
      },
      {
        filters: [FilterEntry.parse('from:dns=www.google.com')!],
      },
      {
        filters: [FilterEntry.parse('to:dns=www.google.com')!],
      },
      {
        filters: [FilterEntry.parse('either:dns=www.google.com')!],
      },
      {
        filters: [FilterEntry.parse('from:label=k8s:k8s-app=random-app')!],
      },
      {
        filters: [FilterEntry.parse('to:label=k8s:k8s-app=random-app')!],
      },
      {
        filters: [FilterEntry.parse('either:label=k8s:k8s-app=random-app')!],
      },
      {
        filters: [FilterEntry.parse('from:ip=153.82.167.250')!],
      },
      {
        filters: [FilterEntry.parse('to:ip=153.82.167.250')!],
      },
      {
        filters: [FilterEntry.parse('either:ip=153.82.167.250')!],
      },
      {
        filters: [
          FilterEntry.parse('from:ip=153.82.167.250')!,
          FilterEntry.parse('to:label=k8s:k8s-app=random-app')!,
        ],
      },
    ],
    {
      tcpForwarded,
      tcpDropped,
      tcpUnknown,
      tcpError,
      tcpForwardedDropped,
      tcpMixed,
      tcpForwardedToItself,
      tcpDroppedToItself,
    },
  );
});
