import { observer } from 'mobx-react';
import React, { ReactNode, useCallback, useEffect, useMemo } from 'react';

import { AbstractCard } from '~/domain/cards';
import { Vec2, XYWH } from '~/domain/geometry';
import { ArrowStrategy, PlacementStrategy } from '~/domain/layout';

import { ArrowsRenderer } from '~/components/ArrowsRenderer';
import { Card as BaseCard } from '~/components/Card';
import { NamespaceBackplate } from './NamespaceBackplate';

import { useMapZoom } from './hooks/useMapZoom';

import { sizes } from '~/ui/vars';
import css from './styles.scss';

export interface Props<C extends AbstractCard> {
  placement: PlacementStrategy;
  namespace?: string | null;
  namespaceBBox?: XYWH | null;
  cards: Array<C>;
  wasDragged: boolean;
  visibleHeight: number;
  arrows?: ArrowStrategy;
  cardRenderer: (card: C) => ReactNode;
  isCardActive?: (id: string) => boolean;
  onCardHeightChange?: (id: string, height: number) => void;
  onMapDrag?: (val: boolean) => void;
}

export const MapElements = observer(function MapElements<
  C extends AbstractCard
>(props: Props<C>) {
  useEffect(() => {
    props.cards.forEach(c => {
      props.placement.initUninitializedCard(c.id);
    });
  }, [props.cards, props.placement]);

  const isCardActive = useCallback(
    (cardId: string): boolean => {
      return props.isCardActive ? props.isCardActive(cardId) : false;
    },
    [props.isCardActive],
  );

  const [backplates, cards] = useMemo(() => {
    const backplates: ReactNode[] = [];
    const cards: ReactNode[] = [];

    props.cards.forEach(card => {
      const coords = props.placement.cardsBBoxes.get(card.id);
      if (coords == null) return;

      const onHeightChange = (h: number) => {
        return props.onCardHeightChange?.(card.id, h);
      };

      backplates.push(
        <BaseCard
          key={card.id}
          coords={coords}
          active={isCardActive(card.id)}
          isBackplate={true}
          onHeightChange={onHeightChange}
        />,
      );

      cards.push(props.cardRenderer(card));
    });

    return [backplates, cards];
  }, [
    props.cardRenderer,
    props.cards,
    props.onCardHeightChange,
    props.placement.cardsBBoxes,
    isCardActive,
  ]);

  return (
    <>
      {props.namespaceBBox && props.namespace && (
        <NamespaceBackplate
          namespace={props.namespace}
          xywh={props.namespaceBBox.addMargin(sizes.endpointHPadding / 2)}
        />
      )}

      {backplates}

      {props.arrows && <ArrowsRenderer arrows={props.arrows.paths} />}

      {cards}
    </>
  );
});

export const Map = observer(function Map<C extends AbstractCard>(
  props: Props<C>,
) {
  const zoom = useMapZoom({
    wasDragged: props.wasDragged,
    onMapDrag: props.onMapDrag,
    mapBBox: props.placement.bbox,
    visibleHeight: props.visibleHeight,
  });

  return (
    <svg ref={zoom.ref} className={css.wrapper}>
      <g transform={zoom.transform}>
        <MapElements {...props} />
      </g>
    </svg>
  );
});
