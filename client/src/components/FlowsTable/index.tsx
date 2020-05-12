import React, { memo, useCallback } from 'react';

import { Body } from './Body';

import { useScroll } from './hooks/useScroll';
import { FlowsTableColumn } from './constants';
import { Flow } from '~/domain/flows';

import css from './styles.scss';

export const DEFAULT_TS_UPDATE_DELAY = 2500;

export interface Props {
  flows: Flow[];
  flowsDiffCount: { value: number };
  selectedFlow: Flow | null;
  onSelectFlow?: (flow: Flow | null) => void;
  tsUpdateDelay?: number;
}

export const FlowsTable = memo<Props>(function FlowsTable(props: Props) {
  const scroll = useScroll<HTMLDivElement>(props.flowsDiffCount);
  const tsUpdateDelay = props.tsUpdateDelay ?? DEFAULT_TS_UPDATE_DELAY;

  return (
    <div {...scroll} className={css.wrapper}>
      <table className={css.table}>
        <Header />
        <Body
          flows={props.flows}
          selectedFlow={props.selectedFlow}
          onSelectFlow={props.onSelectFlow}
          tsUpdateDelay={tsUpdateDelay}
        />
      </table>
    </div>
  );
});

const Header = memo(function FlowsTableHeader() {
  return (
    <thead>
      <tr>
        <th>{FlowsTableColumn.SOURCE_SERVICE}</th>
        <th>{FlowsTableColumn.DESTINATION_SERVICE}</th>
        <th>{FlowsTableColumn.DESTINATION_PORT}</th>
        <th>{FlowsTableColumn.VERDICT}</th>
        <th>{FlowsTableColumn.TIMESTAMP}</th>
      </tr>
    </thead>
  );
});
