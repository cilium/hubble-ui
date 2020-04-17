import classnames from 'classnames';
import * as React from 'react';
import { sizes } from '../sizes';
import css from './Endpoint.scss';

export interface Props {
  readonly x: number;
  readonly y: number;
  readonly height: number;
}

export const EndpointLayer1 = React.memo<Props>(props => {
  return (
    <g transform={`translate(${props.x},${props.y})`}>
      <foreignObject
        width={sizes['--endpoint-width'] + 32}
        height={props.height + 32}
      >
        <div className={classnames(css.wrapper, css.layer1)} />
      </foreignObject>
    </g>
  );
});

EndpointLayer1.displayName = 'EndpointLayer1';
