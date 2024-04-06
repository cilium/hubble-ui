import { Workload } from '~/domain/hubble';

export const equals = (lhs: Workload, rhs: Workload): boolean => {
  const lkind = getKindShorthand(lhs.kind.trim());
  const rkind = getKindShorthand(rhs.kind.trim());

  if (lkind !== rkind) return false;

  const lname = lhs.name.trim().toLowerCase();
  const rname = rhs.name.trim().toLowerCase();

  return lname === rname;
};

export const includes = (arr: Workload[], target: Workload): boolean => {
  return arr.some(elem => equals(elem, target));
};

export const getKindShorthand = (kind: string): string => {
  kind = kind.toLowerCase();

  return k8sShorthands.get(kind) || kind;
};

export const k8sShorthands = (() => {
  return new Map([
    ['componentstatuses', 'cs'],
    ['componentstatus', 'cs'],
    ['configmaps', 'cm'],
    ['configmap', 'cm'],
    ['endpoints', 'ep'],
    ['endpoint', 'ep'],
    ['events', 'ev'],
    ['limitranges', 'limits'],
    ['namespaces', 'ns'],
    ['namespace', 'ns'],
    ['nodes', 'no'],
    ['persistentvolumeclaims', 'pvc'],
    ['persistentvolumes', 'pv'],
    ['pods', 'po'],
    ['pod', 'po'],
    ['replicationcontrollers', 'rc'],
    ['resourcequotas', 'quota'],
    ['serviceaccounts', 'sa'],
    ['services', 'svc'],
    ['service', 'svc'],
    ['customresourcedefinitions', 'crd'],
    ['customresourcedefinition', 'crd'],
    ['daemonset', 'ds'],
    ['daemonsets', 'ds'],
    ['deployment', 'deploy'],
    ['deployments', 'deploy'],
    ['dep', 'deploy'],
    ['replicasets', 'rs'],
    ['replicaset', 'rs'],
    ['statefulsets', 'sts'],
    ['statefulset', 'sts'],
    ['horizontalpodautoscalers', 'hpa'],
    ['cronjobs', 'cj'],
    ['cronjob', 'cj'],
    ['certificaterequests', 'cr,crs'],
    ['certificates', 'cert'],
    ['certificate', 'cert'],
    ['certificatesigningrequests', 'csr'],
    ['ciliumcidrgroups', 'ccg'],
    ['ciliumclusterwideenvoyconfigs', 'ccec'],
    ['ciliumclusterwidenetworkpolicies', 'ccnp'],
    ['ciliumendpoints', 'cep'],
    ['ciliumep', 'cep'],
    ['ciliumenvoyconfigs', 'cec'],
    ['ciliumexternalworkloads', 'cew'],
    ['ciliumidentities', 'ciliumid'],
    ['ciliumloadbalancerippools', 'ippool'],
    ['ippools', 'ippool'],
    ['lbippool', 'ippool'],
    ['lbippools', 'ippool'],
    ['ciliumnetworkpolicies', 'cnp'],
    ['cnps', 'cnp'],
    ['ciliumnodes', 'cn'],
    ['ciliumn', 'cn'],
    ['clickhouseinstallations', 'chi'],
    ['clickhouseinstallationtemplates', 'chit'],
    ['clickhouseoperatorconfigurations', 'chopconf'],
    ['backendconfigs', 'bc'],
    ['strimzipodsets', 'sps'],
    ['events', 'ev'],
    ['capacityrequests', 'capreq'],
    ['isovalentfqdngroups', 'ifg'],
    ['kafkabridges', 'kb'],
    ['kafkabridge', 'kb'],
    ['kafkaconnectors', 'kctr'],
    ['kafkaconnects', 'kc'],
    ['kafkamirrormaker2s', 'kmm2'],
    ['kafkamirrormakers', 'kmm'],
    ['kafkarebalances', 'kr'],
    ['kafkas', 'k'],
    ['kafka', 'k'],
    ['kafkatopics', 'kt'],
    ['kafkatopic', 'kt'],
    ['kafkausers', 'ku'],
    ['tenants', 'tenant'],
    ['alertmanagerconfigs', 'amcfg'],
    ['alertmanagers', 'am'],
    ['podmonitors', 'pmon'],
    ['probes', 'prb'],
    ['prometheusagents', 'promagent'],
    ['prometheuses', 'prom'],
    ['prometheus', 'prom'],
    ['prometheusrules', 'promrule'],
    ['scrapeconfigs', 'scfg'],
    ['servicemonitors', 'smon'],
    ['thanosrulers', 'ruler'],
    ['managedcertificates', 'mcrt'],
    ['servicenetworkendpointgroups', 'svcneg'],
    ['ingresses', 'ing'],
    ['ingress', 'ing'],
    ['networkpolicies', 'netpol'],
    ['updateinfos', 'updinf'],
    ['instrumentations', 'otelinst'],
    ['otelinsts', 'otelinst'],
    ['opentelemetrycollectors', 'otelcol'],
    ['opentelemetrycollector', 'otelcol'],
    ['otelcols', 'otelcol'],
    ['poddisruptionbudgets', 'pdb'],
    ['priorityclasses', 'pc'],
    ['volumesnapshotclasses', 'vsclass,vsclasses'],
    ['volumesnapshotcontents', 'vsc,vscs'],
    ['volumesnapshots', 'vs'],
    ['storageclasses', 'sc'],
  ]);
})();
