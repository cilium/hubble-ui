import classnames from 'classnames';
import React, { memo } from 'react';

import { ServiceCard } from '~/domain/service-map';

import { EndpointLogo } from './EndpointLogo';

import css from './styles.scss';
import { getTestAttributes } from '~/testing/helpers';

export enum E2E {
  cardHeaderTestSelector = 'card-header',
  cardIdTestSelector = 'card-id',
}

export interface Props {
  card: ServiceCard;
  currentNamespace?: string | null;
  onHeadlineClick?: () => void;
}

export const EndpointCardHeader = memo(function EndpointCardHeader(props: Props) {
  const { card, currentNamespace } = props;
  const showNamespace = !!card.namespace && card.namespace !== currentNamespace;

  const titleClassName = classnames(css.title, {
    [css.single]: !showNamespace,
  });

  return (
    <div
      className={css.wrapper}
      {...getTestAttributes({
        [E2E.cardHeaderTestSelector]: card.caption,
        [E2E.cardIdTestSelector]: card.id,
      })}
    >
      <div className={css.headline} onClick={props.onHeadlineClick}>
        <EndpointLogo card={card} />

        <div className={css.headings}>
          <div className={titleClassName}>{card.caption}</div>
          {showNamespace && <div className={css.subtitle}>{card.namespace}</div>}
        </div>
      </div>
    </div>
  );
});
