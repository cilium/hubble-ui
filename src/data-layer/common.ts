import { BackendAPI } from '~/api/customprotocol';
import { Store } from '~/store';

import { DataMode, TransferState } from '~/domain/interactions';

export type Options = {
  store: Store;
  backendAPI: BackendAPI;
  transferState: TransferState;
};

export type StorageParameters = {
  isHostShown: boolean;
  isKubeDNSShown: boolean;
  isAggregationOff: boolean | null;
  dataMode: DataMode | null;
};
