import React, { memo } from 'react';
import classnames from 'classnames';

import { CommonProps, getColumnLabel, Column } from './general';

import css from './styles.scss';

export const Header = memo<CommonProps>(function FlowsTableHeader(props) {
  return (
    <div className={classnames(css.row, css.head)}>
      {props.visibleColumns.has(Column.SrcPod) && (
        <div className={css.cell}>{getColumnLabel(Column.SrcPod)}</div>
      )}
      {props.visibleColumns.has(Column.SrcIp) && (
        <div className={css.cell}>{getColumnLabel(Column.SrcIp)}</div>
      )}
      {props.visibleColumns.has(Column.SrcService) && (
        <div className={css.cell}>{getColumnLabel(Column.SrcService)}</div>
      )}
      {props.visibleColumns.has(Column.DstPod) && (
        <div className={css.cell}>{getColumnLabel(Column.DstPod)}</div>
      )}
      {props.visibleColumns.has(Column.DstIp) && (
        <div className={css.cell}>{getColumnLabel(Column.DstIp)}</div>
      )}
      {props.visibleColumns.has(Column.DstService) && (
        <div className={css.cell}>{getColumnLabel(Column.DstService)}</div>
      )}
      {props.visibleColumns.has(Column.DstPort) && (
        <div className={classnames(css.cell, css.dstPort)}>{getColumnLabel(Column.DstPort)}</div>
      )}
      {props.visibleColumns.has(Column.L7Info) && (
        <div className={classnames(css.cell, css.l7info)}>{getColumnLabel(Column.L7Info)}</div>
      )}
      {props.visibleColumns.has(Column.Verdict) && (
        <div className={classnames(css.cell, css.verdict)}>{getColumnLabel(Column.Verdict)}</div>
      )}
      {props.visibleColumns.has(Column.Auth) && (
        <div className={classnames(css.cell, css.auth)}>{getColumnLabel(Column.Auth)}</div>
      )}
      {props.visibleColumns.has(Column.TcpFlags) && (
        <div className={classnames(css.cell, css.tcpFlags)}>{getColumnLabel(Column.TcpFlags)}</div>
      )}
      {props.visibleColumns.has(Column.Timestamp) && (
        <div className={classnames(css.cell, css.timestamp)}>
          {getColumnLabel(Column.Timestamp)}
        </div>
      )}
    </div>
  );
});
