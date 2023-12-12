import { useCallback, useState } from 'react';

import { getFlowsTableVisibleColumns, saveFlowsTableVisibleColumns } from '~/storage/local';

import { defaultVisibleColumns, Column } from '~/components/FlowsTable';

export interface FlowsTableColumnControl {
  toggle: (_: Column) => void;
  isVisible: (_: Column) => boolean;
  visible: Set<Column>;
}

export const useFlowsTableColumns = (
  def: Set<Column> = defaultVisibleColumns,
): FlowsTableColumnControl => {
  const [visible, setVisible] = useState<Set<Column>>(getFlowsTableVisibleColumns() ?? def);

  // prettier-ignore
  const toggle = useCallback((column: Column) => {
    const nextVisible = new Set<Column>(visible);
    visible.has(column) ? nextVisible.delete(column) : nextVisible.add(column);

    setVisible(nextVisible);
    saveFlowsTableVisibleColumns(nextVisible);
  }, [visible]);

  // prettier-ignore
  const isVisible = useCallback((column: Column) => {
    return visible.has(column);
  }, [visible]);

  return { toggle, isVisible, visible };
};
