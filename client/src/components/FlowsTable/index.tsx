import React, { memo } from 'react';
import { Flow } from '~/domain/flows';
import { FlowsTableColumn } from './constants';
import css from './styles.scss';

export interface FlowsTableProps {
  flows: Array<Flow>;
}

export const FlowsTable = memo<FlowsTableProps>(props => {
  return (
    <div className={css.wrapper}>
      <table className={css.table}>
        <TableHeader />
        <TableBody flows={props.flows} />
      </table>
    </div>
  );
});
FlowsTable.displayName = 'FlowsTable';

const TableHeader: React.FunctionComponent = () => {
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
};
TableHeader.displayName = 'FlowsTableHeader';

interface TableBodyProps {
  flows: Array<Flow>;
}

const TableBody: React.FunctionComponent<TableBodyProps> = props => {
  return (
    <tbody>
      {props.flows.map((flow, flowIdx) => {
        // TODO: replace flowIdx with stable key
        return (
          <tr key={flowIdx}>
            <td>{flow.data.source?.labelsList}</td>
            <td>{flow.data.destination?.labelsList}</td>
            <td>{flow.data.l4?.tcp?.destinationPort}</td>
            <td>{flow.verdictLabel}</td>
            <td>{new Date().toISOString()}</td>
          </tr>
        );
      })}
    </tbody>
  );
};
TableBody.displayName = 'FlowsTableBody';
