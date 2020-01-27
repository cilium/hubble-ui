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
import * as moment from "moment";
import * as qs from "qs";
import { ForwardingStatus } from "src/graphqlTypes";
import { RootState } from "src/state/rootReducer";
import { createSelector } from "../../../state";
import { DEFAULT_APP_ADVANCED_VIEW_TYPE } from "./defaults";
import { AppAdvancedViewType, VisibilityFilter } from "./types";

export const getPathname = (state: RootState) => {
  const { router } = state;
  if (!router.location || !router.location.pathname) {
    return null;
  }
  return router.location.pathname;
};

export const getQueryString = (state: RootState) => {
  const { router } = state;
  if (!router.location || !router.location.search) {
    return null;
  }
  return router.location.search;
};

export const getSplitedPathname = createSelector(getPathname, pathname =>
  pathname ? pathname.split("/").slice(1) : null
);

export const getParsedQueryString = createSelector(
  getQueryString,
  queryString => {
    if (!queryString) {
      return null;
    }
    return qs.parse(queryString, { ignoreQueryPrefix: true }) as {
      [key: string]: string;
    };
  }
);

export const getAppAdvancedViewTypeFromParams = createSelector(
  getSplitedPathname,
  pathname => {
    if (!pathname) {
      return DEFAULT_APP_ADVANCED_VIEW_TYPE;
    }
    let offset = 4;
    const advancedViewType = pathname[offset] as AppAdvancedViewType;
    if (Object.values(AppAdvancedViewType).includes(advancedViewType)) {
      return advancedViewType as AppAdvancedViewType;
    } else {
      return DEFAULT_APP_ADVANCED_VIEW_TYPE;
    }
  }
);

export const getEndpointElementQueryFromParams = createSelector(
  getSplitedPathname,
  getAppAdvancedViewTypeFromParams,
  (pathname, appAdvancedViewType) => {
    if (!pathname) {
      return null;
    }
    let offset = -1;
    if (appAdvancedViewType === AppAdvancedViewType.FLOWS) {
      offset = 6;
    } else {
      offset = 5;
    }
    if (offset < 0) {
      return null;
    }
    return pathname.slice(offset) || null;
  }
);

export const getEndpointQueryFromParams = createSelector(
  getEndpointElementQueryFromParams,
  endpointElementQuery => {
    if (!endpointElementQuery) {
      return null;
    }
    const query = endpointElementQuery[0];
    return query ? query : null;
  }
);

export interface EndpointQueryObject {
  from: string | null;
  fromHash: string | null;
  to: string | null;
  toHash: string | null;
  self: string | null;
  selfHash: string | null;
}

export const getEndpointQueryObjectFromParams = createSelector(
  getEndpointQueryFromParams,
  filter => {
    const obj: EndpointQueryObject = {
      from: null,
      fromHash: null,
      to: null,
      toHash: null,
      self: null,
      selfHash: null
    };
    if (!filter) {
      return obj;
    }
    filter
      .split("-")
      .filter(s => s.trim().length > 0)
      .forEach(part => {
        if (part.startsWith("from:")) {
          const from = part.substring("from:".length);
          obj.fromHash = from;
          obj.from = from.split("_")[0];
        } else if (part.startsWith("to:")) {
          const to = part.substring("to:".length);
          obj.toHash = to;
          obj.to = to.split("_")[0];
        } else {
          obj.selfHash = part;
          obj.self = part.split("_")[0];
        }
      });
    return obj;
  }
);

export const getEndpointIdFromParams = createSelector(
  getEndpointQueryFromParams,
  filter => {
    if (!filter) {
      return null;
    }
    const containsToFilter = /(?:to:)/.test(filter);
    const containsFromFilter = /(?:from:)/.test(filter);
    if (containsToFilter && containsFromFilter) {
      return null;
    } else if (containsToFilter) {
      return filter.replace("to:", "").split("_")[0];
    } else if (containsFromFilter) {
      return filter.replace("from:", "").split("_")[0];
    }
    return filter.split("_")[0];
  }
);

export const getProtocolQueryFromParams = createSelector(
  getEndpointElementQueryFromParams,
  endpointElementQuery => {
    if (
      !endpointElementQuery ||
      !endpointElementQuery[0] ||
      !endpointElementQuery[1]
    ) {
      return null;
    }
    return endpointElementQuery[1];
  }
);

export const getFunctionQueryFromParams = createSelector(
  getEndpointElementQueryFromParams,
  endpointElementQuery => {
    if (
      !endpointElementQuery ||
      !endpointElementQuery[0] ||
      !endpointElementQuery[1] ||
      !endpointElementQuery[2]
    ) {
      return null;
    }
    return endpointElementQuery[2];
  }
);

export const getClusterIdFromParams = createSelector(
  getSplitedPathname,
  pathname => {
    if (!pathname) {
      return null;
    }
    return pathname[2] || null;
  }
);

export const getFlowQueryFromParams = createSelector(
  getSplitedPathname,
  getAppAdvancedViewTypeFromParams,
  (pathname, appAdvancedViewType) => {
    if (!pathname) {
      return null;
    }
    let offset = -1;
    if (appAdvancedViewType === AppAdvancedViewType.FLOWS) {
      offset = 5;
    }
    if (offset < 0) {
      return null;
    }
    const flowQueryFromParam = pathname[offset];
    if (flowQueryFromParam === "none") {
      return null;
    }
    return flowQueryFromParam ? flowQueryFromParam : null;
  }
);

export const getFlowsForwardingStatusRouteState = createSelector(
  getParsedQueryString,
  queryString => {
    if (!queryString) {
      return null;
    }
    const status = queryString["flows-status"];
    return status ? (status as ForwardingStatus) : null;
  }
);

export const getFlowsFilterInputRouteState = createSelector(
  getParsedQueryString,
  queryString => {
    if (!queryString) {
      return null;
    }
    const input = queryString["flows-filter-input"];
    return input ? input : null;
  }
);

export const getHasFlowsFilterInputToDns = createSelector(
  getFlowsFilterInputRouteState,
  filter => {
    if (!filter) {
      return false;
    }
    return filter.includes("to: dns=");
  }
);

export const getFlowsStartDateFromParams = createSelector(
  getParsedQueryString,
  (queryString): { url: string; label: string } => {
    const defaultValue = "5 minutes";
    if (!queryString) {
      return {
        url: defaultValue,
        label: defaultValue
      };
    }
    const date = queryString["flows-start-date"] || defaultValue;
    let url = "no";
    let label = "No date";
    switch (date) {
      case "5 minutes":
      case "30 minutes":
      case "1 hour":
      case "1 day":
      case "1 week":
      case "1 month": {
        url = date;
        label = date;
        break;
      }
      default: {
        label = date ? moment(date).format("MMM D, h:mm A") : "No date";
        url = date ? date : url;
      }
    }
    return {
      label: label,
      url: url
    };
  }
);

export const getFlowsEndDateFromParams = createSelector(
  getParsedQueryString,
  (queryString): { url: string; label: string } => {
    if (!queryString) {
      return {
        url: "now",
        label: "Now"
      };
    }
    const date = queryString["flows-end-date"] || "now";
    let url = "now";
    let label = "now";
    switch (date) {
      case "now": {
        label = "now";
        url = "now";
        break;
      }
      default: {
        label = date ? moment(date).format("MMM D, h:mm A") : "now";
        url = date ? date : url;
      }
    }
    return {
      label: label,
      url: url
    };
  }
);

export const getFlowsStartDate = (startDate: {
  url: string;
  label: string;
}): string => {
  const defaultValue = "5 minutes";
  let date = startDate.url || defaultValue;
  switch (date) {
    case "5 minutes":
    case "30 minutes":
    case "1 hour":
    case "1 day":
    case "1 week":
    case "1 month": {
      const [value, metric] = date.split(" ");
      date = moment()
        .subtract(value, metric as moment.DurationInputArg2)
        .toISOString();
      break;
    }
    default: {
      date = moment(date).toISOString();
    }
  }
  return date;
};

export const getFlowsEndDate = (endDate: {
  url: string;
  label: string;
}): string => {
  let date = endDate.url || "now";
  switch (date) {
    case "now": {
      date = moment().toISOString();
      break;
    }
    default: {
      date = moment(date).toISOString();
    }
  }
  return date;
};

export const getFlowsGroupBySourceNamespaceFromQueryParams = createSelector(
  getParsedQueryString,
  (queryString): "yes" | "no" => {
    if (!queryString) {
      return "no";
    }
    const show = queryString["flows-group-by-source-namespace"];
    return show ? (show as "yes" | "no") : "no";
  }
);

export const getFlowsFilterTypeFromQueryParams = createSelector(
  getParsedQueryString,
  (queryString): "all" | "external" | "cross-namespace" => {
    if (!queryString) {
      return "all";
    }
    const filter = queryString["flows-filter-type"];
    return filter ? (filter as "all" | "external" | "cross-namespace") : "all";
  }
);

export const getFlowsTableGroupByOptionsFromQueryParams = createSelector(
  getParsedQueryString,
  (queryString): string[] => {
    if (!queryString) {
      return [];
    }
    const filter = queryString["flows-group-by"];
    return filter ? filter.split(",") : [];
  }
);

export const getFlowsEventsChartFromQueryParams = createSelector(
  getParsedQueryString,
  (queryString): VisibilityFilter => {
    if (!queryString) {
      return "hide";
    }

    const filter = queryString["flows-events-chart"];
    return (filter as VisibilityFilter) || "hide";
  }
);

export const getFlowsRejectedReasonsFromQueryParams = createSelector(
  getParsedQueryString,
  (queryString): string | null => {
    if (!queryString) {
      return null;
    }

    return queryString["flows-rejected-reasons"] || null;
  }
);

export const getFlowsHttpStatusCodeQueryParams = createSelector(
  getParsedQueryString,
  queryString => {
    if (!queryString) {
      return null;
    }
    const filter = queryString["flows-http-status-code"];
    return filter ? filter : null;
  }
);

export const getNamespaceStringFromParams = createSelector(
  getSplitedPathname,
  pathname => {
    const namespaces: string[] = [];
    if (!pathname) {
      return namespaces.join(",");
    }
    if (pathname[3]) {
      namespaces.push(...(pathname[3] || "").split(","));
    }
    return namespaces.filter(namespace => namespace !== "-").join(",");
  }
);

export const getNamespacesFromParams = createSelector(
  getNamespaceStringFromParams,
  namespaces => namespaces.split(",")
);

export const getNamespaceFromParams = createSelector(
  getNamespacesFromParams,
  namespaces => (namespaces.length > 0 ? namespaces[0] : null)
);
