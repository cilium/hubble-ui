import React, { memo } from 'react';
import classnames from 'classnames';
import { Icon } from '@blueprintjs/core';

import { FilterDirection } from '~/domain/filtering';

import css from './FlowsFilterInput.scss';

export interface TagDirectionProps {
  direction: FilterDirection;
}

export const TagDirection = memo<TagDirectionProps>(function TagDirection(props) {
  const dir = props.direction;
  const className = classnames(css.direction, {
    [css.from]: dir === FilterDirection.From,
    [css.to]: dir === FilterDirection.To,
    [css.both]: dir === FilterDirection.Either,
  });

  const fromIsShown = [FilterDirection.From, FilterDirection.Either].includes(dir);
  const toIsShown = [FilterDirection.To, FilterDirection.Either].includes(dir);

  const iconName = dir === FilterDirection.Either ? 'arrows-horizontal' : 'arrow-right';

  return (
    <span className={className}>
      {fromIsShown && <span className={classnames(css.label, css.from)}>from</span>}

      <span className={css.icon}>
        <Icon icon={iconName} iconSize={9} />
      </span>

      {toIsShown && <span className={classnames(css.label, css.to)}>to</span>}
    </span>
  );
});
