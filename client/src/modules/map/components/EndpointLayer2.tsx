import * as React from 'react';
import { MapEndpoint } from '../entities';
import { sizes } from '../sizes';
import css from './Endpoint.scss';
import { EndpointHeader } from './EndpointHeader';

export interface Props {
  readonly endpoint: MapEndpoint;
  readonly x: number;
  readonly y: number;
  readonly height: number;
}

const endpoints = [
  {
    name: 'kafka',
    processes: [
      {
        pid: 1,
        args: 'dsdadad',
        protocols: [
          {
            port: 8080,
            functions: [
              {
                path: 'GET /users',
              },
            ],
          },
        ],
      },
    ],
  },
];

const nextEndpoints = [...endpoints];

export const EndpointLayer2 = React.memo<Props>(props => {
  return (
    <g transform={`translate(${props.x},${props.y})`}>
      <foreignObject
        width={sizes['--endpoint-width'] + 32}
        height={props.height + 32}
      >
        <div className={css.wrapper}>
          <EndpointHeader endpoint={props.endpoint} />
          {props.endpoint.renderChildren()}
        </div>
      </foreignObject>
    </g>
  );
});

EndpointLayer2.displayName = 'EndpointLayer2';
