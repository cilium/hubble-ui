import {
  Button,
  ButtonGroup,
  Icon,
  InputGroup,
  Intent,
  Popover,
} from '@blueprintjs/core';
import React, { memo, useCallback, useEffect, useState } from 'react';
import css from './HttpStatusCodeDropdown.scss';

interface Props {
  httpStatus: string | null;
  onSelect: (httpStatus: string | null) => void;
}

export const HttpStatusCodeDropdown = memo<Props>(props => {
  const [value, setValue] = useState(props.httpStatus);

  useEffect(() => setValue(props.httpStatus), [props.httpStatus]);

  const onChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.value.trim();
    setValue(nextValue.length > 0 ? nextValue : null);
  }, []);

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    props.onSelect(value);
  };

  const onClear = useCallback(() => props.onSelect(null), []);

  const enabled = Boolean(props.httpStatus && props.httpStatus.length > 0);

  return (
    <Popover
      content={
        <div className={css.outer}>
          <form onSubmit={onSubmit} className={css.wrapper}>
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
          <small className={css.note}>
            <Icon icon="info-sign" iconSize={12} /> Show only flows which match
            <br />
            this HTTP status code prefix
            <br />
            (e.g. 404, 5+)
          </small>
        </div>
      }
    >
      <ButtonGroup className={css.button}>
        <Button
          minimal
          text="HTTP Status"
          intent={enabled ? Intent.PRIMARY : Intent.NONE}
          rightIcon={enabled ? undefined : 'chevron-down'}
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
});

HttpStatusCodeDropdown.displayName = 'HttpStatusCodeDropdown';
