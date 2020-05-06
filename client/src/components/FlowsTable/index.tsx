import classnames from 'classnames';
import React, { memo, useCallback } from 'react';
import { Flow } from '~/domain/flows';
import { FlowsTableColumn } from './constants';
import { useFlowTimestamp } from './hooks/useFlowTimestamp';
import { useScroll } from './hooks/useScroll';
import css from './styles.scss';

export const DEFAULT_TS_UPDATE_DELAY = 2500;

export interface Props {
  flows: Flow[];
  flowsDiffCount: { value: number };
  selectedFlow: Flow | null;
  onSelectFlow: (flow: Flow) => void;
  tsUpdateDelay?: number;
}

export const FlowsTable = memo<Props>(function FlowsTable(props: Props) {
  const scroll = useScroll<HTMLDivElement>(props.flowsDiffCount);
  const tsUpdateDelay = props.tsUpdateDelay ?? DEFAULT_TS_UPDATE_DELAY;

  return (
    <div {...scroll} className={css.wrapper}>
      <table className={css.table}>
        <Header />
        <Body
          flows={props.flows}
          selectedFlow={props.selectedFlow}
          onSelectFlow={props.onSelectFlow}
          tsUpdateDelay={tsUpdateDelay}
        />
      </table>
    </div>
  );
});

const Header = memo(function FlowsTableHeader() {
  return (
    <thead>
      <tr>
        <th>{FlowsTableColumn.SOURCE_SERVICE}</th>
        <th>{FlowsTableColumn.DESTINATION_SERVICE}</th>
        <th>{FlowsTableColumn.DESTINATION_PORT}</th>
        <th>{FlowsTableColumn.VERDICT}</th>
        <th>{FlowsTableColumn.TIMESTAMP}</th>
      </tr>
    </thead>
  );
});

export interface BodyProps {
  flows: Flow[];
  selectedFlow: Flow | null;
  onSelectFlow: (flow: Flow) => void;
  tsUpdateDelay: number;
}

const Body = memo<BodyProps>(function FlowsTableBody(props) {
  return (
    <tbody>
      {props.flows.map(flow => (
        <Row
          key={flow.id}
          flow={flow}
          selected={props.selectedFlow?.id === flow.id}
          onSelect={props.onSelectFlow}
          tsUpdateDelay={props.tsUpdateDelay}
        />
      ))}
    </tbody>
  );
});

export interface RowProps {
  flow: Flow;
  selected: boolean;
  onSelect: (flow: Flow) => void;
  tsUpdateDelay: number;
}

const Row = memo<RowProps>(function FlowsTableRow(props) {
  const { flow } = props;

  const ts = flow.millisecondsTimestamp;

  const onClick = useCallback(() => props.onSelect(flow), []);
  const timestamp = useFlowTimestamp(ts, props.tsUpdateDelay);

  const sourceAppName = flow.sourceAppName ?? 'No app name';
  const destinationAppName = flow.destinationAppName ?? 'No app name';

  const sourceNamespace = flow.sourceNamespace ? (
    <i>{flow.sourceNamespace}</i>
  ) : (
    ''
  );
  const destinationNamespace = flow.destinationNamespace ? (
    <i>{flow.destinationNamespace}</i>
  ) : (
    ''
  );

  // prettier-ignore
  const sourceTitle = <>{sourceAppName} {sourceNamespace}</>;
  // prettier-ignore
  const destinationTitle = <>{destinationAppName} {destinationNamespace}</>;

  const className = classnames({ [css.selected]: props.selected });

  return (
    <tr className={className} onClick={onClick}>
      <td>{sourceTitle}</td>
      <td>{destinationTitle}</td>
      <td>{flow.destinationPort}</td>
      <td>{flow.verdictLabel}</td>
      <td title={flow.isoTimestamp || undefined}>{timestamp}</td>
    </tr>
  );
});
