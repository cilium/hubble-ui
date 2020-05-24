import React, { FunctionComponent, useEffect, useRef, useState } from 'react';
import { observer } from 'mobx-react';
import classnames from 'classnames';

import { CardProps } from './general';

import { useStore } from '~/store/hooks';
import { sizes } from '~/ui';
import { ServiceCard } from '~/domain/service-card';
import { XY } from '~/domain/geometry';

import css from './styles.scss';

const LayerComponent: FunctionComponent<CardProps> = props => {
  const rootRef = useRef<SVGGElement | null>(null);

  const layer1 = !!props.layer1;
  const serviceId = props.card.id;
  const shadowSize = sizes.endpointShadowSize * 2;
  const { x, y, w, h } = props.coords;

  const cls = classnames(
    css.wrapper,
    layer1 ? css.layer1 : css.layer2,
    !!props.active && css.active,
  );

  const divRef = useRef<HTMLDivElement>(null);
  const { layout } = useStore();

  // TODO: it looks unreliable in case when element resize wasn't connected
  // with this component props ><
  useEffect(() => {
    if (layer1) return;

    const div = divRef.current as HTMLDivElement;
    const elemHeight = div.offsetHeight + shadowSize;

    if (elemHeight === h) return;

    props.onHeightChange && props.onHeightChange(props.card, elemHeight);
  }, [props.active, divRef]);

  useEffect(() => {
    if (props.onEmitRootRef == null || rootRef == null) return;

    props.onEmitRootRef(rootRef);
  }, [rootRef.current, props.onEmitRootRef]);

  const styles = {
    height: layer1 ? `${h - shadowSize}px` : 'auto',
  };

  return (
    <g transform={`translate(${x}, ${y})`} ref={rootRef}>
      <foreignObject
        width={layout.endpointWidth(serviceId) + shadowSize}
        height={h}
      >
        <div className={cls} ref={divRef} style={styles}>
          {props.children}
        </div>
      </foreignObject>
    </g>
  );
};

LayerComponent.displayName = 'EndpointCardBase';
export const EndpointCardLayer = observer(LayerComponent);
