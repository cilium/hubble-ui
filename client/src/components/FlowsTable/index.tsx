import React, { FunctionComponent, memo, useCallback } from 'react';
import classnames from 'classnames';
import { observer } from 'mobx-react';

import { useFlowTimestamp } from './hooks/useFlowTimestamp';
import { useScroll } from './hooks/useScroll';

import { FlowsTableColumn } from './constants';
import { Flow } from '~/domain/flows';
import { useStore } from '~/store';

import css from './styles.scss';

export const DEFAULT_TS_UPDATE_DELAY = 2500;

export interface Props {
  flows: Flow[];
  flowsDiffCount: { value: number };
  tsUpdateDelay?: number;
}

export const FlowsTable = memo<Props>(function FlowsTable(props: Props) {
  const scroll = useScroll<HTMLDivElement>(props.flowsDiffCount);
  const tsUpdateDelay = props.tsUpdateDelay ?? DEFAULT_TS_UPDATE_DELAY;

  return (
    <div {...scroll} className={css.wrapper}>
      <table className={css.table}>
        <TableHeader />
        <TableBody flows={props.flows} tsUpdateDelay={tsUpdateDelay} />
      </table>
    </div>
  );
});
FlowsTable.displayName = 'FlowsTable';

const TableHeader = memo(function TableHeader() {
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
TableHeader.displayName = 'FlowsTableHeader';

export interface BodyProps {
  flows: Flow[];
  tsUpdateDelay: number;
}

const TableBody = memo<BodyProps>(function FlowsTableBody(props) {
  return (
    <tbody>
      {props.flows.map(flow => (
        <Row key={flow.id} flow={flow} tsUpdateDelay={props.tsUpdateDelay} />
      ))}
    </tbody>
  );
});
TableBody.displayName = 'FlowsTableBody';

export interface RowProps {
  flow: Flow;
  tsUpdateDelay: number;
}

const Row: FunctionComponent<RowProps> = observer(function FlowsTableRow({
  flow,
  tsUpdateDelay,
}) {
  const ts = flow.millisecondsTimestamp;
  const store = useStore();

  const onClick = useCallback(() => store.selectTableFlow(flow), []);
  const timestamp = useFlowTimestamp(ts, tsUpdateDelay);

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

  const className = classnames({
    [css.selected]: flow === store.selectedTableFlow,
  });

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
Row.displayName = 'FlowsTableRow';
