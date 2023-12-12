import RouteStore, { RouteHistorySourceKind, RouteParam } from '~/store/stores/route';

describe('parsing search params', () => {
  let store: RouteStore;

  beforeEach(() => {
    store = new RouteStore(RouteHistorySourceKind.Memory);
  });

  test('flow filters 1', () => {
    store.setParam(RouteParam.FlowsFilter, 'from:identity=21034,to:identity=48617');

    expect(store.flowFilters.length).toBe(2);

    const [a, b] = store.flowFilters;
    expect([a.isIdentity, b.isIdentity]).toEqual([true, true]);

    expect(a.isFrom).toBe(true);
    expect(b.isTo).toBe(true);

    expect(a.query).toBe('21034');
    expect(b.query).toBe('48617');
  });

  test('flow filters 2', () => {
    store.setParam(RouteParam.FlowsFilter, '');

    expect(store.flowFilters.length).toBe(0);
  });

  test('flow filters 3', () => {
    store.setParam(RouteParam.FlowsFilter, 'from:identity=21034');

    expect(store.flowFilters.length).toBe(1);

    const [a] = store.flowFilters;
    expect(a.isIdentity).toEqual(true);
    expect(a.isFrom).toBe(true);
    expect(a.query).toBe('21034');
  });
});
