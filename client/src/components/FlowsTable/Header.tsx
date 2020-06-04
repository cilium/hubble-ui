import React, { memo } from 'react';

import { CommonProps, getFlowsTableColumnLabel } from './general';

export const Header = memo<CommonProps>(function FlowsTableHeader(props) {
  const { isVisibleColumn } = props;
  return (
    <thead>
      <tr>
        {isVisibleColumn('SrcPod') && (
          <th>{getFlowsTableColumnLabel('SrcPod')}</th>
        )}
        {isVisibleColumn('SrcIp') && (
          <th>{getFlowsTableColumnLabel('SrcIp')}</th>
        )}
        {isVisibleColumn('SrcService') && (
          <th>{getFlowsTableColumnLabel('SrcService')}</th>
        )}
        {isVisibleColumn('DstPod') && (
          <th>{getFlowsTableColumnLabel('DstPod')}</th>
        )}
        {isVisibleColumn('DstIp') && (
          <th>{getFlowsTableColumnLabel('DstIp')}</th>
        )}
        {isVisibleColumn('DstService') && (
          <th>{getFlowsTableColumnLabel('DstService')}</th>
        )}
        {isVisibleColumn('DstPort') && (
          <th>{getFlowsTableColumnLabel('DstPort')}</th>
        )}
        {isVisibleColumn('Verdict') && (
          <th>{getFlowsTableColumnLabel('Verdict')}</th>
        )}
        {isVisibleColumn('Timestamp') && (
          <th>{getFlowsTableColumnLabel('Timestamp')}</th>
        )}
      </tr>
    </thead>
  );
});
