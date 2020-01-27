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
import * as React from "react";
import { PageInfo } from "src/graphqlTypes";

export const css = require("./tables.scss");

export const useScroll = (config: {
  containerRef: React.RefObject<HTMLElement>;
  onReachEdge?: (edge: "top" | "bottom") => void;
  onScroll?: (args: {
    readonly scrollHeight: number;
    readonly clientHeight: number;
    readonly scrollTop: number;
  }) => void;
}) => {
  React.useEffect(() => {
    const wrapper = config.containerRef.current;
    if (wrapper) {
      const onScroll = () => {
        const { scrollHeight, clientHeight, scrollTop } = wrapper;
        if (config.onScroll) {
          config.onScroll({ scrollHeight, clientHeight, scrollTop });
        }
        if (config.onReachEdge) {
          if (scrollTop === 0) {
            config.onReachEdge("top");
          } else if (scrollHeight === clientHeight + scrollTop) {
            config.onReachEdge("bottom");
          }
        }
      };
      const listener = requestAnimationFrame.bind(null, onScroll);
      wrapper.addEventListener("scroll", listener, false);
      return () => wrapper.removeEventListener("scroll", listener, false);
    }
    return undefined;
  });
};

export interface PaginatedTable<Item> {
  readonly ref: React.RefObject<HTMLTableSectionElement>;
  readonly items: Item[];
  readonly setItems: React.Dispatch<React.SetStateAction<Item[]>>;
  readonly status: "loading" | "ready";
  readonly setStatus: React.Dispatch<React.SetStateAction<"loading" | "ready">>;
  readonly pageInfo: React.MutableRefObject<{
    readonly hasNextPage: boolean;
    readonly endCursor: string;
  }>;
}

export interface PaginatedTableCallbacs<Item> {
  readonly onSuccess: (response: {
    readonly edges: Array<{ cursor: string; node: Item }>;
    readonly pageInfo: PageInfo;
  }) => void;
  readonly onError: () => void;
}

export function usePaginatedTable<Item>(
  mappersCreator: (
    props: PaginatedTable<Item>
  ) => {
    mapAction?: (a: {
      callbacks: PaginatedTableCallbacs<Item>;
      mode: "replace" | "append" | "prepend";
    }) => void;
    mapActionDeps?: () => React.DependencyList;
  }
): PaginatedTable<Item> {
  const [items, setItems] = React.useState<Item[]>([]);
  const [status, setStatus] = React.useState<"loading" | "ready">("loading");
  const ref = React.createRef<HTMLTableSectionElement>();
  const pageInfo = React.useRef<{ hasNextPage: boolean; endCursor: string }>({
    hasNextPage: true,
    endCursor: ""
  });

  const props: PaginatedTable<Item> = {
    items,
    setItems,
    status,
    setStatus,
    ref,
    pageInfo
  };

  const mappers = mappersCreator(props);

  const fetchItems = (
    mode: "append" | "prepend" | "replace",
    items: Item[]
  ) => {
    if (mappers.mapAction) {
      setStatus("loading");
      mappers.mapAction({
        mode,
        callbacks: {
          onSuccess: response => {
            setStatus("ready");
            pageInfo.current = response.pageInfo;
            const newItems = response.edges.map(({ node }) => node);
            const nextItems = items.concat(newItems);
            setItems(nextItems);
          },
          onError: () => setStatus("ready")
        }
      });
    }
  };

  React.useEffect(
    () => {
      pageInfo.current = {
        hasNextPage: true,
        endCursor: ""
      };
      const items: Item[] = [];
      setItems(items);
      fetchItems("replace", items);
    },
    mappers.mapActionDeps ? mappers.mapActionDeps() : undefined
  );

  useScroll({
    containerRef: ref,
    onReachEdge: edge => {
      if (
        edge === "bottom" &&
        items.length > 0 &&
        pageInfo.current.hasNextPage
      ) {
        fetchItems("append", items);
      }
    }
  });

  return props;
}

export const storeWidths = (key: string, widths: { [key: string]: number }) => {
  localStorage.setItem(key, JSON.stringify(widths));
};

export const loadWidths = (key: string, columns: string[]) => {
  const widthsFromLocalStorage = getWidths(key, columns);
  const widths = widthsFromLocalStorage
    ? widthsFromLocalStorage
    : calcWidths(columns);
  storeWidths(key, widths);
  return widths;
};

export const updateWidths = (key: string, columns: string[]) => {
  const widths = calcWidths(columns);
  storeWidths(key, widths);
  return widths;
};

const calcWidths = (columns: string[]) => {
  return columns.reduce<{ [key: string]: number }>((map, columnName) => {
    map[columnName] = 1 / columns.length;
    return map;
  }, {});
};

const getWidths = (
  key: string,
  columns: string[]
): { [key: string]: number } | null => {
  const json = localStorage.getItem(key);
  if (json) {
    const widths = JSON.parse(json);
    if (Object.keys(widths).length !== columns.length) {
      return null;
    }
    if (columns.find(column => !widths[column])) {
      return null;
    }
    return widths;
  } else {
    return null;
  }
};
