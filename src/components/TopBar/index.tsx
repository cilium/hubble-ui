import React, { memo } from 'react';

import { Verdict } from '~/domain/hubble';
import { FlowsFilterEntry } from '~/domain/flows';

import { FlowsFilterInput } from './FlowsFilterInput';
import { VerdictFilterDropdown } from './VerdictFilterDropdown';
import { VisualFiltersDropdown } from './VisualFiltersDropdown';
import { NamespaceSelectorDropdown } from './NamespaceSelectorDropdown';
import { ConnectionIndicator, ConnectionState } from './ConnectionIndicator';

import css from './styles.scss';

export { ConnectionState };

export interface Props {
  connectionState: ConnectionState;
  namespaces: Array<string>;
  currentNamespace: string | null;
  onNamespaceChange?: (ns: string) => void;
  selectedVerdict: Verdict | null;
  onVerdictChange?: (verdict: Verdict | null) => void;
  selectedHttpStatus: string | null;
  onHttpStatusChange?: (httpStatus: string | null) => void;
  flowFilters: FlowsFilterEntry[];
  onChangeFlowFilters?: (filters: FlowsFilterEntry[]) => void;
  showHost: boolean;
  onShowHostToggle?: () => void;
  showKubeDns: boolean;
  onShowKubeDnsToggle?: () => void;
  showRemoteNode: boolean;
  onShowRemoteNodeToggle?: () => void;
  showPrometheusApp: boolean;
  onShowPrometheusAppToggle: () => void;
}

export const TopBar = memo<Props>(function TopBar(props) {
  const RenderedFilters = (
    <>
      <div className={css.spacer} />
      <div className={css.spacer} />
      <FlowsFilterInput
        filters={props.flowFilters}
        onChange={props.onChangeFlowFilters}
      />
      <div className={css.spacer} />
      <VerdictFilterDropdown
        verdict={props.selectedVerdict}
        onSelect={props.onVerdictChange}
      />
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
    <div className={css.topbar}>
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
        <ConnectionIndicator state={props.connectionState} />
      </div>
    </div>
  );
});
