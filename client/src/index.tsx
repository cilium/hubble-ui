import 'mobx-react-lite/batchingForReactDom';
import React from 'react';
import ReactDOM from 'react-dom';

import './blueprint.css';
import './index.scss';

import { App } from './components/App';
import { StoreProvider } from '~/store';
import * as ui from '~/ui';
import api from './api/grpc';

const run = async () => {
  ui.setCSSVars(ui.sizes);

  const elems = (
    <StoreProvider>
      <App api={api} />
    </StoreProvider>
  );

  ReactDOM.render(elems, document.getElementById('app'));
};

// TODO: run() if only we are running not as library
run();
