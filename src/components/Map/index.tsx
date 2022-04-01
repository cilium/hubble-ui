import React, { ReactNode, useCallback } from 'react';
import { observer } from 'mobx-react';
import { computed } from 'mobx';

import { AbstractCard } from '~/domain/cards';
import { XYWH } from '~/domain/geometry';
import { ArrowStrategy, PlacementStrategy } from '~/domain/layout';

import { ArrowsRenderer, ArrowRenderer } from '~/components/ArrowsRenderer';
import { Card as BaseCard, CardComponentProps } from '~/components/Card';
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
  arrowRenderer?: ArrowRenderer;
  cardRenderer: (cardProps: CardComponentProps<C>) => ReactNode;
  isCardActive?: (id: string) => boolean;
  onCardHeightChange?: (id: string, height: number) => void;
  onMapDrag?: (val: boolean) => void;
}

export const MapElements = observer(function MapElements<
  C extends AbstractCard,
>(props: Props<C>) {
  const isCardActive = useCallback(
    (cardId: string): boolean => {
      return props.isCardActive ? props.isCardActive(cardId) : false;
    },
    [props.isCardActive],
  );

  const [backplates, cards, unsizedCards] = computed(() => {
    const backplates: ReactNode[] = [];
    const cards: ReactNode[] = [];
    const unsizedCards: ReactNode[] = [];

    props.cards.forEach(card => {
      const coords = props.placement.cardsBBoxes.get(card.id);
      if (coords == null) {
        const coords = props.placement.defaultCardXYWH();
        unsizedCards.push(props.cardRenderer({ card, coords }));

        return;
      }

      backplates.push(
        <BaseCard
          key={card.id}
          coords={coords}
          active={isCardActive(card.id)}
          isBackplate={true}
        />,
      );

      cards.push(props.cardRenderer({ card, coords }));
    });

    return [backplates, cards, unsizedCards];
  }).get();

  return (
    <>
      {props.namespaceBBox && props.namespace && (
        <NamespaceBackplate
          namespace={props.namespace}
          xywh={props.namespaceBBox.addMargin(sizes.endpointHPadding / 2)}
        />
      )}

      {backplates}
      {props.arrows && props.arrowRenderer && (
        <ArrowsRenderer
          strategy={props.arrows}
          renderer={props.arrowRenderer}
        />
      )}
      {cards}

      <g visibility="hidden">{unsizedCards}</g>
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
