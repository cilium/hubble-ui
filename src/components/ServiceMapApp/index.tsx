import React, { useCallback, useEffect, useState, useRef } from 'react';
import { observer } from 'mobx-react';
import * as mobx from 'mobx';

import { TopBar } from '~/components/TopBar';
import { DetailsPanel, ResizeProps as DetailsResizeProps } from '~/components/DetailsPanel';

import { Map } from '~/components/Map';
import {
  getProps as getLoadingOverlayProps,
  LoadingOverlay,
} from '~/components/Misc/LoadingOverlay';
import { ServiceMapCard } from '~/components/ServiceMapCard';
import { CardProps } from '~/components/Card';
import { ServiceMapArrowsRenderer } from '~/components/ServiceMapArrowRenderer';
import { WelcomeScreen } from './WelcomeScreen';

import { Verdict, TCPFlagName, PodSelector } from '~/domain/hubble';
import { ServiceCard } from '~/domain/service-map';
import { KV, Labels } from '~/domain/labels';
import { FilterEntry, FilterDirection } from '~/domain/filtering';

import { useApplication } from '~/application';

import { sizes } from '~/ui/vars';
import { useFlowsTableColumns } from './hooks/useColumns';
import css from './styles.scss';

export const ServiceMapApp = observer(function ServiceMapApp() {
  const { store, ui, dataLayer } = useApplication();

  const onFlowsDiffCount = useRef<(diff: number) => void>();
  const [mapVisibleHeight, setMapVisibleHeight] = useState<number | null>(null);
  const [mapWasDragged, setMapWasDragged] = useState(false);
  const flowsTableColumns = useFlowsTableColumns();
  const [flowsWaitTimeout, setFlowsWaitTimeout] = useState<boolean>(false);

  useEffect(() => {
    if (!store.namespaces.current) return;
    setFlowsWaitTimeout(false);

    const stop = setTimeout(() => {
      setFlowsWaitTimeout(true);
    }, 5000);

    return () => clearTimeout(stop);
  }, [store.namespaces.current]);

  useEffect(() => {
    return dataLayer.serviceMap
      .onFlowsDiffCount((diff, frame) => {
        if (store.currentFrame !== frame) return;

        onFlowsDiffCount.current?.(diff);
      })
      .disposer()
      .asFunction();
  }, [store.currentFrame]);

  useEffect(() => {
    setMapWasDragged(false);
  }, [store.filters]);

  const onCardSelect = useCallback((srvc: ServiceCard) => {
    ui.serviceMap.onCardSelect(srvc);
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
    ui.controls.toggleVerdict(v);
  }, []);

  const onSidebarTCPFlagClick = useCallback((flag?: TCPFlagName, dir?: FilterDirection) => {
    if (!flag || !dir) return ui.controls.setFlowFilters([]);

    ui.controls.setFlowFilters([FilterEntry.newTCPFlag(flag).setDirection(dir)]);
  }, []);

  const onSidebarLabelClick = useCallback((label?: KV, dir?: FilterDirection) => {
    if (!label || !dir) return ui.controls.setFlowFilters([]);
    const labelStr = Labels.concatKV(label);

    ui.controls.setFlowFilters([FilterEntry.newLabel(labelStr).setDirection(dir)]);
  }, []);

  const onSidebarPodClick = useCallback((podSelector?: PodSelector, dir?: FilterDirection) => {
    if (!podSelector || !dir) return ui.controls.setFlowFilters([]);

    ui.controls.setFlowFilters([FilterEntry.newPodSelector(podSelector).setDirection(dir)]);
  }, []);

  const onSidebarIdentityClick = useCallback((identity?: string, dir?: FilterDirection) => {
    if (identity == null || !dir) return ui.controls.setFlowFilters([]);

    ui.controls.setFlowFilters([FilterEntry.newIdentity(identity).setDirection(dir)]);
  }, []);

  const onSidebarIpClick = useCallback((ip?: string, dir?: FilterDirection) => {
    if (ip == null || !dir) return ui.controls.setFlowFilters([]);

    ui.controls.setFlowFilters([FilterEntry.newIP(ip).setDirection(dir)]);
  }, []);

  const onSidebarDnsClick = useCallback((dns?: string) => {
    if (dns == null) return ui.controls.setFlowFilters([]);

    ui.controls.setFlowFilters([FilterEntry.newDNS(dns).setDirection(FilterDirection.Either)]);
  }, []);

  const cardRenderer = mobx.action((props: CardProps<ServiceCard>) => {
    const l7endpoints = store.currentFrame.interactions.l7endpoints;

    return (
      <ServiceMapCard
        {...props}
        key={props.card.id}
        active={ui.serviceMap.isCardActive(props.card)}
        isUnsizedMode={props.isUnsizedMode}
        collector={ui.serviceMap.collector}
        currentNamespace={store.namespaces.current?.namespace}
        className={props.className}
        l7endpoints={l7endpoints.forReceiver(props.card.id)}
        maxHttpEndpointsVisible={5}
        isClusterMeshed={store.currentFrame.services.isClusterMeshed}
        onHeaderClick={onCardSelect}
      />
    );
  });

  const loadingOverlay = getLoadingOverlayProps(
    flowsWaitTimeout,
    dataLayer.transferState.dataMode,
    store.namespaces.current?.namespace,
  );

  const RenderedTopBar = (
    <TopBar
      transferState={dataLayer.transferState}
      status={dataLayer.transferState.deploymentStatus || undefined}
      namespaces={store.availableNamespaces}
      currentNamespace={store.currentNamespace}
      onNamespaceChange={ns => ui.controls.namespaceChanged(ns?.namespace)}
      selectedVerdict={store.controls.activeVerdict}
      onVerdictChange={v => ui.controls.toggleVerdict(v)}
      selectedHttpStatus={store.controls.httpStatus}
      onHttpStatusChange={store.controls.setHttpStatus}
      flowFilters={store.controls.filteredFlowFilters}
      onChangeFlowFilters={ff => ui.controls.setFlowFilters(ff)}
      showHost={ui.controls.isHostShown}
      onShowHostToggle={() => ui.controls.toggleShowHost()}
      showKubeDns={store.controls.showKubeDns}
      onShowKubeDnsToggle={() => ui.controls.toggleShowKubeDNS()}
      showRemoteNode={store.controls.showRemoteNode}
      onShowRemoteNodeToggle={() => ui.controls.toggleShowRemoteNode()}
      showPrometheusApp={store.controls.showPrometheusApp}
      onShowPrometheusAppToggle={() => ui.controls.toggleShowPrometheusApp()}
    />
  );

  if (!store.currentNamespace) {
    return (
      <div className={css.app}>
        {RenderedTopBar}
        <WelcomeScreen
          namespaces={store.availableNamespaces}
          onNamespaceChange={ns => ui.controls.namespaceChanged(ns?.namespace)}
        />
      </div>
    );
  }

  return (
    <div className={css.app}>
      {RenderedTopBar}

      <div className={css.map}>
        {store.currentFrame.services.cardsList.length > 0 ? (
          <Map
            namespace={store.namespaces.current?.namespace}
            namespaceBBox={ui.serviceMap.placement.namespaceBBox}
            placement={ui.serviceMap.placement}
            arrows={ui.serviceMap.arrows}
            arrowsRenderer={ServiceMapArrowsRenderer}
            cards={store.currentFrame.services.cardsList}
            cardRenderer={cardRenderer}
            visibleHeight={mapVisibleHeight ?? 0}
            wasDragged={mapWasDragged}
            onMapDrag={onMapDrag}
            onCardMutated={muts => ui.serviceMap.cardsMutationsObserved(muts)}
          />
        ) : (
          <LoadingOverlay
            height={mapVisibleHeight ?? '50%'}
            text={loadingOverlay.text.map}
            spinnerIntent={loadingOverlay.spinnerIntent}
            isSpinnerHidden={loadingOverlay.isSpinnerHidden}
          />
        )}
      </div>

      <DetailsPanel
        namespace={store.namespaces.current?.namespace || null}
        transferState={dataLayer.transferState}
        flowsWaitTimeout={flowsWaitTimeout}
        flows={store.currentFrame.interactions.flows}
        flowsTableVisibleColumns={flowsTableColumns.visible}
        filters={store.filters}
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
        onPanelResize={onPanelResize}
        onFlowsDiffCount={onFlowsDiffCount}
        onFlowsTableColumnToggle={flowsTableColumns.toggle}
      />
    </div>
  );
});
