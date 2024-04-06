import _ from 'lodash';
import classnames from 'classnames';
import React, { useLayoutEffect, useRef } from 'react';
import { observer } from 'mobx-react';

import { XYWH } from '~/domain/geometry';
import { sizes } from '~/ui';
import * as e2e from '~e2e/client';

import type { CardProps, DivRef, SVGGElementRef, CoordsFn } from './general';

import css from './styles.scss';

export type { CardProps, DivRef, SVGGElementRef, CoordsFn };

export const Card = observer(function Card<C>(props: CardProps<C>) {
  const divRef = useRef<HTMLDivElement>(null);

  const classes = classnames(css.baseCard, props.className);

  const shadowSize = sizes.endpointShadowSize;
  const { x, y, w, h } = props.coords || XYWH.empty();

  useLayoutEffect(() => {
    if (props.divRef == null) return;
    props.divRef.current = divRef.current;
  }, [props.divRef]);

  const viewX = x - shadowSize;
  const viewY = y - shadowSize;
  const viewW = w + 2 * shadowSize;
  const viewH = h + 2 * shadowSize;

  const styles = {
    height: props.isUnsizedMode ? 'auto' : `${h}px`,
  };

  return (
    <g transform={`translate(${viewX}, ${viewY})`} onClick={() => props.onClick?.(props.card)}>
      <foreignObject width={viewW} height={viewH}>
        <div className={classes} ref={divRef} style={styles} {...e2e.attributes.card.selector()}>
          {props.children}
        </div>
      </foreignObject>
    </g>
  );
});
