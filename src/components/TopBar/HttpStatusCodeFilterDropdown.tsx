import { Button, ButtonGroup, Icon, InputGroup, Intent, Popover } from '@blueprintjs/core';
import classnames from 'classnames';
import React, { memo, useCallback, useEffect, useState } from 'react';

import { usePopover } from '~/ui/hooks/usePopover';

import css from './styles.scss';

interface Props {
  httpStatus: string | null;
  onSelect?: (httpStatus: string | null) => void;
}

export const HttpStatusCodeFilterDropdown = memo<Props>(
  function HttpStatusCodeFilterDropdown(props) {
    const popover = usePopover();
    const [value, setValue] = useState(props.httpStatus);

    useEffect(() => setValue(props.httpStatus), [props.httpStatus]);

    const onChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
      const nextValue = event.target.value.trim();
      setValue(nextValue.length > 0 ? nextValue : null);
    }, []);

    const onSubmit = (event: React.FormEvent) => {
      event.preventDefault();
      props.onSelect?.(value);
    };

    const onClear = useCallback(() => props.onSelect?.(null), []);

    const enabled = Boolean(props.httpStatus && props.httpStatus.length > 0);

    const content = (
      <div className={classnames(css.httpStatus, css.outer)}>
        <form onSubmit={onSubmit} className={classnames(css.httpStatus, css.wrapper)}>
          <InputGroup
            autoFocus
            type="text"
            value={value || ''}
            onChange={onChange}
            placeholder="HTTP Status Code"
          />
          {props.httpStatus !== value && (
            <Button type="submit" small onClick={onSubmit}>
              Filter
            </Button>
          )}
        </form>
        <small className={classnames(css.httpStatus, css.note)}>
          <Icon icon="info-sign" iconSize={12} /> Show only flows which match
          <br />
          this HTTP status code prefix
          <br />
          (e.g. 404, 5+)
        </small>
      </div>
    );

    return (
      <Popover {...popover.props} content={content}>
        <ButtonGroup>
          <Button
            minimal
            text="HTTP Status"
            intent={enabled ? Intent.PRIMARY : Intent.NONE}
            rightIcon={enabled ? undefined : 'chevron-down'}
            onClick={popover.toggle}
          />
          {enabled && (
            <Button
              small
              minimal
              icon="small-cross"
              onClick={onClear}
              intent={enabled ? Intent.PRIMARY : Intent.NONE}
            />
          )}
        </ButtonGroup>
      </Popover>
    );
  },
);
