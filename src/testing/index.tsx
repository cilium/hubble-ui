import { render, RenderResult } from '@testing-library/react';
import React from 'react';

import { Store } from '~/store';
import { StoreContext } from '~/store/hooks';
import { Application, ApplicationProvider } from '~/application';
import { Router, RouterKind } from '~/router';

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

  const router = new Router(RouterKind.Memory, dataLayer);
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

type ReturnsStore = () => Store;
export const spyStore = (): ReturnsStore => {
  const spy = jest.spyOn(React, 'useContext');

  return () => {
    const calls = spy.mock.calls;
    const returns = spy.mock.results;

    let idx = -1;
    calls.forEach((c, i) => {
      if (c[0] === StoreContext) {
        idx = i;
      }
    });

    return returns[idx].value;
  };
};

export * from '@testing-library/react';
export { React, customRender as render };
export { data, helpers };
