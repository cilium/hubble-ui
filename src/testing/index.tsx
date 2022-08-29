import { render, RenderResult } from '@testing-library/react';
import React, { FunctionComponent } from 'react';

import { StoreProvider } from '~/store';
import { RouteHistorySourceKind } from '~/store/stores/route';
import { NotifierProvider } from '~/notifier';
import { DataManagerProvider } from '~/data-manager';
import * as data from './data';
import * as helpers from './helpers';

import api from '~/api';

const AllProviders = ({ children }: React.PropsWithChildren<{}>) => {
  return (
    <StoreProvider historySource={RouteHistorySourceKind.URL}>
      <NotifierProvider>
        <DataManagerProvider api={api}>{children}</DataManagerProvider>
      </NotifierProvider>
    </StoreProvider>
  );
};

const customRender = (
  ui: React.ReactElement<any>,
  options?: any,
): RenderResult => {
  return render(ui, { wrapper: AllProviders, ...options });
};

export * from '@testing-library/react';
export { React, customRender as render };
export { data, helpers };
