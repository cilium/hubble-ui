import React, { memo, useCallback } from 'react';

import { Row } from './Row';
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

export interface BodyProps {
  flows: Flow[];
  selectedFlow: Flow | null;
  onSelectFlow?: (flow: Flow | null) => void;
  tsUpdateDelay: number;
}

export const Body = memo<BodyProps>(function FlowsTableBody(props) {
  const onSelectFlow = useCallback(
    (flow: Flow) => {
      props.onSelectFlow && props.onSelectFlow(flow);
    },
    [props.onSelectFlow],
  );

  return (
    <tbody>
      {props.flows.map(flow => (
        <Row
          key={flow.id}
          flow={flow}
          selected={props.selectedFlow?.id === flow.id}
          onSelect={onSelectFlow}
          tsUpdateDelay={props.tsUpdateDelay}
        />
      ))}
    </tbody>
  );
});
