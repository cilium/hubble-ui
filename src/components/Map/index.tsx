import React, { ReactNode, useRef } from 'react';
import { observer } from 'mobx-react';
import { computed } from 'mobx';

import { AbstractCard } from '~/domain/cards';
import { XYWH } from '~/domain/geometry';

import { ArrowsRenderer, AbstractArrowsRenderer, ArrowRenderer } from '~/components/ArrowsRenderer';
import { CardProps } from '~/components/Card';
import { NamespaceBackplate } from './NamespaceBackplate';

import { useMapZoom } from './hooks/useMapZoom';
import { useMutationObserver } from '~/ui/hooks/useMutationObserver';
import { ArrowStrategy, PlacementStrategy } from '~/ui/layout';

import * as e2e from '~e2e/client';

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
  arrowsRenderer?: AbstractArrowsRenderer;
  arrowRenderer?: ArrowRenderer;
  cardRenderer: (cardProps: CardProps<C>) => ReactNode;
  onMapDrag?: (val: boolean) => void;
  onCardMutated?: (muts: MutationRecord[]) => void;
}

export const MapElements = observer(function MapElements<C extends AbstractCard>(props: Props<C>) {
  const underlayRef = useRef<SVGGElement | null>(null);
  const overlayRef = useRef<SVGGElement | null>(null);
  const cardsRef = useRef<SVGGElement | null>(null);
  const backgroundsRef = useRef<SVGGElement | null>(null);
  const arrowsForegroundRef = useRef<SVGGElement | null>(null);

  const [cards, unsizedCards] = computed(() => {
    const cards: ReactNode[] = [];
    const unsizedCards: ReactNode[] = [];

    props.cards.forEach(card => {
      const coords = props.placement.cardsBBoxes.get(card.id);
      if (coords == null) {
        unsizedCards.push(
          props.cardRenderer({
            card,
            coords: props.placement.defaultCardXYWH(),
            isUnsizedMode: true,
            overlayRef,
            underlayRef,
            backgroundsRef,
          }),
        );

        return;
      }

      cards.push(
        props.cardRenderer({
          card,
          coords,
          className: 'map-card',
          overlayRef,
          underlayRef,
          backgroundsRef,
        }),
      );
    });

    return [cards, unsizedCards];
  }).get();

  // NOTE: We use only one mutation observer to watch over cards changes and
  // react on that with arrows rebuilding in the end
  useMutationObserver({ ref: cardsRef, options: { all: true } }, muts => {
    props.onCardMutated?.(muts);
  });

  return (
    <>
      {props.namespaceBBox && props.namespace && (
        <NamespaceBackplate
          namespace={props.namespace}
          xywh={props.namespaceBBox.addMargin(sizes.namespaceBackplatePadding)}
        />
      )}

      <g className="underlay" ref={underlayRef}></g>
      {props.arrows &&
        (props.arrowsRenderer != null ? (
          <props.arrowsRenderer
            strategy={props.arrows}
            overlay={overlayRef}
            arrowsForeground={arrowsForegroundRef}
          />
        ) : props.arrowRenderer != null ? (
          <ArrowsRenderer
            strategy={props.arrows}
            renderer={props.arrowRenderer}
            overlay={overlayRef}
            arrowsForeground={arrowsForegroundRef}
          />
        ) : null)}

      <g className="backgrounds" ref={backgroundsRef}></g>
      <g className="arrows-foreground" ref={arrowsForegroundRef}></g>
      <g ref={cardsRef} className="visible-cards" {...e2e.attributes.card.visibleContainer()}>
        {cards}
      </g>

      <g className="overlay" ref={overlayRef}></g>
      <g visibility="hidden">{unsizedCards}</g>
    </>
  );
});

export const Map = observer(function Map<C extends AbstractCard>(props: Props<C>) {
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
