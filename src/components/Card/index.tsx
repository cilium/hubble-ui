import _ from 'lodash';
import classnames from 'classnames';
import React, {
  FunctionComponent,
  memo,
  useCallback,
  useEffect,
  useRef,
  useMemo,
} from 'react';

import { XY } from '~/domain/geometry';
import { tooSmall } from '~/domain/misc';
import { sizes } from '~/ui';

import {
  BaseCardProps,
  CardComponent,
  CardComponentProps,
  DivRef,
  RootRef,
  CoordsFn,
} from './general';

import css from './styles.scss';

export {
  BaseCardProps,
  CardComponentProps,
  DivRef,
  RootRef,
  CardComponent,
  CoordsFn,
};

export const Card: FunctionComponent<BaseCardProps> = memo(function Card(
  props: BaseCardProps,
) {
  const rootRef = useRef<SVGGElement | null>(null);
  const divRef = useRef<HTMLDivElement | null>(null);

  const classes = classnames(
    css.wrapper,
    !!props.active && css.active,
    !props.isBackplate && css.content,
  );

  const shadowSize = sizes.endpointShadowSize;
  const { x, y, w, h } = props.coords;

  const emitCardHeight = useCallback(() => {
    if (!divRef || !divRef.current || !props.onHeightChange) return;

    // TODO: consider using throttling/debounce/fastdom
    const elemHeight = divRef.current.offsetHeight;

    if (tooSmall(elemHeight - props.coords.h)) return;
    props.onHeightChange(elemHeight);
  }, [props.onHeightChange, divRef, props.coords]);

  const onCardClick = useCallback(() => {
    props.onClick?.();
  }, [props.onClick]);

  useEffect(() => {
    if (props.isBackplate) return;
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
  }, [props.isBackplate, divRef, emitCardHeight]);

  const coordsFn = useCallback(
    (point: XY): [XY, XY] => {
      const divBBox = divRef.current!.getBoundingClientRect();

      const relativeToDiv = {
        x: point.x - divBBox.x,
        y: point.y - divBBox.y,
      };

      const relativeToSvg = {
        x: (relativeToDiv.x / divBBox.width) * w + x,
        y: (relativeToDiv.y / divBBox.height) * h + y,
      };

      return [relativeToDiv, relativeToSvg];
    },
    [divRef.current, x, y, w, h],
  );

  useEffect(() => {
    if (!props.onEmitCoordsFn) return;

    props.onEmitCoordsFn(coordsFn);
  }, [props.onEmitCoordsFn, coordsFn]);

  useEffect(emitCardHeight, [emitCardHeight]);

  const viewX = x - shadowSize;
  const viewY = y - shadowSize;
  const viewW = w + 2 * shadowSize;
  const viewH = h + 2 * shadowSize;

  const styles = {
    height: props.isBackplate ? `${h}px` : 'auto',
  };

  return (
    <g
      transform={`translate(${viewX}, ${viewY})`}
      ref={rootRef}
      onClick={onCardClick}
    >
      <foreignObject width={viewW} height={viewH}>
        <div className={classes} ref={divRef} style={styles}>
          {props.children}
        </div>
      </foreignObject>
    </g>
  );
});
