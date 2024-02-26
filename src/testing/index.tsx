import React from 'react';
import { render, RenderResult } from '@testing-library/react';

import { Store } from '~/store';
import { Application, ApplicationProvider } from '~/application';
import { Router } from '~/router';

import * as data from './data';
import * as helpers from './helpers';
import { Environment } from '~/environment';
import { DataLayer } from '~/data-layer/data-layer';
import { UILayer } from '~/ui-layer/ui-layer';

const customRender = (elem: React.ReactElement<any>, options?: any): RenderResult => {
  const apiUrl = `${document.location.origin}/hubble-ui-api`;
  const store = new Store();
  const env = Environment.new();

  const dataLayer = DataLayer.new({
    store,
    customProtocolBaseURL: apiUrl,
    customProtocolRequestTimeout: 1000,
    customProtocolMessagesInJSON: true,
    customProtocolCORSEnabled: true,
  });

  const router = new Router(dataLayer);
  const uiLayer = UILayer.new({
    router,
    store,
    dataLayer,
    isCSSVarsInjectionEnabled: true,
  });

  const renderFn = (_targetElem: Element, app: Application) => {
    return render(<ApplicationProvider app={app}>{elem}</ApplicationProvider>, { ...options });
  };

  const app = new Application(env, router, store, dataLayer, uiLayer, renderFn);
  return app.mount(document.body);
};

export { customRender as render };
export { data, helpers };
