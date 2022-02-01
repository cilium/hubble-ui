import React from 'react';
import { observer } from 'mobx-react';

import { Method, sortMethods } from '~/domain/http';
import { XY } from '~/domain/geometry';
import { useElemCoords, useDiff } from '~/ui/hooks';
import { SingleIndicator } from '~/ui/hooks/useIndicator';

import { HTTPEndpointGroup } from './http-groups';
import css from './HttpEndpoint.scss';

export interface Props {
  group: HTTPEndpointGroup;

  indicator?: SingleIndicator;
  onConnectorCoords?: (m: Method, c: XY) => void;
}

export const HttpEndpoint = observer(function HttpEndpoint(props: Props) {
  const methods = sortMethods(props.group.methods);

  if (methods.size === 0) return null;

  return (
    <div className={css.httpEndpoint}>
      <div className={css.header}>{props.group.url.pathname}</div>

      <div className={css.connectors}>
        {[...methods].map(method => {
          return (
            <MethodConnector
              key={method}
              method={method}
              indicator={props.indicator}
              onConnectorCoords={xy => props.onConnectorCoords?.(method, xy)}
            />
          );
        })}
      </div>
    </div>
  );
});

interface MethodConnectorProps {
  method: Method;
  indicator?: SingleIndicator;
  onConnectorCoords?: (_: XY) => void;
}

const MethodConnector = function MethodConnector(props: MethodConnectorProps) {
  const circleRef = React.useRef<HTMLDivElement | null>(null);

  const coordsHandle = useElemCoords(circleRef, false, coords => {
    props.onConnectorCoords?.(coords.center);
  });

  useDiff(props.indicator?.value, () => {
    coordsHandle.emit();
  });

  return (
    <div className={css.connector}>
      <div className={css.circle} ref={circleRef}></div>
      <div className={css.method}>{props.method}</div>
    </div>
  );
};
