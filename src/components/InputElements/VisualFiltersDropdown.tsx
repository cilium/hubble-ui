import {
  Button,
  Intent,
  Menu,
  MenuItem,
  Popover,
  Checkbox,
} from '@blueprintjs/core';
import React, { memo } from 'react';

import { usePopover } from '~/ui/hooks/usePopover';

interface Props {
  showHost: boolean;
  onShowHostToggle?: () => void;
  showKubeDns: boolean;
  onShowKubeDnsToggle?: () => void;
  showRemoteNode: boolean;
  onShowRemoteNodeToggle?: () => void;
  showPrometheusApp: boolean;
  onShowPrometheusAppToggle?: () => void;
}

export const VisualFiltersDropdown = memo<Props>(function VisualFiltersDropdown(
  props,
) {
  const popover = usePopover();
  const enabled =
    !props.showHost ||
    !props.showKubeDns ||
    !props.showRemoteNode ||
    !props.showPrometheusApp;

  const content = (
    <Menu>
      <MenuItem
        shouldDismissPopover={false}
        text={
          <Checkbox
            checked={!props.showHost}
            label="Hide host service"
            onChange={props.onShowHostToggle}
          />
        }
      />
      <MenuItem
        shouldDismissPopover={false}
        text={
          <Checkbox
            checked={!props.showKubeDns}
            label="Hide kube-dns:53 pod"
            onChange={props.onShowKubeDnsToggle}
          />
        }
      />
      <MenuItem
        shouldDismissPopover={false}
        text={
          <Checkbox
            checked={!props.showRemoteNode}
            label="Hide remote node"
            onChange={props.onShowRemoteNodeToggle}
          />
        }
      />
      <MenuItem
        shouldDismissPopover={false}
        text={
          <Checkbox
            checked={!props.showPrometheusApp}
            label="Hide prometheus app"
            onChange={props.onShowPrometheusAppToggle}
          />
        }
      />
    </Menu>
  );

  return (
    <Popover {...popover.props} content={content}>
      <Button
        minimal
        text="Visual"
        intent={enabled ? Intent.PRIMARY : Intent.NONE}
        rightIcon="chevron-down"
        onClick={popover.toggle}
      />
    </Popover>
  );
});
