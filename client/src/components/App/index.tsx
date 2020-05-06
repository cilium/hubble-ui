import { RouteComponentProps, Router, useNavigate } from '@reach/router';
import { observer } from 'mobx-react';
import React, {
  FunctionComponent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { API, IStream } from '~/api/general';
import { DragPanel } from '~/components/DragPanel';
import { FlowsTable } from '~/components/FlowsTable';
import { FlowsTableSidebar } from '~/components/FlowsTable/Sidebar';
import { Map } from '~/components/Map';
import { TopBar } from '~/components/TopBar';
import { HubbleFlow } from '~/domain/flows';
import { ServiceCard } from '~/domain/service-card';
import { Interactions } from '~/domain/service-map';
import { useStore } from '~/store';
import { usePanelDrag } from './hooks/usePanelDrag';
import css from './styles.scss';

export interface AppProps extends RouteComponentProps {
  api: API;
}

const loadData = async (api: API, namespace: string) => {
  const flowsStream = await api.v1.getFlowsStream({ namespace });
  const services = await api.v1.getServices();
  const links = await api.v1.getLinks();

  return { flowsStream, services, links };
};

export const AppComponent: FunctionComponent<AppProps> = observer(props => {
  const { api } = props;
  const { bindDrag, gridTemplateRows } = usePanelDrag();
  const [loading, setLoading] = useState(true);
  const [flowsDiffCount, setFlowsDiffCount] = useState({ value: 0 });
  const [flowsStream, setFlowsStream] = useState<IStream<HubbleFlow[]> | null>(
    null,
  );
  const store = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    api.v1.getNamespaces().then((nss: Array<string>) => {
      store.setNamespaces(nss);
    });
  }, []);

  useEffect(() => {
    // if (!store.currentNamespace) {
    //   return;
    // }
    loadData(api, store.currentNamespace || 'default')
      .then(({ services, links, ...data }) => {
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
      })
      .finally(() => {
        setLoading(false);
      });
  }, [store.currentNamespace]);

  const onNsChange = useCallback((ns: string) => {
    store.setNamespaceByName(ns);
    navigate(`/${ns}`);
  }, []);

  const onServiceSelect = useCallback((srvc: ServiceCard) => {
    store.services.toggleActive(srvc.id);
  }, []);

  const onCloseFlowsTableSidebar = useCallback(() => {
    store.selectTableFlow(null);
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
    <div className={css.wrapper} style={{ gridTemplateRows }}>
      <TopBar
        namespaces={store.namespaces}
        currentNsIdx={store.currentNsIdx}
        onNsChange={onNsChange}
      />

      <div className={css.map}>
        <Map
          services={store.services.data}
          namespace={store.currentNamespace}
          interactions={interactions}
          onServiceSelect={onServiceSelect}
          activeServices={store.services.activeSet}
        />
      </div>
      <DragPanel bindDrag={bindDrag} />
      <div className={css.panel}>
        <FlowsTable
          flows={store.interactions.flows}
          flowsDiffCount={flowsDiffCount}
        />
        {store.selectedTableFlow && (
          <FlowsTableSidebar
            flow={store.selectedTableFlow}
            onClose={onCloseFlowsTableSidebar}
          />
        )}
      </div>
    </div>
  );
});

export const App = (props: AppProps) => (
  <Router>
    <AppComponent api={props.api} path="/*appPath" />
  </Router>
);
