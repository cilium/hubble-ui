import * as React from 'react';

export interface Props {
  readonly x: number;
  readonly y: number;
}

export const IngressConnector = React.memo<Props>(props => {
  return (
    <g>
      <circle cx={props.x} cy={props.y} r={4} strokeWidth="2" />
    </g>
  );
});

IngressConnector.displayName = 'IngressConnector';
