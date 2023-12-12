import { Button, Classes, MenuItem } from '@blueprintjs/core';
import { ItemRenderer, MultiSelect2 } from '@blueprintjs/select';
import { trim } from 'lodash';
import React, { useCallback, useState, memo } from 'react';
import classnames from 'classnames';

import { TagDirection } from './TagDirection';

import { FilterDirection, FilterEntry, FilterKind } from '~/domain/filtering';
import { Labels } from '~/domain/labels';

import css from './FlowsFilterInput.scss';

interface Props {
  filters: FilterEntry[];
  onChange?: (filters: FilterEntry[]) => void;
}

const FilterMultiSelect = MultiSelect2.ofType<FilterEntry | null>();

export const FlowsFilterInput = (props: Props) => {
  const [userInput, setUserInput] = useState<string>('');

  const onClear = useCallback(() => {
    props.onChange?.([]);
  }, [props.onChange]);

  const createNewItemRenderer = useCallback(
    (query: string, active: boolean, handleClick: React.MouseEventHandler<HTMLElement>) => {
      if (props.filters.some(({ query: text }) => text === query)) {
        return undefined;
      }

      return (
        <MenuItem onClick={handleClick} active={active} text={`Search "${query}"`} icon="search" />
      );
    },
    [props.filters],
  );

  const createNewItemFromQuery = (userInput: string) => {
    const filter = FilterEntry.parse(userInput);
    if (filter?.isLabel) {
      filter.prepareLabel();
    }

    return filter;
  };

  const onQueryChange = useCallback((query: string) => {
    setUserInput(query.replace(/\s/, ''));
  }, []);

  // prettier-ignore
  const onItemSelect = useCallback((item: FilterEntry | null) => {
    if (!item || trim(item.query).length === 0) return;

    props.onChange?.([...props.filters, item]);
    setUserInput('');
  }, [props.filters, props.onChange, userInput]);

  // prettier-ignore
  const handleTagDelete = useCallback((val: React.ReactNode, idx: number) => {
    props.onChange?.(
      props.filters.filter((_: FilterEntry, i: number) => i !== idx),
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
      onQueryChange={onQueryChange}
      onItemSelect={onItemSelect}
      createNewItemFromQuery={createNewItemFromQuery}
      createNewItemRenderer={createNewItemRenderer}
      itemRenderer={itemRenderer}
      tagRenderer={tagRenderer}
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
          'Filter by: label key=val, ip=1.1.1.1, dns=google.com, identity=42, pod=frontend',
      }}
    />
  );
};

const itemRenderer: ItemRenderer<FilterEntry | null> = () => {
  return null;
};

function tagRenderer(item: FilterEntry | null) {
  if (!item) return null;

  const query = item.kind === FilterKind.Label ? Labels.normalizeKey(item.query) : item.query;

  return (
    <div className={css.tag}>
      <TagDirection direction={item.direction} />
      <span className={css.body}>
        {item.negative && <span className={css.negative}>!</span>}
        <span className={css.kind}>{item.kind}</span>
        <span className={css.separator}>=</span>
        <span className={css.query}>{query}</span>
        {item.meta && <span className={css.meta}>{item.meta}</span>}
      </span>
    </div>
  );
}
