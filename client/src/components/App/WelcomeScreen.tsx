import React, { memo, useCallback } from 'react';
import { Spinner } from '@blueprintjs/core';

import css from './WelcomeScreen.scss';

import hubbleLogo from '~/assets/images/hubble-logo.png';

export interface Props {
  namespaces: string[];
  onNamespaceChange: (namespace: string) => void;
}

export const WelcomeScreen = memo<Props>(function WelcomeScreen(props) {
  const someNamespacesLoaded = props.namespaces.length > 0;

  return (
    <div className={css.wrapper}>
      <div className={css.content}>
        <img src={hubbleLogo} className={css.logo} />
        <h1 className={css.title}>Welcome!</h1>
        <p className={css.description}>
          To begin select one of the namespaces:
        </p>
        {someNamespacesLoaded ? (
          <ul className={css.namespacesList}>
            {props.namespaces.map(namespace => (
              <NamespaceItem
                key={namespace}
                namespace={namespace}
                onClick={props.onNamespaceChange}
              />
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
  namespace: string;
  onClick: (namespace: string) => void;
}

const NamespaceItem = memo<NamespaceItemProps>(function NamespaceItem(props) {
  const onClick = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();
      props.onClick(props.namespace);
    },
    [props.onClick],
  );

  return (
    <li>
      <a href={`/${props.namespace}`} onClick={onClick}>
        {props.namespace}
      </a>
    </li>
  );
});
