import React, { useState, useEffect, FunctionComponent } from 'react';
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
import { usePanelDrag } from './hooks/usePanelDrag';
import { useStore } from '~/store';
import { API } from '~/api';

import css from './styles.scss';

export interface AppOwnProps {
  api: API;
}

export type AppProps = RouteComponentProps & AppOwnProps;

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

  if (loading) {
    return <div>Data is being loaded</div>;
  }

  const onNsChange = (ns: string) => {
    store.setNamespaceByName(ns);
    navigate(`/?ns=${ns}`);
  };

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
        />
      </div>
      <animated.div {...bindDrag()} className={css.drag}>
        Drag
      </animated.div>
      <div className={css.panel}>Panel</div>
    </div>
  );
});

export const App = (props: AppOwnProps) => (
  <Router>
    <AppComponent api={props.api} default />
  </Router>
);
