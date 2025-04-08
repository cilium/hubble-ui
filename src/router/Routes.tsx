import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

import { ServiceMapApp } from '~/components/ServiceMapApp';

import { Router, ApplicationPath } from './router';
import { extractPathname } from './utils';

export type Props = {
  router: Router;
  RootComponent: JSX.Element;
};

export const Routes = function Routes(props: Props) {
  const router = createBrowserRouter(
    [
      {
        path: '/',
        element: props.RootComponent,
        children: [
          {
            path: ApplicationPath.ServiceMap,
            element: <ServiceMapApp />,
          },
        ],
      },
    ],
    {
      basename: extractPathname(document.querySelector('base')?.href ?? '/'),
    },
  );

  return <RouterProvider router={router} />;
};
