import { Column as FlowsTableColumn } from '~/components/FlowsTable/general';

const LAST_NAMESPACE_KEY = '@hubble-ui/namespace';
const FLOWS_TABLE_VISIBLE_COLUMNS_KEY = '@hubble-ui/flowstable-visible-columns';
const SHOW_HOST_KEY = '@hubble-ui/show-host';
const SHOW_KUBEDNS_KEY = '@hubble-ui/show-kube-dns';
const SHOW_REMOTE_NODE_KEY = '@hubble-ui/show-remote-node';
const SHOW_PROMETHEUS_SERVICE_KEY = '@hubble-ui/show-prometheus-app';
const SHOW_KUBE_APISERVER = '@hubble-ui/show-kube-apiserver';
const DETAILS_PANEL_POS = '@hubble-ui/panel-position';

export function getLastNamespace(): string | null {
  return localStorage.getItem(LAST_NAMESPACE_KEY);
}

export function saveLastNamespace(ns: string) {
  localStorage.setItem(LAST_NAMESPACE_KEY, ns);
}

export function deleteLastNamespace() {
  localStorage.removeItem(LAST_NAMESPACE_KEY);
}

export function getFlowsTableVisibleColumns(): Set<FlowsTableColumn> | null {
  const val = localStorage.getItem(FLOWS_TABLE_VISIBLE_COLUMNS_KEY);
  if (!val) return null;

  const arr = JSON.parse(val);
  if (!Array.isArray(arr)) return null;

  return new Set<FlowsTableColumn>(arr);
}

export function saveFlowsTableVisibleColumns(clmns: Set<FlowsTableColumn>) {
  localStorage.setItem(
    FLOWS_TABLE_VISIBLE_COLUMNS_KEY,
    JSON.stringify(Array.from(clmns)),
  );
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

export function getShowKubeApiServer(): boolean {
  return localStorage.getItem(SHOW_KUBE_APISERVER) === 'true';
}

export function saveShowKubeApiServer(val: boolean) {
  localStorage.setItem(SHOW_KUBE_APISERVER, val ? 'true' : 'false');
}

export function getDetailsPanelTop(): number | null {
  const num = localStorage.getItem(DETAILS_PANEL_POS);
  if (!num) return null;

  return parseFloat(num);
}

export function setDetailsPanelTop(top: number) {
  localStorage.setItem(DETAILS_PANEL_POS, `${top}`);
}
