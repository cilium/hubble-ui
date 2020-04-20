import { RouteComponentProps, Router, useNavigate } from '@reach/router';
import { observer } from 'mobx-react';
import React, {
  FunctionComponent,
  useCallback,
  useEffect,
  useState,
} from 'react';
import { animated } from 'react-spring';
import { API } from '~/api';
import { FlowsTable } from '~/components/FlowsTable';
import { Map } from '~/components/Map';
import { TopBar } from '~/components/TopBar';
import { ServiceCard } from '~/domain/service-card';
import { useStore } from '~/store';
import { usePanelDrag } from './hooks/usePanelDrag';
import css from './styles.scss';

export interface AppProps extends RouteComponentProps {
  api: API;
}

const loadData = async (api: API) => {
  const flows = await api.v1.getFlows();
  const services = await api.v1.getServices();

  return { flows, services };
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
      .then(({ flows, services }) => {
        // Kind a temporal function to setup everything we need for now in store
        store.setup({ flows, services });
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
