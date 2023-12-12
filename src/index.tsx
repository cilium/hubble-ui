import React from 'react';
import { createRoot } from 'react-dom/client';

import { Environment } from '~/environment';
import { Store } from '~/store';
import { DataLayer } from '~/data-layer';
import { Router, RouterKind, RouterProvider } from '~/router';
import { UILayer } from '~/ui-layer';
import { Application, ApplicationProvider } from '~/application';

import { e2e } from '~e2e/client';

import './blueprint.scss';
import './index.scss';

declare global {
  interface Window {
    debugTools: any;
  }
}

const buildAPIUrl = (env: Environment): string => {
  if (!env.isDev) {
    return `${document.location.origin}/api/`;
  }

  const schema = env.var('API_SCHEMA') || 'http';
  const host = env.var('API_HOST') || 'localhost';
  const port = env.var('API_PORT') || 8090;
  const path = env.var('API_PATH') || 'api';
  const slashedPath = path?.startsWith('/') ? path : `/${path}`;

  return `${schema}://${host}:${port}${slashedPath}`;
};

const run = async () => {
  const env = Environment.new();
  const store = new Store();

  const apiUrl = buildAPIUrl(env);
  const dataLayer = DataLayer.new({
    store,
    customProtocolBaseURL: apiUrl,
    customProtocolRequestTimeout: 3000,
    customProtocolMessagesInJSON: env.isDev,
    customProtocolCORSEnabled: true,
  });

  const router = new Router(env.isTesting ? RouterKind.Memory : RouterKind.Browser, dataLayer);

  const uiLayer = UILayer.new({
    router,
    store,
    dataLayer,
    isCSSVarsInjectionEnabled: true,
  });

  const renderFn = (targetElem: Element, app: Application) => {
    const root = createRoot(targetElem);

    // NOTE: Use RouterProvider here not to create dependency cycle:
    // Application -> Router -> <Our app component> -> useApplication
    root.render(
      <ApplicationProvider app={app}>
        <RouterProvider router={app.router} />
      </ApplicationProvider>,
    );
  };

  const app = new Application(env, router, store, dataLayer, uiLayer, renderFn);
  app
    .onBeforeMount(_app => {
      const env = app.environment;
      e2e.attributes.setEnabled(env.isDev || env.isTesting);
      uiLayer.onBeforeMount();
    })
    .onMounted(app => app.uiLayer.onMounted())
    .mount('#app');
};

// TODO: run() if only we are running not as library
run();
