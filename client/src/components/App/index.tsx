import React, {
  FunctionComponent,
  useCallback,
  useEffect,
  useState,
} from 'react';
import { RouteComponentProps, Router } from '@reach/router';
import { observer } from 'mobx-react';

import { TopBar } from '~/components/TopBar';
import { DetailsPanel } from '~/components/DetailsPanel';
import { Map } from '~/components/Map';
import { LoadingOverlay } from '~/components/Misc/LoadingOverlay';

import { FlowsFilterEntry } from '~/domain/flows';
import { HubbleFlow, Verdict } from '~/domain/hubble';
import { ServiceCard } from '~/domain/service-card';
import { Vec2 } from '~/domain/geometry';
import { setupDebugProp } from '~/domain/misc';

import * as mockData from '~/api/__mocks__/data';
import { useStore } from '~/store';
import { useNotifier } from '~/notifier';

import { API } from '~/api/general';
import {
  EventParamsSet,
  EventKind as EventStreamEventKind,
  NamespaceChange,
  ServiceChange,
  ServiceLinkChange,
  IEventStream,
} from '~/api/general/event-stream';

import css from './styles.scss';
import { GeneralStreamEventKind } from '~/api/general/stream';
import { WelcomeScreen } from './WelcomeScreen';

export interface AppProps extends RouteComponentProps {
  api: API;
}

export const AppComponent: FunctionComponent<AppProps> = observer(props => {
  const { api } = props;
  const [flowsDiffCount, setFlowsDiffCount] = useState({ value: 0 });
  const [eventStream, setEventStream] = useState<IEventStream | null>(null);
  const [isStreaming, setIsStreaming] = useState<boolean>(true);

  const store = useStore();
  const notifier = useNotifier();

  useEffect(() => {
    setIsStreaming(Boolean(eventStream));
  }, [eventStream]);

  useEffect(() => {
    setupDebugProp({
      stopFlows: () => {
        if (eventStream == null) return;

        eventStream.stop();
      },
    });
  }, [eventStream]);

  // prettier-ignore
  const setupNamespaceEventHandlers = useCallback((stream: IEventStream) => {
    stream.on(EventStreamEventKind.Namespace, (nsChange: NamespaceChange) => {
      store.applyNamespaceChange(nsChange.name, nsChange.change);
    });
  }, [store]);

  // prettier-ignore
  const setupServicesEventHandlers = useCallback((stream: IEventStream) => {
    stream.on(EventStreamEventKind.Service, (svcChange: ServiceChange) => {
      store.applyServiceChange(svcChange.service, svcChange.change);
    });

    stream.on(EventStreamEventKind.Flows, (flows: HubbleFlow[]) => {
      const { flowsDiffCount } = store.interactions.addFlows(flows);
      setFlowsDiffCount({ value: flowsDiffCount });
    });

    stream.on(EventStreamEventKind.ServiceLink, (link: ServiceLinkChange) => {
      store.applyServiceLinkChange(link.serviceLink, link.change);
    });
  }, [store]);

  const setupGeneralEventHandlers = useCallback((stream: IEventStream) => {
    stream.on(GeneralStreamEventKind.Error, () => {
      setIsStreaming(false);
      notifier.showError(`
        Failed to receive data from backend.
        Please make sure that your deployment is up and try again.
      `);
    });

    stream.on(GeneralStreamEventKind.End, () => {
      setIsStreaming(false);
    });
  }, []);

  useEffect(() => {
    console.log('store.mocked: ', store.mocked);

    if (store.mocked) {
      const links = mockData.links;
      const services = mockData.endpoints;

      store.setup({ services });
      store.updateInteractions({ links });
      store.controls.setCurrentNamespace(mockData.selectedNamespace);
      store.controls.setCrossNamespaceActivity(true);
      setIsStreaming(true);
      return;
    }

    if (store.controls.currentNamespace != null) return;

    const stream = api.v1.getEventStream(EventParamsSet.Namespaces);

    setupNamespaceEventHandlers(stream);
    setupGeneralEventHandlers(stream);
    setEventStream(stream);
  }, []);

  useEffect(() => {
    if (!store.controls.currentNamespace || store.mocked) {
      return;
    }

    const streamParams = {
      namespace: store.controls.currentNamespace,
      verdict: store.route.verdict,
      httpStatus: store.route.httpStatus,
      filters: store.route.flowFilters,
    };

    let previousStopped = Promise.resolve();
    if (eventStream != null) {
      previousStopped = eventStream.stop(true);
    }

    previousStopped.then(() => {
      const newStream = api.v1.getEventStream(EventParamsSet.All, streamParams);

      setupNamespaceEventHandlers(newStream);
      setupServicesEventHandlers(newStream);
      setupGeneralEventHandlers(newStream);

      setEventStream(newStream);
    });
  }, [
    store.controls.currentNamespace,
    store.controls.verdict,
    store.controls.httpStatus,
    store.controls.flowFilters,
  ]);

  const onNamespaceChange = useCallback((ns: string) => {
    store.controls.setCurrentNamespace(ns);
  }, []);

  const onCardSelect = useCallback((srvc: ServiceCard) => {
    const isActive = store.toggleActiveService(srvc.id);
    store.setFlowFiltersForActiveCard(srvc.id, isActive);
  }, []);

  const onSelectVerdict = useCallback((verdict: Verdict | null) => {
    store.controls.setVerdict(verdict);
  }, []);

  const onSelectHttpStatus = useCallback((httpStatus: string | null) => {
    store.controls.setHttpStatus(httpStatus);
  }, []);

  const onChangeFlowFilters = useCallback((ffs: FlowsFilterEntry[]) => {
    store.setFlowFilters(ffs);
  }, []);

  const onCloseFlowsTableSidebar = useCallback(() => {
    store.controls.selectTableFlow(null);
  }, []);

  const onEmitAccessPointCoords = useCallback((apId: string, coords: Vec2) => {
    store.layout.setAPCoords(apId, coords);
  }, []);

  const onStreamStop = useCallback(() => {
    if (!eventStream) return;

    eventStream.stop().then(() => {
      setEventStream(null);
    });
  }, [eventStream]);

  const isCardActive = useCallback(
    (id: string) => store.services.isCardActive(id),
    [store.services.activeCardsList],
  );

  const mapLoaded = store.layout.placement.length > 0 && isStreaming;

  const RenderedTopBar = (
    <TopBar
      isStreaming={isStreaming}
      namespaces={store.controls.namespaces}
      currentNamespace={store.controls.currentNamespace}
      onNamespaceChange={onNamespaceChange}
      selectedVerdict={store.controls.verdict}
      onSelectVerdict={onSelectVerdict}
      selectedHttpStatus={store.controls.httpStatus}
      onSelectHttpStatus={onSelectHttpStatus}
      flowFilters={store.controls.flowFilters}
      onChangeFlowFilters={onChangeFlowFilters}
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
            namespaceBBox={store.layout.namespaceBBox}
            placement={store.layout.placement}
            accessPoints={store.accessPoints}
            accessPointsCoords={store.layout.accessPointsCoords}
            arrows={store.layout.arrows}
            isCardActive={isCardActive}
            onCardSelect={onCardSelect}
            onEmitAccessPointCoords={onEmitAccessPointCoords}
            onCardHeightChange={store.layout.setCardHeight}
          />
        ) : (
          <LoadingOverlay height="50%" text="Waiting for service map data…" />
        )}
      </div>

      <DetailsPanel
        resizable={true}
        isStreaming={isStreaming}
        flows={store.interactions.flows}
        flowsDiffCount={flowsDiffCount}
        selectedFlow={store.controls.selectedTableFlow}
        onSelectFlow={store.controls.selectTableFlow}
        onCloseSidebar={onCloseFlowsTableSidebar}
        tsUpdateDelay={eventStream?.flowsDelay}
        onStreamStop={onStreamStop}
      />
    </div>
  );
});

export const App = (props: AppProps) => (
  <Router>
    <AppComponent api={props.api} path="/*appPath" />
  </Router>
);
