import { Checkbox, Menu, MenuItem, Popover } from '@blueprintjs/core';
import React from 'react';
import classnames from 'classnames';

import { usePopover } from '~/ui/hooks/usePopover';

import { VisualFiltersIcon } from '~/components/Icons/VisualFiltersIcon';
import { FilterIcon } from './FilterIcon';

import css from './styles.scss';
import { observer } from 'mobx-react';

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

export const VisualFiltersDropdown = observer(function VisualFiltersDropdown(props: Props) {
  const popover = usePopover();
  const enabled =
    !props.showHost || !props.showKubeDns || !props.showRemoteNode || !props.showPrometheusApp;

  const content = (
    <Menu className={css.visualFiltersMenu}>
      <MenuItem
        shouldDismissPopover={false}
        text={
          <Checkbox
            checked={!props.showHost}
            label="Hide host service"
            onClick={props.onShowHostToggle}
            className={css.checkbox}
          />
        }
      />
      <MenuItem
        shouldDismissPopover={false}
        text={
          <Checkbox
            checked={!props.showKubeDns}
            label="Hide kube-dns:53 pod"
            onClick={props.onShowKubeDnsToggle}
            className={css.checkbox}
          />
        }
      />
      <MenuItem
        shouldDismissPopover={false}
        text={
          <Checkbox
            checked={!props.showRemoteNode}
            label="Hide remote node"
            onClick={props.onShowRemoteNodeToggle}
            className={css.checkbox}
          />
        }
      />
      <MenuItem
        shouldDismissPopover={false}
        text={
          <Checkbox
            checked={!props.showPrometheusApp}
            label="Hide prometheus app"
            onClick={props.onShowPrometheusAppToggle}
            className={css.checkbox}
          />
        }
      />
    </Menu>
  );

  return (
    <Popover {...popover.props} content={content}>
      <FilterIcon
        icon={<VisualFiltersIcon />}
        text="Visual"
        onClick={popover.toggle}
        className={classnames({
          [css.visualFilterEnabled]: enabled,
        })}
      />
    </Popover>
  );
});
