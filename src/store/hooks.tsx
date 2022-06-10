import { useLocalObservable } from 'mobx-react';
import React, { createContext, FunctionComponent, useContext } from 'react';
import { Store, Props as MainStoreProps } from './stores/main';

const StoreContext = createContext<Store | null>(null);

export const StoreProvider: FunctionComponent<MainStoreProps> = ({
  children,
  historySource,
  routes,
}) => {
  const store = useLocalObservable(() => new Store({ historySource, routes }));

  return (
    <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
  );
};

export const useStore = () => {
  const store = useContext(StoreContext);
  if (!store) {
    throw new Error('useStore must be used within a StoreProvider.');
  }

  return store;
};
