import React, { memo } from 'react';
import classnames from 'classnames';

import css from './styles.scss';

export interface Props {
  icon?: JSX.Element | string;
  text?: string;
  className?: string;
  onClick?: () => void;
}

export const FilterIcon = memo<Props>(function FilterIcon(props) {
  const text = props.text;
  const icon = typeof props.icon === 'string' ? <img src={props.icon} /> : props.icon;

  const className = classnames(css.icon, props.className, {
    [css.clickable]: !!props.onClick,
  });

  return (
    <div className={className} onClick={props.onClick}>
      {icon && <div className={css.image}>{icon}</div>}
      {text && <div className={css.text}>{text}</div>}
    </div>
  );
});
