import classnames from 'classnames';
import React, {
  memo,
  useCallback,
  useEffect,
  useRef,
  FunctionComponent,
} from 'react';

import { tooSmall } from '~/domain/misc';
import ServiceCard from '~/domain/service-card';
import { sizes } from '~/ui';
import { CardProps } from './general';

import css from './styles.scss';

export interface Props extends CardProps {
  onClick?: (card: ServiceCard) => void;
}

export const EndpointCardBase: FunctionComponent<Props> = memo(
  function EndpointCardBase(props) {
    const rootRef = useRef<SVGGElement | null>(null);
    const divRef = useRef<HTMLDivElement | null>(null);

    const layer1 = !!props.layer1;
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
      props.onHeightChange(props.card, elemHeight);
    }, [props.onHeightChange, divRef]);

    const onCardClick = useCallback(() => {
      if (props.onClick == null) return;

      props.onClick(props.card);
    }, [props.onClick]);

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
      <g
        transform={`translate(${viewX}, ${viewY})`}
        ref={rootRef}
        onClick={onCardClick}
      >
        <foreignObject width={viewW} height={viewH}>
          <div className={cls} ref={divRef} style={styles}>
            {props.children}
          </div>
        </foreignObject>
      </g>
    );
  },
);
