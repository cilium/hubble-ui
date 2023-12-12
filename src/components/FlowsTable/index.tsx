import useResizeObserver from '@react-hook/resize-observer';
import React, { useMemo, useRef } from 'react';
import { FixedSizeList } from 'react-window';

import { Flow } from '~/domain/flows';
import { sizes } from '~/ui';
import { Ticker } from '~/utils/ticker';

import { CommonProps, TickerEvents } from './general';
import { useScroll, OnFlowsDiffCount } from './hooks/useScroll';
import { Header } from './Header';
import { RowRenderer, RowRendererData } from './Row';

import css from './styles.scss';
import { observer } from 'mobx-react';

export { Column, defaultVisibleColumns } from './general';
export const DEFAULT_TS_UPDATE_DELAY = 2500;
export { TickerEvents, OnFlowsDiffCount };

export interface Props extends CommonProps {
  flows: Flow[];
  selectedFlow: Flow | null;
  onSelectFlow?: (flow: Flow | null) => void;
  onFlowsDiffCount?: OnFlowsDiffCount;
}

export const FlowsTable = observer(function FlowsTable(props: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const wrapperSize = useSize(wrapperRef);

  const scroll = useScroll(props.onFlowsDiffCount);

  const itemData = useMemo((): RowRendererData => {
    return {
      flows: props.flows,
      visibleColumns: props.visibleColumns,
      selectedFlow: props.selectedFlow,
      onSelectFlow: props.onSelectFlow,
    };
  }, [props.flows, props.visibleColumns, props.selectedFlow, props.onSelectFlow]);

  const width = wrapperSize?.width ?? 0;
  const height = wrapperSize ? wrapperSize.height : 0;

  return (
    <div className={css.wrapper} ref={wrapperRef}>
      <Header visibleColumns={itemData.visibleColumns} />
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
    </div>
  );
});

function itemKey(index: number, data: RowRendererData) {
  return data.flows[index].id;
}

const useSize = (target: React.RefObject<HTMLElement>) => {
  const [size, setSize] = React.useState<DOMRect | null>(null);

  React.useLayoutEffect(() => {
    setSize(target.current?.getBoundingClientRect() ?? null);
  }, [target]);

  useResizeObserver(target, entry => setSize(entry.contentRect));

  return size;
};
