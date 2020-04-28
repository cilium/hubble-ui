import { KV } from '~/domain/misc';

export class Labels {
  public static readonly PREFIXES = [
    'k8s:',
    'io.kubernetes.pod.',
    'covalent.io/',
  ];

  public static normalizeLabelName(label: string) {
    return Labels.PREFIXES.reduce(
      (acc, val) => acc.replace(val, ''),
      label.toLowerCase(),
    );
  }

  public static findLabelNameByNormalizedKey(
    labels: KV[],
    key: string,
  ): string | null {
    const label = labels.find(l => Labels.normalizeLabelName(l.key) === key);
    return label ? label.value : null;
  }

  public static findNamespaceInLabels(labels: KV[]) {
    return Labels.findLabelNameByNormalizedKey(labels, 'namespace');
  }

  public static findAppNameInLabels(labels: KV[]) {
    return (
      Labels.findAppNameInReservedLabel(labels) ||
      Labels.findLabelNameByNormalizedKey(labels, 'app') ||
      Labels.findLabelNameByNormalizedKey(labels, 'name') ||
      Labels.findLabelNameByNormalizedKey(labels, 'functionName') ||
      Labels.findLabelNameByNormalizedKey(labels, 'k8s-app')
    );
  }

  public static findAppNameInReservedLabel(labels: KV[]): string | null {
    const label = labels.find(l =>
      Labels.normalizeLabelName(l.key).startsWith('reserved:'),
    );
    return label ? label.key.replace('reserved:', '') : null;
  }
}
