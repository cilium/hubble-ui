import React, { FunctionComponent, useEffect, useRef, useState } from 'react';
import { observer } from 'mobx-react';
import classnames from 'classnames';

import { CardProps } from './general';

import { useStore } from '~/store/hooks';
import { sizes } from '~/ui';
import { ServiceCard } from '~/domain/service-card';
import { XY } from '~/domain/geometry';

import css from './styles.scss';

// TODO: prevent this component from rerendering
const LayerComponent: FunctionComponent<CardProps> = props => {
  const layer1 = !!props.layer1;
  const serviceId = props.card.id;
  const shadowSize = sizes.endpointShadowSize * 2;
  const { x, y } = props.coords;

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

    const currentHeight = layout.cardHeight(serviceId);
    const div = divRef.current as HTMLDivElement;
    const elemHeight = div.offsetHeight + shadowSize;

    // TODO: this component shouldn't write its height directly to store
    layout.setCardHeight(serviceId, elemHeight);

    if (elemHeight !== currentHeight && props.onHeightChange) {
      props.onHeightChange(elemHeight);
    }
  }, [(divRef.current || {}).offsetHeight, props.active]);

  const currentHeight = layout.cardHeight(serviceId);
  const styles = {
    height: layer1 ? `${currentHeight - shadowSize}px` : 'auto',
  };

  return (
    <g transform={`translate(${x}, ${y})`}>
      <foreignObject
        width={layout.endpointWidth(serviceId) + shadowSize}
        height={currentHeight}
      >
        <div className={cls} ref={divRef} style={styles}>
          {props.children}
        </div>
      </foreignObject>
    </g>
  );
};

export const EndpointCardLayer = observer(LayerComponent);
