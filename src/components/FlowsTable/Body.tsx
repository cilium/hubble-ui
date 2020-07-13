import React, { memo, useCallback } from 'react';

import { Row } from './Row';
import { Flow } from '~/domain/flows';
import { CommonProps, TickerEvents } from './general';
import { Ticker } from '~/utils/ticker';

export interface BodyProps extends CommonProps {
  flows: Flow[];
  selectedFlow: Flow | null;
  onSelectFlow?: (flow: Flow | null) => void;
  ticker: Ticker<TickerEvents>;
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
          isVisibleColumn={props.isVisibleColumn}
          selected={props.selectedFlow?.id === flow.id}
          onSelect={onSelectFlow}
          ticker={props.ticker}
        />
      ))}
    </tbody>
  );
});
