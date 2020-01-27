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
import { AppFunction, Protocol } from "../../../graphqlTypes";
import { provide } from "../../../state";
import {
  getCurrentEndpoint,
  getCurrentFunction,
  getCurrentProtocol,
  getEndpointVisibleMode,
  getGraphBoundaries,
  getShortandEndpointName,
  isFlowVisibleMode
} from "../../App/state/selectors";
import { pushAppUrl } from "../../Routing/state/actions";
import { getEndpointQueryObjectFromParams } from "../../Routing/state/selectors";
import { FunctionsGroups, Graph, Node } from "./types";

interface FlowNodeConnectorOwnProps {
  readonly fromNode: Node;
  readonly toNode: Node;
}

export const flowNodeConnectorProvider = provide({
  mapStateToProps: (state, ownProps: FlowNodeConnectorOwnProps) => {
    const currentEndpoint = getCurrentEndpoint(state);
    const currentProtocol = getCurrentProtocol(state);
    const currentFunction = getCurrentFunction(state);
    const visibleMode = isFlowVisibleMode(
      state,
      ownProps.fromNode.endpoint,
      ownProps.toNode.endpoint
    );

    let selected = false;
    let applicationProtocol = null;
    if (currentEndpoint) {
      if (currentEndpoint.id === ownProps.toNode.endpoint.id) {
        if (currentFunction) {
          selected = currentFunction.allowedSources.some(
            allowedSource => allowedSource === ownProps.fromNode.endpoint.id
          );
        }
        if (!selected) {
          if (currentProtocol && !currentFunction) {
            selected = (currentProtocol.allowedSources || []).some(
              allowedSource => allowedSource === ownProps.fromNode.endpoint.id
            );
          }
        }
        applicationProtocol =
          selected && currentProtocol && currentProtocol.applicationProtocol
            ? currentProtocol.applicationProtocol.toLowerCase()
            : null;
      }
    }

    return { selected, visibleMode, applicationProtocol };
  }
});

interface FlowNodeBoundariesOwnProps {
  readonly node: Node;
}

export const flowNodeBoundariesProvider = provide({
  mapStateToProps: (state, ownProps: FlowNodeBoundariesOwnProps) => ({
    boundaries: getGraphBoundaries(state)
  })
});

interface FlowOwnProps {
  readonly fromNode: Node;
  readonly toNode: Node;
  readonly toProtocol: Protocol;
  readonly toFunction?: AppFunction;
}

export const flowProvider = provide({
  mapStateToProps: (state, ownProps: FlowOwnProps) => {
    const currentEndpoint = getCurrentEndpoint(state);
    const currentProtocol = getCurrentProtocol(state);
    const currentFunction = getCurrentFunction(state);
    const visibleMode = isFlowVisibleMode(
      state,
      ownProps.fromNode.endpoint,
      ownProps.toNode.endpoint
    );

    let selected = false;
    let applicationProtocol = null;
    if (currentEndpoint) {
      if (currentEndpoint.id === ownProps.toNode.endpoint.id) {
        if (currentFunction && ownProps.toFunction) {
          selected = Boolean(currentFunction.id === ownProps.toFunction.id);
        }
        if (!selected) {
          if (currentProtocol && !currentFunction && !ownProps.toFunction) {
            selected = Boolean(currentProtocol.id === ownProps.toProtocol.id);
          }
        }
        selected = Boolean(selected && currentProtocol);
        applicationProtocol =
          selected && currentProtocol && currentProtocol.applicationProtocol
            ? currentProtocol.applicationProtocol.toLowerCase()
            : null;
      }
    }
    return { selected, visibleMode, applicationProtocol };
  }
});

interface Endpoint1LayerOwnProps {
  node: Node;
}

export const endpoint1LayerProvider = provide({
  mapStateToProps: (state, ownProps: Endpoint1LayerOwnProps) => {
    const visibleMode = getEndpointVisibleMode(state, ownProps.node.endpoint);
    return { visibleMode };
  }
});

interface Endpoint2LayerOwnProps {
  readonly graph: Graph;
  readonly node: Node;
}

export const endpoint2LayerProvider = provide({
  mapStateToProps: (state, ownProps: Endpoint2LayerOwnProps) => {
    const endpointsFilter = getEndpointQueryObjectFromParams(state);
    const currentEndpoint = getCurrentEndpoint(state);
    const currentProtocol = getCurrentProtocol(state);
    const currentFunction = getCurrentFunction(state);
    const visibleMode = getEndpointVisibleMode(state, ownProps.node.endpoint);

    let selected = false;
    let applicationProtocol = "other";
    let applicationProtocolDefault = "other";
    if (currentEndpoint) {
      if (currentFunction) {
        selected = currentFunction.allowedSources.some(
          allowedSource => allowedSource === ownProps.node.endpoint.id
        );
      }
      if (!selected) {
        if (currentProtocol && !currentFunction) {
          selected = (currentProtocol.allowedSources || []).some(
            allowedSource => allowedSource === ownProps.node.endpoint.id
          );
        }
      }
      selected = Boolean(selected && currentProtocol);
      if (selected) {
        applicationProtocol = applicationProtocolDefault = "otherSelected";
      }
      applicationProtocol =
        selected && currentProtocol && currentProtocol.applicationProtocol
          ? `${applicationProtocol}${currentProtocol.applicationProtocol.toLowerCase()}`
          : applicationProtocol;
    }

    return {
      selected,
      visibleMode,
      applicationProtocolDefault,
      applicationProtocol,
      currentEndpoint,
      endpointsFilter
    };
  }
});

interface Endpoint3LayerOwnProps {
  graph: Graph;
  node: Node;
}

export const endpoint3LayerProvider = provide({
  mapStateToProps: (state, ownProps: Endpoint3LayerOwnProps) => {
    const currentEndpoint = getCurrentEndpoint(state);
    const endpointFilter = getEndpointQueryObjectFromParams(state);
    const visibleMode = getEndpointVisibleMode(state, ownProps.node.endpoint);
    const endpointName = getShortandEndpointName(
      state,
      ownProps.node.endpoint.name
    );

    const selected =
      endpointFilter.from === ownProps.node.endpoint.id ||
      endpointFilter.to === ownProps.node.endpoint.id ||
      endpointFilter.self === ownProps.node.endpoint.id;

    return {
      endpointName,
      currentEndpoint,
      selected,
      visibleMode
    };
  },
  mapDispatchToProps: {
    pushAppUrl
  }
});

interface NodeProtocolOwnProps {
  readonly endpointId: string;
  readonly filteredFunctions: AppFunction[];
  readonly protocol: Protocol;
  readonly visibleFunctionsGroups: FunctionsGroups;
}

export const nodeProtocolProvider = provide({
  mapStateToProps: (state, ownProps: NodeProtocolOwnProps) => {
    const currentProtocol = getCurrentProtocol(state);
    const currentFunction = getCurrentFunction(state);

    let selected = false;
    if (currentProtocol && !currentFunction) {
      selected = ownProps.protocol.id === currentProtocol.id;
    }

    return {
      selected
    };
  },
  mapDispatchToProps: {
    pushAppUrl
  }
});

interface NodeFunctionOwnProps {
  readonly endpointId: string;
  readonly protocolId: string;
  readonly func: AppFunction;
  readonly title: string;
  readonly applicationProtocol?: string | null;
}

export const nodeFunctionProvider = provide({
  mapStateToProps: (state, ownProps: NodeFunctionOwnProps) => {
    const currentFunction = getCurrentFunction(state);

    let selected = false;
    if (currentFunction) {
      selected = ownProps.func.id === currentFunction.id;
    }

    return {
      selected
    };
  },
  mapDispatchToProps: {
    pushAppUrl
  }
});
