import { RouteComponentProps, Router } from '@reach/router';
import { observer } from 'mobx-react';
import React, {
  FunctionComponent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { API, FlowsStreamParams, ThrottledFlowsStream } from '~/api/general';
import { DetailsPanel } from '~/components/DetailsPanel';
import { Map } from '~/components/Map';
import { TopBar } from '~/components/TopBar';
import { FlowsFilterEntry, FlowsFilterUtils } from '~/domain/flows';
import { Vec2 } from '~/domain/geometry';
import { Verdict } from '~/domain/hubble';
import { ResolveType } from '~/domain/misc';
import { ServiceCard } from '~/domain/service-card';
import { Interactions } from '~/domain/service-map';
import { useStore } from '~/store';
import css from './styles.scss';

export interface AppProps extends RouteComponentProps {
  api: API;
}

interface LoadDataParams {
  api: API;
  flowsStreamParams: FlowsStreamParams;
}

const loadData = async (params: LoadDataParams) => {
  const flowsStream = await params.api.v1.getFlowsStream(
    params.flowsStreamParams,
  );
  const services = await params.api.v1.getServices();
  const links = await params.api.v1.getLinks();

  return { flowsStream, services, links };
};

type LoadedData = ResolveType<ReturnType<typeof loadData>>;

export const AppComponent: FunctionComponent<AppProps> = observer(props => {
  const { api } = props;
  const [loading, setLoading] = useState(true);
  const [flowsDiffCount, setFlowsDiffCount] = useState({ value: 0 });
  const [flowsStream, setFlowsStream] = useState<ThrottledFlowsStream | null>(
    null,
  );

  const store = useStore();

  useEffect(() => {
    api.v1.getNamespaces().then((nss: Array<string>) => {
      store.setNamespaces(nss);
    });
  }, []);

  useEffect(() => {
    if (!store.route.namespace) {
      return;
    }

    const onLoad = (data: LoadedData) => {
      const { services, links } = data;
      // Kind a temporal function to setup everything we need for now in store
      store.setup({ services });
      store.updateInteractions({ links });

      if (flowsStream) {
        flowsStream.stop();
        store.interactions.clearFlows();
      }

      data.flowsStream.subscribe(flows => {
        const { flowsDiffCount } = store.interactions.addFlows(flows);
        setFlowsDiffCount({ value: flowsDiffCount });
      });

      setFlowsStream(data.flowsStream);
    };

    const params = {
      api,
      flowsStreamParams: {
        namespace: store.route.namespace,
        verdict: store.route.verdict,
        httpStatus: store.route.httpStatus,
        filters: store.route.flowFilters,
      },
    };

    loadData(params)
      .then(onLoad)
      .finally(() => setLoading(false));
  }, [
    store.route.namespace,
    store.route.verdict,
    store.route.httpStatus,
    store.route.flowFilters,
  ]);

  const onNsChange = useCallback((ns: string) => {
    store.route.goto(`/${ns}`);
  }, []);

  const onServiceSelect = useCallback((srvc: ServiceCard) => {
    store.services.toggleActive(srvc.id);
  }, []);

  const onSelectVerdict = useCallback((verdict: Verdict | null) => {
    store.route.setParam('verdict', verdict);
  }, []);

  const onSelectHttpStatus = useCallback((httpStatus: string | null) => {
    store.route.setParam('http-status', httpStatus);
  }, []);

  const onChangeFlowFilters = useCallback((values: FlowsFilterEntry[]) => {
    store.route.setParam(
      'flows-filter',
      values.map(FlowsFilterUtils.createFilterString),
    );
  }, []);

  const onCloseFlowsTableSidebar = useCallback(() => {
    store.selectTableFlow(null);
  }, []);

  const onEmitAPConnectorCoords = useCallback((apId: string, coords: Vec2) => {
    store.layout.setAPCoords(apId, coords);
  }, []);

  const interactions = useMemo(() => {
    return {
      links: store.interactions.links,
    } as Interactions;
  }, [store.interactions.all]);

  if (loading) {
    return <div>Loading</div>;
  }

  return (
    <div className={css.app}>
      <TopBar
        namespaces={store.namespaces}
        currentNamespace={store.route.namespace}
        onNsChange={onNsChange}
      />

      <div className={css.map}>
        <Map
          services={store.services.data}
          namespace={store.route.namespace}
          interactions={interactions}
          activeServices={store.services.activeSet}
          onServiceSelect={onServiceSelect}
          onEmitAPConnectorCoords={onEmitAPConnectorCoords}
        />
      </div>

      <DetailsPanel
        resizable={true}
        flows={store.interactions.flows}
        flowsDiffCount={flowsDiffCount}
        selectedFlow={store.selectedTableFlow}
        onSelectFlow={store.selectTableFlow}
        selectedVerdict={store.route.verdict}
        onSelectVerdict={onSelectVerdict}
        selectedHttpStatus={store.route.httpStatus}
        onSelectHttpStatus={onSelectHttpStatus}
        onCloseSidebar={onCloseFlowsTableSidebar}
        flowFilters={store.route.flowFilters}
        onChangeFlowFilters={onChangeFlowFilters}
        tsUpdateDelay={flowsStream?.throttleDelay}
      />
    </div>
  );
});

export const App = (props: AppProps) => (
  <Router>
    <AppComponent api={props.api} path="/*appPath" />
  </Router>
);
