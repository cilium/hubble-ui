import React, { useCallback, memo } from 'react';
import { ItemRenderer, ItemPredicate, Select } from '@blueprintjs/select';
import { Button, MenuItem } from '@blueprintjs/core';

import { usePopover } from '~/ui/hooks/usePopover';

import css from './styles.scss';

const NamespaceSelect = Select.ofType<string>();

const renderItem: ItemRenderer<string> = (namespace, itemProps) => {
  const { handleClick, modifiers } = itemProps;

  if (!modifiers.matchesPredicate) {
    return null;
  }

  return <MenuItem key={namespace} onClick={handleClick} text={namespace} />;
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

export const NamespaceSelectorDropdown = memo<Props>(
  function NamespaceSelectorDropdown(props) {
    const { namespaces, currentNamespace } = props;

    const popover = usePopover();

    // prettier-ignore
    const onChange = useCallback(
      (ns: string) => props.onChange?.(ns),
      [props.onChange]
    );

    const btnIcon = (
      <img
        src="icons/misc/namespace-icon.svg"
        className={css.namespacesDropdownButtonIcon}
      />
    );

    const currentValue =
      currentNamespace && namespaces.includes(currentNamespace)
        ? currentNamespace
        : currentNamespace
        ? `Waiting ${currentNamespace} namespace…`
        : 'Choose namespace';

    return (
      <NamespaceSelect
        resetOnQuery
        resetOnClose
        resetOnSelect
        itemPredicate={filterItem}
        itemRenderer={renderItem}
        items={namespaces || []}
        noResults={<MenuItem disabled={true} text="No matches" />}
        onItemSelect={onChange}
        popoverProps={popover.props}
        inputProps={{ placeholder: 'Filter namespaces…' }}
      >
        <Button
          rightIcon="caret-down"
          icon={btnIcon}
          text={currentValue}
          onClick={popover.toggle}
          className={css.namespacesDropdownButton}
          alignText="left"
        />
      </NamespaceSelect>
    );
  },
);
