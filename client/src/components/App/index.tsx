import React, {
  useState,
  useEffect,
  useCallback,
  FunctionComponent,
} from 'react';
import { observer } from 'mobx-react';
import { animated } from 'react-spring';
import {
  Router,
  RouteComponentProps,
  useParams,
  useNavigate,
} from '@reach/router';

import { Map } from '~/components/Map';
import { TopBar } from '~/components/TopBar';
import { ServiceCard } from '~/domain/service-card';
import { usePanelDrag } from './hooks/usePanelDrag';
import { useStore } from '~/store';
import { API } from '~/api';

import css from './styles.scss';

export interface AppProps extends RouteComponentProps {
  api: API;
}

const loadData = async (api: API) => {
  const services = await api.v1.getServices();

  return { services };
};

export const AppComponent: FunctionComponent<AppProps> = observer(function(
  props,
) {
  const { api } = props;
  const { bindDrag, gridTemplateRows } = usePanelDrag();
  const [loading, setLoading] = useState(true);
  const store = useStore();
  const { services } = store;
  const navigate = useNavigate();

  useEffect(() => {
    api.v1.getNamespaces().then((nss: Array<string>) => {
      store.setNamespaces(nss);
    });
  }, []);

  useEffect(() => {
    loadData(api)
      .then(({ services }) => {
        // Kind a temporal function to setup everything we need for now in store
        store.setup(services);
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
      <div className={css.panel}>Panel</div>
    </div>
  );
});

export const App = (props: AppProps) => (
  <Router>
    <AppComponent api={props.api} path="/*appPath" />
  </Router>
);
