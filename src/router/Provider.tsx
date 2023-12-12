import React, { createContext, PropsWithChildren, useContext, useEffect } from 'react';
import { Outlet, useSearchParams, useLocation, useNavigate } from 'react-router-dom';
import _ from 'lodash';

import { Router } from './router';
import { Routes } from './Routes';

export const RouterContext = createContext<Router | null>(null);

export type Props = PropsWithChildren<{
  router: Router;
}>;

export const RouterProvider = (props: PropsWithChildren<Props>) => {
  return (
    <RouterContext.Provider value={props.router}>
      <Routes router={props.router} RootComponent={<RouterWrapper router={props.router} />} />
    </RouterContext.Provider>
  );
};

const RouterWrapper = function RouterWrapper(props: Props) {
  const loc = useLocation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    // NOTE: This call updates routers' searchParams ref when actual search params in url were
    // changed.
    props.router.searchParamsUpdated(searchParams);
  }, [searchParams, props]);

  useEffect(() => {
    props.router.locationUpdated(loc);
  }, [loc, props]);

  useEffect(() => {
    return props.router
      .onCommit((path, sparams, opts) => {
        const qs = sparams?.toString() || '';
        const finalPath = `${path}${qs.length > 1 ? '?' + qs : ''}`;

        console.log(`router commit: ${finalPath}`);
        navigate(finalPath, opts);
      })
      .disposer()
      .asFunction();
  }, [props]);

  return <Outlet />;
};

export const useRouter = () => {
  const router = useContext(RouterContext);
  if (!router) {
    throw new Error('useRouter must be used within a RouterProvider.');
  }

  return router;
};
