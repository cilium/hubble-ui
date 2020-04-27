import React, {
  FunctionComponent,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';

import { RouteComponentProps, Router, useNavigate } from '@reach/router';
import { observer } from 'mobx-react';
import { animated } from 'react-spring';

import { FlowsTable } from '~/components/FlowsTable';
import { Map } from '~/components/Map';
import { TopBar } from '~/components/TopBar';

import { ServiceCard } from '~/domain/service-card';
import { Interactions } from '~/domain/service-map';

import { usePanelDrag } from './hooks/usePanelDrag';
import { useStore } from '~/store';
import { API } from '~/api';

import css from './styles.scss';

export interface AppProps extends RouteComponentProps {
  api: API;
}

const loadData = async (api: API) => {
  const flowsStream = await api.v1.getFlowsStream();
  const services = await api.v1.getServices();
  const links = await api.v1.getLinks();

  return { flowsStream, services, links };
};

export const AppComponent: FunctionComponent<AppProps> = observer(function(
  props,
) {
  const { api } = props;
  const { bindDrag, gridTemplateRows } = usePanelDrag();
  const [loading, setLoading] = useState(true);
  const store = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    api.v1.getNamespaces().then((nss: Array<string>) => {
      store.setNamespaces(nss);
    });
  }, []);

  useEffect(() => {
    loadData(api)
      .then(({ flowsStream, services, links }) => {
        // Kind a temporal function to setup everything we need for now in store
        store.setup({ services });
        store.updateInteractions({ links } as Interactions);
        flowsStream.subscribe(flows => {
          store.interactions.addFlows(flows);
        });
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const onNsChange = useCallback((ns: string) => {
    store.setNamespaceByName(ns);
    navigate(`/${ns}`);
  }, []);

  const onServiceSelect = useCallback((srvc: ServiceCard) => {
    store.services.toggleActive(srvc.id);
  }, []);

  const interactions = useMemo(() => {
    return {
      links: store.interactions.links,
    } as Interactions;
  }, [store.interactions.all]);

  if (loading) {
    return <div>Data is being loaded</div>;
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
      <animated.div {...bindDrag()} className={css.drag}>
        Drag
      </animated.div>
      <div className={css.panel}>
        <FlowsTable flows={store.interactions.flows} />
      </div>
    </div>
  );
});

export const App = (props: AppProps) => (
  <Router>
    <AppComponent api={props.api} path="/*appPath" />
  </Router>
);
