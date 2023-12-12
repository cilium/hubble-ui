import { Column as FlowsTableColumn } from '~/components/FlowsTable/general';
import {
  Aggregation,
  AggregatorType,
  StateChange as AggregationStateChange,
} from '~/domain/aggregation';

import { DataMode } from '~/domain/interactions';

const LAST_NAMESPACE_KEY = '@hubble-ui/namespace';
const LAST_IS_AGGREGATION_OFF = '@hubble-ui/is-aggregation-off';
const LAST_AGGREGATOR_TYPES_KEY = '@hubble-ui/aggregator-types';
const LAST_AGGREGATION_STATE_CHANGE = '@hubble-ui/aggregation-state-change';
const FLOWS_TABLE_VISIBLE_COLUMNS_KEY = '@hubble-ui/flowstable-visible-columns';
const SHOW_HOST_KEY = '@hubble-ui/show-host';
const SHOW_KUBEDNS_KEY = '@hubble-ui/show-kube-dns';
const SHOW_REMOTE_NODE_KEY = '@hubble-ui/show-remote-node';
const SHOW_PROMETHEUS_SERVICE_KEY = '@hubble-ui/show-prometheus-app';
const DETAILS_PANEL_POS = '@hubble-ui/panel-position';
const DATA_MODE = '@hubble-ui/data-mode';
const CLUSTERWIDE_ENABLED = '@hubble-ui/clusterwide-enabled';
const THEME_PREFERENCE_KEY = '@hubble-ui/theme-preference';

export function getLastNamespace(): string | null {
  return localStorage.getItem(LAST_NAMESPACE_KEY);
}

export function saveLastNamespace(ns: string) {
  localStorage.setItem(LAST_NAMESPACE_KEY, ns);
}

export function deleteLastNamespace() {
  localStorage.removeItem(LAST_NAMESPACE_KEY);
}

export function getIsAggregationOff(): boolean | null {
  const isOff = localStorage.getItem(LAST_IS_AGGREGATION_OFF);
  if (isOff == null) return null;

  return isOff === 'true';
}

export function saveIsAggregationOff(val: boolean) {
  localStorage.setItem(LAST_IS_AGGREGATION_OFF, String(val));
}

export function deleteLastIsAggregationOff() {
  localStorage.removeItem(LAST_IS_AGGREGATION_OFF);
}

export function getLastAggregatorTypes(): AggregatorType[] | null {
  const val = localStorage.getItem(LAST_AGGREGATOR_TYPES_KEY);
  if (val == null) return null;

  const types: AggregatorType[] = [];

  val.split(',').forEach(str => {
    const type = Aggregation.parseAggregatorType(str);
    if (type == null) return;

    types.push(type);
  }, [] as string[]);

  return types;
}

export function saveLastAggregatorTypes(types: AggregatorType[] | null) {
  if (types == null || types.length === 0) {
    deleteLastAggregatorTypes();
    return;
  }

  localStorage.setItem(LAST_AGGREGATOR_TYPES_KEY, types.join(','));
}

export function deleteLastAggregatorTypes() {
  localStorage.removeItem(LAST_AGGREGATOR_TYPES_KEY);
}

export function getLastAggregationStateChange(): AggregationStateChange | null {
  const val = localStorage.getItem(LAST_AGGREGATION_STATE_CHANGE);
  if (val == null || val.length === 0) return null;

  return Aggregation.parseStateChange(val);
}

export function saveLastAggregationStateChange(stateChange: AggregationStateChange | null) {
  if (stateChange == null) {
    deleteLastAggregationStateChange();
    return;
  }

  localStorage.setItem(LAST_AGGREGATION_STATE_CHANGE, String(stateChange));
}

export function deleteLastAggregationStateChange() {
  localStorage.removeItem(LAST_AGGREGATION_STATE_CHANGE);
}

export function getFlowsTableVisibleColumns(): Set<FlowsTableColumn> | null {
  const val = localStorage.getItem(FLOWS_TABLE_VISIBLE_COLUMNS_KEY);
  if (!val) return null;

  const arr = JSON.parse(val);
  if (!Array.isArray(arr)) return null;

  return new Set<FlowsTableColumn>(arr);
}

export function saveFlowsTableVisibleColumns(clmns: Set<FlowsTableColumn>) {
  localStorage.setItem(FLOWS_TABLE_VISIBLE_COLUMNS_KEY, JSON.stringify(Array.from(clmns)));
}

export function getShowHost(): boolean {
  return localStorage.getItem(SHOW_HOST_KEY) === 'true';
}

export function saveShowHost(val: boolean) {
  localStorage.setItem(SHOW_HOST_KEY, val ? 'true' : 'false');
}

export function getShowKubeDns(): boolean {
  return localStorage.getItem(SHOW_KUBEDNS_KEY) === 'true';
}

export function saveShowKubeDns(val: boolean) {
  localStorage.setItem(SHOW_KUBEDNS_KEY, val ? 'true' : 'false');
}

export function getShowRemoteNode(): boolean {
  return localStorage.getItem(SHOW_REMOTE_NODE_KEY) === 'true';
}

export function saveShowRemoteNode(val: boolean) {
  localStorage.setItem(SHOW_REMOTE_NODE_KEY, val ? 'true' : 'false');
}

export function getShowPrometheusApp(): boolean {
  return localStorage.getItem(SHOW_PROMETHEUS_SERVICE_KEY) === 'true';
}

export function saveShowPrometheusApp(val: boolean) {
  localStorage.setItem(SHOW_PROMETHEUS_SERVICE_KEY, val ? 'true' : 'false');
}

export function getDetailsPanelTop(): number | null {
  const num = localStorage.getItem(DETAILS_PANEL_POS);
  if (!num) return null;

  return parseFloat(num);
}

export function setDetailsPanelTop(top: number) {
  localStorage.setItem(DETAILS_PANEL_POS, `${top}`);
}

export function getDataMode(): DataMode | null {
  const v = localStorage.getItem(DATA_MODE);
  if (!v || !Object.values(DataMode).includes(v as DataMode)) return null;

  return v as DataMode;
}

export function saveDataMode(mode: DataMode) {
  localStorage.setItem(DATA_MODE, mode);
}

export function getClusterwideEnabled() {
  return localStorage.getItem(CLUSTERWIDE_ENABLED) === 'true';
}

export function saveClusterwideEnabled(val: boolean) {
  localStorage.setItem(CLUSTERWIDE_ENABLED, val ? 'true' : 'false');
}

export function getThemePreference() {
  return localStorage.getItem(THEME_PREFERENCE_KEY);
}

export function saveThemePreference(themeValue: string) {
  localStorage.setItem(THEME_PREFERENCE_KEY, themeValue);
}
