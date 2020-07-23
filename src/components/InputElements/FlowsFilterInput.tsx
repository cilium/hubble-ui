import { Button, Classes, Icon, MenuItem } from '@blueprintjs/core';
import { ItemRenderer, MultiSelect } from '@blueprintjs/select';
import { trim } from 'lodash';
import React, { useCallback, useState, memo } from 'react';
import classnames from 'classnames';

import {
  FlowsFilterDirection,
  FlowsFilterEntry,
  FlowsFilterKind,
} from '~/domain/flows';

import css from './FlowsFilterInput.scss';
import { Labels } from '~/domain/labels';

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

  const createNewItemRenderer = useCallback(
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

  const createNewItemFromQuery = (userInput: string) => {
    const filter = FlowsFilterEntry.parse(userInput);
    if (filter?.isLabel) {
      filter.ensureLabelPrefix();
    }

    return filter;
  };

  const onQueryChange = useCallback((query: string) => {
    setUserInput(query.replace(/\s/, ''));
  }, []);

  // prettier-ignore
  const onItemSelect = useCallback((item: FlowsFilterEntry | null) => {
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
          'Filter by: labels key=val, ip=0.0.0.0, dns=google.com, identity=42',
      }}
    />
  );
};

const itemRenderer: ItemRenderer<FlowsFilterEntry | null> = () => {
  return null;
};

function tagRenderer(item: FlowsFilterEntry | null) {
  if (!item) return null;

  const query =
    item.kind === FlowsFilterKind.Label
      ? Labels.normalizeKey(item.query)
      : item.query;

  return (
    <div className={css.tag}>
      <TagDirection direction={item.direction} />
      <span className={css.body}>
        <span className={css.kind}>{item.kind}</span>
        <span className={css.separator}>=</span>
        <span className={css.query}>{query}</span>
        {item.meta && <span className={css.meta}>{item.meta}</span>}
      </span>
    </div>
  );
}

interface TagDirectionProps {
  direction: FlowsFilterDirection;
}

const TagDirection = memo<TagDirectionProps>(function TagDirection(props) {
  const className = classnames(css.direction, {
    [css.from]: props.direction === FlowsFilterDirection.From,
    [css.to]: props.direction === FlowsFilterDirection.To,
    [css.both]: props.direction === FlowsFilterDirection.Both,
  });

  return (
    <span className={className}>
      {props.direction === FlowsFilterDirection.From && (
        <>
          <span className={classnames(css.label, css.from)}>from</span>
          <Icon icon="arrow-left" iconSize={9} className={css.icon} />
        </>
      )}
      {props.direction === FlowsFilterDirection.To && (
        <>
          <Icon icon="arrow-right" iconSize={9} className={css.icon} />
          <span className={classnames(css.label, css.to)}>to</span>
        </>
      )}
      {props.direction === FlowsFilterDirection.Both && (
        <>
          <span className={classnames(css.label, css.from)}>from</span>
          <Icon icon="arrows-horizontal" iconSize={9} className={css.icon} />
          <span className={classnames(css.label, css.to)}>to</span>
        </>
      )}
      {/* <Icon icon={icon} iconSize={9} color={color} style={{ color }} /> */}
    </span>
  );
});
