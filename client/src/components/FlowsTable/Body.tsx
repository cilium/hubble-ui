import React, { memo, useCallback } from 'react';

import { Row } from './Row';
import { Flow } from '~/domain/flows';
import { CommonProps } from './general';

export interface BodyProps extends CommonProps {
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
          isVisibleColumn={props.isVisibleColumn}
          selected={props.selectedFlow?.id === flow.id}
          onSelect={onSelectFlow}
          tsUpdateDelay={props.tsUpdateDelay}
        />
      ))}
    </tbody>
  );
});
