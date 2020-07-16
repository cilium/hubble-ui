import React, { memo, useMemo, createContext, forwardRef } from 'react';
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
import { Filters } from '~/domain/filtering';

export const DEFAULT_TS_UPDATE_DELAY = 2500;
export { TickerEvents, OnFlowsDiffCount };

export interface Props extends CommonProps {
  flows: Flow[];
  selectedFlow: Flow | null;
  onSelectFlow?: (flow: Flow | null) => void;
  onSelectFilters?: (filters: Filters) => void;
  dataFilters?: Filters;
  ticker?: Ticker<TickerEvents>;
  onFlowsDiffCount?: OnFlowsDiffCount;
}

const ItemDataContext = createContext<RowRendererData | null>(null);
ItemDataContext.displayName = 'FlowsTableItemDataContext';

export const FlowsTable = memo<Props>(function FlowsTable(props: Props) {
  const scroll = useScroll(props.onFlowsDiffCount);

  const itemData = useMemo((): RowRendererData => {
    return {
      flows: props.flows,
      isVisibleColumn: props.isVisibleColumn,
      selectedFlow: props.selectedFlow,
      onSelectFlow: props.onSelectFlow,
      ticker: props.ticker,
    };
  }, [
    props.flows,
    props.isVisibleColumn,
    props.selectedFlow,
    props.onSelectFlow,
    props.ticker,
  ]);

  return (
    <div className={css.wrapper}>
      <AutoSizer>
        {({ width, height }) => (
          <ItemDataContext.Provider value={itemData}>
            <FixedSizeList
              {...scroll}
              className={css.table}
              innerElementType={stickyHeaderElement}
              width={width}
              height={height}
              itemSize={sizes.flowsTableRowHeight}
              itemCount={props.flows.length + 1 /* first header row counts */}
              itemKey={itemKey}
              itemData={itemData}
              overscanCount={Math.ceil(height / sizes.flowsTableRowHeight / 2)}
            >
              {RowRenderer}
            </FixedSizeList>
          </ItemDataContext.Provider>
        )}
      </AutoSizer>
    </div>
  );
});

function itemKey(index: number, data: RowRendererData) {
  return index === 0 ? 'header-row' : data.flows[index - 1].id;
}

const stickyHeaderElement = forwardRef<HTMLDivElement>(
  function FlowsTableHeaderWrapper({ children, ...props }, ref) {
    return (
      <ItemDataContext.Consumer>
        {itemData => (
          <div ref={ref} {...props}>
            <Header isVisibleColumn={itemData?.isVisibleColumn} />
            {children}
          </div>
        )}
      </ItemDataContext.Consumer>
    );
  },
);
