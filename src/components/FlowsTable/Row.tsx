import React, { memo, useCallback } from 'react';
import { ListChildComponentProps, areEqual } from 'react-window';
import classnames from 'classnames';

import { Flow } from '~/domain/flows';

import { CommonProps, Column } from './general';
import { Cell } from './Cell';

import css from './styles.scss';

export interface RowProps extends CommonProps {
  flow: Flow;
  isSelected: boolean;
  onSelect?: (flow: Flow | null) => void;
  style?: React.CSSProperties;
}

export interface RowRendererData {
  flows: Flow[];
  selectedFlow: Flow | null;
  visibleColumns: CommonProps['visibleColumns'];
  onSelectFlow?: RowProps['onSelect'];
}

export function RowRenderer({ index, style, data }: ListChildComponentProps) {
  const props = data as RowRendererData;
  const flow = props.flows[index];
  return (
    <Row
      style={style}
      flow={flow}
      visibleColumns={props.visibleColumns}
      isSelected={props.selectedFlow?.id === flow.id}
      onSelect={props.onSelectFlow}
    />
  );
}

export const Row = memo<RowProps>(function FlowsTableRow(props) {
  const onClick = useCallback(
    () => props.onSelect?.(props.isSelected ? null : props.flow),
    [props.onSelect, props.isSelected, props.flow],
  );

  const className = classnames(css.row, {
    [css.selected]: props.isSelected,
  });

  return (
    <div className={className} style={props.style} onClick={onClick}>
      {props.visibleColumns.has(Column.SrcPod) && <Cell flow={props.flow} kind={Column.SrcPod} />}
      {props.visibleColumns.has(Column.SrcIp) && <Cell flow={props.flow} kind={Column.SrcIp} />}
      {props.visibleColumns.has(Column.SrcService) && (
        <Cell flow={props.flow} kind={Column.SrcService} />
      )}
      {props.visibleColumns.has(Column.DstPod) && <Cell flow={props.flow} kind={Column.DstPod} />}
      {props.visibleColumns.has(Column.DstIp) && <Cell flow={props.flow} kind={Column.DstIp} />}
      {props.visibleColumns.has(Column.DstService) && (
        <Cell flow={props.flow} kind={Column.DstService} />
      )}
      {props.visibleColumns.has(Column.DstPort) && <Cell flow={props.flow} kind={Column.DstPort} />}
      {props.visibleColumns.has(Column.L7Info) && <Cell flow={props.flow} kind={Column.L7Info} />}
      {props.visibleColumns.has(Column.Verdict) && <Cell flow={props.flow} kind={Column.Verdict} />}
      {props.visibleColumns.has(Column.Auth) && <Cell flow={props.flow} kind={Column.Auth} />}
      {props.visibleColumns.has(Column.TcpFlags) && (
        <Cell flow={props.flow} kind={Column.TcpFlags} />
      )}
      {props.visibleColumns.has(Column.Timestamp) && (
        <Cell flow={props.flow} kind={Column.Timestamp} />
      )}
    </div>
  );
}, areEqual);
