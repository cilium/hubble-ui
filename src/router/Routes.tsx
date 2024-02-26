import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

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
