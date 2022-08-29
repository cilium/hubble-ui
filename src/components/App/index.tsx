import React, {
  useCallback,
  useEffect,
  useState,
  useMemo,
  useRef,
} from 'react';
import { observer } from 'mobx-react';
import * as mobx from 'mobx';

import { TopBar } from '~/components/TopBar';
import {
  DetailsPanel,
  ResizeProps as DetailsResizeProps,
  TickerEvents as DPTickerEvents,
  DEFAULT_TS_UPDATE_DELAY,
} from '~/components/DetailsPanel';

import { Map } from '~/components/Map';
import { LoadingOverlay } from '~/components/Misc/LoadingOverlay';
import { ServiceMapCard } from '~/components/ServiceMapCard';
import { CardComponentProps } from '~/components/Card';
import { ServiceMapArrowRenderer } from '~/components/ServiceMapArrowRenderer';
import { WelcomeScreen } from './WelcomeScreen';

import { Verdict, TCPFlagName, PodSelector } from '~/domain/hubble';
import { ServiceCard } from '~/domain/service-map';
import { Vec2, XY } from '~/domain/geometry';
import { KV, Labels } from '~/domain/labels';
import { FilterEntry, FilterDirection } from '~/domain/filtering';
import { Method as HttpMethod } from '~/domain/http';

import { useStore } from '~/store';
import { API } from '~/api/general';
import { useDataManager, EventKind as DataManagerEvents } from '~/data-manager';

import { Ticker } from '~/utils/ticker';
import { sizes } from '~/ui/vars';
import { useFlowsTableColumns } from './hooks/useColumns';
import css from './styles.scss';

export interface AppProps {
  api: API;
}

export const App = observer((_props: AppProps) => {
  const dataManager = useDataManager();
  const store = useStore();

  const transferState = store.controls.transferState;
  const onFlowsDiffCount = useRef<(diff: number) => void>();
  const [mapVisibleHeight, setMapVisibleHeight] = useState<number | null>(null);
  const [mapWasDragged, setMapWasDragged] = useState(false);
  const flowsTableColumns = useFlowsTableColumns();
  const [flowsWaitTimeout, setFlowsWaitTimeout] = useState<boolean>(false);

  const ticker = useMemo(() => {
    const ticker = new Ticker<DPTickerEvents>();
    ticker.start(DPTickerEvents.TimestampUpdate, DEFAULT_TS_UPDATE_DELAY);

    return ticker;
  }, [dataManager]);

  useEffect(() => {
    if (!store.controls.currentNamespace) return;
    setFlowsWaitTimeout(false);

    const stop = setTimeout(() => {
      setFlowsWaitTimeout(true);
    }, 5000);

    return () => clearTimeout(stop);
  }, [store.controls.currentNamespace]);

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
    setMapWasDragged(false);
  }, [store.filters]);

  const onNamespaceChange = useCallback((ns: string) => {
    store.flush();
    store.controls.reset();
    store.controls.setCurrentNamespace(ns);
  }, []);

  const onCardSelect = useCallback((srvc: ServiceCard) => {
    const isActive = store.toggleActiveService(srvc.id);
    store.setFlowFiltersForActiveCard(srvc.id, isActive);

    store.runAfterFrameReset(() => {
      store.setActiveServiceState(srvc.id, isActive);
    });
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
    (podSelector?: PodSelector, dir?: FilterDirection) => {
      if (!podSelector || !dir) return store.setFlowFilters([]);

      store.setFlowFilters([
        FilterEntry.newPodSelector(podSelector!).setDirection(dir!),
      ]);
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

  const onHttpEndpointCoords = useCallback(
    (svcId: string, urlPath: string, method: HttpMethod, coords: XY) => {
      store.placement.setHttpEndpointCoords(svcId, urlPath, method, coords);
    },
    [store.placement],
  );

  const cardRenderer = mobx.action((props: CardComponentProps<ServiceCard>) => {
    const onHeightChange = (h: number) => {
      return store.placement.setCardHeight(props.card.id, h);
    };

    const l7endpoints = store.currentFrame.interactions.l7endpoints;

    return (
      <ServiceMapCard
        key={props.card.id}
        active={isCardActive(props.card.id)}
        coords={props.coords}
        currentNamespace={store.controls.currentNamespace}
        card={props.card}
        l7endpoints={l7endpoints.forReceiver(props.card.id)}
        maxHttpEndpointsVisible={5}
        onHeightChange={onHeightChange}
        onClick={onCardSelect}
        onAccessPointCoords={onAccessPointCoords}
        onHttpEndpointCoords={(urlPath, method, xy) =>
          onHttpEndpointCoords(props.card.id, urlPath, method, xy)
        }
      />
    );
  });

  const mapLoaded =
    store.currentFrame.services.cardsList.length > 0 &&
    !transferState.isDisabled;

  const RenderedTopBar = (
    <TopBar
      transferState={store.controls.transferState}
      status={store.controls.lastStatus || undefined}
      namespaces={store.controls.namespaces}
      currentNamespace={store.controls.currentNamespace}
      onNamespaceChange={onNamespaceChange}
      selectedVerdict={store.controls.verdict}
      onVerdictChange={store.controls.setVerdict}
      selectedHttpStatus={store.controls.httpStatus}
      onHttpStatusChange={store.controls.setHttpStatus}
      flowFilters={store.controls.correctFlowFilters}
      onChangeFlowFilters={store.setFlowFilters}
      showHost={store.controls.showHost}
      onShowHostToggle={store.toggleShowHost}
      showKubeDns={store.controls.showKubeDns}
      onShowKubeDnsToggle={store.toggleShowKubeDns}
      showRemoteNode={store.controls.showRemoteNode}
      onShowRemoteNodeToggle={store.toggleShowRemoteNode}
      showPrometheusApp={store.controls.showPrometheusApp}
      onShowPrometheusAppToggle={store.toggleShowPrometheusApp}
      showKubeApiServer={store.controls.showKubeApiServer}
      onShowKubeApiServerToggle={store.toggleShowKubeApiServer}
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
            arrowRenderer={ServiceMapArrowRenderer}
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
            text={
              flowsWaitTimeout
                ? `No flows found for ${store.controls.currentNamespace} namespace. Will continue to monitor for new flows…`
                : 'Waiting for flows to show on service map…'
            }
            spinnerIntent={flowsWaitTimeout ? 'none' : 'success'}
          />
        )}
      </div>

      <DetailsPanel
        namespace={store.controls.currentNamespace}
        dataMode={transferState.dataMode}
        flowsWaitTimeout={flowsWaitTimeout}
        flows={store.currentFrame.interactions.flows}
        flowsTableVisibleColumns={flowsTableColumns.visible}
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
        onFlowsTableColumnToggle={flowsTableColumns.toggle}
      />
    </div>
  );
});
