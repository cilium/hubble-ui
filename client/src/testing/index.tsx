import { render, RenderResult } from '@testing-library/react';
import React, { FunctionComponent } from 'react';

import { StoreProvider } from '~/store';
import * as data from './data';
import { RouteHistorySourceKind } from '~/store/stores/route';

const AllProviders: FunctionComponent = ({ children }) => {
  return (
    <StoreProvider historySource={RouteHistorySourceKind.URL}>
      {children}
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
