import * as _ from 'lodash';
import React, {
  FunctionComponent,
  useCallback,
  useEffect,
  useState,
  useMemo,
} from 'react';
import { IconNames } from '@blueprintjs/icons';
import { RouteComponentProps, Router } from '@reach/router';
import { observer } from 'mobx-react';

import { TopBar } from '~/components/TopBar';
import {
  DetailsPanel,
  ResizeProps as DetailsResizeProps,
} from '~/components/DetailsPanel';
import { Map } from '~/components/Map';
import { LoadingOverlay } from '~/components/Misc/LoadingOverlay';
import { WelcomeScreen } from './WelcomeScreen';

import { ServiceCard } from '~/domain/service-card';
import { Vec2 } from '~/domain/geometry';

import { useStore } from '~/store';
import { useNotifier } from '~/notifier';

import { API } from '~/api/general';
import * as storage from '~/storage/local';
import { DataManager, EventKind as DataManagerEvents } from './DataManager';

import { sizes } from '~/ui/vars';
import css from './styles.scss';

export interface AppProps extends RouteComponentProps {
  api: API;
}

export const AppComponent: FunctionComponent<AppProps> = observer(props => {
  const store = useStore();

  const [flowsDiffCount, setFlowsDiffCount] = useState({ value: 0 });
  const [isStreaming, setIsStreaming] = useState<boolean>(true);
  const [mapVisibleHeight, setMapVisibleHeight] = useState<number | null>(null);
  const [mapWasDragged, setMapWasDragged] = useState<boolean>(false);

  const frame = store.currentFrame;
  const notifier = useNotifier();
  const dataManager = useMemo(() => {
    return new DataManager(props.api, store);
  }, []);

  useEffect(() => {
    dataManager.on(DataManagerEvents.StreamError, () => {
      setIsStreaming(false);
      notifier.showError(`
        Failed to receive data from backend.
        Please make sure that your deployment is up and try again.
      `);
    });

    dataManager.on(DataManagerEvents.StreamEnd, () => {
      setIsStreaming(false);
    });

    dataManager.on(DataManagerEvents.StoreMocked, () => {
      setIsStreaming(true);
    });

    dataManager.on(DataManagerEvents.FlowsDiff, (value: number) => {
      setFlowsDiffCount({ value });
    });

    dataManager.on(
      DataManagerEvents.NamespaceAdded,
      _.debounce(() => {
        const { namespaces, currentNamespace } = store.controls;
        if (currentNamespace && namespaces.includes(currentNamespace)) return;

        const message = `Namespace "${currentNamespace}" is still not observed. Keep waiting for the data`;

        notifier.showWarning(message, 5000, IconNames.SEARCH_AROUND);

        storage.deleteLastNamespace();
      }, 2000),
    );

    if (store.mocked) {
      dataManager.setupMock();
    } else if (store.controls.currentNamespace == null) {
      dataManager.setupInitialStream();
    }
  }, [dataManager]);

  useEffect(() => {
    if (!store.controls.currentNamespace || store.mocked) return;
    const newNamespace = store.controls.currentNamespace;

    if (dataManager.currentNamespace !== newNamespace) {
      dataManager.resetNamespace(newNamespace);
    }

    if (dataManager.hasFilteringStream) {
      dataManager.dropFilteringFrame();
    }

    const filtersNonNull = !store.controls.isDefault;

    if (filtersNonNull) {
      dataManager.setupFilteringFrame(store.controls.currentNamespace);
    }

    setMapWasDragged(false);
  }, [store.controls.dataFilters]);

  const onNamespaceChange = useCallback((ns: string) => {
    store.flush();
    store.controls.setCurrentNamespace(ns);
  }, []);

  const onCardSelect = useCallback((srvc: ServiceCard) => {
    const isActive = store.toggleActiveService(srvc.id);
    store.setFlowFiltersForActiveCard(srvc.id, isActive);
  }, []);

  const onCloseFlowsTableSidebar = useCallback(() => {
    store.controls.selectTableFlow(null);
  }, []);

  const onAccessPointCoords = useCallback((apId: string, coords: Vec2) => {
    store.setAccessPointCoords(apId, coords);
  }, []);

  const onPanelResize = useCallback((resizeProps: DetailsResizeProps) => {
    const vh = resizeProps.panelTopInPixels - sizes.topBarHeight;
    setMapVisibleHeight(vh);
  }, []);

  const onMapDrag = useCallback((val: boolean) => {
    setMapWasDragged(val);
  }, []);

  // prettier-ignore
  const isCardActive = useCallback((id: string) => {
    return frame.isCardActive(id);
  },[frame.services.activeCardsList]);

  const mapLoaded = frame.layout.placement.length > 0 && isStreaming;

  const RenderedTopBar = (
    <TopBar
      isStreaming={isStreaming}
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
            namespace={frame.controls.currentNamespace}
            namespaceBBox={frame.layout.namespaceBBox}
            placement={frame.layout.placement}
            visibleHeight={mapVisibleHeight ?? 0}
            accessPoints={frame.interactions.accessPoints}
            accessPointsCoords={frame.layout.accessPointsCoords}
            arrows={frame.layout.arrows}
            isCardActive={isCardActive}
            wasDragged={mapWasDragged}
            onCardSelect={onCardSelect}
            onAccessPointCoords={onAccessPointCoords}
            onCardHeightChange={frame.layout.setCardHeight}
            onMapDrag={onMapDrag}
          />
        ) : (
          <LoadingOverlay height="50%" text="Waiting for service map data…" />
        )}
      </div>

      <DetailsPanel
        isStreaming={isStreaming}
        flows={frame.interactions.flows}
        flowsDiffCount={flowsDiffCount}
        selectedFlow={frame.controls.selectedTableFlow}
        onSelectFlow={frame.controls.selectTableFlow}
        onCloseSidebar={onCloseFlowsTableSidebar}
        tsUpdateDelay={dataManager.flowsDelay}
        onPanelResize={onPanelResize}
      />
    </div>
  );
});

export const App = (props: AppProps) => (
  <Router>
    <AppComponent api={props.api} path="/*appPath" />
  </Router>
);
