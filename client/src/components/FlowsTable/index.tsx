import { Spinner } from '@blueprintjs/core';
import React, { memo } from 'react';
import { Flow } from '~/domain/flows';
import { FlowsTableColumn } from './constants';
import { useFlows } from './hooks/useFlows';
import { useFlowTimestamp } from './hooks/useFlowTimestamp';
import css from './styles.scss';

export const FlowsTable = memo<{ flows: Flow[] }>(props => {
  const { ref, flows } = useFlows<HTMLDivElement>(props.flows);

  return (
    <div ref={ref} className={css.wrapper}>
      <table className={css.table}>
        <TableHeader />
        <TableBody flows={flows} />
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

const Row = memo<{ flow: Flow }>(({ flow }) => {
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

  return (
    <tr>
      <td>{sourceTitle}</td>
      <td>{destinationTitle}</td>
      <td>{flow.destinationPort}</td>
      <td>{flow.verdictLabel}</td>
      <td title={flow.isoTimestamp || undefined}>{timestamp}</td>
    </tr>
  );
});
Row.displayName = 'FlowsTableRow';

const LoadingRow: React.FunctionComponent = () => {
  return (
    <tr className={css.loadingRow}>
      <th colSpan={5}>
        <div className={css.loadingLabel}>
          Streaming flows <Spinner size={12} />
        </div>
      </th>
    </tr>
  );
};
LoadingRow.displayName = 'FlowsTableLoadingRow';
