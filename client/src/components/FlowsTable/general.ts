export interface CommonProps {
  isVisibleColumn: (column: FlowsTableColumnKey) => boolean;
}

export enum FlowsTableColumn {
  SrcPod = 'Source Pod',
  SrcIp = 'Source IP',
  SrcService = 'Source Service',
  DstPod = 'Destination Pod',
  DstIp = 'Destination IP',
  DstService = 'Destination Service',
  DstPort = 'Destination Port',
  Verdict = 'Verdict',
  Timestamp = 'Timestamp',
}

export type FlowsTableColumnKey = keyof typeof FlowsTableColumn;

export const FLOWS_TABLE_COLUMNS = Object.keys(
  FlowsTableColumn,
) as FlowsTableColumnKey[];

export const DEFAULT_FLOWS_TABLE_VISIBLE_COLUMNS = new Set<FlowsTableColumnKey>(
  ['SrcService', 'DstService', 'DstPort', 'Verdict', 'Timestamp'],
);

export function getFlowsTableColumnLabel(column: FlowsTableColumnKey) {
  return FlowsTableColumn[column];
}
