import React, { createContext, FunctionComponent, useContext } from 'react';
import { Toaster } from '@blueprintjs/core';

import { Notifier, Props as NotifierProps } from './notifier';
import { NotifierPosition } from '~/notifier/general';
import * as helpers from '~/notifier/helpers';

import { setupDebugProp } from '~/domain/misc';

type ProviderComponent = FunctionComponent<NotifierProps>;

const NotifierContext = createContext<Notifier | null>(null);

export const NotifierProvider: ProviderComponent = props => {
  const notifier = new Notifier();
  setupDebugProp({ notifier });

  const toasterProps = Notifier.prepareToasterProps(props);

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
};

export const useNotifier = () => {
  const notifier = useContext(NotifierContext);
  if (!notifier) {
    throw new Error('useNotifier must be used within a NotifierProvider.');
  }

  return notifier;
};
