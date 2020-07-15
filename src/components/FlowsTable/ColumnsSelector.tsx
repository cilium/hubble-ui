import { Button, Checkbox, Menu, MenuItem, Popover } from '@blueprintjs/core';
import React, { memo, useCallback } from 'react';

import { usePopover } from '~/ui/hooks/usePopover';

import {
  CommonProps,
  FlowsTableColumnKey,
  FLOWS_TABLE_COLUMNS,
  getFlowsTableColumnLabel,
} from './general';

export interface Props extends CommonProps {
  toggleColumn: (column: FlowsTableColumnKey) => void;
}

export const FlowsTableColumnsSelector = memo<Props>(
  function FlowsTableColumnsSelector(props) {
    const popover = usePopover();

    const menuItems = FLOWS_TABLE_COLUMNS.map(column => (
      <Item
        key={column}
        column={column}
        checked={props.isVisibleColumn?.(column) ?? false}
        onChange={props.toggleColumn}
      />
    ));

    return (
      <Popover {...popover.props} content={<Menu>{menuItems}</Menu>}>
        <Button
          small
          minimal
          rightIcon="chevron-down"
          text="Columns"
          onClick={popover.toggle}
        />
      </Popover>
    );
  },
);

interface ItemProps {
  column: FlowsTableColumnKey;
  checked: boolean;
  onChange: (column: FlowsTableColumnKey) => void;
}

const Item = memo<ItemProps>(function ColumnsSelectorItem(props) {
  const onChange = useCallback(() => {
    props.onChange(props.column);
  }, [props.onChange]);

  return (
    <MenuItem
      shouldDismissPopover={false}
      text={
        <Checkbox
          label={getFlowsTableColumnLabel(props.column)}
          checked={props.checked}
          onChange={onChange}
        />
      }
    />
  );
});
