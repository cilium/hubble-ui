import React, { FunctionComponent, createContext, useContext } from 'react';
import { Store } from './stores/main';
import { useLocalStore } from 'mobx-react';

const StoreContext = createContext<Store | null>(null);

export const StoreProvider: FunctionComponent<{}> = ({ children }) => {
  const store = useLocalStore(Store.new);

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
