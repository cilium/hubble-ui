import { Button, Classes, Icon, MenuItem } from '@blueprintjs/core';
import { ItemRenderer, MultiSelect } from '@blueprintjs/select';
import { trim } from 'lodash';
import React, { useCallback, useState } from 'react';

import { FlowsFilterDirection, FlowsFilterEntry } from '~/domain/flows';

import css from './FlowsFilterInput.scss';

interface Props {
  filters: FlowsFilterEntry[];
  onChange?: (filters: FlowsFilterEntry[]) => void;
}

const FilterMultiSelect = MultiSelect.ofType<FlowsFilterEntry | null>();

export const FlowsFilterInput = (props: Props) => {
  const [userInput, setUserInput] = useState<string>('');

  const onClear = useCallback(() => {
    props.onChange?.([]);
  }, [props.onChange]);

  const renderCreateNewItem = useCallback(
    (
      query: string,
      active: boolean,
      handleClick: React.MouseEventHandler<HTMLElement>,
    ) => {
      if (props.filters.some(({ query: text }) => text === query)) {
        return undefined;
      }

      return (
        <MenuItem
          onClick={handleClick}
          active={active}
          text={`Search "${query}"`}
          icon="search"
        />
      );
    },
    [props.filters],
  );

  const handleQueryChange = useCallback((query: string) => {
    setUserInput(query.replace(/\s/, ''));
  }, []);

  // prettier-ignore
  const handleItemSelect = useCallback((item: FlowsFilterEntry | null) => {
    if (!item || trim(item.query).length === 0) return;

    props.onChange?.([...props.filters, item]);
    setUserInput('');
  }, [props.filters, props.onChange, userInput]);

  // prettier-ignore
  const handleTagDelete = useCallback((val: string, idx: number) => {
    props.onChange?.(
      props.filters.filter((_: FlowsFilterEntry, i: number) => i !== idx),
    );
  }, [props.filters, props.onChange]);

  const rightElement = props.filters.length ? (
    <Button minimal icon="cross" onClick={onClear} />
  ) : undefined;

  return (
    <FilterMultiSelect
      initialContent={null}
      className={css.container}
      query={userInput}
      selectedItems={props.filters}
      onQueryChange={handleQueryChange}
      onItemSelect={handleItemSelect}
      createNewItemFromQuery={FlowsFilterEntry.parse}
      createNewItemRenderer={renderCreateNewItem}
      itemRenderer={renderItem}
      tagRenderer={renderTag}
      itemPredicate={useCallback(() => false, [])}
      items={[]}
      popoverProps={{
        minimal: true,
        usePortal: true,
        openOnTargetFocus: false,
      }}
      resetOnSelect={true}
      noResults={<MenuItem disabled={true} text="No results." />}
      tagInputProps={{
        onRemove: handleTagDelete,
        tagProps: { minimal: true },
        rightElement: rightElement,
        className: Classes.INPUT,
        placeholder:
          'Filter by: labels key=val, ip=0.0.0.0, dns=google.com, identity=42',
      }}
    />
  );
};

const renderItem: ItemRenderer<FlowsFilterEntry | null> = () => {
  return null;
};

const renderTag = (item: FlowsFilterEntry | null) => {
  if (!item) return null;

  const label = item.meta ? (
    <>
      {item.kind}={item.query} <i>{item.meta}</i>
    </>
  ) : (
    <>
      {item.kind}={item.query}
    </>
  );
  let color: string;
  let directionLabel: 'from:' | 'to:' | 'from|to:';
  let icon: 'arrow-left' | 'arrow-right' | 'arrows-horizontal';

  switch (item.direction) {
    case FlowsFilterDirection.From:
      color = '#468706';
      icon = 'arrow-left';
      directionLabel = 'from:';
      break;
    case FlowsFilterDirection.To:
      color = '#065A8D';
      icon = 'arrow-right';
      directionLabel = 'to:';
      break;
    case FlowsFilterDirection.Both:
      color = '#666';
      icon = 'arrows-horizontal';
      directionLabel = 'from|to:';
      break;
  }

  return (
    <div className={css.tagContent}>
      <b style={{ color }}>{directionLabel}</b>
      <Icon icon={icon} iconSize={9} color={color} style={{ color }} />
      <div className={css.tagTitle}>
        <span>{label}</span>
      </div>
    </div>
  );
};
