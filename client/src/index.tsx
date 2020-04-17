import React from 'react';
import ReactDOM from 'react-dom';

import { StoreProvider } from '~/store';
import { App } from './components/App';

import * as router from './modules/navigation/router';
import * as ui from '~/ui';
import api from '~/api';

import './blueprint.css';
import './index.scss';

const run = async () => {
  router.start();
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
