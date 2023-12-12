import _ from 'lodash';
import { observer } from 'mobx-react';
import React, { useRef } from 'react';

import { ArrowStrategy } from '~/ui/layout';
import { Arrow } from '~/ui/layout/abstract/arrows';
import { MapUtils } from '~/utils/iter-tools/map';

type MutRef<T> = React.MutableRefObject<T | null>;

// NOTE: `overlay` is a ref to a container that is ensured to be rendered on top
// NOTE: of all other elements
export interface ArrowRendererProps {
  arrow: Arrow;
  overlay?: MutRef<Element>;
  arrowsForeground?: MutRef<Element>;
}

export type AbstractArrowsRendererProps = Omit<Props, 'renderer'>;
export type AbstractArrowsRenderer = (_: AbstractArrowsRendererProps) => JSX.Element | null;

export type ArrowRenderer = (_: ArrowRendererProps) => JSX.Element | null;

export type Props = {
  strategy: ArrowStrategy;
  renderer: ArrowRenderer;
  overlay?: MutRef<Element>;
  arrowsForeground?: MutRef<Element>;
};

// This component manages multiple arrows to be able to draw them
// properly using d3
export const ArrowsRenderer = observer(function ArrowsRenderer(props: Props) {
  const rootRef = useRef<SVGGElement>(null as any);
  const Arrow = props.renderer;

  return (
    <g ref={rootRef} className="arrows">
      {MapUtils.new(props.strategy.arrows).map((arrowId, arrow) => {
        return (
          <Arrow
            key={arrowId}
            arrow={arrow}
            overlay={props.overlay}
            arrowsForeground={props.arrowsForeground}
          />
        );
      })}
    </g>
  );
});
