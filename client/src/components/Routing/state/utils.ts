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
import * as qs from "qs";
import { DEFAULT_APP_ADVANCED_VIEW_TYPE } from "./defaults";
import { EndpointQueryObject } from "./selectors";
import { AppAdvancedViewType, UrlState } from "./types";

export const buildUrlFromState = (state: UrlState) => {
  const {
    appAdvancedViewType,
    endpointsQuery,
    protocolsQuery,
    functionsQuery,
    flowsQuery,
    flowsForwardingStatus,
    flowsFilterInput,
    flowsStartDate,
    flowsHttpStatusCode,
    clusterId,
    namespaces
  } = state;

  const appendEndpointProtocolFuntcionIds = (url: string) => {
    let res = url;
    if (endpointsQuery) {
      res = `${res}/${endpointsQuery}`;
      if (protocolsQuery) {
        res = `${res}/${protocolsQuery}`;
        if (functionsQuery) {
          res = `${res}/${functionsQuery}`;
        }
      }
    }
    return res;
  };

  let selectedAppAdvancedViewType = appAdvancedViewType;
  if (!selectedAppAdvancedViewType) {
    selectedAppAdvancedViewType = DEFAULT_APP_ADVANCED_VIEW_TYPE;
  }

  let url = `/service-map/clusters`;
  if (!clusterId) {
    return url;
  }
  url = `${url}/${clusterId}`;
  if (!namespaces) {
    url = `${url}/-`;
  } else {
    url = `${url}/${namespaces}`;
  }
  url = `${url}/${selectedAppAdvancedViewType}`;
  if (selectedAppAdvancedViewType === AppAdvancedViewType.FLOWS) {
    if (!flowsQuery) {
      url = `${url}/none`;
    } else {
      url = `${url}/${flowsQuery}`;
    }
  }
  url = appendEndpointProtocolFuntcionIds(url);
  const queryString = qs.stringify({
    ...{
      "flows-start-date": flowsStartDate ? flowsStartDate.url : undefined,
      "flows-status": flowsForwardingStatus,
      "flows-filter-input": flowsFilterInput,
      "flows-http-status-code": flowsHttpStatusCode
    }
  });
  return `${url}?${queryString}`;
};

export const hasEndpointFilter = (endpointsFilter: EndpointQueryObject) => {
  return Boolean(
    endpointsFilter.self || endpointsFilter.to || endpointsFilter.from
  );
};
