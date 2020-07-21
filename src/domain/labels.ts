import { KV } from '~/domain/misc';

export interface LabelsProps {
  isHost: boolean;
  isWorld: boolean;
  isRemoteNode: boolean;
  isKubeDNS: boolean;
  isInit: boolean;
  isHealth: boolean;
  isPrometheusApp: boolean;
  appName?: string;
}

export enum ReservedLabel {
  Host = 'reserved:host',
  World = 'reserved:world',
  Health = 'reserved:health',
  Init = 'reserved:init',
  RemoteNode = 'reserved:remote-node',
  Unmanaged = 'reserved:unmanaged',
  Unknown = 'reserved:unknown',
}

export enum SpecialLabel {
  KubeDNS = 'k8s:k8s-app=kube-dns',
  PrometheusApp = 'k8s:app=prometheus',
}

export class Labels {
  public static readonly prefixes = [
    'k8s:',
    'io.kubernetes.pod.',
    'covalent.io/',
  ];

  public static normalizeKey(key: string) {
    return Labels.prefixes.reduce(
      (acc, val) => acc.replace(val, ''),
      key.toLowerCase(),
    );
  }

  public static normalizeLabel(label: KV) {
    let str = Labels.normalizeKey(label.key);
    if (label.value) str += `=${label.value}`;
    return str;
  }

  public static findLabelNameByNormalizedKey(
    labels: KV[],
    keys: string[],
  ): string | null {
    const label = labels.find(l => {
      const nkey = Labels.normalizeKey(l.key);
      return keys.findIndex(key => key === nkey) !== -1;
    });

    return label ? label.value : null;
  }

  public static findNamespaceInLabels(labels: KV[]) {
    return Labels.findLabelNameByNormalizedKey(labels, ['namespace']);
  }

  public static findAppNameInLabels(labels: KV[]) {
    return (
      Labels.findAppNameInReservedLabel(labels) ||
      Labels.findLabelNameByNormalizedKey(labels, [
        'app',
        'name',
        'functionName',
        'k8s-app',
      ])
    );
  }

  public static findAppNameInReservedLabel(labels: KV[]): string | null {
    const label = labels.find(l =>
      Labels.normalizeKey(l.key).startsWith('reserved:'),
    );

    return label ? label.key.replace('reserved:', '') : null;
  }

  public static haveReserved(labels: KV[], reserved: ReservedLabel): boolean {
    return labels.some(l => Labels.normalizeKey(l.key) === reserved);
  }

  public static isWorld(labels: KV[]): boolean {
    return Labels.haveReserved(labels, ReservedLabel.World);
  }

  public static isHost(labels: KV[]): boolean {
    return Labels.haveReserved(labels, ReservedLabel.Host);
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
      isInit: false,
      isRemoteNode: false,
      isKubeDNS: false,
      isHealth: false,
      isPrometheusApp: false,
    };

    labels.forEach((kv: KV) => {
      const nkey = Labels.normalizeKey(kv.key);

      props.isWorld = !!props.isWorld || nkey === ReservedLabel.World;
      props.isHost = !!props.isHost || nkey === ReservedLabel.Host;
      props.isInit = !!props.isInit || nkey === ReservedLabel.Init;
      props.isHealth = !!props.isHealth || nkey === ReservedLabel.Health;
      props.isKubeDNS =
        !!props.isKubeDNS || `${kv.key}=${kv.value}` === SpecialLabel.KubeDNS;
      props.isRemoteNode =
        !!props.isRemoteNode || nkey === ReservedLabel.RemoteNode;
      props.isPrometheusApp =
        !!props.isPrometheusApp || nkey === SpecialLabel.PrometheusApp;
    });

    const appName = Labels.findAppNameInLabels(labels);
    if (appName != null) {
      props.appName = appName;
    }

    return props;
  }
}
