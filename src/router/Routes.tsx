import React from 'react';
import { createMemoryRouter, createBrowserRouter, RouterProvider } from 'react-router-dom';

import { ServiceMapApp } from '~/components/ServiceMapApp';

import { Router, ApplicationPath } from './router';

export type Props = {
  router: Router;
  RootComponent: JSX.Element;
};

export const Routes = function Routes(props: Props) {
  const createRouter = props.router.isInMemory ? createMemoryRouter : createBrowserRouter;

  const router = createRouter([
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
