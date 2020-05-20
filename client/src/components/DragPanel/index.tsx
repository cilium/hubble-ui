import React, { useMemo, memo, useCallback } from 'react';
import { Button, Spinner, ButtonGroup, Icon } from '@blueprintjs/core';
import { animated } from 'react-spring';
import { useDrag } from 'react-use-gesture';

import { FlowsFilterInput } from '~/components/InputElements/FlowsFilterInput';
import { ForwardingStatusDropdown } from '~/components/InputElements/ForwardingStatusDropdown';
import { HttpStatusCodeDropdown } from '~/components/InputElements/HttpStatusCodeDropdown';

import { FlowsFilterEntry } from '~/domain/flows';
import { Verdict } from '~/domain/hubble';

import css from './styles.scss';

export interface DragPanelBaseProps {
  selectedVerdict: Verdict | null;
  onSelectVerdict: (verdict: Verdict | null) => void;
  selectedHttpStatus: string | null;
  onSelectHttpStatus: (httpStatus: string | null) => void;
  flowFilters: FlowsFilterEntry[];
  onChangeFlowFilters: (filters: FlowsFilterEntry[]) => void;
}

export interface Props extends DragPanelBaseProps {
  onResize?: (dy: number) => void;
  onStreamStop?: () => void;
}

export const Component = function DragPanelComponent(props: Props) {
  // XXX: this thing cannot be used inside useMemo ???
  const bind = useDrag(e => {
    const dy = e.delta[1];

    props.onResize && props.onResize(dy);
  });

  const onStreamStop = useCallback(() => {
    if (!props.onStreamStop) return;

    props.onStreamStop();
  }, [props.onStreamStop]);

  return (
    <animated.div {...bind()} className={css.dragPanel}>
      <div className={css.left}>
        <FlowsFilterInput
          filters={props.flowFilters}
          onChange={props.onChangeFlowFilters}
        />
      </div>
      <div className={css.center}>
        <ButtonGroup>
          <Button small active rightIcon={<Spinner size={16} />}>
            Flows streaming
          </Button>

          <Button
            small
            rightIcon={<Icon icon="cross" />}
            onClick={onStreamStop}
          ></Button>
        </ButtonGroup>
      </div>
      <div className={css.right}>
        <ForwardingStatusDropdown
          verdict={props.selectedVerdict}
          onSelect={props.onSelectVerdict}
        />
        <HttpStatusCodeDropdown
          httpStatus={props.selectedHttpStatus}
          onSelect={props.onSelectHttpStatus}
        />
      </div>
    </animated.div>
  );
};

export const DragPanel = memo<Props>(Component);
DragPanel.displayName = 'DragPanelMemoized';
