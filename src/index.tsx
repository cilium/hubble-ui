import React from 'react';
import ReactDOM from 'react-dom';
import { Router } from '@reach/router';

import './blueprint.scss';
import './index.scss';

import { App } from './components/App';

import { StoreProvider } from '~/store';
import { RouteHistorySourceKind, Route } from '~/store/stores/route';
import { NotifierProvider } from '~/notifier';

import * as ui from '~/ui';
import api from '~/api';

declare global {
  interface Window {
    debugTools: any;
  }
}

const run = async () => {
  ui.setCSSVars(ui.sizes);

  const routes: Route[] = [Route.new('service-map', { path: '(/:namespace)' })];

  const elems = (
    <NotifierProvider>
      <StoreProvider historySource={RouteHistorySourceKind.URL} routes={routes}>
        <Router>
          <App key="service-map" api={api} path="/*appPath" />
        </Router>
      </StoreProvider>
    </NotifierProvider>
  );

  ReactDOM.render(elems, document.getElementById('app'));
};

// TODO: run() if only we are running not as library
run();
