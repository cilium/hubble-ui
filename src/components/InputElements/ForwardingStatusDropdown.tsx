import {
  Button,
  ButtonGroup,
  Menu,
  MenuItem,
  Popover,
} from '@blueprintjs/core';
import { find } from 'lodash';
import React, { memo, useCallback } from 'react';

import { usePopover } from '~/ui/hooks/usePopover';
import { Verdict } from '~/domain/hubble';

export interface Props {
  verdict: Verdict | null;
  onSelect?: (verdict: Verdict | null) => void;
}

interface FilterOption {
  verdict: Verdict | null;
  title: string;
}

const filters: FilterOption[] = [
  {
    verdict: null,
    title: 'Any verdict',
  },
  {
    verdict: Verdict.Forwarded,
    title: 'Forwarded',
  },
  {
    verdict: Verdict.Dropped,
    title: 'Dropped',
  },
];

export const ForwardingStatusDropdown = memo<Props>(props => {
  const popover = usePopover();

  const getLabel = useCallback(() => {
    const found = find(filters, f => f.verdict === props.verdict);
    return found ? found.title : '';
  }, [props.verdict]);

  const content = (
    <Menu>
      {filters.map(filter => (
        <MenuItem
          key={String(filter.verdict)}
          active={props.verdict == filter.verdict}
          text={filter.title}
          onClick={() => props.onSelect?.(filter.verdict)}
        />
      ))}
    </Menu>
  );

  return (
    <Popover {...popover.props} content={content}>
      <ButtonGroup>
        <Button
          minimal
          intent={
            props.verdict === Verdict.Forwarded
              ? 'success'
              : props.verdict === Verdict.Dropped
              ? 'danger'
              : 'none'
          }
          rightIcon="chevron-down"
          text={getLabel()}
          onClick={popover.toggle}
        />
      </ButtonGroup>
    </Popover>
  );
});

ForwardingStatusDropdown.displayName = 'ForwardingStatusDropdown';
