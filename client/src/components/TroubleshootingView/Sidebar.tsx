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
import { Button, NonIdealState, Spinner, Text } from "@blueprintjs/core";
import * as classnames from "classnames";
import { isEqual } from "lodash";
import * as moment from "moment";
import * as React from "react";
import {
  Flow,
  Label,
  LabelInput,
  PolicySpecsFilterInput
} from "../../graphqlTypes";
import { client, provide } from "../../state";
import { GqlResult } from "../App/state/types";
import { normalizeLabelName, processFunctionName } from "../App/utils";
import * as queries from "../Flows/state/queries";
import { getFlowById, getFlowsFilterBy } from "../Flows/state/selectors";
import { Icon } from "../Misc/SVGIcon";
import { pushAppUrl } from "../Routing/state/actions";
import {
  getClusterIdFromParams,
  getFlowQueryFromParams
} from "../Routing/state/selectors";
import { SpecsTypes } from "./state/types";

const css = require("./Sidebar.scss");

const provider = provide({
  mapStateToProps: state => {
    const flowQuery = getFlowQueryFromParams(state);
    const memoryFlow = flowQuery ? getFlowById(state, flowQuery) : null;
    return {
      flowQuery,
      memoryFlow: memoryFlow ? memoryFlow.ref : null,
      clusterId: getClusterIdFromParams(state),
      filterBy: getFlowsFilterBy(state)
    };
  },
  mapDispatchToProps: {
    pushAppUrl: pushAppUrl
  }
});

export const { Container: Sidebar } = provider(Props => {
  type Props = typeof Props;
  interface State {
    readonly flow: Flow | null;
    readonly loading: boolean;
    readonly error: boolean;
    readonly showSpecs: boolean;
    readonly specsFilter: PolicySpecsFilterInput | null;
    readonly specsType: SpecsTypes;
  }
  return class SidebarClass extends React.Component<Props, State> {
    state: State = {
      flow: null,
      loading: false,
      error: false,
      showSpecs: false,
      specsFilter: null,
      specsType: "all"
    };
    componentDidMount() {
      this.fetch(this.props);
    }

    componentWillReceiveProps(nextProps: Props) {
      if (nextProps.flowQuery !== this.props.flowQuery) {
        this.fetch(nextProps);
      }
    }

    hideSidebar = () => {
      this.props.pushAppUrl({
        flowsQuery: null
      });
    };

    fetch = (props: Props) => {
      const { memoryFlow } = props;
      this.setState(
        {
          loading: memoryFlow ? false : true,
          error: false,
          flow: memoryFlow ? memoryFlow : null
        },
        async () => {
          try {
            const { flowQuery } = props;
            if (!Boolean(flowQuery) || flowQuery === "none") {
              return;
            }
            const query = {
              query: queries.getFlow,
              variables: {
                id: flowQuery,
                labels: props.filterBy.labels
              }
            };
            type ResultType = GqlResult<{
              flow: Flow;
            }>;
            const { data } = await client.query<ResultType>(query);
            if (!data || !data.viewer || !data.viewer.flow) {
              this.setState({ flow: null, error: true, loading: false });
            } else {
              this.setState(
                { flow: data.viewer.flow, error: false, loading: false },
                () => {
                  if (this.props.flowQuery !== data.viewer.flow.id) {
                    this.props.pushAppUrl({
                      flowsQuery: data.viewer.flow.id
                    });
                  }
                }
              );
            }
          } catch (error) {
            this.setState({ error: true, loading: false });
          }
        }
      );
    };

    onLabelClick = (filterInput: string) => {
      this.props.pushAppUrl({
        flowsFilterInput: filterInput
      });
    };

    renderTogglePolicyButton = (labels: LabelInput[], type: SpecsTypes) => {
      const { specsFilter, showSpecs } = this.state;
      const isViewing = specsFilter
        ? !isEqual(specsFilter.labels, labels)
        : false;
      const nextShowSpecs = isViewing ? showSpecs : !showSpecs;
      const text = nextShowSpecs ? "View policies" : "Close";
      const handleClick = () => {
        if (this.props.clusterId) {
          this.setState({
            showSpecs: nextShowSpecs,
            specsType: type,
            specsFilter: nextShowSpecs
              ? { clusterId: this.props.clusterId, labels }
              : null
          });
        }
      };

      return (
        <Button
          small
          className={css.viewSpecs}
          text={text}
          onClick={handleClick}
        />
      );
    };

    onShowPodFlowsClick = (flow: Flow) => {
      const filterParts: string[] = [];
      // const buildLabel = (label: Label) => {
      //   if (label.value) {
      //     return `${normalizeLabelName(label.key)}=${label.value}`;
      //   }
      //   return normalizeLabelName(label.key);
      // };
      // if (flow.sourceLabels && flow.sourceLabels.length > 0) {
      //   filterParts.push(
      //     ...flow.sourceLabels.map(label => `from: ${buildLabel(label)}`)
      //   );
      // }
      // if (flow.destinationLabels && flow.destinationLabels.length > 0) {
      //   filterParts.push(
      //     ...flow.destinationLabels.map(label => `to: ${buildLabel(label)}`)
      //   );
      // }
      filterParts.push(`from: security-id=${flow.sourceSecurityId}`);
      if (flow.destinationDnsName) {
        filterParts.push(`to: dns=${flow.destinationDnsName}`);
      } else {
        filterParts.push(`to: security-id=${flow.destinationSecurityId}`);
      }
      if (flow.destinationPort) {
        filterParts.push(`to: port=${flow.destinationPort}`);
      }
      this.props.pushAppUrl({
        flowsGroupBy: ["unaggregatedFlows"],
        flowsFilterInput: filterParts.join(","),
        flowsQuery: null
      });
    };

    render() {
      const {
        flow,
        showSpecs,
        specsFilter,
        specsType,
        error,
        loading
      } = this.state;
      let content: React.ReactElement | null;

      if (error) {
        content = (
          <>
            <div className={css.flowDetails}>
              <div className={css.header}>
                <div className={css.hideButton}>
                  <Icon
                    name="close"
                    size={11}
                    color="#bbb"
                    onClick={this.hideSidebar}
                  />
                </div>
              </div>
              <NonIdealState
                description="Something went wrong while fetching flow info"
                icon="disable"
              />
            </div>
          </>
        );
      }

      if (!flow) {
        content = (
          <>
            <div className={css.flowDetails}>
              <div className={css.header}>
                <div className={css.hideButton}>
                  <Icon
                    name="close"
                    size={11}
                    color="#bbb"
                    onClick={this.hideSidebar}
                  />
                </div>
              </div>
              <NonIdealState
                description="Detailed information for the requested flow was not found"
                icon="disable"
              />
            </div>
          </>
        );
      } else {
        const linkable = false;
        const isL3L4 = !Boolean(flow.destinationFunctionName);
        const forwardingStatus =
          flow.forwardingStatus.toLowerCase() === "undefined_policy_decision"
            ? "Transient Drop"
            : flow.forwardingStatus;

        content = (
          <>
            <div className={css.flowDetails}>
              <div className={css.header}>
                <div className={css.title}>Flow details</div>
                <div className={css.hideButton}>
                  <Icon
                    name="close"
                    size={11}
                    color="#bbb"
                    onClick={this.hideSidebar}
                  />
                </div>
              </div>
              <SidebarBlock label="Last Seen">
                {moment(flow.timestamp).format("H:mm:ss Z M/D/YY")}
              </SidebarBlock>
              <SidebarBlock label="Forwarding Status">
                {forwardingStatus ? forwardingStatus.toLowerCase() : "unknown"}
                {flow.forwardingStatusDetails &&
                flow.forwardingStatusDetails.length > 0
                  ? ` (${flow.forwardingStatusDetails.join(", ")})`
                  : ""}
              </SidebarBlock>
              <SidebarBlock label="Direction">
                {flow.direction
                  ? flow.direction.toLowerCase()
                  : flow.requestOrResponse || "unknown"}
              </SidebarBlock>
              {flow.ciliumEventSubType && (
                <SidebarBlock label="Type">
                  {flow.ciliumEventSubType.toLowerCase()}
                </SidebarBlock>
              )}
              <div className={css.splitter} />
              {flow.sourcePodName && (
                <SidebarBlock overflow label="Source Pod name">
                  {flow.sourcePodName}
                </SidebarBlock>
              )}
              <SidebarBlock overflow label="Source Endpoint Labels">
                <Labels
                  linkable={linkable}
                  direction="from"
                  labels={flow.sourceLabels}
                  onLabelClick={this.onLabelClick}
                />
              </SidebarBlock>
              {flow.sourceIpAddress && (
                <SidebarBlock overflow label="Source IP Address">
                  <Label
                    linkable={linkable}
                    direction="from"
                    label={flow.sourceIpAddress}
                    type="ip"
                    handleClick={this.onLabelClick}
                  />
                </SidebarBlock>
              )}
              <div className={css.splitter} />
              {flow.destinationPodName && (
                <SidebarBlock overflow label="Destination Pod name">
                  {flow.destinationPodName}
                </SidebarBlock>
              )}
              <SidebarBlock overflow label="Destination Endpoint Labels">
                <Labels
                  linkable={linkable}
                  direction="to"
                  labels={flow.destinationLabels}
                  onLabelClick={this.onLabelClick}
                />
              </SidebarBlock>
              {flow.destinationIpAddress && (
                <SidebarBlock overflow label="Destination IP Address">
                  <Label
                    linkable={linkable}
                    direction="to"
                    label={flow.destinationIpAddress}
                    type="ip"
                    handleClick={this.onLabelClick}
                  />
                </SidebarBlock>
              )}
              {flow.destinationDnsName && (
                <SidebarBlock overflow label="Destination DNS Name">
                  <Label
                    linkable={linkable}
                    label={flow.destinationDnsName}
                    type="dns"
                    direction="to"
                    handleClick={this.onLabelClick}
                  />
                </SidebarBlock>
              )}
              <SidebarBlock overflow label="Destination Protocol/Port">
                {flow.destinationL4Protocol}
                {flow.destinationPort && (
                  <>
                    :
                    <Label
                      linkable={linkable}
                      label={flow.destinationPort}
                      type="port"
                      direction="to"
                      handleClick={this.onLabelClick}
                    />
                  </>
                )}
              </SidebarBlock>
              {!isL3L4 && (
                <SidebarBlock overflow label="Destination Function">
                  {processFunctionName(
                    flow.destinationFunctionName,
                    flow.destinationL7Protocol,
                    flow.dnsResponse,
                    flow.httpResponse
                  )}
                </SidebarBlock>
              )}
              {flow.dnsResponse && (
                <SidebarBlock overflow label="DNS Response">
                  <div>
                    <b>Query:</b> {flow.dnsResponse.query}
                  </div>
                  <div>
                    <b>RCODE:</b> {flow.dnsResponse.rcode}
                  </div>
                  <div>
                    <b>IPs:</b> {flow.dnsResponse.ips.join(", ")}
                  </div>
                </SidebarBlock>
              )}
              {flow.httpResponse && (
                <SidebarBlock overflow label="HTTP Response">
                  <div>
                    <b>URL:</b> {flow.httpResponse.url}
                  </div>
                  <div>
                    <b>Method:</b> {flow.httpResponse.method}
                  </div>
                  <div>
                    <b>Code:</b> {flow.httpResponse.code}
                  </div>
                  <div>
                    <b>Protocol:</b> {flow.httpResponse.protocol}
                  </div>
                  {flow.httpResponse.headers.length > 0 && (
                    <div>
                      <b>Headers:</b>
                      <ul>
                        {flow.httpResponse.headers.map(({ key, value }) => {
                          const label = `${key}: ${value}`;
                          return <li key={label}>{label}</li>;
                        })}
                      </ul>
                    </div>
                  )}
                </SidebarBlock>
              )}
              {flow.metricsResponse && (
                <SidebarBlock overflow label="Metrics">
                  <div>
                    <b>Latency:</b> {flow.metricsResponse.latencyMs} ms
                  </div>
                </SidebarBlock>
              )}
              <div className={css.splitter} />
              {flow.tcpControlBits.length ? (
                <SidebarBlock overflow label="TCP Flags">
                  {flow.tcpControlBits.join(", ")}
                </SidebarBlock>
              ) : null}
            </div>
          </>
        );
      }
      const width = `${showSpecs ? 705 : 255}px`;
      return (
        <div
          style={{
            display: "flex",
            height: "100%",
            marginLeft: `-${width}`,
            width: width,
            position: "relative",
            background: "#FFF",
            boxShadow: "0 0 60px rgba(0, 0, 0, 0.25)"
          }}
        >
          {!loading && content}
          {loading && (
            <div className={css.flowDetails}>
              <NonIdealState title="Loading flow info..." icon={<Spinner />} />
            </div>
          )}
        </div>
      );
    }
  };
});

interface LabelProps {
  direction: "from" | "to";
  linkable: boolean;
  type?: "dns" | "ip" | "security-id" | "port";
  label: Label | string | number;
  handleClick(s: string): void;
}

const Label: React.SFC<LabelProps> = ({
  handleClick,
  type,
  label,
  linkable,
  direction
}) => {
  const className = [
    css.label,
    "text-overflow",
    linkable ? css.linkable : ""
  ].join(" ");
  if (typeof label === "string" || typeof label === "number") {
    return (
      <span
        className={className}
        role="button"
        onClick={() =>
          linkable && handleClick(`${direction}: ${type}=${label}`)
        }
      >
        <span className={css.labelValue}>{label}</span>
      </span>
    );
  } else {
    const normalizedKey = normalizeLabelName(label.key);
    const filterValue = label.value ? `=${label.value}` : "";
    return (
      <span
        title={`${normalizedKey}=${label.value}`}
        className={className}
        role="button"
        onClick={() =>
          linkable &&
          handleClick(`${direction}: ${normalizedKey}${filterValue}`)
        }
      >
        <span className={css.labelKey}>{normalizedKey}</span>
        {label.value && (
          <span className={css.labelValue}>
            {"="}
            {label.value}
          </span>
        )}
      </span>
    );
  }
};

interface LabelsProps {
  labels: Label[];
  linkable: boolean;
  direction: "from" | "to";
  type?: "dns" | "ip" | "security-id";
  onLabelClick(l: string): void;
}

const Labels = ({
  labels,
  type,
  direction,
  linkable,
  onLabelClick
}: LabelsProps) => (
  <div className={css.labels}>
    {labels.map(label => (
      <div key={`${label.key}:${label.value}`}>
        <Label
          linkable={linkable}
          type={type}
          direction={direction}
          label={label}
          handleClick={onLabelClick}
        />
      </div>
    ))}
  </div>
);

interface SidebarBlockProps {
  label: string;
  overflow?: boolean;
}

export const SidebarBlock: React.SFC<SidebarBlockProps> = ({
  label,
  overflow,
  children
}) => (
  <div className={css.block}>
    <Text tagName="b" className={css.propertyLabel}>
      {label}
    </Text>
    <div className={classnames(css.text, { [css.overflow]: overflow })}>
      {children}
    </div>
  </div>
);
