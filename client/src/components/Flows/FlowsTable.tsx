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
import * as React from "react";
import {
  AutoSizer,
  Column,
  Index,
  RowMouseEventHandlerParams,
  ScrollEventData,
  Table
} from "react-virtualized";
import { FlowConnection, FlowFiltersInput } from "../../graphqlTypes";
import { provide } from "../../state";
import { getCurrentEndpoint } from "../App/state/selectors";
import { isFQDNSEndpoint } from "../App/utils";
import * as tableUtils from "../Common/utils/tables";
import { Icon } from "../Misc/Icon";
import { pushAppUrl } from "../Routing/state/actions";
import {
  getEndpointQueryObjectFromParams,
  getFlowQueryFromParams,
  getFlowsEndDate,
  getFlowsEndDateFromParams,
  getFlowsStartDate,
  getFlowsStartDateFromParams,
  getClusterIdFromParams,
  getNamespaceFromParams
} from "../Routing/state/selectors";
import { createColumns } from "./columns";
import { COLUMN_SYMBOL } from "./columns/types";
import { fetchFlows } from "./state/actions";
import {
  getEndCursor,
  getFilterById,
  getFilterByParam,
  getFlowsFilterBy,
  getFlowsForDiscovery,
  getFlowsLoading,
  getFlowsAutoRefresh,
  getFlowsTableVisibleColumns,
  getStartCursor,
  getExcludeLabelsFlowsFilter
} from "./state/selectors";
import { ExtFlow } from "./state/types";
import { discoverCluster } from "../Clusters/state/actions";
import { DEFAULT_NAME_LABEL_KEYS } from "../App/state/defaults";
import { setNextDiscoveryTime } from "../App/state/actions";
import { getClusterDiscoveryTimestamp } from "../Clusters/state/selectors";

const css = require("./FlowsTable.scss");

const provider = provide({
  mapStateToProps: state => ({
    currentEndpoint: getCurrentEndpoint(state),
    endpointQuery: getEndpointQueryObjectFromParams(state),
    autoRefresh: getFlowsAutoRefresh(state),
    flowIdFromParams: getFlowQueryFromParams(state),
    visibleColumns: getFlowsTableVisibleColumns(state),
    flows: getFlowsForDiscovery(state),
    flowsStartDate: getFlowsStartDateFromParams(state),
    flowsEndDate: getFlowsEndDateFromParams(state),
    filterBy: getFlowsFilterBy(state),
    endCursor: getEndCursor(state),
    startCursor: getStartCursor(state),
    filterByParam: getFilterByParam(state),
    filterByIdFromParams: getFilterById(state),
    loading: getFlowsLoading(state),
    clusterId: getClusterIdFromParams(state),
    namespaceFromParams: getNamespaceFromParams(state),
    clusterDiscoveryTimestamp: getClusterDiscoveryTimestamp(state),
    excludedLabels: getExcludeLabelsFlowsFilter(state)
  }),
  mapDispatchToProps: {
    fetchFlows: fetchFlows.action,
    fetchMap: discoverCluster.action,
    setNextDiscoveryTime: setNextDiscoveryTime,
    pushAppUrl
  }
});

const CELL_HEIGHT = 20;
const HEADER_HEIGHT = 23;
const WIDTHS_LS_KEY_PREFIX = "v8-flows-table-colums-widths";
const FETCH_DELAY = 120000;

export const { Container: FlowsTable } = provider(Props => {
  type Props = typeof Props;
  interface State {
    readonly widths: { [key: string]: number };
    readonly showNewFlowsPopup: boolean;
    readonly timeIndicator: null | string;
    readonly columns: ReturnType<typeof createColumns>;
  }
  return class FlowsTableClass extends React.Component<Props, State> {
    private width: number = 0;
    private height: number = 0;
    private refreshInterval: any;
    private tableRef: null | Table;

    constructor(props: Props) {
      super(props);
      this.state = {
        widths: tableUtils.loadWidths(
          FlowsTableClass.getTableKey(props),
          props.visibleColumns
        ),
        showNewFlowsPopup: false,
        timeIndicator: null,
        columns: createColumns(this.resizeRow)
      };
    }

    static getTableKey = (props: Props) => {
      return `${WIDTHS_LS_KEY_PREFIX}-service-map`;
    };

    componentDidMount() {
      this.refetchFlows();
      this.getFlows("replace", this.props, true, true);
    }

    componentWillUnmount() {
      clearInterval(this.refreshInterval);
    }

    componentWillReceiveProps(nextProps: Props) {
      const autoRefreshChanged =
        this.props.autoRefresh !== nextProps.autoRefresh;
      const filterByIdChanged =
        this.props.filterByIdFromParams !== nextProps.filterByIdFromParams;
      const filterByChanged = this.props.filterBy !== nextProps.filterBy;
      const filterByParamChanged =
        this.props.filterByParam !== nextProps.filterByParam;
      const endpointChanged =
        this.props.endpointQuery !== nextProps.endpointQuery ||
        (this.props.currentEndpoint === null &&
          nextProps.currentEndpoint !== null) ||
        (this.props.currentEndpoint !== null &&
          nextProps.currentEndpoint === null);
      const flowsDatesChanged =
        this.props.flowsStartDate !== nextProps.flowsStartDate ||
        this.props.flowsEndDate !== nextProps.flowsEndDate;
      const excludedLabelsChanged =
        this.props.excludedLabels !== nextProps.excludedLabels;

      const changed =
        filterByIdChanged ||
        filterByParamChanged ||
        filterByChanged ||
        autoRefreshChanged ||
        endpointChanged ||
        flowsDatesChanged ||
        excludedLabelsChanged;

      if (this.props.visibleColumns !== nextProps.visibleColumns) {
        this.setState({
          widths: tableUtils.updateWidths(
            FlowsTableClass.getTableKey(nextProps),
            nextProps.visibleColumns
          )
        });
      }

      if (changed && nextProps.autoRefresh) {
        this.setState({
          timeIndicator: null
        });
        this.getFlows("replace", nextProps, true, true);
      }
    }

    getFlows = (
      mode: "append" | "prepend" | "replace",
      props: Props,
      resetChartData: boolean,
      updateChart: boolean
    ) => {
      if (props.filterByParam && props.filterByIdFromParams) {
        const numberOfRows = this.numberOfRowsToFetch();

        const isAppend = mode === "append";
        const isPrepend = mode === "prepend";
        const isReplace = mode === "replace";

        const first = isAppend || isReplace ? numberOfRows : undefined;
        const after = isAppend ? props.endCursor : undefined;
        const last = isPrepend ? numberOfRows : undefined;
        const before = isPrepend ? props.startCursor : undefined;

        const filterBy: FlowFiltersInput = {
          ...props.filterBy,
          [props.filterByParam]: props.filterByIdFromParams,
          labels: this.getLabels(props, "self", "labels"),
          sourceLabels: this.getLabels(props, "from", "sourceLabels"),
          destinationLabels: this.getLabels(props, "to", "destinationLabels"),
          destinationDnsName: this.getDestinationDnsName(props),
          after: null,
          before: null
          // after: moment(getFlowsStartDate(props.flowsStartDate)),
          // before:
          //   props.flowsEndDate.url === "now"
          //     ? moment()
          //     : moment(getFlowsEndDate(props.flowsEndDate))
        };

        props.fetchFlows(
          {
            resetChartData,
            mode,
            first,
            after,
            last,
            before,
            filterBy,
            updateChart
          },
          {
            onSuccess: flows => {
              if (mode === "prepend" && !this.props.autoRefresh) {
                if (flows.edges.length > 0) {
                  this.scrollTo(flows.edges.length * CELL_HEIGHT + 1);
                } else {
                  this.setState({ timeIndicator: null });
                }
              }
              this.fetchMap(this.props, () => {
                this.props.setNextDiscoveryTime({
                  date: moment().add("milliseconds", FETCH_DELAY)
                });
              });
            },
            onError: error => {
              this.fetchMap(this.props, () => {
                this.props.setNextDiscoveryTime({
                  date: moment().add("milliseconds", FETCH_DELAY)
                });
              });
            }
          }
        );
      }
    };

    getLabels = (
      props: Props,
      endpointQueryField: "from" | "to" | "self",
      filterByField: "labels" | "destinationLabels" | "sourceLabels"
    ) => {
      if (props.currentEndpoint) {
        if (props.endpointQuery[endpointQueryField]) {
          return props.currentEndpoint.labels;
        }
      } else if (filterByField === "labels") {
        return props.filterBy.labels || null;
      }
      return null;
    };

    getDestinationDnsName = (props: Props) => {
      if (props.currentEndpoint) {
        if (isFQDNSEndpoint(props.currentEndpoint)) {
          return props.currentEndpoint.dnsName;
        }
      }
      return props.filterBy.destinationDnsName;
    };

    scrollTo = (offset: number) => {
      if (this.tableRef && this.height < offset) {
        this.tableRef.scrollToPosition(offset);
      }
    };

    onScroll = ({ scrollTop }: ScrollEventData) => {
      if (scrollTop === 0) {
        this.setState(prevState => ({
          showNewFlowsPopup: false,
          timeIndicator: this.props.loading ? prevState.timeIndicator : null
        }));
      } else {
        const idx = Math.floor(scrollTop / CELL_HEIGHT);
        const underFlow = this.props.flows[idx];
        if (underFlow) {
          this.setState({
            timeIndicator: moment(underFlow.ref.timestamp).fromNow()
          });
        }
      }
    };

    refetchFlows = () => {
      this.refreshInterval = setInterval(() => {
        if (this.props.autoRefresh) {
          this.getFlows("prepend", this.props, false, true);
        }
      }, FETCH_DELAY);
    };

    fetchMap = (props: Props, callback: () => void) => {
      if (props.clusterId && props.namespaceFromParams) {
        if (props.currentEndpoint) {
          callback();
        } else {
          props.fetchMap(
            {
              clusterId: props.clusterId,
              excludedLabelKeys: [],
              nameLabelKeys: DEFAULT_NAME_LABEL_KEYS,
              namespaces: [props.namespaceFromParams],
              startedAfter:
                props.clusterDiscoveryTimestamp ||
                getFlowsStartDate(props.flowsStartDate),
              filterBy: {
                excludeLabels:
                  props.excludedLabels.length > 0
                    ? props.excludedLabels
                    : undefined
              }
            },
            { onSuccess: callback, onError: callback }
          );
        }
      }
    };

    onRowClick = ({ rowData, event }: RowMouseEventHandlerParams) => {
      if ("parentNode" in event.target) {
        const target = event.target as HTMLElement;
        if (target.parentNode && "classList" in target.parentNode) {
          const parentNode = target.parentNode as HTMLElement;
          if (parentNode.classList.contains("add-flows-to-policy-checkbox")) {
            return;
          }
        }
      }
      this.props.pushAppUrl({ flowsQuery: rowData.ref.id });
    };

    numberOfRowsToFetch = () => {
      return Math.ceil(window.innerHeight / CELL_HEIGHT);
    };

    rowGetter = ({ index }: Index) => {
      const flow = this.props.flows[index];
      return flow ? flow : "Loading...";
    };

    rowClassName = ({ index }: Index) => {
      if (index < 0) {
        return css.header;
      } else {
        const row = this.rowGetter({ index });
        let rowClassNames = [];
        if (typeof row === "object") {
          if (this.props.flowIdFromParams === row.ref.id) {
            rowClassNames.push(css.active);
          }
        }
        if (index < this.props.flows.length - 1) {
          rowClassNames.push(index % 2 === 0 ? css.even : css.odd);
        }
        return rowClassNames.join(" ");
      }
    };

    resizeRow = (dataKey: string, deltaX: number) => {
      this.setState(
        prevState => {
          const prevWidths = prevState.widths;
          const percentDelta = deltaX / this.width;
          const currentCollumnIndex = this.props.visibleColumns.findIndex(
            columnName => columnName === dataKey
          );
          const nextColumnName = this.props.visibleColumns[
            currentCollumnIndex + 1
          ];
          return {
            widths: {
              ...prevWidths,
              [dataKey]: prevWidths[dataKey] + percentDelta,
              [nextColumnName]: prevWidths[nextColumnName] - percentDelta
            }
          };
        },
        () => {
          tableUtils.storeWidths(
            FlowsTableClass.getTableKey(this.props),
            this.state.widths
          );
        }
      );
    };

    renderCell = (
      flow: ExtFlow | string,
      callback: (flow: ExtFlow) => JSX.Element | string | null
    ) => {
      if (flow === "Loading...") {
        return <div className={css.emptyCell}>…</div>;
      } else {
        return callback(flow as ExtFlow);
      }
    };

    onTableRef = (ref: null | Table) => {
      if (ref) {
        this.tableRef = ref;
      }
    };

    calcCellWidth = (columnName: COLUMN_SYMBOL) => {
      return this.state.widths[columnName] * this.width;
    };

    render() {
      const { flows, loading } = this.props;
      const { showNewFlowsPopup, timeIndicator } = this.state;

      const showLoader =
        loading === "append" ||
        (loading === "prepend" && !this.props.autoRefresh);

      const className = [css.wrapper, timeIndicator && css.timeIndicated].join(
        " "
      );

      return (
        <div className={className}>
          <AutoSizer>
            {({ width, height }) => {
              this.width = width;
              this.height = height;
              return (
                <Table
                  ref={this.onTableRef}
                  className={css.table}
                  rowClassName={this.rowClassName}
                  width={this.width}
                  height={this.height}
                  headerHeight={HEADER_HEIGHT}
                  rowHeight={CELL_HEIGHT}
                  rowCount={flows.length}
                  overscanRowCount={this.numberOfRowsToFetch()}
                  rowGetter={this.rowGetter}
                  onRowClick={this.onRowClick}
                  onScroll={this.onScroll}
                  scrollingResetTimeInterval={10}
                  noRowsRenderer={() => (
                    <Nothing loading={this.props.loading === "replace"} />
                  )}
                >
                  {this.props.visibleColumns.map(columnSymbol => (
                    <Column
                      dataKey={columnSymbol}
                      width={this.calcCellWidth(columnSymbol)}
                      className={css.cell}
                      cellRenderer={this.state.columns[columnSymbol].cell}
                      headerRenderer={this.state.columns[columnSymbol].header}
                    />
                  ))}
                </Table>
              );
            }}
          </AutoSizer>
          {showNewFlowsPopup && (
            <Popup tableRef={this.tableRef} position="top" mode="new-flows" />
          )}
          {showLoader && (
            <Popup
              position={loading === "append" ? "bottom" : "top"}
              mode="loading"
            />
          )}
          <TimeIndicator value={timeIndicator} />
        </div>
      );
    }
  };
});

const Popup: React.SFC<{
  tableRef?: Table | null;
  position: "top" | "bottom";
  mode: "new-flows" | "loading";
}> = ({ tableRef, position, mode }) => {
  const isTop = position === "top";
  const style = {
    [position]: isTop ? `${HEADER_HEIGHT}px` : "10px",
    borderRadius: isTop ? "0 0 5px 5px" : "5px 5px 0 0"
  };
  const className = [
    css.loaderWrapper,
    mode === "new-flows" && css.hoverable
  ].join(" ");
  return (
    <div
      className={className}
      style={style}
      onClick={event => {
        if (tableRef && mode === "new-flows") {
          event.preventDefault();
          tableRef.scrollToPosition(0);
        }
      }}
    >
      <Icon
        name={mode === "loading" ? "spinner" : "arrow-up"}
        animated={mode === "loading"}
      />
      <span className={css.loaderLabel}>
        {mode === "loading" ? "Loading. Please wait..." : "New flows received"}
      </span>
    </div>
  );
};

const Nothing: React.SFC<{ loading: boolean }> = ({ loading }) => {
  return (
    <div className={css.nothingWrapper}>
      {loading ? (
        <img
          src={require("../assets/illustrations/spinner.svg")}
          className={`${css.noFlowsIcon} spin`}
        />
      ) : (
        <img
          src={require("../assets/icons/crossed-out-circle.svg")}
          className={css.noFlowsIcon}
        />
      )}
      <div className={css.noFlowsTitle}>
        {loading ? "Loading..." : "No Flows"}
      </div>
      <div className={css.noFlowsSubtitle}>
        {loading ? "Please wait" : "Seems that the flows were not detected"}
      </div>
    </div>
  );
};

const TimeIndicator: React.SFC<{ value: string | null }> = props => (
  <div
    className={css.timeIndicator}
    style={{
      opacity: props.value ? 1 : 0,
      visibility: props.value ? "visible" : "hidden"
    }}
  >
    <Icon name="clock-o" />
    <span className={css.timeIndicatorLabel}>{props.value}</span>
  </div>
);
