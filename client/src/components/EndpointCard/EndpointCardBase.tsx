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
import { tooSmall } from '~/domain/misc';

import css from './styles.scss';

const LayerComponent: FunctionComponent<CardProps> = props => {
  const rootRef = useRef<SVGGElement | null>(null);
  const divRef = useRef<HTMLDivElement | null>(null);
  const { layout } = useStore();

  const layer1 = !!props.layer1;
  const serviceId = props.card.id;
  const shadowSize = sizes.endpointShadowSize;
  const { x, y, w, h } = props.coords;

  const cls = classnames(
    css.wrapper,
    layer1 ? css.layer1 : css.layer2,
    !!props.active && css.active,
  );

  const emitCardHeight = useCallback(() => {
    if (!divRef || !divRef.current || !props.onHeightChange) return;

    // TODO: consider using throttling/debounce/fastdom
    const elemHeight = divRef.current.offsetHeight;

    if (tooSmall(elemHeight - h)) return;
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

  useEffect(() => {
    if (props.onEmitContentRef == null || divRef == null) return;

    props.onEmitContentRef(divRef);
  }, [divRef.current, props.onEmitContentRef]);

  useEffect(emitCardHeight, [emitCardHeight]);

  const viewX = x - shadowSize;
  const viewY = y - shadowSize;
  const viewW = w + 2 * shadowSize;
  const viewH = h + 2 * shadowSize;

  const styles = {
    height: layer1 ? `${h}px` : 'auto',
  };

  return (
    <g transform={`translate(${viewX}, ${viewY})`} ref={rootRef}>
      <foreignObject width={viewW} height={viewH}>
        <div className={cls} ref={divRef} style={styles}>
          {props.children}
        </div>
      </foreignObject>
    </g>
  );
};

LayerComponent.displayName = 'EndpointCardBase';
export const EndpointCardLayer = observer(LayerComponent);
