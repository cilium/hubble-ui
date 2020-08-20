import { render, RenderResult } from '@testing-library/react';
import React, { FunctionComponent } from 'react';

import { StoreProvider } from '~/store';
import { RouteHistorySourceKind } from '~/store/stores/route';
import { NotifierProvider } from '~/notifier';
import * as data from './data';

const AllProviders: FunctionComponent = ({ children }) => {
  return (
    <StoreProvider historySource={RouteHistorySourceKind.URL}>
      <NotifierProvider>{children}</NotifierProvider>
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
export { data };
