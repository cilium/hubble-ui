import _ from 'lodash';
import React, { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import ReactDOM from 'react-dom';

export type Props = {
  to: Element | React.MutableRefObject<Element | null | undefined> | string | null | undefined;
  disabled?: boolean;
  children?: React.ReactNode;
  key?: string;
};

export const Teleport = function Teleport(props: Props) {
  const [container, setContainer] = useState<Element | null>(null);

  useEffect(() => {
    if (props.to == null) {
      setContainer(null);
    } else if (props.to instanceof Element) {
      setContainer(props.to);
    } else if (_.isString(props.to)) {
      const elem = document.querySelector(props.to);
      setContainer(elem);
    } else {
      setContainer(props.to.current || null);
    }
  }, [props, props.to]);

  if (container == null) return null;
  if (!!props.disabled) return <>{props.children}</>;

  return ReactDOM.createPortal(props.children, container, props.key);
};
