import { Labels } from '~/domain/labels';

const appNameTest = (strLabels: string[], expectedAppName: string | null) => {
  const labels = strLabels.map(l => Labels.toKV(l));
  const appName = Labels.findAppNameInLabels(labels);

  expect(appName).toBe(expectedAppName);
};

describe('extract app name', () => {
  test('from reserved host', () => {
    appNameTest(['reserved:host'], 'host');
    appNameTest(['reserved:host='], 'host');
  });

  test('from reserved world', () => {
    appNameTest(['reserved:world'], 'world');
    appNameTest(['reserved:world='], 'world');
  });

  test('from reserved health', () => {
    appNameTest(['reserved:health'], 'health');
    appNameTest(['reserved:health='], 'health');
  });

  test('from reserved init', () => {
    appNameTest(['reserved:init'], 'init');
    appNameTest(['reserved:init='], 'init');
  });

  test('from reserved remote-node', () => {
    appNameTest(['reserved:remote-node'], 'remote-node');
    appNameTest(['reserved:remote-node='], 'remote-node');
  });

  test('from reserved kube-apiserver', () => {
    appNameTest(['reserved:kube-apiserver'], 'kube-apiserver');
    appNameTest(['reserved:kube-apiserver='], 'kube-apiserver');
  });

  test('from reserved unmanaged', () => {
    appNameTest(['reserved:unmanaged'], 'unmanaged');
    appNameTest(['reserved:unmanaged='], 'unmanaged');
  });

  test('from reserved unknown', () => {
    appNameTest(['reserved:unknown'], 'unknown');
    appNameTest(['reserved:unknown='], 'unknown');
  });

  test('from k8s prefixed lbls', () => {
    appNameTest(['k8s:app=EXPECTED_NAME'], 'EXPECTED_NAME');
    appNameTest(['k8s:name=EXPECTED_NAME'], 'EXPECTED_NAME');
    appNameTest(['k8s:functionName=EXPECTED_NAME'], 'EXPECTED_NAME');
    appNameTest(['k8s:k8s-app=EXPECTED_NAME'], 'EXPECTED_NAME');

    appNameTest(['k8s:io.kubernetes.pod.app=EXPECTED_NAME'], 'EXPECTED_NAME');
    appNameTest(['k8s:io.kubernetes.pod.name=EXPECTED_NAME'], 'EXPECTED_NAME');
    appNameTest(['k8s:io.kubernetes.pod.functionName=EXPECTED_NAME'], 'EXPECTED_NAME');
    appNameTest(['k8s:io.kubernetes.pod.k8s-app=EXPECTED_NAME'], 'EXPECTED_NAME');

    appNameTest(['app=EXPECTED_NAME'], 'EXPECTED_NAME');
    appNameTest(['name=EXPECTED_NAME'], 'EXPECTED_NAME');
    appNameTest(['functionName=EXPECTED_NAME'], 'EXPECTED_NAME');
    appNameTest(['k8s-app=EXPECTED_NAME'], 'EXPECTED_NAME');

    appNameTest(['k8s:app.kubernetes.io/name=EXPECTED_NAME'], 'EXPECTED_NAME');
  });

  test('random label without explicit appName', () => {
    appNameTest(['k8s:random-app=random-name'], 'random-name');
    appNameTest(['k8s:random-name=random-app'], 'random-app');
  });
});
