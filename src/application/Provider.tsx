import React, { createContext, useContext, PropsWithChildren } from 'react';

import { StoreProvider } from '~/store';
import { NotifierProvider } from '~/notifier/hooks';

import { Application } from './application';

export const ApplicationContext = createContext<Application | null>(null);

export type Props = PropsWithChildren<{
  app: Application;
}>;

export const ApplicationProvider = (props: Props) => {
  return (
    <ApplicationContext.Provider value={props.app}>
      <StoreProvider store={props.app.store}>
        <NotifierProvider statusCenter={props.app.uiLayer.statusCenter}>
          {props.children}
        </NotifierProvider>
      </StoreProvider>
    </ApplicationContext.Provider>
  );
};

export const useApplication = () => {
  const app = useContext(ApplicationContext);
  if (app != null) return app;

  throw new Error('useApplication must be used within ApplicationContext');
};
