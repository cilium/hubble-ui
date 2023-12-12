import React from 'react';
import { observer } from 'mobx-react';

import { AbstractArrowsRendererProps as AbstractProps } from '~/components/ArrowsRenderer';
import { ServiceMapArrowStrategy } from '~/ui-layer/service-map/coordinates/arrows';
import { MapUtils } from '~/utils/iter-tools/map';

import { ServiceMapArrowBody } from './ServiceMapArrowBody';
import { ServiceMapArrowDuckFeet } from './ServiceMapArrowDuckFeet';

export type Props = Omit<AbstractProps, 'strategy'> & {
  strategy: ServiceMapArrowStrategy;
};

export const ServiceMapArrowsRenderer = observer(function ServiceMapArrowsRenderer(
  props: AbstractProps,
) {
  return props.strategy instanceof ServiceMapArrowStrategy ? (
    <ServiceMapArrows {...props} strategy={props.strategy} />
  ) : null;
});

const ServiceMapArrows = observer(function ServiceMapArrows(props: Props) {
  return (
    <g className="arrows">
      <g className="bodies">
        {MapUtils.new(props.strategy.arrows).map((arrowId, arrow) => {
          return (
            <ServiceMapArrowBody
              key={arrowId}
              arrow={arrow}
              overlay={props.overlay}
              arrowsForeground={props.arrowsForeground}
            />
          );
        })}
      </g>
      <g className="duck-feets">
        {MapUtils.new(props.strategy.combinedAccessPointArrows).map(
          (connectorId, combinedArrows) => {
            return (
              <ServiceMapArrowDuckFeet
                key={connectorId}
                connectorId={connectorId}
                arrows={combinedArrows}
                arrowsForeground={props.arrowsForeground}
                overlay={props.overlay}
              />
            );
          },
        )}
      </g>
    </g>
  );
});
