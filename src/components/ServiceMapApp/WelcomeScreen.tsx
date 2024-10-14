import React from 'react';
import { Spinner } from '@blueprintjs/core';
import { observer } from 'mobx-react';

import { NamespaceDescriptor } from '~/domain/namespaces';
import { NamespaceSelectorDropdown } from '../TopBar/NamespaceSelectorDropdown';

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
          <NamespaceSelectorDropdown
            namespaces={props.namespaces}
            currentNamespace={null}
            onChange={props.onNamespaceChange}
          />
        ) : (
          <div className={css.spinnerWrapper}>
            <Spinner size={48} intent="primary" />
          </div>
        )}
      </div>
    </div>
  );
});
