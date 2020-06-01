import React, {
  FunctionComponent,
  useEffect,
  useRef,
  useState,
  useCallback,
} from 'react';
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

  const emitCardHeight = useCallback(() => {
    if (!divRef || !divRef.current || !props.onHeightChange) return;

    // TODO: consider using throttling/debounce/fastdom
    const elemHeight = divRef.current.offsetHeight + shadowSize;

    if (Math.abs(elemHeight - h) < Number.EPSILON) return;
    props.onHeightChange!(props.card, elemHeight);
  }, [props.onHeightChange, divRef]);

  useEffect(() => {
    if (layer1) return;
    const observer = new MutationObserver(emitCardHeight);

    observer.observe(divRef.current as HTMLDivElement, {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: true,
    });

    return () => {
      observer.disconnect();
    };
  }, [layer1, divRef, emitCardHeight]);

  useEffect(() => {
    if (props.onEmitRootRef == null || rootRef == null) return;

    props.onEmitRootRef(rootRef);
  }, [rootRef.current, props.onEmitRootRef]);

  useEffect(emitCardHeight, [emitCardHeight]);

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
