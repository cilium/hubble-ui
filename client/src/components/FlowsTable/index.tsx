import React, { memo } from 'react';

import { Header } from './Header';
import { Body } from './Body';

import { Flow } from '~/domain/flows';
import { CommonProps, TickerEvents } from './general';

import { useScroll } from './hooks/useScroll';

import { Ticker } from '~/utils/ticker';
import css from './styles.scss';

export const DEFAULT_TS_UPDATE_DELAY = 2500;
export { TickerEvents };

export interface Props extends CommonProps {
  flows: Flow[];
  flowsDiffCount: { value: number };
  selectedFlow: Flow | null;
  onSelectFlow?: (flow: Flow | null) => void;
  ticker: Ticker<TickerEvents>;
}

export const FlowsTable = memo<Props>(function FlowsTable(props: Props) {
  const scroll = useScroll<HTMLDivElement>(props.flowsDiffCount);

  return (
    <div {...scroll} className={css.wrapper}>
      <table className={css.table}>
        <Header isVisibleColumn={props.isVisibleColumn} />
        <Body
          flows={props.flows}
          isVisibleColumn={props.isVisibleColumn}
          selectedFlow={props.selectedFlow}
          onSelectFlow={props.onSelectFlow}
          ticker={props.ticker}
        />
      </table>
    </div>
  );
});
