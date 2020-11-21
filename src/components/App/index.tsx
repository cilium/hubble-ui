import * as _ from 'lodash';
import React, {
  FunctionComponent,
  useCallback,
  useEffect,
  useState,
  useMemo,
  useRef,
} from 'react';
import { IconNames } from '@blueprintjs/icons';
import { RouteComponentProps } from '@reach/router';
import { observer } from 'mobx-react';

import { TopBar, ConnectionState } from '~/components/TopBar';
import {
  DetailsPanel,
  ResizeProps as DetailsResizeProps,
  TickerEvents as DPTickerEvents,
  DEFAULT_TS_UPDATE_DELAY,
} from '~/components/DetailsPanel';

import { Map } from '~/components/Map';
import { LoadingOverlay } from '~/components/Misc/LoadingOverlay';
import { ServiceMapCard } from '~/components/ServiceMapCard';
import { CardComponent } from '~/components/Card';
import { WelcomeScreen } from './WelcomeScreen';

import { Verdict, TCPFlagName } from '~/domain/hubble';
import { ServiceCard } from '~/domain/service-map';
import { Vec2 } from '~/domain/geometry';
import { KV, Labels } from '~/domain/labels';
import {
  Filters,
  FilterEntry,
  FilterKind,
  FilterDirection,
} from '~/domain/filtering';

import {
  ServiceMapPlacementStrategy,
  ServiceMapArrowStrategy,
} from '~/domain/layout/service-map';

import { useStore } from '~/store';
import { useNotifier } from '~/notifier';

import { API } from '~/api/general';
import * as storage from '~/storage/local';
import { DataManager, EventKind as DataManagerEvents } from './DataManager';

import { Ticker } from '~/utils/ticker';
import { sizes } from '~/ui/vars';
import css from './styles.scss';

export interface AppProps extends RouteComponentProps {
  api: API;
}

export const App: FunctionComponent<AppProps> = observer(props => {
  const store = useStore();

  const onFlowsDiffCount = useRef<(diff: number) => void>();
  const [isStreaming, setIsStreaming] = useState(true);
  const [connState, setConnState] = useState(ConnectionState.Idle);
  const [mapVisibleHeight, setMapVisibleHeight] = useState<number | null>(null);
  const [mapWasDragged, setMapWasDragged] = useState(false);

  const notifier = useNotifier();
  const dataManager = useMemo(() => {
    return new DataManager(props.api, store);
  }, []);

  const ticker = useMemo(() => {
    const ticker = new Ticker<DPTickerEvents>();
    ticker.start(DPTickerEvents.TimestampUpdate, DEFAULT_TS_UPDATE_DELAY);

    return ticker;
  }, [dataManager]);

  useEffect(() => {
    const d1 = dataManager.on(DataManagerEvents.StreamError, () => {
      setIsStreaming(false);
      setConnState(ConnectionState.Stopped);

      notifier.showError(
        `Failed to receive data from backend.
        Please make sure that your deployment is up and try again.`,
        { key: 'backend-error' },
      );
    });

    const d2 = dataManager.on(DataManagerEvents.Notification, notif => {
      if (notif.connState?.reconnecting) {
        setConnState(ConnectionState.Reconnecting);

        notifier.showError(
          `Connection to hubble-relay has been lost.
          Reconnecting...`,
          { key: 'reconnecting-to-hubble-relay ' },
        );
      } else if (notif.connState?.connected) {
        setConnState(ConnectionState.Receiving);

        notifier.showInfo(`Connection to hubble-relay has been established.`, {
          key: 'connected-to-hubble-relay',
        });
      } else if (notif.dataState?.noActivity) {
        notifier.showInfo(`There are no pods in this namespace.`, {
          key: 'no-activity',
        });
      } else if (notif.status != null) {
        store.controls.setStatus(notif.status);
      }
    });

    return () => {
      d1();
      d2();
    };
  }, [dataManager, notifier]);

  useEffect(() => {
    return dataManager.on(DataManagerEvents.StreamEnd, () => {
      setIsStreaming(false);
    });
  }, [dataManager]);

  useEffect(() => {
    return dataManager.on(DataManagerEvents.StoreMocked, () => {
      setIsStreaming(true);
    });
  }, [dataManager]);

  useEffect(() => {
    const { currentNamespace } = store.controls;

    const unsubscribe = dataManager.on(
      DataManagerEvents.NamespaceAdded,
      _.debounce(() => {
        const { namespaces } = store.controls;
        if (currentNamespace == null) return;
        if (currentNamespace && namespaces.includes(currentNamespace)) return;

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
    } else if (currentNamespace == null && !dataManager.hasInitialStream) {
      dataManager.setupInitialStream();
    }

    return unsubscribe;
  }, [
    dataManager,
    store.controls.namespaces,
    store.controls.currentNamespace,
    store.mocked,
  ]);

  useEffect(() => {
    return dataManager.on(
      DataManagerEvents.FlowsDiff,
      (frame, diff: number) => {
        if (store.currentFrame === frame) {
          onFlowsDiffCount.current?.(diff);
        }
      },
    );
  }, [store.currentFrame, dataManager]);

  useEffect(() => {
    if (!store.controls.currentNamespace || store.mocked) return;
    const newNamespace = store.controls.currentNamespace;
    console.log('control filters changed: ', store.controls.filters.clone());

    if (dataManager.currentNamespace !== newNamespace) {
      dataManager.resetNamespace(newNamespace);
    } else {
      dataManager.dropCurrentStream();
      dataManager.setupCurrentStream(store.controls.currentNamespace);
    }

    setConnState(ConnectionState.Receiving);
    setMapWasDragged(false);
  }, [store.controls.filters]);

  const onNamespaceChange = useCallback((ns: string) => {
    store.flush();
    store.controls.reset();
    store.controls.setCurrentNamespace(ns);
  }, []);

  const onCardSelect = useCallback((srvc: ServiceCard) => {
    const isActive = store.toggleActiveService(srvc.id);
    store.setFlowFiltersForActiveCard(srvc.id, isActive);
  }, []);

  const onCloseFlowsTableSidebar = useCallback(() => {
    store.controls.selectTableFlow(null);
  }, []);

  const onPanelResize = useCallback((resizeProps: DetailsResizeProps) => {
    const vh = resizeProps.panelTopInPixels - sizes.topBarHeight;
    setMapVisibleHeight(vh);
  }, []);

  const onMapDrag = useCallback((val: boolean) => {
    setMapWasDragged(val);
  }, []);

  const onSidebarVerdictClick = useCallback((v: Verdict | null) => {
    store.controls.setVerdict(v);
  }, []);

  const onSidebarTCPFlagClick = useCallback(
    (flag?: TCPFlagName, dir?: FilterDirection) => {
      if (!flag || !dir) return store.setFlowFilters([]);

      store.setFlowFilters([FilterEntry.newTCPFlag(flag!).setDirection(dir!)]);
    },
    [],
  );

  const onSidebarLabelClick = useCallback(
    (label?: KV, dir?: FilterDirection) => {
      if (!label || !dir) return store.setFlowFilters([]);
      const labelStr = Labels.concatKV(label!);

      store.setFlowFilters([FilterEntry.newLabel(labelStr).setDirection(dir!)]);
    },
    [],
  );

  const onSidebarPodClick = useCallback(
    (podName?: string, dir?: FilterDirection) => {
      if (!podName || !dir) return store.setFlowFilters([]);

      store.setFlowFilters([FilterEntry.newPod(podName!).setDirection(dir!)]);
    },
    [],
  );

  const onSidebarIdentityClick = useCallback(
    (identity?: string, dir?: FilterDirection) => {
      if (identity == null || !dir) return store.setFlowFilters([]);

      store.setFlowFilters([
        FilterEntry.newIdentity(identity!).setDirection(dir!),
      ]);
    },
    [],
  );

  const onSidebarIpClick = useCallback((ip?: string, dir?: FilterDirection) => {
    if (ip == null || !dir) return store.setFlowFilters([]);

    store.setFlowFilters([FilterEntry.newIP(ip!).setDirection(dir!)]);
  }, []);

  const onSidebarDnsClick = useCallback((dns?: string) => {
    if (dns == null) return store.setFlowFilters([]);

    store.setFlowFilters([
      FilterEntry.newDNS(dns).setDirection(FilterDirection.Both),
    ]);
  }, []);

  // prettier-ignore
  const isCardActive = useCallback((id: string) => {
    return store.currentFrame.isCardActive(id);
  },[store.currentFrame.services.activeCardsList]);

  const onAccessPointCoords = useCallback(
    (apId: string, coords: Vec2) => {
      store.placement.setAccessPointCoords(apId, coords);
    },
    [store.placement],
  );

  const cardRenderer = useCallback(
    (card: ServiceCard) => {
      const coords = store.placement.cardsBBoxes.get(card.id);
      if (coords == null) return null;

      const onHeightChange = (h: number) => {
        return store.placement.setCardHeight(card.id, h);
      };

      return (
        <ServiceMapCard
          key={card.id}
          active={isCardActive(card.id)}
          coords={coords}
          currentNamespace={store.controls.currentNamespace}
          card={card}
          onHeightChange={onHeightChange}
          onClick={onCardSelect}
          onAccessPointCoords={onAccessPointCoords}
        />
      );
    },
    [
      store.placement,
      store.placement.cardsBBoxes,
      store.controls.currentNamespace,
      onAccessPointCoords,
      isCardActive,
    ],
  );

  const mapLoaded =
    store.currentFrame.services.cardsList.length > 0 && isStreaming;

  const RenderedTopBar = (
    <TopBar
      connectionState={connState}
      status={store.controls.lastStatus || undefined}
      namespaces={store.controls.namespaces}
      currentNamespace={store.controls.currentNamespace}
      onNamespaceChange={onNamespaceChange}
      selectedVerdict={store.controls.verdict}
      onVerdictChange={store.controls.setVerdict}
      selectedHttpStatus={store.controls.httpStatus}
      onHttpStatusChange={store.controls.setHttpStatus}
      flowFilters={store.controls.flowFilters}
      onChangeFlowFilters={store.setFlowFilters}
      showHost={store.controls.showHost}
      onShowHostToggle={store.toggleShowHost}
      showKubeDns={store.controls.showKubeDns}
      onShowKubeDnsToggle={store.toggleShowKubeDns}
      showRemoteNode={store.controls.showRemoteNode}
      onShowRemoteNodeToggle={store.toggleShowRemoteNode}
      showPrometheusApp={store.controls.showPrometheusApp}
      onShowPrometheusAppToggle={store.toggleShowPrometheusApp}
    />
  );

  if (!store.controls.currentNamespace) {
    return (
      <div className={css.app}>
        {RenderedTopBar}
        <WelcomeScreen
          namespaces={store.controls.namespaces}
          onNamespaceChange={onNamespaceChange}
        />
      </div>
    );
  }

  return (
    <div className={css.app}>
      {RenderedTopBar}

      <div className={css.map}>
        {mapLoaded ? (
          <Map
            namespace={store.controls.currentNamespace}
            namespaceBBox={store.placement.namespaceBBox}
            placement={store.placement}
            arrows={store.arrows}
            cards={store.currentFrame.services.cardsList}
            cardRenderer={cardRenderer}
            visibleHeight={mapVisibleHeight ?? 0}
            isCardActive={isCardActive}
            wasDragged={mapWasDragged}
            onCardHeightChange={store.placement.setCardHeight}
            onMapDrag={onMapDrag}
          />
        ) : (
          <LoadingOverlay
            height={mapVisibleHeight ?? '50%'}
            text="Waiting for service map data…"
          />
        )}
      </div>

      <DetailsPanel
        isStreaming={isStreaming}
        flows={store.currentFrame.interactions.flows}
        filters={store.controls.filters}
        selectedFlow={store.controls.selectedTableFlow}
        onSelectFlow={store.controls.selectTableFlow}
        onCloseSidebar={onCloseFlowsTableSidebar}
        onSidebarVerdictClick={onSidebarVerdictClick}
        onSidebarTCPFlagClick={onSidebarTCPFlagClick}
        onSidebarLabelClick={onSidebarLabelClick}
        onSidebarPodClick={onSidebarPodClick}
        onSidebarIdentityClick={onSidebarIdentityClick}
        onSidebarIpClick={onSidebarIpClick}
        onSidebarDnsClick={onSidebarDnsClick}
        ticker={ticker}
        onPanelResize={onPanelResize}
        onFlowsDiffCount={onFlowsDiffCount}
      />
    </div>
  );
});
