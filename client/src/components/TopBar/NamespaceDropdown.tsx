import React, { FunctionComponent } from 'react';
import { ItemRenderer, ItemPredicate, Select } from '@blueprintjs/select';
import { Button, ButtonGroup, MenuItem } from '@blueprintjs/core';

const NamespaceSelect = Select.ofType<string>();

import css from './styles.scss';

const renderItem: ItemRenderer<string> = (namespace, itemProps) => {
  const { handleClick, modifiers, query } = itemProps;

  if (!modifiers.matchesPredicate) {
    return null;
  }

  return (
    <MenuItem
      key={namespace}
      onClick={handleClick}
      // text={highlightText(namespace, query)}
      text={namespace}
    />
  );
};

const filterItem: ItemPredicate<string> = (query, value, idx, exactMatch) => {
  const normalizedTitle = value.toLowerCase();
  const normalizedQuery = query.toLowerCase();

  if (exactMatch) {
    return normalizedTitle === normalizedQuery;
  } else {
    return value.indexOf(normalizedQuery) >= 0;
  }
};

export interface Props {
  namespaces: Array<string>;
  currentNamespace: string | null;
  onChange?: (ns: string) => void;
}

export const NamespaceDropdown: FunctionComponent<Props> = props => {
  const onChange = (ns: string) => {
    if (props.onChange) {
      props.onChange(ns);
    }
  };

  const btnIcon = (
    <img src="/icons/misc/namespace-icon.svg" style={{ width: '14px' }} />
  );

  const currentValue =
    props.currentNamespace == null
      ? 'Choose namespace'
      : props.currentNamespace;

  return (
    <div className={css.nsDropdown}>
      <NamespaceSelect
        resetOnQuery
        resetOnClose
        resetOnSelect
        itemPredicate={filterItem}
        itemRenderer={renderItem}
        items={props.namespaces || []}
        noResults={<MenuItem disabled={true} text="No matches" />}
        onItemSelect={onChange}
        inputProps={{ placeholder: 'Filter namespaces…' }}
      >
        <ButtonGroup>
          <Button rightIcon="caret-down" icon={btnIcon} text={currentValue} />
          {/*{props.clearable && props.namespaceFromParams && (
            <Button small icon="cross" onClick={onReset} />
          )}*/}
        </ButtonGroup>
      </NamespaceSelect>
    </div>
  );
};
