import React from 'react';
import { createMemoryRouter, createBrowserRouter, RouterProvider } from 'react-router-dom';

import { ServiceMapApp } from '~/components/ServiceMapApp';

import { Router, ApplicationPath } from './router';

export type Props = {
  router: Router;
  RootComponent: JSX.Element;
};

const pathname = (href: string | undefined) => {
  if (href == null) return undefined;
  try {
    return new URL(href).pathname;
  } catch (e) {
    console.error('Failed to determine base path', e);
    return undefined;
  }
};

export const Routes = function Routes(props: Props) {
  const createRouter = props.router.isInMemory ? createMemoryRouter : createBrowserRouter;
  const opts = props.router.isInMemory
    ? undefined
    : {
        basename: pathname(document.querySelector('base')?.href),
      };

  const router = createRouter(
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
    opts,
  );

  return <RouterProvider router={router} />;
};
