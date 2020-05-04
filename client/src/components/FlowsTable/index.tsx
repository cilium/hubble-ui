import classnames from 'classnames';
import { observer } from 'mobx-react';
import React, { FunctionComponent, memo, useCallback } from 'react';
import { Flow } from '~/domain/flows';
import { useStore } from '~/store';
import { FlowsTableColumn } from './constants';
import { useFlowTimestamp } from './hooks/useFlowTimestamp';
import { useScroll } from './hooks/useScroll';
import css from './styles.scss';

export interface Props {
  flows: Flow[];
  flowsDiffCount: { value: number };
}

export const FlowsTable = memo<Props>(props => {
  const scroll = useScroll<HTMLDivElement>(props.flowsDiffCount);
  return (
    <div {...scroll} className={css.wrapper}>
      <table className={css.table}>
        <TableHeader />
        <TableBody flows={props.flows} />
      </table>
    </div>
  );
});
FlowsTable.displayName = 'FlowsTable';

const TableHeader = memo(() => {
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

const TableBody = memo<{ flows: Flow[] }>(props => {
  return (
    <tbody>
      {props.flows.map(flow => (
        <Row key={flow.id} flow={flow} />
      ))}
    </tbody>
  );
});
TableBody.displayName = 'FlowsTableBody';

const Row: FunctionComponent<{ flow: Flow }> = observer(({ flow }) => {
  const store = useStore();

  const onClick = useCallback(() => store.selectTableFlow(flow), []);
  const timestamp = useFlowTimestamp(flow.millisecondsTimestamp);

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
