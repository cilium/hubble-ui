import React, { FunctionComponent, useEffect, useRef, useState } from 'react';
import { observer } from 'mobx-react';
import classnames from 'classnames';

import { EndpointCardHeader } from '~/components/EndpointCardHeader';
// import { EndpointCardLabels } from '~/components/EndpointCardLabels';

import { useStore } from '~/store/hooks';
import { sizes } from '~/ui';
import { ServiceCard } from '~/domain/service-card';
import { XY } from '~/domain/geometry';

import css from './styles.scss';

export interface LayerProps {
  readonly card: ServiceCard;
  readonly coords: XY;
  readonly layer1?: boolean;
  readonly onHeightChange?: (_: number) => void;
}

// TODO: prevent this component from rerendering
const LayerComponent: FunctionComponent<LayerProps> = props => {
  const layer1 = !!props.layer1;
  const serviceId = props.card.id;
  const shadowSize = sizes.endpointShadowSize * 2;
  const { x, y } = props.coords;

  const cls = classnames(css.wrapper, layer1 ? css.layer1 : css.layer2);
  const divRef = useRef<HTMLDivElement>(null);
  const { layout } = useStore();

  console.log(
    `LayerComponent ${layer1 ? 'backplate' : 'content'} is rerendering`,
  );

  useEffect(() => {
    if (layer1) return;

    const currentHeight = layout.cardHeight(serviceId);
    const div = divRef.current as HTMLDivElement;
    const elemHeight = div.offsetHeight + shadowSize;
    const newHeight = Math.max(elemHeight, currentHeight);

    // TODO: is it okay that this component writes its height directly to store?
    layout.setCardHeight(serviceId, newHeight);

    if (newHeight !== currentHeight && props.onHeightChange) {
      props.onHeightChange(newHeight);
    }
  }, []);

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

export const EndpointCardBackplate: FunctionComponent<LayerProps> = props => {
  return <EndpointCardLayer layer1 {...props} />;
};

export const EndpointCardContent: FunctionComponent<LayerProps> = props => {
  return (
    <EndpointCardLayer {...props}>
      <EndpointCardHeader card={props.card} />
      {/*<EndpointCardLabels endpoint={props.endpoint} />*/}
    </EndpointCardLayer>
  );
};
