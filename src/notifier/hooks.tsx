import React, { createContext, FunctionComponent, useContext } from 'react';
import { Toaster } from '@blueprintjs/core';

import { Notifier, Props as NotifierProps } from './notifier';

import { setupDebugProp } from '~/domain/misc';
import { observer } from 'mobx-react';

const NotifierContext = createContext<Notifier | null>(null);

export const NotifierProvider = observer(
  (props: React.PropsWithChildren<NotifierProps>) => {
    const notifier = React.useMemo(() => new Notifier(), []);
    React.useEffect(() => setupDebugProp({ notifier }), [notifier]);

    const toasterProps = React.useMemo(
      () => Notifier.prepareToasterProps(props),
      [props],
    );

    return (
      <NotifierContext.Provider value={notifier}>
        <Toaster
          {...toasterProps}
          ref={ref => {
            if (!ref) return;

            notifier.setBackend(ref!);
          }}
        />

        {props.children}
      </NotifierContext.Provider>
    );
  },
);

export const useNotifier = () => {
  const notifier = useContext(NotifierContext);
  if (!notifier) {
    throw new Error('useNotifier must be used within a NotifierProvider.');
  }

  return notifier;
};
