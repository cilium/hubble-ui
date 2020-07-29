import React, { memo, useCallback } from 'react';
import { ListChildComponentProps, areEqual } from 'react-window';
import classnames from 'classnames';

import { Flow } from '~/domain/flows';
import { Ticker } from '~/utils/ticker';

import { CommonProps, TickerEvents, FlowsTableColumn } from './general';
import { Cell } from './Cell';

import css from './styles.scss';

export interface RowProps extends CommonProps {
  flow: Flow;
  isSelected: boolean;
  onSelect?: (flow: Flow | null) => void;
  ticker?: Ticker<TickerEvents>;
  style?: React.CSSProperties;
}

export interface RowRendererData {
  flows: Flow[];
  selectedFlow: Flow | null;
  isVisibleColumn: CommonProps['isVisibleColumn'];
  onSelectFlow?: RowProps['onSelect'];
  ticker?: RowProps['ticker'];
}

export function RowRenderer({ index, style, data }: ListChildComponentProps) {
  if (index === 0) return null;
  const props = data as RowRendererData;
  const flowIndex = index - 1; // header row is first row, so -1
  const flow = props.flows[flowIndex];
  return (
    <Row
      style={style}
      flow={flow}
      isVisibleColumn={props.isVisibleColumn}
      isSelected={props.selectedFlow?.id === flow.id}
      onSelect={props.onSelectFlow}
      ticker={props.ticker}
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
      {props.isVisibleColumn?.('SrcPod') && (
        <Cell flow={props.flow} kind={FlowsTableColumn.SrcPod} />
      )}
      {props.isVisibleColumn?.('SrcIp') && (
        <Cell flow={props.flow} kind={FlowsTableColumn.SrcIp} />
      )}
      {props.isVisibleColumn?.('SrcService') && (
        <Cell flow={props.flow} kind={FlowsTableColumn.SrcService} />
      )}
      {props.isVisibleColumn?.('DstPod') && (
        <Cell flow={props.flow} kind={FlowsTableColumn.DstPod} />
      )}
      {props.isVisibleColumn?.('DstIp') && (
        <Cell flow={props.flow} kind={FlowsTableColumn.DstIp} />
      )}
      {props.isVisibleColumn?.('DstService') && (
        <Cell flow={props.flow} kind={FlowsTableColumn.DstService} />
      )}
      {props.isVisibleColumn?.('DstPort') && (
        <Cell flow={props.flow} kind={FlowsTableColumn.DstPort} />
      )}
      {props.isVisibleColumn?.('Verdict') && (
        <Cell flow={props.flow} kind={FlowsTableColumn.Verdict} />
      )}
      {props.isVisibleColumn?.('TcpFlags') && (
        <Cell flow={props.flow} kind={FlowsTableColumn.TcpFlags} />
      )}
      {props.isVisibleColumn?.('Timestamp') && (
        <Cell
          flow={props.flow}
          kind={FlowsTableColumn.Timestamp}
          ticker={props.ticker}
        />
      )}
    </div>
  );
}, areEqual);
