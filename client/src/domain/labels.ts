import { KV } from '~/domain/misc';

export enum ReservedLabel {
  Host = 'reserved:host',
  World = 'reserved:world',
  Health = 'reserved:health',
  Init = 'reserved:init',
  RemoteNode = 'reserved:remote-node',
  Unmanaged = 'reserved:unmanaged',
  Unknown = 'reserved:unknown',
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
}
