import React, { useCallback, memo } from 'react';
import { ItemRenderer, ItemPredicate, Select } from '@blueprintjs/select';
import { Button, MenuItem } from '@blueprintjs/core';

import { NamespaceDescriptor } from '~/domain/namespaces';
import { usePopover } from '~/ui/hooks/usePopover';
import * as e2e from '~e2e/client';

import css from './styles.scss';

const renderItem: ItemRenderer<NamespaceDescriptor> = (ns, itemProps) => {
  const { handleClick, modifiers } = itemProps;

  if (!modifiers.matchesPredicate) {
    return null;
  }

  return (
    <MenuItem
      key={ns.namespace}
      onClick={handleClick}
      text={ns.namespace}
      {...e2e.attributes.ns.availability(ns.relay, false)}
    />
  );
};

const filterItem: ItemPredicate<NamespaceDescriptor> = (query, ns, idx, exactMatch) => {
  const value = ns.namespace;
  const normalizedTitle = value.toLowerCase();
  const normalizedQuery = query.toLowerCase();

  if (exactMatch) {
    return normalizedTitle === normalizedQuery;
  } else {
    return value.indexOf(normalizedQuery) >= 0;
  }
};

export interface Props {
  namespaces: NamespaceDescriptor[];
  currentNamespace?: NamespaceDescriptor | null;
  onChange?: (ns: NamespaceDescriptor) => void;
}

export const NamespaceSelectorDropdown = memo<Props>(function NamespaceSelectorDropdown(props) {
  const { namespaces, currentNamespace } = props;

  const popover = usePopover();

  // prettier-ignore
  const onChange = useCallback(
    (ns: NamespaceDescriptor) => props.onChange?.(ns),
    [props.onChange]
  );

  const btnIcon = (
    <img src="icons/misc/namespace-icon.svg" className={css.namespacesDropdownButtonIcon} />
  );

  const dropdownText = currentNamespace?.namespace ?? 'Choose namespace';

  return (
    <Select<NamespaceDescriptor>
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
        {...e2e.attributes.ns.availability(!!currentNamespace?.relay, false)}
        rightIcon="caret-down"
        icon={btnIcon}
        text={dropdownText}
        onClick={popover.toggle}
        className={css.namespacesDropdownButton}
        alignText="left"
      />
    </Select>
  );
});
