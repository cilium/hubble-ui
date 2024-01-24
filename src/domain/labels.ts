import _ from 'lodash';
import { KV } from '~/domain/misc';
export { KV };

export const NamespaceLabelKey = 'io.kubernetes.pod.namespace';

export interface LabelsProps {
  isHost: boolean;
  isKubeApiserver: boolean;
  isWorld: boolean;
  isRemoteNode: boolean;
  isKubeDNS: boolean;
  isInit: boolean;
  isHealth: boolean;
  isPrometheusApp: boolean;
  isIngress: boolean;
  appName?: string;
  clusterName?: string;
}

export enum ReservedLabel {
  Host = 'reserved:host',
  KubeApiserver = 'reserved:kube-apiserver',
  World = 'reserved:world',
  Health = 'reserved:health',
  Init = 'reserved:init',
  Ingress = 'reserved:ingress',
  RemoteNode = 'reserved:remote-node',
  Unmanaged = 'reserved:unmanaged',
  Unknown = 'reserved:unknown',
}

export enum SpecialLabel {
  KubeDNS = 'k8s:k8s-app=kube-dns',
  PrometheusApp = 'k8s:app=prometheus',
  Networks = 'cni:com.isovalent.v1alpha1.network.attachment',
  CNPName = 'k8s:io.cilium.k8s.policy.name',
  CNPUID = 'k8s:io.cilium.k8s.policy.uid',
}

export type KeyFindOptions = {
  normalizeLabel?: boolean;
  normalizeTargetKeys?: boolean;
};

export class Labels {
  public static readonly prefixes = [
    'any:',
    'k8s:',
    'cni:',
    'io.kubernetes.pod.',
    'app.kubernetes.io/',
    'covalent.io/',
  ];

  public static readonly appNameNormalizedKeys = new Set([
    'component',
    'app',
    'name',
    'functionname',
    'k8s-app',
  ]);

  public static readonly ciliumClusterKeys = new Set(['io.cilium.k8s.policy.cluster']);

  public static readonly innerSeparatorsRe = /[-./=]/g;

  public static readonly reservedLabelSet = new Set(Object.values(ReservedLabel));

  public static readonly specialLabelKeys = (() => {
    const keys = new Set<string>();

    Object.values(SpecialLabel).forEach(lblStr => {
      const key = Labels.normalizeKey(Labels.toKV(lblStr).key);
      keys.add(key);
    });

    return keys;
  })();

  public static toKV(label: string, normalize = false): KV {
    const [key, ...rest] = label.split('=');

    return {
      key: normalize ? Labels.normalizeKey(key) : key,
      value: rest.join('='),
    };
  }

  public static labelsToKV(labels: string[], normalize = false): KV[] {
    return labels.map(l => Labels.toKV(l, normalize));
  }

  // NOTE: Trims all the prefixes and ending `=` sign
  public static normalizeKey(key: string) {
    const trimmed = key.toLowerCase().replace(/=+$/, '');
    return Labels.prefixes.reduce((acc, val) => acc.replace(val, ''), trimmed);
  }

  public static normalizeLabel(lbl: KV): KV {
    return {
      key: Labels.normalizeKey(lbl.key),
      value: lbl.value,
    };
  }

  public static normalizeLabelToString(label: KV): string {
    let str = Labels.normalizeKey(label.key);
    if (label.value) str += `=${label.value}`;
    return str;
  }

  public static normalizeNamespaceLabelKey(key: string) {
    return [
      'k8s:io.kubernetes.pod.namespace.labels.',
      'k8s:io.kubernetes.pod.namespace',
      'io.kubernetes.pod.namespace.labels.',
      'io.kubernetes.pod.namespace',
    ].reduce((acc, val) => acc.replace(val, ''), key.toLowerCase());
  }

  public static concatKV(label: KV, normalize = false): string {
    const key = normalize ? Labels.normalizeKey(label.key) : label.key;

    return `${key}${label.value ? `=${label.value}` : ''}`;
  }

  public static findNamespaceInLabels(labels: KV[], normalizeLabels = true): string | null {
    for (const lbl of labels) {
      const kv = normalizeLabels ? Labels.normalizeLabel(lbl) : lbl;

      const hasNamespace = Labels.containsKey(kv, ['namespace']);
      if (hasNamespace) return kv.value;
    }

    return null;
  }

  public static containsKey(
    lbl: KV,
    nkeys: Set<string> | Iterable<string>,
    opts?: KeyFindOptions,
  ): boolean {
    // NOTE: If `normalizeTargetKeys` is set, we are going to refill a set in
    // the next `if` branch
    const targetKeys = !!opts?.normalizeTargetKeys
      ? new Set<string>()
      : _.isSet(nkeys)
        ? nkeys
        : new Set(nkeys);

    if (!!opts?.normalizeTargetKeys) {
      for (const key of nkeys) {
        targetKeys.add(Labels.normalizeKey(key));
      }
    }

    const kv = opts?.normalizeLabel ? Labels.normalizeLabel(lbl) : lbl;
    return targetKeys.has(kv.key);
  }

  public static containsKeyPart(lbl: KV, tkeys: Iterable<string>, opts?: KeyFindOptions): boolean {
    const [parts, targetKeys] = Labels.prepareKeyPartsAndTarget(lbl, tkeys, opts);

    return parts.some(part => targetKeys.has(part));
  }

  public static containsAllKeyParts(
    lbl: KV,
    tkeys: Iterable<string>,
    opts?: KeyFindOptions,
  ): boolean {
    const [parts, targetKeys] = Labels.prepareKeyPartsAndTarget(lbl, tkeys, opts);
    const partsSet = new Set(parts);

    for (const targetKey of targetKeys) {
      if (!partsSet.has(targetKey)) return false;
    }

    return true;
  }

  public static findAppNameInLabels(labels: KV[], normalizeLabels = true): string | null {
    for (const lbl of labels) {
      const kv = normalizeLabels ? Labels.normalizeLabel(lbl) : lbl;

      const appName = Labels.getAppNameFromLabel(kv, false);
      if (!!appName) return appName;
    }

    // NOTE: This method is too aggressive, lets use it only if the whole iteration
    // over labels doesnt give anything meaningful
    return Labels.findAppNameFromLabelsParts(labels);
  }

  public static findAppNameFromLabelsParts(labels: KV[], normalize = true): string | null {
    for (const lbl of labels) {
      const kv = normalize ? Labels.normalizeLabel(lbl) : lbl;

      // NOTE: Try to find app name related parts in a label key, very rude..
      const hasAppPartInKey = Labels.containsKeyPart(kv, Labels.appNameNormalizedKeys);
      if (hasAppPartInKey) return kv.value;
    }

    return null;
  }

  public static getAppNameFromLabel(lbl: KV, normalize = true): string | null {
    const kv = normalize ? Labels.normalizeLabel(lbl) : lbl;

    // NOTE: Check if we have explicit app name label
    const hasAppName = Labels.containsKey(kv, Labels.appNameNormalizedKeys);
    if (hasAppName) return kv.value;

    // NOTE: If not, we use reserved label, `reserved:remote-node` would give `remote-node` name
    const reservedAppName = Labels.getReservedAppName(kv, false);
    if (!!reservedAppName) return reservedAppName;

    return null;
  }

  public static findNetworksInLabels(labels: KV[]): string[] {
    const normNetworksLabelKey = Labels.normalizeKey(SpecialLabel.Networks);
    const set = labels.reduce<Set<string>>((set, { key, value }) => {
      if (Labels.normalizeKey(key) === normNetworksLabelKey) {
        value
          .split(',')
          .map(s => s.trim())
          .filter(s => s.length)
          .forEach(network => set.add(network));
      }
      return set;
    }, new Set());
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }

  public static getReservedAppName(lbl: KV, normalizeLabel = true): string | null {
    const kv = normalizeLabel ? Labels.normalizeLabel(lbl) : lbl;

    if (Labels.isReserved(kv, undefined, false)) return kv.key.replace('reserved:', '');

    return null;
  }

  public static findClusterNameInLabels(labels: KV[], normalize = true): string | null {
    for (const lbl of labels) {
      if (Labels.isClusterNameLabel(lbl, normalize)) return lbl.value;
    }

    return null;
  }

  public static isClusterNameLabel(lbl: KV, normalize = true): boolean {
    const kv = normalize ? Labels.normalizeLabel(lbl) : lbl;

    return Labels.containsKey(kv, Labels.ciliumClusterKeys);
  }

  public static findKVByString(labels: KV[], query: string): KV | null {
    for (const label of labels) {
      const { key, value } = label;
      if (value.length === 0 && key === query) return label;

      const labelStr = `${key}=${value}`;
      if (labelStr === query) return label;
    }

    return null;
  }

  public static getPolicyUUID(lbl: KV, normalize = true): string | null {
    const kv = normalize ? Labels.normalizeLabel(lbl) : lbl;
    const isUUID = Labels.containsAllKeyParts(kv, [SpecialLabel.CNPUID], {
      normalizeTargetKeys: true,
      normalizeLabel: normalize,
    });

    return isUUID ? kv.value : null;
  }

  public static findKVByArray(labels: KV[], kv: [string, string]): KV | null {
    return Labels.findKVByString(labels, `${kv[0]}=${kv[1]}`);
  }

  public static haveReserved(labels: KV[], reserved?: ReservedLabel): boolean {
    return labels.some(lbl => Labels.isReserved(lbl, reserved, true));
  }

  public static isReserved(lbl: KV, reserved?: ReservedLabel, normalize = true): boolean {
    const key = normalize ? Labels.normalizeKey(lbl.key) : lbl.key;

    return reserved == null ? Labels.isReservedKey(key, false) : key === reserved;
  }

  public static isReservedKey(key: string, normalize = true) {
    const nkey = normalize ? Labels.normalizeKey(key) : key;

    return Labels.reservedLabelSet.has(nkey as ReservedLabel);
  }

  public static isSpecial(lbl: KV, special?: SpecialLabel, normalize = true): boolean {
    const kv = normalize ? Labels.normalizeLabel(lbl) : lbl;

    if (special == null) return Labels.isSpecialKey(kv.key, false);

    const specialKV = Labels.toKV(special);
    const normSpecial = normalize ? Labels.normalizeLabel(specialKV) : specialKV;

    return kv.key === normSpecial.key && (!normSpecial.value || kv.value === normSpecial.value);
  }

  public static isSpecialKey(k: string, normalize = true): boolean {
    const key = normalize ? Labels.normalizeKey(k) : k;

    return Labels.specialLabelKeys.has(key);
  }

  public static isWorld(labels: KV[]): boolean {
    return Labels.haveReserved(labels, ReservedLabel.World);
  }

  public static isHost(labels: KV[]): boolean {
    return Labels.haveReserved(labels, ReservedLabel.Host);
  }

  public static isKubeApiserver(labels: KV[]): boolean {
    return Labels.haveReserved(labels, ReservedLabel.KubeApiserver);
  }

  public static isKubeApiServerLabel(lbl: KV, normalize = true): boolean {
    return Labels.isReserved(lbl, ReservedLabel.KubeApiserver, normalize);
  }

  public static isInit(labels: KV[]): boolean {
    return Labels.haveReserved(labels, ReservedLabel.Init);
  }

  public static isHealth(labels: KV[]): boolean {
    return Labels.haveReserved(labels, ReservedLabel.Health);
  }

  public static isRemoteNode(labels: KV[]): boolean {
    return Labels.haveReserved(labels, ReservedLabel.RemoteNode);
  }

  public static detect(labels: KV[]): LabelsProps {
    const props: LabelsProps = {
      isWorld: false,
      isHost: false,
      isKubeApiserver: false,
      isInit: false,
      isRemoteNode: false,
      isKubeDNS: false,
      isHealth: false,
      isPrometheusApp: false,
      isIngress: false,
      appName: undefined,
      clusterName: undefined,
    };

    labels.forEach((lbl: KV) => {
      const kv = Labels.normalizeLabel(lbl);

      props.isWorld = !!props.isWorld || Labels.isReserved(kv, ReservedLabel.World, false);
      props.isKubeApiserver =
        !!props.isKubeApiserver || Labels.isReserved(kv, ReservedLabel.KubeApiserver, false);
      props.isHost = !!props.isHost || Labels.isReserved(kv, ReservedLabel.Host, false);
      props.isInit = !!props.isInit || Labels.isReserved(kv, ReservedLabel.Init, false);
      props.isHealth = !!props.isHealth || Labels.isReserved(kv, ReservedLabel.Health, false);
      props.isKubeDNS = !!props.isKubeDNS || Labels.isSpecial(kv, SpecialLabel.KubeDNS);
      props.isIngress = !!props.isIngress || Labels.isReserved(kv, ReservedLabel.Ingress, false);
      props.isRemoteNode =
        !!props.isRemoteNode || Labels.isReserved(kv, ReservedLabel.RemoteNode, false);
      props.isPrometheusApp = !!props.isPrometheusApp || kv.key === SpecialLabel.PrometheusApp;

      if (!props.appName) {
        props.appName = Labels.getAppNameFromLabel(kv) || void 0;
      }

      if (!props.clusterName) {
        props.clusterName = Labels.isClusterNameLabel(kv, false) ? kv.value : void 0;
      }
    });

    // NOTE: Now lets use smth more aggressive
    if (!props.appName) {
      props.appName = Labels.findAppNameFromLabelsParts(labels) || void 0;
    }

    return props;
  }

  public static ensureK8sPrefix(str: string): string {
    if (str.startsWith('k8s:')) return str;
    if (Labels.isReservedKey(str)) return str;

    return `k8s:${str}`;
  }

  private static prepareKeyPartsAndTarget(
    lbl: KV,
    tkeys: Iterable<string>,
    opts?: KeyFindOptions,
  ): [string[], Set<string>] {
    const nkey = opts?.normalizeLabel ? Labels.normalizeKey(lbl.key) : lbl.key;
    const parts = nkey.split(Labels.innerSeparatorsRe);

    const targetKeys = !!opts?.normalizeTargetKeys
      ? new Set<string>()
      : _.isSet(tkeys)
        ? tkeys
        : new Set(tkeys);

    if (!!opts?.normalizeTargetKeys) {
      for (const key of tkeys) {
        targetKeys.add(Labels.normalizeKey(key));
      }
    }

    return [parts, targetKeys];
  }
}
