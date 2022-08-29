import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { observer } from 'mobx-react-lite';

import { StoreProvider, useStore } from '~/store';
import { RouteHistorySourceKind } from '~/store/stores/route';
import { NotifierProvider, Notifier } from '~/notifier';

import { DataManagerProvider } from '~/data-manager';
import { useHooksOnDataManager } from './data-manager/Provider';

import { FeatureFlagsFetcher } from './components/FeatureFlags/FeatureFlagsFetcher';
import { App } from './components/App';

import * as ui from '~/ui';
import api from '~/api';

import './blueprint.scss';
import './index.scss';

declare global {
  interface Window {
    debugTools: any;
  }
}

const run = async () => {
  ui.setCSSVars(ui.sizes);

  const Screen = observer(() => {
    const store = useStore();

    useHooksOnDataManager();

    return (
      <BrowserRouter>
        <Routes location={store.route.location}>
          <Route path="*" element={<App api={api} />} />
        </Routes>
      </BrowserRouter>
    );
  });

  // NOTE: we don't have another option to take notifier from except from inside
  const onFeatureFetchError = (err: Error, notifier: Notifier) => {
    console.error('features fetch error: ', err);
    notifier.showError(`Failed to load UI settings: ${err.message}`);
  };

  const elems = (
    <NotifierProvider>
      <StoreProvider historySource={RouteHistorySourceKind.URL}>
        <DataManagerProvider api={api}>
          <FeatureFlagsFetcher api={api.v1} onError={onFeatureFetchError}>
            <Screen />
          </FeatureFlagsFetcher>
        </DataManagerProvider>
      </StoreProvider>
    </NotifierProvider>
  );

  const container = document.getElementById('app');
  if (!container) throw new Error('Expect #app in DOM');
  const root = createRoot(container);

  root.render(elems);
};

// TODO: run() if only we are running not as library
run();
