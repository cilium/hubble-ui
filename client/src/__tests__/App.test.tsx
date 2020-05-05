import { act, render } from '@testing-library/react';
import 'mobx-react-lite/batchingForReactDom';
import React from 'react';
import api from '~/api/test';
import { App } from '~/components/App';
import { StoreProvider } from '~/store';

test('App renders without exceptions', async () => {
  await act(async () => {
    render(
      <StoreProvider>
        <App api={api} />
      </StoreProvider>,
    );
  });
});
