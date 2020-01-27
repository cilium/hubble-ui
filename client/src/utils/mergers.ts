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
import { uniq } from "lodash";
import {
  AllowedSourcesDisabledMap,
  ChangesMetaMap,
  FunctionsChangesMeta,
  ProtocolsChangesMeta
} from "../components/App/state/types";
import { AppEndpoint, AppFunction, Protocol } from "../graphqlTypes";

const isObject = (x: any): boolean => typeof x === "object";

export const mergeEndpoints = (
  stateEndpoints: AppEndpoint[],
  newEndpoints: AppEndpoint[],
  allowedSourcesDisabled: AllowedSourcesDisabledMap,
  changesMetaMap: ChangesMetaMap,
  concat = false
): AppEndpoint[] => {
  const mergedNewEndpoints = newEndpoints
    .filter(newEndpoint => {
      const wasRemoved = changesMetaMap[newEndpoint.id] === "removed";
      return !wasRemoved;
    })
    .map(newEndpoint => {
      const stateEndpoint = stateEndpoints.find(
        ({ id }) => newEndpoint.id === id
      );
      if (!stateEndpoint) {
        return newEndpoint;
      }
      return mergeEndpoint(
        stateEndpoint,
        newEndpoint,
        allowedSourcesDisabled,
        changesMetaMap
      );
    });
  const finalMergedEndpoints = mergedNewEndpoints.concat(
    stateEndpoints.filter(stateEndpoint => {
      const existInNewEndpoints = newEndpoints.some(
        ({ id }) => stateEndpoint.id === id
      );
      const wasAdded = changesMetaMap[stateEndpoint.id] === "new";
      return !existInNewEndpoints && (wasAdded || concat);
    })
  );
  return finalMergedEndpoints;
};

const mergeEndpoint = (
  stateEndpoint: AppEndpoint,
  newEndpoint: AppEndpoint,
  allowedSourcesDisabled: AllowedSourcesDisabledMap,
  changesMetaMap: ChangesMetaMap,
  concat = false
): AppEndpoint => {
  const endpointChangesMeta = changesMetaMap[stateEndpoint.id];
  return {
    ...newEndpoint,
    ...(isObject(endpointChangesMeta) ? (endpointChangesMeta as any) : {}),
    protocols: mergeProtocols(
      stateEndpoint.protocols,
      newEndpoint.protocols,
      allowedSourcesDisabled,
      changesMetaMap,
      concat
    )
  };
};

const mergeProtocols = (
  stateProtocols: Protocol[],
  newProtocols: Protocol[],
  allowedSourcesDisabled: AllowedSourcesDisabledMap,
  changesMetaMap: ChangesMetaMap,
  concat = false
): Protocol[] => {
  const mergedNewProtocols = newProtocols
    .filter(newProtocol => {
      const wasRemoved = changesMetaMap[newProtocol.id] === "removed";
      return !wasRemoved;
    })
    .map(newProtocol => {
      const stateProtocol = stateProtocols.find(
        ({ id }) => newProtocol.id === id
      );
      if (!stateProtocol) {
        return newProtocol;
      }
      return mergeProtocol(
        stateProtocol,
        newProtocol,
        allowedSourcesDisabled,
        changesMetaMap,
        concat
      );
    });
  const finalMergedProtocols = mergedNewProtocols.concat(
    stateProtocols.filter(stateProtocol => {
      const existInNewProtocols = newProtocols.some(
        ({ id }) => stateProtocol.id === id
      );
      const wasAdded = changesMetaMap[stateProtocol.id] === "new";
      return !existInNewProtocols && (wasAdded || concat);
    })
  );

  return finalMergedProtocols;
};

const mergeProtocol = (
  stateProtocol: Protocol,
  newProtocol: Protocol,
  allowedSourcesDisabled: AllowedSourcesDisabledMap,
  changesMetaMap: ChangesMetaMap,
  concat = false
): Protocol => {
  const protocolChangesMeta = changesMetaMap[stateProtocol.id];
  return {
    ...newProtocol,
    ...(isObject(protocolChangesMeta) ? (protocolChangesMeta as any) : {}),
    functions: mergeFunctions(
      stateProtocol.functions || [],
      newProtocol.functions || [],
      allowedSourcesDisabled,
      changesMetaMap,
      concat
    ),
    allowedSources: mergeSources(
      stateProtocol,
      newProtocol,
      allowedSourcesDisabled,
      changesMetaMap,
      concat
    )
  };
};

const mergeFunctions = (
  stateFunctions: AppFunction[],
  newFunctions: AppFunction[],
  allowedSourcesDisabled: AllowedSourcesDisabledMap,
  changesMetaMap: ChangesMetaMap,
  concat = false
): AppFunction[] => {
  const mergedNewFunctions = newFunctions.map(newFunction => {
    const stateFunction = stateFunctions.find(
      ({ id }) => newFunction.id === id
    );
    if (!stateFunction) {
      return newFunction;
    }
    return mergeFunction(
      stateFunction,
      newFunction,
      allowedSourcesDisabled,
      changesMetaMap,
      concat
    );
  });
  const finalMergedFunctions = mergedNewFunctions.concat(
    stateFunctions.filter(stateFunction => {
      const existInNewFunctions = newFunctions.some(
        ({ id }) => stateFunction.id === id
      );
      const wasAdded = changesMetaMap[stateFunction.id] === "new";
      return !existInNewFunctions && (wasAdded || concat);
    })
  );

  return finalMergedFunctions;
};

const mergeFunction = (
  stateFunction: AppFunction,
  newFunction: AppFunction,
  allowedSourcesDisabled: AllowedSourcesDisabledMap,
  changesMetaMap: ChangesMetaMap,
  concat = false
): AppFunction => {
  const functionChangesMeta = changesMetaMap[stateFunction.id];
  return {
    ...newFunction,
    ...(isObject(functionChangesMeta) ? (functionChangesMeta as any) : {}),
    allowedSources: mergeSources(
      stateFunction,
      newFunction,
      allowedSourcesDisabled,
      changesMetaMap,
      concat
    )
  };
};

const mergeSources = (
  stateElement: AppFunction | Protocol,
  newElement: AppFunction | Protocol,
  allowedSourcesDisabled: AllowedSourcesDisabledMap,
  changesMetaMap: ChangesMetaMap,
  concat = false
): string[] => {
  let elementChangesMeta = changesMetaMap[stateElement.id];
  let addedAllowedSources: string[] = [];
  if (isObject(elementChangesMeta)) {
    elementChangesMeta = elementChangesMeta as
      | ProtocolsChangesMeta
      | FunctionsChangesMeta;
    if ("allowedSources" in elementChangesMeta) {
      addedAllowedSources = elementChangesMeta.allowedSources as string[];
    }
  }
  const mergedAllowedSources = uniq(
    newElement.allowedSources
      .concat(addedAllowedSources)
      .concat(concat ? stateElement.allowedSources : [])
  );
  return filterSources(
    mergedAllowedSources,
    allowedSourcesDisabled[stateElement.id] || []
  );
};

const filterSources = (
  allowedSources: string[],
  allowedSourcesDisabled: string[]
): string[] => {
  const disabledSourcesMap: { [key: string]: boolean } = {};
  allowedSourcesDisabled.forEach(id => (disabledSourcesMap[id] = true));
  return allowedSources.filter(id => !disabledSourcesMap[id]);
};
