import { render } from '@testing-library/react';
import React, { FunctionComponent } from 'react';
import { StoreProvider } from '~/store';

const AllProviders: FunctionComponent = ({ children }) => {
  return <StoreProvider>{children}</StoreProvider>;
};

const customRender: typeof render = (async (ui: any, options: any) => {
  return render(ui, { wrapper: AllProviders, ...options });
}) as any;

export * from '@testing-library/react';
export { React, customRender as render };
