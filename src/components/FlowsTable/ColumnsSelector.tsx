import { Button, Checkbox, Menu, MenuItem, Popover } from '@blueprintjs/core';
import React, { memo, useCallback } from 'react';

import { usePopover } from '~/ui/hooks/usePopover';

import { CommonProps, Column, columnKeys, getColumnLabel } from './general';

export interface Props extends CommonProps {
  visibleColumns: Set<Column>;
  onToggleColumn?: (column: Column) => void;
}

export const FlowsTableColumnsSelector = memo<Props>(function FlowsTableColumnsSelector(props) {
  const popover = usePopover();

  const menuItems = Object.values(Column).map(column => (
    <Item
      key={column}
      column={column}
      checked={props.visibleColumns.has(column)}
      onChange={c => props.onToggleColumn?.(c)}
    />
  ));

  return (
    <Popover {...popover.props} content={<Menu>{menuItems}</Menu>}>
      <Button small minimal rightIcon="chevron-down" text="Columns" onClick={popover.toggle} />
    </Popover>
  );
});

interface ItemProps {
  column: Column;
  checked: boolean;
  onChange?: (column: Column) => void;
}

const Item = memo<ItemProps>(function ColumnsSelectorItem(props) {
  const onChange = useCallback(() => {
    props.onChange?.(props.column);
  }, [props.onChange]);

  return (
    <MenuItem
      shouldDismissPopover={false}
      text={
        <Checkbox
          label={getColumnLabel(props.column)}
          checked={props.checked}
          onChange={onChange}
        />
      }
    />
  );
});
