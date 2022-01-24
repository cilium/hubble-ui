// import * as mobx from 'mobx';
import { IconNames } from '@blueprintjs/icons';
import React, {
  createContext,
  FunctionComponent,
  useContext,
  useEffect,
  useMemo,
} from 'react';
import _ from 'lodash';

import { API } from '~/api/general';
import { useNotifier } from '~/notifier';
import { useStore } from '~/store';
import { useDiff } from '~/ui/hooks';
import * as storage from '~/storage/local';

import { EventKind as DataManagerEvents } from './common';
import { DataManager } from './data-manager';

export interface ProviderProps {
  api: API;
}

export type ProviderComponent = FunctionComponent<ProviderProps>;

export const DataManagerContext = createContext<DataManager | null>(null);

export const DataManagerProvider: ProviderComponent = props => {
  const store = useStore();

  const dataManager = useMemo(() => {
    return new DataManager(props.api, store);
  }, [props.api, store]);

  return (
    <DataManagerContext.Provider value={dataManager}>
      {props.children}
    </DataManagerContext.Provider>
  );
};

export const useDataManager = () => {
  const dataManager = useContext(DataManagerContext);

  if (!dataManager) {
    throw new Error(
      'useDataManager must be used within a DataManagerProvider.',
    );
  }

  // NOTE: we must not run hooks below multiple times because of useDiff hook

  return dataManager;
};

export const useHooksOnDataManager = () => {
  const dataManager = useDataManager();
  const notifier = useNotifier();
  const store = useStore();
  const transferState = store.controls.transferState;

  useEffect(() => {
    const d1 = dataManager.on(DataManagerEvents.Notification, notif => {
      if (notif.connState?.reconnecting) {
        transferState.setReconnecting();

        notifier.showError(
          `Connection to hubble-relay has been lost.
          Reconnecting...`,
          { key: 'reconnecting-to-hubble-relay ' },
        );
      } else if (notif.connState?.connected) {
        transferState.setReceiving();

        notifier.showInfo(`Connection to hubble-relay has been established.`, {
          key: 'connected-to-hubble-relay',
        });
      } else if (notif.connState?.k8sConnected) {
        const unavailableNotif = notifier.cached('k8s-unavailable');
        unavailableNotif?.hide();

        notifier.showInfo(`Connection to Kubernetes has been established.`);
      } else if (notif.connState?.k8sUnavailable) {
        notifier.showError(
          `Connection to Kubernetes has been lost. Check your deployment and ` +
            `refresh this page.`,
          { timeout: 0, key: 'k8s-unavailable' },
        );
      } else if (notif.dataState?.noActivity) {
        notifier.showInfo(`There are no pods in this namespace.`, {
          key: 'no-activity',
        });
      } else if (notif.status != null) {
        transferState.setDeploymentStatus(notif.status);
      } else if (notif.noPermission != null) {
        const { error, resource } = notif.noPermission;

        let notifText =
          `hubble-ui unable to watch over ${resource} resource. ` +
          `You will not be provided with this kind of resource.`;

        if (error.length > 0) {
          notifText += ` Check out developer console to discover the internal error`;
          console.warn(notifText);
          console.warn(
            `Here is why we can't provide ${resource} data: `,
            error,
          );
        }

        notifier.showWarning(notifText, { key: resource, timeout: 0 });
      }
    });

    const d2 = dataManager.on(DataManagerEvents.StreamError, (err, kind) => {
      notifier.showError(
        `Data stream has failed on the UI backend: ${err.message}`,
        { key: 'error', timeout: 0 },
      );
    });

    const d3 = dataManager.on(DataManagerEvents.StreamsReconnecting, () => {
      notifier.showInfo(`Trying to reconnect streams...`, {
        timeout: 0,
        key: 'reconnecting',
      });
    });

    const d4 = dataManager.on(DataManagerEvents.StreamsReconnected, () => {
      notifier.hideBykeys('reconnecting', 'error');
      notifier.showSuccess(`Successfully reconnected`, { timeout: 2000 });
    });

    return () => {
      d1();
      d2();
      d3();
      d4();
    };
  }, [dataManager, notifier]);

  useEffect(() => {
    const d1 = dataManager.on(DataManagerEvents.StreamEnd, () => {
      console.log('stream end: setting streaming to false');
      dataManager.setCurrentTransferState();
    });

    const d2 = dataManager.on(DataManagerEvents.StoreMocked, () => {
      transferState.switchToRealtimeStreaming();
    });

    const d3 = dataManager.on(DataManagerEvents.DataModeSwitched, () => {
      if (transferState.isRealtimeStreaming) {
        transferState.setReceiving();
      } else {
        transferState.setIdle();
      }
    });

    return () => {
      d1();
      d2();
      d3();
    };
  }, [dataManager]);

  useEffect(() => {
    if (!store.features.isSet) return;
    const currentNamespace = store.controls.currentNamespace;

    const unsubscribe = dataManager.on(
      DataManagerEvents.NamespaceAdded,
      _.debounce(() => {
        if (currentNamespace == null) return;
        if (store.controls.namespaces.includes(currentNamespace)) return;

        const message = `
          Namespace "${currentNamespace}" is still not observed.
          Keep waiting for the data.
        `;

        notifier.showWarning(message, { icon: IconNames.SEARCH_AROUND });
        storage.deleteLastNamespace();
      }, 2000),
    );

    if (store.mocked) {
      dataManager.setupMock();
      return;
    }

    return unsubscribe;
  }, [
    dataManager,
    store.features.isSet,
    store.controls.currentNamespace,
    store.mocked,
  ]);

  useDiff(store.filters, d => {
    if (!store.features.isSet) return;

    dataManager.filtersChanged(d.diff ?? void 0);
  });

  // TODO: ideally, we should not run an application until features are set
  useDiff(store.features.isSet, d => {
    if (d.before == null) return;

    dataManager.featuresChanged();
  });
};
