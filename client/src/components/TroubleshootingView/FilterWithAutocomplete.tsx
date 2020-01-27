// Copyright 2019 Authors of Hubble
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
import {
  Button,
  Classes,
  Icon,
  Intent,
  MenuItem,
  Spinner,
  Tag
} from "@blueprintjs/core";
import { ItemRenderer, MultiSelect } from "@blueprintjs/select";
import { trim } from "lodash";
import * as React from "react";
import { provide } from "src/state";
import { pushAppUrl } from "../Routing/state/actions";
import {
  getClusterIdFromParams,
  getFlowsFilterInputRouteState,
  getFlowsRejectedReasonsFromQueryParams
} from "../Routing/state/selectors";

interface OwnProps {
  initialValue: Suggestion[];
  placeholder: string;
  fromto?: boolean;
  include?: FlowsFilterSuggestionType[];
  reason?: boolean;
  onChange(value: Suggestion[]): void;
  queryStringRef?: React.MutableRefObject<Suggestion[]>;
}

const css = require("./FilterWithAutocomplete.scss");
const provider = provide({
  mapStateToProps: (state, _ownProps: OwnProps) => ({
    clusterId: getClusterIdFromParams(state),
    filterInput: getFlowsFilterInputRouteState(state),
    rejectedReasons: getFlowsRejectedReasonsFromQueryParams(state)
  }),
  mapDispatchToProps: {
    pushAppUrl: pushAppUrl
  }
});

export type SuggestionDirection = "from:" | "to:" | "";

export enum FlowsFilterSuggestionType {
  UNKNOWN,
  DESTINATION_DNS_NAME,
  DESTINATION_IP_ADDRESS,
  SOURCE_IP_ADDRESS,
  LABEL
}

export type FlowsFilterSuggestion = {
  type: FlowsFilterSuggestionType;
  text: string;
};

export interface Suggestion extends FlowsFilterSuggestion {
  direction: SuggestionDirection;
}

const FilterMultiSelect = MultiSelect.ofType<Suggestion>();
const cleanUpDirections = (query: string) => {
  return query.replace(/from:|to:/, "").trim();
};
const getItemLabel = (item: Suggestion) => {
  return `${item.direction ? item.direction : ""}${item.text}`;
};

export const { Container: FilterWithAutocomplete } = provider(() => props => {
  const {
    initialValue,
    clusterId,
    onChange,
    placeholder,
    include,
    reason = true,
    fromto = true,
    queryStringRef
  } = props;
  const [selected, setSelected] = React.useState<Suggestion[]>(initialValue);
  const [suggestions, setSuggestions] = React.useState<Suggestion[]>([]);
  const [queryString, setQueryString] = React.useState<string>("");
  const [fetching, setFetching] = React.useState<boolean>(false);
  const [selectedSubItem, setSelectedSubItem] = React.useState<0 | 1 | null>(
    null
  );

  React.useEffect(() => onChange(selected), [selected]);

  React.useEffect(() => {
    setSelected(initialValue);
  }, [initialValue]);

  const createNewItemFromQuery = (query: string): Suggestion => {
    let direction: SuggestionDirection = "";

    if (query.includes("from:")) {
      direction = "from:";
    } else if (query.includes("to:")) {
      direction = "to:";
    }

    return {
      text: fromto ? cleanUpDirections(query) : query,
      type: FlowsFilterSuggestionType.UNKNOWN,
      direction: fromto ? direction : ""
    };
  };

  if (queryStringRef) {
    queryStringRef.current = queryString
      .split(",")
      .map(q => createNewItemFromQuery(q.trim()));
  }

  const getQueryDirection = (): SuggestionDirection => {
    if (queryString.startsWith("from:")) {
      return "from:";
    } else if (queryString.startsWith("to:")) {
      return "to:";
    }

    return "";
  };
  const handleClear = () => setSelected([]);
  let rightElement = selected.length ? (
    <Button minimal icon="cross" onClick={handleClear} />
  ) : (
    undefined
  );
  const renderTag = (item: Suggestion) => {
    let keyColor = "#666";
    let icon: "arrow-left" | "arrow-right" | "arrows-horizontal" =
      "arrows-horizontal";

    if (fromto && item.direction) {
      keyColor = item.direction === "from:" ? "#468706" : "#065A8D";
      icon = item.direction === "from:" ? "arrow-left" : "arrow-right";
    }

    return (
      <div className={css.tagContent}>
        {fromto && (
          <>
            <b style={{ color: keyColor }}>
              {item.direction ? item.direction : "from|to:"}
            </b>
            <Icon
              icon={icon}
              iconSize={9}
              color={keyColor}
              style={{ color: keyColor }}
            />
          </>
        )}
        <div className={css.tagTitle} data-popover={item.text}>
          <span>{item.text}</span>
        </div>
      </div>
    );
  };
  const renderItem: ItemRenderer<Suggestion> = (item, { modifiers }) => {
    if (!modifiers.matchesPredicate) {
      return null;
    }

    const handleClick = () => handleItemSelect(item);
    const renderFromTo =
      fromto &&
      !item.direction &&
      queryString &&
      !queryString.startsWith("reason") &&
      !(queryString.includes("from:") || queryString.includes("to:"));
    let labelElement: React.ReactNode | null = null;

    if (renderFromTo) {
      const handleFromClick = (event: React.MouseEvent<HTMLElement>) => {
        event.preventDefault();
        event.stopPropagation();
        handleItemSelect({ ...item, text: `from:${item.text}` });
      };
      const handleToClick = (event: React.MouseEvent<HTMLElement>) => {
        event.preventDefault();
        event.stopPropagation();
        handleItemSelect({ ...item, text: `to:${item.text}` });
      };
      const getIntent = (index: number): Intent => {
        if (modifiers.active) {
          if (index === selectedSubItem) {
            return "success";
          }
        }

        return "none";
      };

      labelElement = (
        <>
          <Tag
            interactive
            minimal={!modifiers.active}
            intent={getIntent(0)}
            onClick={handleFromClick}
          >
            from
          </Tag>{" "}
          <Tag
            interactive
            minimal={!modifiers.active}
            intent={getIntent(1)}
            onClick={handleToClick}
          >
            to
          </Tag>
        </>
      );
    }

    return (
      <MenuItem
        onClick={handleClick}
        key={item.text}
        active={modifiers.active}
        text={getItemLabel(item)}
        shouldDismissPopover={false}
        labelElement={labelElement}
      />
    );
  };
  const renderCreateNewItemSuggestion = (
    query: string,
    active: boolean,
    handleClick: React.MouseEventHandler<HTMLElement>
  ) => {
    const isItemExists = Boolean(selected.find(({ text }) => text === query));

    return isItemExists ? (
      undefined
    ) : (
      <MenuItem
        onClick={handleClick}
        active={active}
        text={`Search "${query}"`}
        icon="search"
      />
    );
  };
  const itemPredicate = (query: string, item: Suggestion) => {
    const found = selected.find(({ text }) => text === item.text);
    let matchesQuery: boolean = true;

    if (item.direction) {
      matchesQuery = getItemLabel(item).includes(query);
    } else {
      matchesQuery = item.text.includes(cleanUpDirections(query));
    }

    return query ? matchesQuery && !Boolean(found) : !Boolean(found);
  };
  const hanldeQueryChange = (query: string) => {
    setQueryString(query.replace(/\s/, ""));
  };
  const handleItemSelect = (item: Suggestion) => {
    if (trim(item.text).length === 0) {
      return;
    }

    const queryDirection = getQueryDirection();
    let nextItem = item;
    let direction: SuggestionDirection = "";

    if (item.text.includes("from:")) {
      direction = "from:";
    } else if (item.text.includes("to:")) {
      direction = "to:";
    }

    if (typeof selectedSubItem === "number") {
      nextItem = {
        ...item,
        direction: selectedSubItem === 0 ? "from:" : "to:"
      };
    } else if (item.type === FlowsFilterSuggestionType.UNKNOWN) {
      nextItem = item;
    } else {
      nextItem = {
        ...item,
        text: cleanUpDirections(item.text),
        direction: direction || queryDirection
      };
    }

    setSuggestions([]);
    setSelected([...selected, nextItem]);
    setQueryString("");
  };
  const handleTageDelete = (_value: string, index: number) => {
    setSelected(selected.filter((_tag: Suggestion, i: number) => i !== index));
  };
  const hanldeActiveItemChange = (item: Suggestion) => {
    setSelectedSubItem(null);
  };
  const handleKeyDown = (event: React.KeyboardEvent) => {
    switch (event.key) {
      case "Tab": {
        event.preventDefault();
        event.stopPropagation();

        if (typeof selectedSubItem === "number") {
          setSelectedSubItem(selectedSubItem === 0 ? 1 : null);
        } else {
          setSelectedSubItem(0);
        }

        return;
      }
    }
  };

  if (fetching) {
    rightElement = (
      <Button minimal disabled rightIcon={<Spinner size={16} />} />
    );
  }

  return (
    <FilterMultiSelect
      initialContent={null}
      className={css.container}
      onActiveItemChange={hanldeActiveItemChange}
      query={queryString}
      selectedItems={selected}
      onQueryChange={hanldeQueryChange}
      onItemSelect={handleItemSelect}
      createNewItemFromQuery={createNewItemFromQuery}
      createNewItemRenderer={renderCreateNewItemSuggestion}
      itemRenderer={renderItem}
      tagRenderer={renderTag}
      itemPredicate={itemPredicate}
      items={suggestions}
      popoverProps={{
        minimal: true,
        usePortal: true,
        openOnTargetFocus: false
      }}
      resetOnSelect={true}
      noResults={<MenuItem disabled={true} text="No results." />}
      tagInputProps={{
        onRemove: handleTageDelete,
        onKeyDown: handleKeyDown,
        tagProps: { minimal: true },
        rightElement: rightElement,
        className: Classes.INPUT,
        placeholder
      }}
    />
  );
});
