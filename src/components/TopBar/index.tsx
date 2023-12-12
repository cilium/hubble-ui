import React from 'react';
import { observer } from 'mobx-react';

import { Verdict } from '~/domain/hubble';
import { FilterEntry } from '~/domain/filtering';
import { Status } from '~/domain/status';
import { DataMode, TransferState } from '~/domain/interactions';
import { NamespaceDescriptor } from '~/domain/namespaces';

import { FlowsFilterInput } from './FlowsFilterInput';
import { VerdictFilterDropdown } from './VerdictFilterDropdown';
import { VisualFiltersDropdown } from './VisualFiltersDropdown';
import { NamespaceSelectorDropdown } from './NamespaceSelectorDropdown';
import { ConnectionIndicator } from './ConnectionIndicator';

import { e2e } from '~e2e/client';
import css from './styles.scss';

export interface Props {
  transferState: TransferState;
  status?: Status;
  namespaces: NamespaceDescriptor[];
  currentNamespace: NamespaceDescriptor | null;
  onNamespaceChange?: (ns: NamespaceDescriptor) => void;
  selectedVerdict: Verdict | null;
  onVerdictChange?: (verdict: Verdict | null) => void;
  selectedHttpStatus: string | null;
  onHttpStatusChange?: (httpStatus: string | null) => void;
  flowFilters: FilterEntry[];
  onChangeFlowFilters?: (filters: FilterEntry[]) => void;
  showHost: boolean;
  onShowHostToggle?: () => void;
  showKubeDns: boolean;
  onShowKubeDnsToggle?: () => void;
  showRemoteNode: boolean;
  onShowRemoteNodeToggle?: () => void;
  showPrometheusApp: boolean;
  onShowPrometheusAppToggle: () => void;
}

export const TopBar = observer(function TopBar(props: Props) {
  const RenderedFilters = (
    <>
      <div className={css.spacer} />
      <div className={css.spacer} />
      <FlowsFilterInput filters={props.flowFilters} onChange={props.onChangeFlowFilters} />
      <div className={css.spacer} />
      <VerdictFilterDropdown verdict={props.selectedVerdict} onSelect={props.onVerdictChange} />
      <div className={css.border} />
      <VisualFiltersDropdown
        showHost={props.showHost}
        onShowHostToggle={props.onShowHostToggle}
        showKubeDns={props.showKubeDns}
        onShowKubeDnsToggle={props.onShowKubeDnsToggle}
        showRemoteNode={props.showRemoteNode}
        onShowRemoteNodeToggle={props.onShowRemoteNodeToggle}
        showPrometheusApp={props.showPrometheusApp}
        onShowPrometheusAppToggle={props.onShowPrometheusAppToggle}
      />
    </>
  );

  return (
    <div className={css.topbar} {...e2e.attributes.topbar.selector()}>
      <div className={css.left}>
        <NamespaceSelectorDropdown
          namespaces={props.namespaces}
          currentNamespace={props.currentNamespace}
          onChange={props.onNamespaceChange}
        />
        {props.currentNamespace && RenderedFilters}
      </div>
      <div className={css.right}>
        <div className={css.spacer} />
        <div className={css.spacer} />

        <ConnectionIndicator transferState={props.transferState} />
      </div>
    </div>
  );
});
