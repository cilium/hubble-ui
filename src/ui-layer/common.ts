import { DataLayer } from '~/data-layer';
import { Router } from '~/router';
import { Store } from '~/store';

import { StatusCenter } from './status-center';

export type Options = {
  store: Store;
  router: Router;
  dataLayer: DataLayer;
  statusCenter: StatusCenter;
  utils: CommonUtils;
};

export interface CommonUtils {}
