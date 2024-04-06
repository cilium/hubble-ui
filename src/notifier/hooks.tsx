import { observer } from 'mobx-react';
import React, { createContext, useContext, useEffect, useMemo, PropsWithChildren } from 'react';
import { OverlayToaster } from '@blueprintjs/core';

import { setupDebugProp } from '~/domain/misc';

import { Notifier, Props as NotifierProps } from './notifier';
import { StatusCenter } from '~/ui-layer/status-center';

const NotifierContext = createContext<Notifier | null>(null);

export type ProviderProps = PropsWithChildren<NotifierProps> & {
  statusCenter: StatusCenter;
};

export const NotifierProvider = observer((props: ProviderProps) => {
  const notifier = useMemo(() => new Notifier(), []);
  const toasterProps = useMemo(() => Notifier.prepareToasterProps(props), [props]);

  useEffect(() => setupDebugProp({ notifier }), [notifier]);

  useEffect(() => {
    return props.statusCenter
      .onNewEntry(e => {
        notifier.hideBykeys(...(e.entry.keysToComplete || []));
        notifier.showStatusEntry(e.entry, e.entryFlags.wasPending);
      })
      .disposer()
      .asFunction();
  }, [notifier, props]);

  return (
    <NotifierContext.Provider value={notifier}>
      <OverlayToaster
        {...toasterProps}
        ref={ref => {
          if (!ref) return;

          notifier.setBackend(ref!);
        }}
      />

      {props.children}
    </NotifierContext.Provider>
  );
});

export const useNotifier = () => {
  const notifier = useContext(NotifierContext);
  if (!notifier) {
    throw new Error('useNotifier must be used within a NotifierProvider.');
  }

  return notifier;
};
