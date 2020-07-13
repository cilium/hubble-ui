import React, { memo } from 'react';

import { FlowsFilterInput } from '~/components/InputElements/FlowsFilterInput';
import { ForwardingStatusDropdown } from '~/components/InputElements/ForwardingStatusDropdown';
import { HttpStatusCodeDropdown } from '~/components/InputElements/HttpStatusCodeDropdown';
import { VisualFiltersDropdown } from '~/components/InputElements/VisualFiltersDropdown';
import { NamespaceDropdown } from './NamespaceDropdown';
import { StreamingIndicator } from './StreamingIndicator';

import { Verdict } from '~/domain/hubble';
import { FlowsFilterEntry } from '~/domain/flows';

import css from './styles.scss';

export interface Props {
  isStreaming: boolean;
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
}

export const TopBar = memo<Props>(function TopBar(props) {
  const RenderedFilters = (
    <>
      <div className={css.border} />
      <FlowsFilterInput
        filters={props.flowFilters}
        onChange={props.onChangeFlowFilters}
      />
      <div className={css.spacer} />
      <ForwardingStatusDropdown
        verdict={props.selectedVerdict}
        onSelect={props.onVerdictChange}
      />
      <div className={css.spacer} />
      <HttpStatusCodeDropdown
        httpStatus={props.selectedHttpStatus}
        onSelect={props.onHttpStatusChange}
      />
      <div className={css.spacer} />
      <VisualFiltersDropdown
        showHost={props.showHost}
        onShowHostToggle={props.onShowHostToggle}
        showKubeDns={props.showKubeDns}
        onShowKubeDnsToggle={props.onShowKubeDnsToggle}
      />
    </>
  );

  return (
    <div className={css.topbar}>
      <div className={css.left}>
        <NamespaceDropdown
          namespaces={props.namespaces}
          currentNamespace={props.currentNamespace}
          onChange={props.onNamespaceChange}
        />
        {props.currentNamespace && RenderedFilters}
      </div>
      <div className={css.right}>
        <div className={css.spacer} />
        <StreamingIndicator isStreaming={props.isStreaming} />
      </div>
    </div>
  );
});
