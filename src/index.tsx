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
    const fallbackAPIUrl = `${document.location.origin}/api/`;
    try {
      const base = document.querySelector('base')?.href;
      if (base != null) return new URL('api/', base).href;
    } catch (e) {
      console.error('Failed to determine API path', e);
    }
    return fallbackAPIUrl;
  }

  // NOTE: Do not edit those `process.env.VAR_NAME` variable accesses
  // because they only work if you have such a direct call for them.
  const schemaRaw = process.env.API_SCHEMA || document.location.protocol || 'http';
  const schema = schemaRaw.endsWith(':') ? schemaRaw : `${schemaRaw}:`;
  const hostname = process.env.API_HOST || document.location.hostname;
  const port = process.env.API_PORT || document.location.port;
  const path = process.env.API_PATH || 'api';
  const slashedPath = path?.startsWith('/') ? path : `/${path}`;

  return `${schema}//${hostname}${port ? `:${port}` : ''}${slashedPath}`;
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

  router.onInitialized(() => {
    e2e.attributes.setEnabled(router.mockModeParam != null);
  });

  app
    .onBeforeMount(_app => {
      uiLayer.onBeforeMount();
    })
    .onMounted(app => {
      app.uiLayer.onMounted();
    })
    .mount('#app');
};

// TODO: run() if only we are running not as library
run();
