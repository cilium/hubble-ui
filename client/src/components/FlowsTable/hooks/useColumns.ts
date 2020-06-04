import { useCallback, useState } from 'react';

import {
  getFlowsTableVisibleColumns,
  saveFlowsTableVisibleColumns,
} from '~/storage/local';

import {
  DEFAULT_FLOWS_TABLE_VISIBLE_COLUMNS,
  FlowsTableColumnKey,
} from '../general';

export function useFlowsTableColumns() {
  const [visible, setVisible] = useState<Set<FlowsTableColumnKey>>(
    getFlowsTableVisibleColumns() ?? DEFAULT_FLOWS_TABLE_VISIBLE_COLUMNS,
  );

  // prettier-ignore
  const toggle = useCallback((column: FlowsTableColumnKey) => {
    const nextVisible = new Set<FlowsTableColumnKey>(visible);
    visible.has(column) ? nextVisible.delete(column) : nextVisible.add(column);
    setVisible(nextVisible);
    saveFlowsTableVisibleColumns(nextVisible);
  }, [visible]);

  // prettier-ignore
  const isVisible = useCallback((column: FlowsTableColumnKey) => {
    return visible.has(column);
  }, [visible]);

  return {
    toggleColumn: toggle,
    isVisibleColumn: isVisible,
  };
}
