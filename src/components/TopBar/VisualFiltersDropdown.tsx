import { Checkbox, Menu, MenuItem, Popover } from '@blueprintjs/core';
import React, { memo } from 'react';
import classnames from 'classnames';

import { usePopover } from '~/ui/hooks/usePopover';

import VisualIcon from '~/assets/icons/visual-icon.svg';
import { FilterIcon } from './FilterIcon';

import css from './styles.scss';

interface Props {
  showHost: boolean;
  onShowHostToggle?: () => void;
  showKubeDns: boolean;
  onShowKubeDnsToggle?: () => void;
  showRemoteNode: boolean;
  onShowRemoteNodeToggle?: () => void;
  showPrometheusApp: boolean;
  onShowPrometheusAppToggle?: () => void;
  showKubeApiServer: boolean;
  onShowKubeApiServerToggle?: () => void;
}

export const VisualFiltersDropdown = memo<Props>(function VisualFiltersDropdown(
  props,
) {
  const popover = usePopover();
  const enabled =
    !props.showHost ||
    !props.showKubeDns ||
    !props.showRemoteNode ||
    !props.showPrometheusApp ||
    !props.showKubeApiServer;

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
            checked={!props.showKubeApiServer}
            label="Hide kube-apiserver"
            onChange={props.onShowKubeApiServerToggle}
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
      <FilterIcon
        icon={<VisualIcon />}
        text="Visual"
        onClick={popover.toggle}
        className={classnames({
          [css.visualFilterEnabled]: enabled,
        })}
      />
    </Popover>
  );
});
