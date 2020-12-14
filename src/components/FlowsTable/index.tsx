import React, { memo, useMemo } from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
import { FixedSizeList } from 'react-window';

import { Flow } from '~/domain/flows';
import { sizes } from '~/ui';
import { Ticker } from '~/utils/ticker';

import { CommonProps, TickerEvents } from './general';
import { useScroll, OnFlowsDiffCount } from './hooks/useScroll';
import { Header } from './Header';
import { RowRenderer, RowRendererData } from './Row';

import css from './styles.scss';

export { Column, defaultVisibleColumns } from './general';
export const DEFAULT_TS_UPDATE_DELAY = 2500;
export { TickerEvents, OnFlowsDiffCount };

export interface Props extends CommonProps {
  flows: Flow[];
  selectedFlow: Flow | null;
  onSelectFlow?: (flow: Flow | null) => void;
  ticker?: Ticker<TickerEvents>;
  onFlowsDiffCount?: OnFlowsDiffCount;
}

export const FlowsTable = memo<Props>(function FlowsTable(props: Props) {
  const scroll = useScroll(props.onFlowsDiffCount);

  const itemData = useMemo((): RowRendererData => {
    return {
      flows: props.flows,
      visibleColumns: props.visibleColumns,
      selectedFlow: props.selectedFlow,
      onSelectFlow: props.onSelectFlow,
      ticker: props.ticker,
    };
  }, [
    props.flows,
    props.visibleColumns,
    props.selectedFlow,
    props.onSelectFlow,
    props.ticker,
  ]);

  return (
    <div className={css.wrapper}>
      <Header visibleColumns={itemData.visibleColumns} />
      <AutoSizer>
        {({ width, height }) => (
          <FixedSizeList
            {...scroll}
            className={css.table}
            width={width}
            height={height - sizes.flowsTableHeadHeight}
            itemSize={sizes.flowsTableRowHeight}
            itemCount={props.flows.length}
            itemKey={itemKey}
            itemData={itemData}
            overscanCount={Math.ceil(height / sizes.flowsTableRowHeight / 2)}
          >
            {RowRenderer}
          </FixedSizeList>
        )}
      </AutoSizer>
    </div>
  );
});

function itemKey(index: number, data: RowRendererData) {
  return data.flows[index].id;
}
