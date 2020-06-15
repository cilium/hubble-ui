import React, {
  FunctionComponent,
  useCallback,
  useEffect,
  useState,
} from 'react';
import _ from 'lodash';
import { RouteComponentProps, Router } from '@reach/router';
import { observer } from 'mobx-react';

import { TopBar } from '~/components/TopBar';
import { DetailsPanel } from '~/components/DetailsPanel';
import { Map } from '~/components/Map';

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

export interface AppProps extends RouteComponentProps {
  api: API;
}

export const AppComponent: FunctionComponent<AppProps> = observer(props => {
  const { api } = props;
  const [flowsDiffCount, setFlowsDiffCount] = useState({ value: 0 });
  const [eventStream, setEventStream] = useState<IEventStream | null>(null);

  const store = useStore();
  const notifier = useNotifier();

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
    stream.on('error', e => {
      notifier.showError(`
        Failed to receive data from backend.
        Please make sure that your deployment is up and try again.
      `);
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

  const onNsChange = useCallback((ns: string) => {
    store.controls.setCurrentNamespace(ns);
  }, []);

  const onServiceSelect = useCallback((srvc: ServiceCard) => {
    store.services.toggleActive(srvc.id);
  }, []);

  const onSelectVerdict = useCallback((verdict: Verdict | null) => {
    store.controls.setVerdict(verdict);
  }, []);

  const onSelectHttpStatus = useCallback((httpStatus: string | null) => {
    store.controls.setHttpStatus(httpStatus);
  }, []);

  const onChangeFlowFilters = useCallback((ffs: FlowsFilterEntry[]) => {
    store.controls.setFlowFilters(ffs);
  }, []);

  const onCloseFlowsTableSidebar = useCallback(() => {
    store.controls.selectTableFlow(null);
  }, []);

  const onEmitAPConnectorCoords = useCallback((apId: string, coords: Vec2) => {
    store.layout.setAPCoords(apId, coords);
  }, []);

  const onStreamStop = useCallback(() => {
    if (!eventStream) return;

    eventStream.stop().then(() => {
      setEventStream(null);
    });
  }, [eventStream]);

  return (
    <div className={css.app}>
      <TopBar
        namespaces={store.controls.namespaces}
        currentNamespace={store.controls.currentNamespace}
        onNsChange={onNsChange}
        selectedVerdict={store.controls.verdict}
        onSelectVerdict={onSelectVerdict}
        selectedHttpStatus={store.controls.httpStatus}
        onSelectHttpStatus={onSelectHttpStatus}
        flowFilters={store.controls.flowFilters}
        onChangeFlowFilters={onChangeFlowFilters}
      />

      <div className={css.map}>
        <Map
          services={store.services.data}
          namespace={store.controls.currentNamespace}
          accessPoints={store.accessPoints}
          activeServices={store.services.activeSet}
          onServiceSelect={onServiceSelect}
          onEmitAPConnectorCoords={onEmitAPConnectorCoords}
        />
      </div>

      <DetailsPanel
        resizable={true}
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
