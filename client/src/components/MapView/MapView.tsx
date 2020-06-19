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
import { Spinner } from "@blueprintjs/core";
import { event as d3event, select as d3select, Selection } from "d3-selection";
import {
  zoom as d3zoom,
  ZoomBehavior,
  zoomIdentity as d3zoomIdentity,
  ZoomTransform
} from "d3-zoom";
import { throttle } from "lodash";
import * as React from "react";
import { AppFunction, Protocol } from "../../graphqlTypes";
import { provide } from "../../state";
import {
  getCurrentEndpointId,
  getCurrentFunctionId,
  getCurrentProtocolId,
  getGraphData,
  getGraphSnapshot,
  getMapFilters,
  getMapPanelPosition,
  getScreenDimensions
} from "../App/state/selectors";
import {
  getClusterDiscovering,
  getClusterDiscoveryResult
} from "../Clusters/state/selectors";
import { appUrlStateMeta } from "../Routing/state/actions";
import { getEndpointQueryFromParams } from "../Routing/state/selectors";
import { Endpoint1Layer, Endpoint2Layer, Endpoint3Layer } from "./Endpoint";
import { FlowBetweenConnectorAndNode } from "./FlowBetweenConnectorAndNode";
import { FlowBetweenNodeAndBounds } from "./FlowBetweenNodeAndBorder";
import { FlowBetweenNodeAndConnector } from "./FlowBetweenNodeAndConnector";
import { FlowNodeConnector } from "./FlowNodeConnector";
import { MapBoundary } from "./MapBoundary";
import { Node } from "./state/types";
import { MAP_H_PADDING } from "./utils/constants";
import { forEachAllowedNode, forEachNode } from "./utils/graphs";

const css = require("./MapView.scss");

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 1;
const V_THRESHOLD = 45 + 20;
const H_THRESHOLD = MAP_H_PADDING * 2;

const EmptyState = ({
  type,
  text
}: {
  type: "empty" | "error";
  text: string;
}) => (
  <div className={css.canvas}>
    <hgroup className={css.emptyStateTitles}>
      <h1 className={css.emptyStateTitle}>Nothing to show</h1>
      <h2 className={css.emptyStateSubTitle}>{text}</h2>
    </hgroup>
  </div>
);

const wrapperProvider = provide({
  mapStateToProps: state => {
    const graph = getGraphData(state);
    return {
      isMapEmpty: !graph || Object.keys(graph.graph).length === 0,
      loading: getClusterDiscovering(state)
    };
  }
});

export const { Container: MapView } = wrapperProvider(
  Props => (props: typeof Props) => {
    if (props.isMapEmpty) {
      if (props.loading) {
        return (
          <div className={css.emptyMapStub}>
            <Spinner size={84} />
            <div style={{ marginTop: "20px" }}>
              Loading data for service map...
            </div>
          </div>
        );
      }
      return (
        <div className={css.emptyMapStub}>
          {" "}
          <img
            src={require("../assets/icons/crossed-out-circle.svg")}
            className={css.emptyMapIcon}
          />
          No data to display the deployment map
        </div>
      );
    }
    return <Map />;
  }
);

const provider = provide({
  mapStateToProps: state => {
    let hasData = Boolean(getClusterDiscoveryResult(state));
    return {
      hasData,
      currentEndpointId: getCurrentEndpointId(state),
      currentProtocolId: getCurrentProtocolId(state),
      currentFunctionId: getCurrentFunctionId(state),
      graphData: getGraphData(state),
      graphSnapshot: getGraphSnapshot(state),
      screenDimensions: getScreenDimensions(state),
      mapPanelPosition: getMapPanelPosition(state),
      filterFromParams: getEndpointQueryFromParams(state),
      mapFilters: getMapFilters(state)
    };
  }
});

const { Container: Map } = provider(Props => {
  type PropsType = typeof Props;
  interface State {
    readonly scaled: boolean;
    readonly transform: ZoomTransform | null;
    readonly endpoints1Layer: JSX.Element[];
    readonly selectedEndpoints1Layer: JSX.Element[];
    readonly endpoints2Layer: JSX.Element[];
    readonly selectedEndpoints2Layer: JSX.Element[];
    readonly endpoints3Layer: JSX.Element[];
    readonly selectedEndpoints3Layer: JSX.Element[];
    readonly flowsBetweenConnectorsAndFunctions: JSX.Element[];
    readonly selectedFlowsBetweenConnectorsAndFunctions: JSX.Element[];
    readonly flowsBetweenNodesAndConnectors: JSX.Element[];
    readonly selectedFlowsBetweenNodesAndConnectors: JSX.Element[];
    readonly flowsBetweenNodesAndBounds: JSX.Element[];
    readonly connectors: JSX.Element[];
    readonly selectedConnectors: JSX.Element[];
  }
  return class MapClass extends React.Component<PropsType, State> {
    canvas: SVGGElement | null;
    zoom: ZoomBehavior<any, any>;
    selection: Selection<SVGGElement, any, any, any>;

    constructor(props: PropsType) {
      super(props);

      this.state = {
        scaled: false,
        transform: null,
        endpoints1Layer: [],
        selectedEndpoints1Layer: [],
        endpoints2Layer: [],
        selectedEndpoints2Layer: [],
        endpoints3Layer: [],
        selectedEndpoints3Layer: [],
        flowsBetweenConnectorsAndFunctions: [],
        selectedFlowsBetweenConnectorsAndFunctions: [],
        flowsBetweenNodesAndConnectors: [],
        selectedFlowsBetweenNodesAndConnectors: [],
        flowsBetweenNodesAndBounds: [],
        connectors: [],
        selectedConnectors: []
      };
    }

    componentWillMount() {
      this.zoom = d3zoom().scaleExtent([MIN_ZOOM, MAX_ZOOM]);
    }

    componentDidMount() {
      this.componentWillReceiveProps(this.props, this.state);
    }

    shouldComponentUpdate(nextProps: PropsType, nextState: State) {
      const { needRerender, needRebuildMapComponents } = this.detectChanges(
        nextProps,
        nextState
      );
      return needRerender || needRebuildMapComponents;
    }

    detectChanges = (nextProps: PropsType, nextState: State) => {
      const { scaled, transform } = nextState;

      const transformChanged = nextState.transform !== this.state.transform;
      const graphChanged = nextProps.graphSnapshot !== this.props.graphSnapshot;

      const endpointIdChanged =
        nextProps.currentEndpointId !== this.props.currentEndpointId;

      const filterChanged =
        nextProps.filterFromParams !== this.props.filterFromParams;

      const mapFiltersChanged = nextProps.mapFilters !== this.props.mapFilters;

      const protocolIdChanged =
        nextProps.currentProtocolId !== this.props.currentProtocolId;

      const functionIdChanged =
        nextProps.currentFunctionId !== this.props.currentFunctionId;

      const someElementIdChanged =
        endpointIdChanged || protocolIdChanged || functionIdChanged;

      const notZeroDimensions =
        nextProps.screenDimensions.height > 0 &&
        nextProps.screenDimensions.width > 0;

      const screenHeightChanged =
        nextProps.screenDimensions.height !==
        this.props.screenDimensions.height;

      const screenWidthChanged =
        nextProps.screenDimensions.width !== this.props.screenDimensions.width;

      const screenSizeChanged = screenHeightChanged || screenWidthChanged;

      const mapPanelPositionChanged =
        nextProps.mapPanelPosition !== this.props.mapPanelPosition;

      const anyChanged =
        transformChanged ||
        graphChanged ||
        someElementIdChanged ||
        filterChanged ||
        mapFiltersChanged ||
        screenSizeChanged ||
        mapPanelPositionChanged ||
        !scaled;

      const canRender = this.canvas !== null && nextProps.hasData;

      const needRerender = canRender && notZeroDimensions && anyChanged;

      const needRebuildMapComponents =
        !scaled || graphChanged || mapFiltersChanged || someElementIdChanged;

      return {
        filterChanged,
        needRerender,
        graphChanged,
        needRebuildMapComponents,
        screenSizeChanged,
        mapPanelPositionChanged
      };
    };

    componentWillReceiveProps(nextProps: PropsType, nextState: State) {
      const {
        needRerender,
        needRebuildMapComponents,
        screenSizeChanged,
        mapPanelPositionChanged,
        filterChanged
      } = this.detectChanges(nextProps, this.state);

      const needRescale =
        !this.state.scaled ||
        screenSizeChanged ||
        mapPanelPositionChanged ||
        filterChanged;

      const { needRecenterMap } = appUrlStateMeta;

      if (needRerender) {
        let nextState: State = this.state;
        if (!this.state.scaled) {
          this.initializeScaling();
          nextState = {
            ...this.state,
            scaled: true
          };
        }

        if (needRebuildMapComponents) {
          nextState = {
            ...nextState,
            ...this.buildMapComponents(nextProps)
          };
        }

        const rescaling = () => {
          if (needRescale) {
            this.rescale(nextState, nextProps);
          } else if (needRecenterMap) {
            appUrlStateMeta.needRecenterMap = false;
            this.recenter(nextState, nextProps);
          }
        };

        if (nextState !== this.state) {
          this.setState(nextState, rescaling);
        } else {
          rescaling();
        }
      } else if (needRebuildMapComponents) {
        this.setState(this.buildMapComponents(nextProps));
      }
    }

    componentWillUnmount() {
      if (this.zoom) {
        this.zoom.on("zoom", null);
      }
      if (this.selection) {
        this.selection.on("wheel", null);
      }
    }

    initializeScaling = () => {
      this.zoom.on("zoom", this.onZoom);
      this.selection = d3select(this.canvas!);
      this.selection.on("wheel", () => d3event.preventDefault());
      this.selection.call(this.zoom);
    };

    rescale = throttle((state: State, props: PropsType) => {
      const height = this.calculateActualMapHeight(state, props);
      const scale = this.calculateTransformScale(state, props, height);
      const { x, y } = this.calculateTransformXY(state, props, height, scale);
      this.zoom.transform(
        this.selection,
        d3zoomIdentity.translate(x, y).scale(scale)
      );
    }, 200);

    recenter = (state: State, props: PropsType) => {
      const { transform } = state;
      const { graphData } = props;
      const { currentEndpointId } = props;
      if (transform && graphData && currentEndpointId) {
        const node = graphData.graph[currentEndpointId];
        const mapWidth = this.calculateActualMapWidth(state, props);
        const mapHeight = this.calculateActualMapHeight(state, props);
        let scale = transform.k;
        if (mapHeight < node.height * scale) {
          scale = mapHeight / ((node.height + V_THRESHOLD) * scale);
        }
        const { x, y } = this.calculateTransformXY(
          state,
          props,
          mapHeight,
          scale
        );
        const nodeLeftX = x + -node.x * scale;
        const nodeTopY = y + -node.y * scale;
        const nodeCenterX = nodeLeftX + (-node.width * scale) / 2;
        const nodeCenterY = nodeTopY + (-node.height * scale) / 2;
        const mapCenterX = (mapWidth - x * 2) / 2;
        const mapCenterY = (mapHeight - y * 2) / 2;
        const nodeX = mapCenterX + nodeCenterX;
        const nodeY = mapCenterY + nodeCenterY;
        this.zoom.transform(
          this.selection,
          d3zoomIdentity.translate(nodeX, nodeY).scale(scale)
        );
      }
    };

    calculateActualMapWidth = (state: State, props: PropsType) => {
      const { screenDimensions } = props;
      const { width: screenWidth } = screenDimensions;
      return screenWidth - H_THRESHOLD;
    };

    calculateActualMapHeight = (state: State, props: PropsType) => {
      const { screenDimensions } = props;
      const { height: screenHeight } = screenDimensions;
      const heightMultiplier = Math.max(props.mapPanelPosition, 0.25);
      const thresholdDivider = 2;
      const viewHeight = screenHeight - V_THRESHOLD;
      return viewHeight * heightMultiplier - thresholdDivider;
    };

    calculateTransformScale = (
      state: State,
      props: PropsType,
      height: number
    ) => {
      const { graphData } = props;
      if (!graphData) {
        return 1;
      }
      const { screenDimensions } = props;
      const { width } = screenDimensions;
      let scale = (height - V_THRESHOLD) / graphData.meta.graphHeight;
      if (graphData.meta.graphWidth * scale > width - H_THRESHOLD) {
        scale = (width - H_THRESHOLD) / graphData.meta.graphWidth;
      }
      return Math.min(1, scale);
    };

    calculateTransformXY = (
      state: State,
      props: PropsType,
      height: number,
      scale: number
    ) => {
      const { screenDimensions, graphData } = props;
      if (!graphData) {
        return { x: 0, y: 0 };
      }
      const { width: screenWidth } = screenDimensions;
      const x =
        (screenWidth - H_THRESHOLD - graphData.meta.graphWidth * scale) / 2;
      const y =
        Math.abs(
          height - V_THRESHOLD / 2 - graphData.meta.graphHeight * scale
        ) / 2;
      return { x, y };
    };

    onZoom = () => this.setState({ transform: d3event.transform });

    buildMapComponents = (props: PropsType) => {
      const {
        graphData,
        currentProtocolId,
        currentFunctionId,
        mapFilters
      } = props;

      const endpoints1Layer: JSX.Element[] = [];
      const selectedEndpoints1Layer: JSX.Element[] = [];
      const endpoints2Layer: JSX.Element[] = [];
      const selectedEndpoints2Layer: JSX.Element[] = [];
      const endpoints3Layer: JSX.Element[] = [];
      const selectedEndpoints3Layer: JSX.Element[] = [];
      const flowsBetweenConnectorsAndFunctions: JSX.Element[] = [];
      const selectedFlowsBetweenConnectorsAndFunctions: JSX.Element[] = [];
      const flowsBetweenNodesAndConnectors: JSX.Element[] = [];
      const selectedFlowsBetweenNodesAndConnectors: JSX.Element[] = [];
      const flowsBetweenNodesAndBounds: JSX.Element[] = [];
      const connectors: JSX.Element[] = [];
      const selectedConnectors: JSX.Element[] = [];

      if (!graphData) {
        return {
          endpoints1Layer,
          selectedEndpoints1Layer,
          endpoints2Layer,
          selectedEndpoints2Layer,
          endpoints3Layer,
          selectedEndpoints3Layer,
          flowsBetweenConnectorsAndFunctions,
          selectedFlowsBetweenConnectorsAndFunctions,
          flowsBetweenNodesAndConnectors,
          selectedFlowsBetweenNodesAndConnectors,
          flowsBetweenNodesAndBounds,
          connectors,
          selectedConnectors
        };
      }

      const usedKeys: { [key: string]: boolean } = {};

      const add = <P extends object>(
        targetElements: JSX.Element[],
        Component: React.ComponentType<P>,
        key: string,
        props: any
      ) => {
        if (!usedKeys[key]) {
          usedKeys[key] = true;
          targetElements.push(<Component key={key} {...props} />);
        }
      };

      const addConnector = (
        selected: boolean,
        fromNode: Node,
        toNode: Node
      ) => {
        const key = [
          selected ? "selected:connector" : "connector",
          fromNode.endpoint.id,
          toNode.endpoint.id
        ].join(":");
        const targetElements = selected ? selectedConnectors : connectors;
        const props = { fromNode, toNode };
        add(targetElements, FlowNodeConnector, key, props);
      };

      const addFlowBetweenNodeAndConnector = (
        selected: boolean,
        fromNode: Node,
        toNode: Node
      ) => {
        const baseKey = "flowBetweenNodeAndConnector";
        const key = [
          selected ? `selected:${baseKey}` : baseKey,
          fromNode.endpoint.id,
          toNode.endpoint.id
        ].join(":");
        const targetElements = selected
          ? selectedFlowsBetweenNodesAndConnectors
          : flowsBetweenNodesAndConnectors;
        const props = { fromNode, toNode };
        add(targetElements, FlowBetweenNodeAndConnector, key, props);
      };

      const addFlowBetweenNodeAndBounds = (node: Node) => {
        const key = ["flowBetweenNodeAndBounds", node.endpoint.id].join(":");
        const props = { node };
        add(flowsBetweenNodesAndBounds, FlowBetweenNodeAndBounds, key, props);
      };

      const addFlowBetweenConnectorAndFunction = (
        selected: boolean,
        fromNode: Node,
        toNode: Node,
        protocol: Protocol,
        func?: AppFunction
      ) => {
        const baseKey = "flowBetweenConnectorAndFunction";
        const key = [
          selected ? `selected:${baseKey}` : baseKey,
          fromNode.endpoint.id,
          toNode.endpoint.id,
          protocol.id,
          func ? func.id : ""
        ].join(":");
        const targetElements = selected
          ? selectedFlowsBetweenConnectorsAndFunctions
          : flowsBetweenConnectorsAndFunctions;
        const props = {
          fromNode,
          toNode,
          toProtocol: protocol,
          toFunction: func
        };
        add(targetElements, FlowBetweenConnectorAndNode, key, props);
      };

      const addFlows = (
        selected: boolean,
        fromNode: Node,
        toNode: Node,
        protocol: Protocol,
        func?: AppFunction
      ) => {
        addFlowBetweenNodeAndConnector(selected, fromNode, toNode);
        addFlowBetweenConnectorAndFunction(
          selected,
          fromNode,
          toNode,
          protocol,
          func
        );
        addConnector(selected, fromNode, toNode);
      };

      const hideIngressFlows = (node: Node) => {
        return Boolean(
          mapFilters.aggregateIngressFlows &&
            node.connection.type === "many-ingress-to-app"
        );
      };

      const hideEgressFlows = (node: Node) => {
        return Boolean(
          mapFilters.aggregateEgressFlows &&
            node.connection.type === "many-egress-from-app"
        );
      };

      const hideIntraAppFlows = (fromNode: Node, toNode: Node) => {
        return Boolean(
          !mapFilters.showIntraAppTraffic &&
            !fromNode.connection.outside &&
            !toNode.connection.outside
        );
      };

      forEachNode(graphData.graph, toNode => {
        add(
          endpoints1Layer,
          Endpoint1Layer,
          `endpoint1Layer:${toNode.endpoint.id}`,
          { node: toNode }
        );
        add(
          endpoints2Layer,
          Endpoint2Layer,
          `endpoint2Layer:${toNode.endpoint.id}`,
          { graph: graphData.graph, node: toNode }
        );
        add(
          endpoints3Layer,
          Endpoint3Layer,
          `endpoint3Layer:${toNode.endpoint.id}`,
          { graph: graphData.graph, node: toNode }
        );
        if (hideIngressFlows(toNode)) {
          addFlowBetweenNodeAndBounds(toNode);
          return;
        } else if (hideEgressFlows(toNode)) {
          addFlowBetweenNodeAndBounds(toNode);
          return;
        }
        forEachAllowedNode(graphData.graph, toNode, fromNode => {
          if (hideIntraAppFlows(fromNode, toNode)) {
            return;
          }
          if (hideIngressFlows(fromNode)) {
            addFlowBetweenNodeAndBounds(fromNode);
            return;
          } else if (hideEgressFlows(fromNode)) {
            addFlowBetweenNodeAndBounds(fromNode);
            return;
          }
          toNode.protocolsFunctionsGroups.forEach(
            ({
              visibleFunctionsGroups,
              protocolIndex,
              visibleAllowedSources
            }) => {
              const protocol = toNode.endpoint.protocols[protocolIndex];

              const protocolAllowed = visibleAllowedSources.some(
                allowedSource => allowedSource === fromNode.endpoint.id
              );
              if (protocolAllowed) {
                addFlows(false, fromNode, toNode, protocol);
                if (!currentFunctionId && protocol.id === currentProtocolId) {
                  addFlows(true, fromNode, toNode, protocol);
                }
              }

              visibleFunctionsGroups.forEach(functionsGroup => {
                functionsGroup.functions.forEach(
                  ({ functionIndex, visibleAllowedSources }) => {
                    const func = (protocol.functions || [])[functionIndex];
                    const functionAllowed = visibleAllowedSources.some(
                      allowedSource => allowedSource === fromNode.endpoint.id
                    );
                    if (functionAllowed) {
                      addFlows(false, fromNode, toNode, protocol, func);
                      if (func.id === currentFunctionId) {
                        addFlows(true, fromNode, toNode, protocol, func);
                      }
                    }
                  }
                );
              });
            }
          );
        });
      });
      return {
        endpoints1Layer,
        selectedEndpoints1Layer,
        endpoints2Layer,
        selectedEndpoints2Layer,
        endpoints3Layer,
        selectedEndpoints3Layer,
        flowsBetweenConnectorsAndFunctions,
        selectedFlowsBetweenConnectorsAndFunctions,
        flowsBetweenNodesAndConnectors,
        selectedFlowsBetweenNodesAndConnectors,
        flowsBetweenNodesAndBounds,
        connectors,
        selectedConnectors
      };
    };

    render() {
      const {
        graphData,
        screenDimensions: { height: screenHeight, width: screenWidth }
      } = this.props;
      const { scaled, transform } = this.state;
      const {
        endpoints1Layer,
        selectedEndpoints1Layer,
        endpoints2Layer,
        selectedEndpoints2Layer,
        endpoints3Layer,
        selectedEndpoints3Layer,
        flowsBetweenConnectorsAndFunctions,
        selectedFlowsBetweenConnectorsAndFunctions,
        flowsBetweenNodesAndConnectors,
        selectedFlowsBetweenNodesAndConnectors,
        flowsBetweenNodesAndBounds,
        connectors,
        selectedConnectors
      } = this.state;

      const canRenderComponents = scaled && transform !== null;

      return (
        <div className={css.wrapper}>
          <svg className={css.canvas}>
            <g ref={ref => (this.canvas = ref)}>
              <rect
                width={screenWidth}
                height={screenHeight}
                fill="transparent"
              />
              {canRenderComponents && (
                <g transform={transform!.toString()}>
                  {graphData &&
                    graphData.meta.boundaries.map(boundary => {
                      return (
                        <MapBoundary
                          key={`${boundary.type}:${boundary.title}`}
                          strokeWidth={2}
                          strokeDasharray="10 7"
                          fillOpacity={0.05}
                          boundary={boundary}
                          cornerRadius={7}
                          padding={40}
                        />
                      );
                    })}
                  {endpoints1Layer}
                  {selectedEndpoints1Layer}
                  {flowsBetweenNodesAndBounds}
                  {flowsBetweenNodesAndConnectors}
                  {flowsBetweenConnectorsAndFunctions}
                  {selectedFlowsBetweenNodesAndConnectors}
                  {connectors}
                  {endpoints2Layer}
                  {selectedEndpoints2Layer}
                  {selectedFlowsBetweenConnectorsAndFunctions}
                  {selectedConnectors}
                  {endpoints3Layer}
                  {selectedEndpoints3Layer}
                </g>
              )}
            </g>
          </svg>
        </div>
      );
    }
  };
});
