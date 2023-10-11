export interface CommonProps {
  visibleColumns: Set<Column>;
}

export enum Column {
  Auth = 'Authentication',
  SrcPod = 'Source Pod',
  SrcIp = 'Source IP',
  SrcIdentity = 'Source Identity',
  DstPod = 'Destination Pod',
  DstIp = 'Destination IP',
  DstIdentity = 'Destination Identity',
  DstPort = 'Destination Port',
  L7Info = 'L7 info',
  Verdict = 'Verdict',
  TcpFlags = 'TCP Flags',
  Timestamp = 'Timestamp',
}

export enum TickerEvents {
  TimestampUpdate = 'timestamp-update',
}

export type ColumnKey = keyof typeof Column;

export const columnKeys = Object.keys(Column) as ColumnKey[];

export const columnMap = new Map(
  Object.entries(Column).map(pair => pair.reverse() as [Column, ColumnKey]),
) as Map<Column, ColumnKey>;

export const getColumnKey = (col: Column): ColumnKey => {
  return columnMap.get(col)!;
};

export const defaultVisibleColumns = new Set<Column>([
  Column.SrcIdentity,
  Column.DstIdentity,
  Column.DstPort,
  Column.L7Info,
  Column.Verdict,
  Column.Timestamp,
]);

export function getColumnLabel(column: Column) {
  return column;
}
