import { getFlowsTableVisibleColumns, saveFlowsTableVisibleColumns } from '~/storage/local';

import { Column } from '~/components/FlowsTable';

describe('consistency tests for setItem / getItem', () => {
  beforeEach(() => {
    global.localStorage.clear();
    jest.clearAllMocks();
  });

  test('flows table visible columns 1', () => {
    const data = getFlowsTableVisibleColumns();
    expect(data).toBeNull();
  });

  test('flows table visible columns 2', () => {
    const getItem = jest.spyOn(Storage.prototype, 'getItem');
    const setItem = jest.spyOn(Storage.prototype, 'setItem');

    const arr = [Column.SrcService];
    saveFlowsTableVisibleColumns(new Set(arr));

    expect(setItem.mock.calls.length).toBe(1);
    expect(setItem.mock.calls[0][1]).toBe(JSON.stringify(arr));

    const data = getFlowsTableVisibleColumns();
    expect(data).toEqual(new Set([Column.SrcService]));
  });

  test('flows table visible columns 3', () => {
    const getItem = jest.spyOn(Storage.prototype, 'getItem');
    const setItem = jest.spyOn(Storage.prototype, 'setItem');

    const arr = [Column.SrcPod, Column.DstPod];
    saveFlowsTableVisibleColumns(new Set(arr));

    expect(setItem.mock.calls.length).toBe(1);
    expect(setItem.mock.calls[0][1]).toBe(JSON.stringify(arr));

    const data = getFlowsTableVisibleColumns();
    expect(data).toEqual(new Set([Column.SrcPod, Column.DstPod]));
  });
});
