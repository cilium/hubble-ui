import React from 'react';
import { observer } from 'mobx-react-lite';
import classNames from 'classnames';
import { Intent, Spinner } from '@blueprintjs/core';

import { unifiedFormatDate } from '~/domain/helpers/time';
import { StatusEntry } from '~/ui/status-center';

import css from './styles.scss';

export type Props = {
  entry: StatusEntry;
  className?: string;
  iconHidden?: boolean;
  componentHidden?: boolean;
  intentHidden?: boolean;
  backgrounded?: boolean;

  detailsTarget?: (e: StatusEntry) => React.ReactNode;
};

export const StatusEntryMessage = observer(function StatusEntryMessage(props: Props) {
  const { entry } = props;
  const cardinalityPrefix = entry.cardinalityPrefix ?? 'Repeated: ';

  const classes = classNames(css.statusEntryMessage, props.className, {
    [css.backgrounded]: !!props.backgrounded,
    [css.critical]: entry.isCritical,
    [css.error]: entry.isError,
    [css.warning]: entry.isWarning,
    [css.success]: entry.isSuccess,
    [css.info]: entry.isInfo,
    [css.debug]: entry.isDebug,
    [css.highlighted]: entry.isPending && !props.backgrounded,
  });

  return (
    <div className={classes}>
      {!entry.isPending && !props.iconHidden && (
        <div className={css.icon}>
          <img src="/icons/misc/exclamation-mark.svg" />
        </div>
      )}
      {entry.isPending && !props.iconHidden && (
        <div className={css.spinner}>
          <Spinner size={23} intent={Intent.DANGER} />
        </div>
      )}

      <div className={css.content}>
        <div className={css.meta}>
          <div className={css.left}>
            <div className={css.dateTime}>{unifiedFormatDate(entry.occuredAt).human}</div>

            {!props.intentHidden && <div className={css.intent}>{entry.intent}</div>}
            {!props.componentHidden && <div className={css.component}>{entry.component}</div>}
          </div>

          <div className={css.right}>
            {entry.cardinality > 1 && (
              <div className={css.cardinality}>
                {cardinalityPrefix}
                {entry.cardinality}
              </div>
            )}
          </div>
        </div>

        <div className={css.title}>{entry.title}</div>

        <div className={css.details}>
          {props.detailsTarget != null
            ? props.detailsTarget(entry) ?? entry.details
            : entry.details}
        </div>
      </div>
    </div>
  );
});
