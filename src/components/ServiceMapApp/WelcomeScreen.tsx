import React, { useCallback } from 'react';
import { Spinner } from '@blueprintjs/core';
import { observer } from 'mobx-react';

import { NamespaceDescriptor } from '~/domain/namespaces';

import { e2e } from '~e2e/client';

import css from './WelcomeScreen.scss';
import hubbleLogo from '~/assets/images/hubble-logo.png';

export interface Props {
  namespaces: NamespaceDescriptor[];
  onNamespaceChange: (namespace: NamespaceDescriptor) => void;
}

export const WelcomeScreen = observer(function WelcomeScreen(props: Props) {
  const someNamespacesLoaded = props.namespaces.length > 0;

  return (
    <div className={css.wrapper}>
      <div className={css.content}>
        <img src={hubbleLogo} className={css.logo} />
        <h1 className={css.title}>Welcome!</h1>
        <p className={css.description}>To begin select one of the namespaces:</p>
        {someNamespacesLoaded ? (
          <ul className={css.namespacesList} {...e2e.attributes.ns.listSelector()}>
            {props.namespaces.map(ns => (
              <NamespaceItem key={ns.namespace} namespace={ns} onClick={props.onNamespaceChange} />
            ))}
          </ul>
        ) : (
          <div className={css.spinnerWrapper}>
            <Spinner size={48} intent="primary" />
          </div>
        )}
      </div>
    </div>
  );
});

interface NamespaceItemProps {
  namespace: NamespaceDescriptor;
  onClick: (ns: NamespaceDescriptor) => void;
}

const NamespaceItem = observer(function NamespaceItem(props: NamespaceItemProps) {
  const onClick = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();
      props.onClick(props.namespace);
    },
    [props.onClick],
  );

  return (
    <li {...e2e.attributes.ns.availability(props.namespace.relay, false)}>
      <a href={`/${props.namespace.namespace}`} onClick={onClick}>
        {props.namespace.namespace}
      </a>
    </li>
  );
});
