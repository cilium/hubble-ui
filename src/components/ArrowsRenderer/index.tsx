import _ from 'lodash';
import { observer } from 'mobx-react';
import React, { FunctionComponent, useRef } from 'react';
import { ArrowStrategy } from '~/domain/layout';

import { Arrow } from '~/domain/layout/abstract/arrows';
import { MapUtils } from '~/utils/iter-tools/map';

export interface ArrowRendererProps {
  arrow: Arrow;
}

export type ArrowRenderer = (_: ArrowRendererProps) => JSX.Element | null;

export interface Props {
  strategy: ArrowStrategy;
  renderer: ArrowRenderer;
}

// This component manages multiple arrows to be able to draw them
// properly using d3
export const Component: FunctionComponent<Props> = observer(
  function ArrowsRenderer(props: Props) {
    const rootRef = useRef<SVGGElement>(null as any);

    return (
      <g ref={rootRef} className="arrows">
        {MapUtils.new(props.strategy.arrows).map((arrowId, arrow) => {
          const Arrow = props.renderer;

          return <Arrow key={arrowId} arrow={arrow} />;
        })}
      </g>
    );
  },
);

export const ArrowsRenderer = React.memo(Component);
