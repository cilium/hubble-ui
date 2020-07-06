import { FlowsTableColumnKey } from '~/components/FlowsTable/general';

const LAST_NAMESPACE_KEY = '@hubble-ui/namespace';
const FLOWS_TABLE_VISIBLE_COLUMNS_KEY = '@hubble-ui/flowstable-visible-columns';
const SHOW_HOST_KEY = '@hubble-ui/show-host';
const SHOW_KUBEDNS_KEY = '@hubble-ui/show-kube-dns';

export function getLastNamespace(): string | null {
  return localStorage.getItem(LAST_NAMESPACE_KEY);
}

export function saveLastNamespace(ns: string) {
  localStorage.setItem(LAST_NAMESPACE_KEY, ns);
}

export function getFlowsTableVisibleColumns(): Set<FlowsTableColumnKey> | null {
  const val = localStorage.getItem(FLOWS_TABLE_VISIBLE_COLUMNS_KEY);
  if (!val) return null;
  return new Set<FlowsTableColumnKey>(JSON.parse(val));
}

export function saveFlowsTableVisibleColumns(clmns: Set<FlowsTableColumnKey>) {
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