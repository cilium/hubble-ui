import React, { memo, useCallback, useState } from 'react';
import { Button, Checkbox, Menu, MenuItem, Popover } from '@blueprintjs/core';

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
    const [opened, setOpened] = useState<boolean>(false);
    const onClick = useCallback(() => setOpened(!opened), []);

    const menuItems = FLOWS_TABLE_COLUMNS.map(column => (
      <Item
        key={column}
        column={column}
        checked={props.isVisibleColumn(column)}
        onChange={props.toggleColumn}
      />
    ));

    return (
      <Popover content={<Menu>{menuItems}</Menu>}>
        <Button
          small
          minimal
          onClick={onClick}
          rightIcon="chevron-down"
          text="Columns"
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
