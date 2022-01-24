import { observer } from 'mobx-react';
import React, { useEffect } from 'react';

import { CoreAPIv1 } from '~/api/general';
import { Notifier, useNotifier } from '~/notifier';
import { useStore } from '~/store';

export interface Props {
  api: CoreAPIv1;
  children: React.ReactNode;
  onError?: (err: Error, n: Notifier) => void;
}

export const FeatureFlagsFetcher = observer(function FeatureFlagsFetcher(
  props: Props,
) {
  const store = useStore();
  const notifier = useNotifier();

  useEffect(() => {
    props.api
      .getFeatureFlags()
      .then(features => {
        console.log(features);
        store.setFeatures(features);
      })
      .catch(error => props.onError?.(error, notifier));
  }, [props.api, props.onError]);

  return <>{props.children}</>;
});
