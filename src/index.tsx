import React from 'react';
import ReactDOM from 'react-dom';
import { Router } from '@reach/router';
import { observer } from 'mobx-react-lite';

import { StoreProvider } from '~/store';
import { RouteHistorySourceKind, Route } from '~/store/stores/route';
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

  const routes: Route[] = [Route.new('service-map', { path: '(/:namespace)' })];

  const Screen = observer(() => {
    useHooksOnDataManager();

    return (
      <Router>
        <App key="service-map" api={api} path="/*appPath" />
      </Router>
    );
  });

  // NOTE: we don't have another option to take notifier from except from inside
  const onFeatureFetchError = (err: Error, notifier: Notifier) => {
    console.error('features fetch error: ', err);
    notifier.showError(`Failed to load UI settings: ${err.message}`);
  };

  const elems = (
    <NotifierProvider>
      <StoreProvider historySource={RouteHistorySourceKind.URL} routes={routes}>
        <DataManagerProvider api={api}>
          <FeatureFlagsFetcher api={api.v1} onError={onFeatureFetchError}>
            <Screen />
          </FeatureFlagsFetcher>
        </DataManagerProvider>
      </StoreProvider>
    </NotifierProvider>
  );

  ReactDOM.render(elems, document.getElementById('app'));
};

// TODO: run() if only we are running not as library
run();
