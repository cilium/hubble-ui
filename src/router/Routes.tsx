import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

import { ServiceMapApp } from '~/components/ServiceMapApp';

import { Router, ApplicationPath } from './router';

export type Props = {
  router: Router;
  RootComponent: JSX.Element;
};

export const Routes = function Routes(props: Props) {
  const router = createBrowserRouter([
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
  ]);

  return <RouterProvider router={router} />;
};
