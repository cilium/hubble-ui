import React, { useCallback } from 'react';
import { observer } from 'mobx-react';

import { Icon, Button } from '@blueprintjs/core';

import css from './styles.scss';

export interface Props {
  onExport?: () => void;
}

export const ExportButton = observer(function ExportButton(props: Props) {
  const handleClick = useCallback(() => {
    props.onExport?.();
  }, [props.onExport]);

  return (
    <Button
      minimal
      small
      icon={<Icon icon="export" iconSize={16} />}
      onClick={handleClick}
      title="Export Service Map Connections"
    >
      Export
    </Button>
  );
});
