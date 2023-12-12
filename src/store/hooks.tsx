import React, { createContext, PropsWithChildren, useContext } from 'react';
import { Store } from './stores/main';

export const StoreContext = createContext<Store | null>(null);

export type Props = {
  store: Store;
};

export const StoreProvider = (props: PropsWithChildren<Props>) => {
  return <StoreContext.Provider value={props.store}>{props.children}</StoreContext.Provider>;
};

export const useStore = () => {
  const store = useContext(StoreContext);
  if (!store) {
    throw new Error('useStore must be used within a StoreProvider.');
  }

  return store;
};
