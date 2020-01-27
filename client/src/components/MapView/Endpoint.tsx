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
import { Tooltip } from "react-tippy";
import { Protocol } from "../../graphqlTypes";
import {
  buildEndpointFilterHash,
  getEndpointNamespaceFromLabels,
  getExtraLabels,
  isBottomNode,
  isCIDREndpoint,
  isDNSEndpoint,
  isTopNode,
  isWorldOrHostNode,
  normalizeLabelName,
  processFunctionName
} from "../App/utils";
import * as Badges from "../Misc/Badges";
import { EndpointLogo } from "../Misc/ProtocolsImages";
import {
  endpoint1LayerProvider,
  endpoint2LayerProvider,
  endpoint3LayerProvider,
  nodeFunctionProvider,
  nodeProtocolProvider
} from "./state/providers";
import { FunctionsGroup } from "./state/types";
import { NODE_WIDTH } from "./utils/constants";
import { forEachNode } from "./utils/graphs";

const css = require("./MapView.scss");
const protocolors = require("../App/protocolors.scss");

const ingressGrayUnlockedIcon = require("../assets/icons/ingress-gray-unlocked-icon.svg");
const egressGrayUnlockedIcon = require("../assets/icons/egress-gray-unlocked-icon.svg");
const ingressBlueLockedIcon = require("../assets/icons/ingress-blue-locked-icon.svg");
const egressBlueLockedIcon = require("../assets/icons/egress-blue-locked-icon.svg");

export const { Container: Endpoint1Layer } = endpoint1LayerProvider(Props => {
  type Props = typeof Props;
  return class Endpoint1LayerClass extends React.Component<Props> {
    render() {
      const { node, visibleMode } = this.props;
      const { width, height, x, y } = node;
      const isWorld = isWorldOrHostNode(node);
      const className = [
        css.nodeFirstLayer,
        isCIDREndpoint(node.endpoint) && css.cidr
      ].join(" ");
      const fogged = visibleMode === "fogged";
      return (
        <g transform={`translate(${x},${y})`} opacity={fogged ? 0.25 : 1}>
          <foreignObject width={width} height={isWorld ? height - 38 : height}>
            <div className={className} />
          </foreignObject>
        </g>
      );
    }
  };
});

export const { Container: Endpoint2Layer } = endpoint2LayerProvider(Props => {
  type Props = typeof Props;
  return class Endpoint2LayerClass extends React.Component<Props> {
    render() {
      const {
        graph,
        node,
        endpointsFilter,
        applicationProtocol,
        visibleMode,
        applicationProtocolDefault
      } = this.props;
      const { width, height, x, y } = node;
      let isWorld = isWorldOrHostNode(node);
      let isBottom = isBottomNode(node);
      const endpointClassName = [
        css.nodeSecondLayer,
        protocolors[`${applicationProtocol}Node`] ||
          protocolors[`${applicationProtocolDefault}Node`],
        isCIDREndpoint(node.endpoint) && protocolors.cidr,
        isCIDREndpoint(node.endpoint) && css.cidr
      ].join(" ");
      const topEarClassName = [css.topEar];
      const rightEarClassName = [css.rightEar];
      let showTopEar = false;
      let showRightEar = false;
      forEachNode(graph, currentNode => {
        let allowed = false;
        currentNode.endpoint.protocols.forEach(protocol => {
          if (!allowed) {
            allowed = (protocol.allowedSources || []).some(
              allowedSource => allowedSource === node.endpoint.id
            );
            if (!allowed) {
              (protocol.functions || []).forEach(func => {
                if (!allowed) {
                  allowed = func.allowedSources.some(
                    allowedSource => allowedSource === node.endpoint.id
                  );
                }
              });
            }
          }
        });
        if (node.endpoint.id !== currentNode.endpoint.id && allowed) {
          if (isTopNode(currentNode) || isBottom) {
            showTopEar = true;
            if (
              endpointsFilter.self === currentNode.endpoint.id ||
              endpointsFilter.from === currentNode.endpoint.id
            ) {
              topEarClassName.push(
                protocolors[`${applicationProtocol}Ear`] ||
                  protocolors[`${applicationProtocolDefault}Ear`]
              );
            }
          } else {
            showRightEar = true;
            if (
              endpointsFilter.self === currentNode.endpoint.id ||
              endpointsFilter.from === currentNode.endpoint.id
            ) {
              rightEarClassName.push(
                protocolors[`${applicationProtocol}Ear`] ||
                  protocolors[`${applicationProtocolDefault}Ear`]
              );
            }
          }
        }
      });
      const fogged = visibleMode === "fogged";
      return (
        <g transform={`translate(${x},${y})`} opacity={fogged ? 0.25 : 1}>
          <foreignObject width={width} height={isWorld ? height - 38 : height}>
            <div className={endpointClassName} />
          </foreignObject>
          {showTopEar && (
            <g transform={`translate(${NODE_WIDTH / 2 - 11},${-4})`}>
              <foreignObject width={22} height={4}>
                <div className={topEarClassName.join(" ")} />
              </foreignObject>
            </g>
          )}
          {showRightEar && (
            <g transform={`translate(${NODE_WIDTH},${15})`}>
              <foreignObject width={4} height={22}>
                <div className={rightEarClassName.join(" ")} />
              </foreignObject>
            </g>
          )}
        </g>
      );
    }
  };
});

export const { Container: Endpoint3Layer } = endpoint3LayerProvider(Props => {
  type Props = typeof Props;
  return class Endpoint3LayerClass extends React.Component<Props> {
    onClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();
      if (this.props.currentEndpoint !== this.props.node.endpoint) {
        this.props.pushAppUrl(
          {
            endpointsQuery: buildEndpointFilterHash(this.props.node.endpoint),
            protocolsQuery: undefined,
            functionsQuery: undefined
          },
          {
            needRecenterMap: false
          }
        );
      }
    };

    render() {
      const { endpointName, node, selected, visibleMode } = this.props;
      const { width, height, x, y, isFlowsFiltered } = node;
      let isEditable = true;
      let isWorld = isWorldOrHostNode(node);
      const labels = getExtraLabels(node.endpoint.labels);
      const hasLabels = labels.length > 0;

      // TODO: find better place to conver host to World representation
      let nodeName = endpointName;
      if (!nodeName) {
        const reserveLabel = node.endpoint.labels.find(({ key }) =>
          key.startsWith("reserved:")
        );
        if (reserveLabel) {
          nodeName = reserveLabel.key.replace("reserved:", "");
        }
      }
      const className = [css.nodeThirdLayer, selected && css.active].join(" ");
      let namespace = getEndpointNamespaceFromLabels(node.endpoint.labels);

      if (isWorld) {
        isEditable = false;
        namespace = node.endpoint.labels
          .map(({ key, value }) => `${key}:${value}`)
          .join(" ");
      } else {
        if (isDNSEndpoint(node.endpoint)) {
          namespace = node.endpoint.dnsName as string;
        } else if (isCIDREndpoint(node.endpoint)) {
          namespace = node.endpoint.v4Cidrs
            ? node.endpoint.v4Cidrs.join(", ")
            : node.endpoint.v6Cidrs
            ? node.endpoint.v6Cidrs!.join(", ")
            : "no namespace";
        }
      }
      const fogged = visibleMode === "fogged";
      return (
        <g transform={`translate(${x},${y})`} opacity={fogged ? 0.25 : 1}>
          <foreignObject width={width} height={isWorld ? height - 38 : height}>
            <div className={className}>
              <header className={css.nodeHeader}>
                <div className={css.nodeLogoWrapper}>
                  <EndpointLogo
                    endpoint={node.endpoint}
                    width={35}
                    maxWidth={35}
                    maxHeight={35}
                  />
                </div>
                <hgroup className={css.nodeHeadings}>
                  <h3 className={css.nodeTitle}>
                    <Tooltip
                      arrow
                      html={node.endpoint.name}
                      arrowSize="small"
                      size="small"
                      position="top"
                      duration={100}
                      delay={300}
                    >
                      {nodeName}
                    </Tooltip>
                  </h3>
                  <h4 className={css.nodeSubtitle}>{namespace}</h4>
                </hgroup>
                <a
                  href="#"
                  className={css.settingsButton}
                  onClick={this.onClick}
                >
                  <i className="fa fa-cog" />
                </a>
              </header>
              <div className={css.ingressEgressWrapper}>
                <div className={css.ingressWrapper}>
                  <img
                    src={
                      node.endpoint.hasIngressPolicyRules
                        ? ingressBlueLockedIcon
                        : ingressGrayUnlockedIcon
                    }
                  />{" "}
                  Ingress
                </div>
                <div className={css.egressWrapper}>
                  <img
                    src={
                      node.endpoint.hasEgressPolicyRules
                        ? egressBlueLockedIcon
                        : egressGrayUnlockedIcon
                    }
                  />{" "}
                  Egress
                </div>
              </div>
              {node.protocolsFunctionsGroups.length > 0 && (
                <section className={css.nodeProtocols}>
                  {node.protocolsFunctionsGroups.map(
                    ({
                      visibleFunctionsGroups,
                      filteredFunctions,
                      protocolIndex
                    }) => {
                      const protocol = node.endpoint.protocols[protocolIndex];
                      return (
                        <NodeProtocol
                          key={protocol.id}
                          filteredFunctions={filteredFunctions}
                          endpointId={buildEndpointFilterHash(node.endpoint)}
                          protocol={protocol}
                          visibleFunctionsGroups={visibleFunctionsGroups}
                        />
                      );
                    }
                  )}
                </section>
              )}
              {!isWorld && hasLabels && (
                <section className={css.nodeLabels}>
                  {labels.map(({ key, value }) => {
                    const label = `${key}:${value}`;
                    return (
                      <span key={label} className={css.nodeLabelWrapper}>
                        <span className={css.nodeLabel}>
                          {normalizeLabelName(key)}:{value}
                        </span>
                      </span>
                    );
                  })}
                </section>
              )}
              {isFlowsFiltered && (
                <div className={css.nodeFilteredFunctionsLabel}>
                  Some flows were filtered…
                </div>
              )}
            </div>
          </foreignObject>
        </g>
      );
    }
  };
});

const { Container: NodeProtocol } = nodeProtocolProvider(Props => {
  type Props = typeof Props;
  return class NodeProtocolClass extends React.Component<Props> {
    onClick = (event: React.MouseEvent<any>) => {
      event.preventDefault();
      this.props.pushAppUrl(
        {
          endpointsQuery: this.props.endpointId,
          protocolsQuery: this.props.protocol.id,
          functionsQuery: undefined
        },
        {
          needRecenterMap: false
        }
      );
    };

    render() {
      const {
        endpointId,
        protocol,
        visibleFunctionsGroups,
        filteredFunctions,
        selected
      } = this.props;
      const applicationProtocolNorm = protocol.applicationProtocol
        ? protocol.applicationProtocol.toLowerCase()
        : "other";
      const protocolBgColor =
        protocolors[`${applicationProtocolNorm}ProtocolBg`] ||
        protocolors["otherProtocolBg"];
      const portColor =
        protocolors[`${applicationProtocolNorm}Port`] ||
        protocolors["otherPort"];

      const headerClassName = [
        css.nodeProtocolHeader,
        selected && protocolBgColor,
        css.clickable
      ].join(" ");

      return (
        <div className={css.nodeProtocol}>
          <header className={headerClassName} onClick={this.onClick}>
            <div className={css.nodeProtocolLabel}>
              {protocol.port ? (
                <span className={`${css.nodeProtocolPort} ${portColor}`}>
                  {protocol.port}
                </span>
              ) : (
                <span className={`${css.nodePortCircleWrapper} ${portColor}`}>
                  <span className={css.nodePortCircle} />
                </span>
              )}
              <span
                className={`${css.nodeProtocolTitle} ${selected &&
                  css.selected}`}
              >
                {protocol.l34Protocol}
                {protocol.applicationProtocol &&
                  ` · ${protocol.applicationProtocol.toUpperCase()}`}
              </span>
            </div>
          </header>
          {visibleFunctionsGroups.length > 0 && (
            <ul className={css.nodeFunctions}>
              {visibleFunctionsGroups.map(functionsGroup => (
                <FunctionsGroup
                  key={`${protocol.id}:${functionsGroup.groupTitle}`}
                  endpointId={endpointId}
                  protocol={protocol}
                  functionsGroup={functionsGroup}
                />
              ))}
            </ul>
          )}
          {filteredFunctions.length > 0 && (
            <div
              className={css.nodeProtocolTruncatedLabel}
              onClick={this.onClick}
            >
              View all functions
            </div>
          )}
        </div>
      );
    }
  };
});

const FunctionsGroup = ({
  endpointId,
  protocol,
  functionsGroup
}: {
  endpointId: string;
  protocol: Protocol;
  functionsGroup: FunctionsGroup;
}) => {
  const { groupTitle } = functionsGroup;
  const { applicationProtocol } = protocol;
  const processedGroupTitle = processFunctionName(
    groupTitle,
    applicationProtocol
  );
  return (
    <>
      <li className={`${css.nodeFunctionLabel} ${css.nodeRootFunction}`}>
        <Tooltip
          arrow
          html={processedGroupTitle}
          arrowSize="small"
          size="small"
          position="left"
          duration={100}
          delay={300}
        >
          {processedGroupTitle}
        </Tooltip>
      </li>
      {functionsGroup.functions.map(({ functionTitle, functionIndex }) => {
        const func = (protocol.functions || [])[functionIndex];
        return (
          <NodeFunction
            key={func.id}
            title={functionTitle}
            endpointId={endpointId}
            protocolId={protocol.id}
            func={func}
            applicationProtocol={applicationProtocol}
          />
        );
      })}
    </>
  );
};

const { Container: NodeFunction } = nodeFunctionProvider(Props => {
  type Props = typeof Props;
  return class NodeFunctionClass extends React.Component<Props> {
    onClick = (event: React.MouseEvent<HTMLLIElement>) => {
      event.preventDefault();
      this.props.pushAppUrl(
        {
          // appAdvancedViewType: AppAdvancedViewType.SERVICES,
          endpointsQuery: this.props.endpointId,
          protocolsQuery: this.props.protocolId,
          functionsQuery: this.props.func.id
        },
        {
          needRecenterMap: false
        }
      );
    };

    render() {
      const { title, applicationProtocol, selected } = this.props;
      const pointColor =
        protocolors[`${applicationProtocol}Point`] || protocolors["otherPoint"];
      const functionBgColor =
        protocolors[`${applicationProtocol}FunctionBg`] ||
        protocolors["otherFunctionBg"];
      const functionLabelColor =
        protocolors[`${applicationProtocol}FunctionLabel`] ||
        protocolors["otherFunctionLabel"];
      const processedFunctionName = processFunctionName(
        title,
        applicationProtocol
      );
      const className = [
        css.nodeFunction,
        selected && `${functionBgColor} ${functionLabelColor}`
      ].join(" ");
      return (
        <li className={className} onClick={this.onClick}>
          <i className={`${css.nodeFunctionPoint} ${pointColor}`} />
          <div className={css.nodeFunctionLabel}>
            {processedFunctionName ? processedFunctionName : "—"}
          </div>
        </li>
      );
    }
  };
});
