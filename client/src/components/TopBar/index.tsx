import React, { memo } from 'react';
import { NamespaceDropdown } from './NamespaceDropdown';

import css from './styles.scss';

export interface BarProps {
  namespaces: Array<string>;
  currentNsIdx: number;
  onNsChange?: (ns: string) => void;
}

export const TopBar = memo<BarProps>(props => {
  return (
    <div className={css.topbar}>
      <div className={css.left}>
        <NamespaceDropdown
          namespaces={props.namespaces}
          currentIdx={props.currentNsIdx}
          onChange={props.onNsChange}
        />
      </div>

      <div className={css.right}></div>
    </div>
  );
});

TopBar.displayName = 'TopBar';
