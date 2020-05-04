export type Maybe<T> = T | null;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  /**
   * A timestamp formatted according to the IETF RFC 3339 Internet Date and Time Format
   * (https://tools.ietf.org/html/rfc3339#section-5.6),
   * with the date and time separated by "T", e.g. "2017-05-10T11:35:00Z
   */
  DateTime: any;
};

export type AppEndpoint = {
  __typename?: 'AppEndpoint';
  /** ID of the endpoint. This is a hash of endpoint labels. */
  id: Scalars['ID'];
  /** name of the endpoint, ex: redis-master */
  name: Scalars['String'];
  /** all labels for the endpoint */
  labels: Array<Label>;
  /** Protocols supported by this endpoint. */
  protocols: Array<Protocol>;
  /** If this field is set to true, this endpoint is excluded from the app model. */
  disabled: Scalars['Boolean'];
  /**
   * CIDRs for this endpoint. These fields take precedence over the labels field, meaning if either of the cidrs lists is
   * not empty, the endpoint is defined based on CIDRs and the labels field should be ignored. Note that these fields will
   * be required once migration from the cidr field is complete.
   */
  v4Cidrs?: Maybe<Array<Scalars['String']>>;
  v6Cidrs?: Maybe<Array<Scalars['String']>>;
  /** DNS name of the endpoint. */
  dnsName?: Maybe<Scalars['String']>;
  /** name of an icon to use for displaying purposes */
  icon?: Maybe<Scalars['String']>;
  /** @deprecated(reason: "Use v4Cidrs/v6Cidrs.") */
  cidr?: Maybe<Scalars['String']>;
  type?: Maybe<AppEndpointType>;
  hasIngressPolicyRules?: Maybe<Scalars['Boolean']>;
  hasEgressPolicyRules?: Maybe<Scalars['Boolean']>;
};

export type AppEndpointInput = {
  /** ID of the endpoint. This is a hash of endpoint labels. */
  id?: Maybe<Scalars['ID']>;
  /** name of the endpoint, ex: redis-master */
  name: Scalars['String'];
  /** all labels for the endpoint */
  labels: Array<LabelInput>;
  /** protocols of the endpoint */
  protocols: Array<ProtocolInput>;
  /** disabled or not */
  disabled: Scalars['Boolean'];
  /** CIDRs for this endpoint. */
  v4Cidrs?: Maybe<Array<Scalars['String']>>;
  v6Cidrs?: Maybe<Array<Scalars['String']>>;
  /** DNS name of the endpoint. */
  dnsName?: Maybe<Scalars['String']>;
  /** name of an icon to use for displaying purposes */
  icon?: Maybe<Scalars['String']>;
  /** @deprecated(reason: "Use v4Cidrs/v6Cidrs.") */
  cidr?: Maybe<Scalars['String']>;
  type?: Maybe<AppEndpointType>;
};

export enum AppEndpointType {
  /** Endpoint does not belong to the app, but is managed by Cilium. */
  OUTSIDE_MANAGED = 'OUTSIDE_MANAGED',
  /** Source "reserved:world" endpoint. */
  SOURCE_RESERVED_WORLD = 'SOURCE_RESERVED_WORLD',
  /** The default /0 CIDR endpoint for CIDR destinations. */
  CIDR_ALLOW_ALL = 'CIDR_ALLOW_ALL',
  /** DNS-based endpoint. */
  DNS = 'DNS',
}

export type AppFunction = {
  __typename?: 'AppFunction';
  /** id of function, hash */
  id: Scalars['ID'];
  /** Name of the function, e.g. "^GET /jobs/[0-9]+$". */
  name: Scalars['String'];
  /** List of source endpoints that are allowed to call this function. */
  allowedSources: Array<Scalars['ID']>;
  allowedSourcesDisabled: Array<Scalars['ID']>;
  /** If this field is set to true, this function is excluded from the app model. */
  disabled: Scalars['Boolean'];
  /** If function built from dns response set this field */
  dnsResponse?: Maybe<FlowDnsResponse>;
  /** If function built from http response set this field */
  httpResponse?: Maybe<FlowHttpResponse>;
  /** If function built from http response set this field */
  metricsResponse?: Maybe<FlowMetricsResponse>;
};

export type AppFunctionInput = {
  id?: Maybe<Scalars['ID']>;
  /** e.g. "^GET /jobs/[0-9]+$" (comes from flow name) */
  name: Scalars['String'];
  /** List of source endpoint that are allowed to call this function. */
  allowedSources: Array<Scalars['ID']>;
  allowedSourcesDisabled: Array<Scalars['ID']>;
  /** If this field is set to true, this function is excluded from the app model. */
  disabled: Scalars['Boolean'];
  /** If function built from dns response set this field */
  dnsResponse?: Maybe<FlowDnsResponseInput>;
  /** If function built from http response set this field */
  httpResponse?: Maybe<FlowHttpResponseInput>;
  /** If function built from http response set this field */
  metricsResponse?: Maybe<FlowMetricsResponseInput>;
};

/** Cilium Endpoint Information */
export type CiliumEndpoint = {
  __typename?: 'CiliumEndpoint';
  /** Cilium Endpoint ID */
  endpointId: Scalars['String'];
  /** Namespace */
  namespace: Scalars['String'];
  /** Name of CEP */
  name: Scalars['String'];
  /** Cilium Identity ID */
  identityId: Scalars['String'];
  /** Cilium Identity labels */
  identityLabels: Array<Label>;
  /** IPv4 addresses */
  ipv4Addresses: Array<Scalars['String']>;
  /** IPv6 addresses */
  ipv6Addresses: Array<Scalars['String']>;
  /** Log message */
  logMessage: Scalars['String'];
  /** Failing controllers */
  failingControllers: Array<CiliumEndpointFailingController>;
  ingress?: Maybe<CiliumEndpointPolicyStatus>;
  egress?: Maybe<CiliumEndpointPolicyStatus>;
};

export type CiliumEndpointAllowedIdentity = {
  __typename?: 'CiliumEndpointAllowedIdentity';
  identityLabels: Array<Label>;
  port?: Maybe<Scalars['Int']>;
  protocol?: Maybe<Scalars['String']>;
};

/** Represents FailingControllers for the endpoint */
export type CiliumEndpointFailingController = {
  __typename?: 'CiliumEndpointFailingController';
  /** Number of consecutive controller failures */
  consecutiveFailureCount: Scalars['String'];
  /** Total number of controller failures */
  failureCount: Scalars['String'];
  /** Failure message from failing controller */
  lastFailureMsg: Scalars['String'];
  /** Timestamp for last controller failure */
  lastFailureTimestamp: Scalars['String'];
  /** Timestamp for last controller success */
  lastSuccessTimestamp: Scalars['String'];
  /** Total number successful controller executions */
  successCount: Scalars['String'];
};

export type CiliumEndpointPolicyStatus = {
  __typename?: 'CiliumEndpointPolicyStatus';
  enforcing: Scalars['Boolean'];
  allowed?: Maybe<Array<CiliumEndpointAllowedIdentity>>;
};

/** Represents a Cilium network policy. */
export type CiliumNetworkPolicy = {
  __typename?: 'CiliumNetworkPolicy';
  /** Namespace this CNP belongs to. */
  namespace: Scalars['String'];
  /** Name of the CNP. */
  name: Scalars['String'];
  /** Timestamp at which this CNP was created. */
  creationTimestamp: Scalars['DateTime'];
  /** The full CNP in YAML format. */
  yaml: Scalars['String'];
};

/** CiliumNetworkPolicyStatus represents status of each cilium network policy */
export type CiliumNetworkPolicyStatus = {
  __typename?: 'CiliumNetworkPolicyStatus';
  /** Status of the cilium network policy. */
  status: ClusterComponentStatus;
  /** (optional) Error message. This field is set to null if the status is not ERROR. */
  error?: Maybe<Scalars['String']>;
  /** Name of the policy. */
  name?: Maybe<Scalars['String']>;
  /** Name of the node e.g. minikube where the pod is running. */
  hostname: Scalars['String'];
  /** Name of the namespace where this policy has been appied. */
  namespace: Scalars['String'];
  /** (optional) The desired cilium network policy version. */
  desiredVersion?: Maybe<Scalars['String']>;
  /** (optional) The current cilium network policy version. */
  currentVersion?: Maybe<Scalars['String']>;
};

export type Cluster = {
  __typename?: 'Cluster';
  /** ID of the cluster. */
  id: Scalars['String'];
  /** Name of the cluster. */
  name: Scalars['String'];
  /** Type of the cluster. */
  type: ClusterType;
  /** Namespaces in this cluster. */
  namespaces: Array<Scalars['String']>;
  lastSynced?: Maybe<Scalars['DateTime']>;
  /** (Optional) Information about the status of the cluster. */
  status?: Maybe<ClusterStatus>;
  /** List of pods that are not managed by cilium */
  unmanagedPods?: Maybe<Array<Pod>>;
  /**
   * List of Cilium network policies in this cluster. You can optionally specify a namespace
   * to limit the results to CNPs in the namespace.
   */
  cnp?: Maybe<Array<CiliumNetworkPolicy>>;
  /** List of Cilium Endpoints. */
  cep?: Maybe<Array<CiliumEndpoint>>;
};

export type ClusterCnpArgs = {
  namespace?: Maybe<Scalars['String']>;
};

export type ClusterCepArgs = {
  namespace?: Maybe<Scalars['String']>;
};

export enum ClusterComponentStatus {
  UNKNOWN = 'UNKNOWN',
  ERROR = 'ERROR',
  PENDING = 'PENDING',
  OK = 'OK',
}

export type ClusterStatus = {
  __typename?: 'ClusterStatus';
  /**
   * Status of the component. Some components, such as components of type K8S_CONTROLLER
   * can have multiple associated K8S_PODS, each having their own status. This is the reason
   * status is an unordered list of ClusterComponentStatus objects.
   */
  ciliumNetworkPolicies: Array<CiliumNetworkPolicyStatus>;
  pods: Array<PodStatus>;
  date?: Maybe<Scalars['String']>;
};

export enum ClusterType {
  KUBERNETES = 'KUBERNETES',
}

export type DashboardCounters = {
  __typename?: 'DashboardCounters';
  /** Counter of pods not managed by cilium */
  notCiliumManagedPods?: Maybe<Scalars['Int']>;
  /** Counter of host-networking pods not managed by cilium */
  notCiliumManagedHostNetworkingPods?: Maybe<Scalars['Int']>;
};

export type DashboardCountersFiltersInput = {
  /** Returns counters observed in this cluster */
  clusterId: Scalars['String'];
};

export type DiscoverClusterResult = {
  __typename?: 'DiscoverClusterResult';
  endpoints: Array<AppEndpoint>;
  responseHash: Scalars['String'];
  responseTimestamp?: Maybe<Scalars['DateTime']>;
};

export enum DiscoverFilterEnum {
  /** discover only flows that goes ingress to app deployment from outside */
  INBOUND = 'INBOUND',
  /** discover only flows that goes egress from app deployment to outside */
  OUTBOUND = 'OUTBOUND',
  /** discover only flows within app deployment boundaries */
  INTRA_APP = 'INTRA_APP',
}

export type Endpoint = {
  __typename?: 'Endpoint';
  labels: Array<Label>;
  name: Scalars['String'];
};

/** A flow. */
export type Flow = {
  __typename?: 'Flow';
  id: Scalars['String'];
  hash: Scalars['String'];
  sourceSecurityId: Scalars['Int'];
  sourceDeploymentId: Scalars['String'];
  sourceLabels: Array<Label>;
  sourcePodName?: Maybe<Scalars['String']>;
  sourceIpAddress?: Maybe<Scalars['String']>;
  destinationSecurityId: Scalars['Int'];
  destinationDeploymentId: Scalars['String'];
  destinationLabels: Array<Label>;
  destinationIpAddress?: Maybe<Scalars['String']>;
  destinationPodName?: Maybe<Scalars['String']>;
  destinationDnsName?: Maybe<Scalars['String']>;
  destinationL4Protocol: Scalars['String'];
  destinationL7Protocol?: Maybe<Scalars['String']>;
  destinationPort?: Maybe<Scalars['Int']>;
  destinationFunctionName?: Maybe<Scalars['String']>;
  dnsResponse?: Maybe<FlowDnsResponse>;
  httpResponse?: Maybe<FlowHttpResponse>;
  metricsResponse?: Maybe<FlowMetricsResponse>;
  tcpControlBits: Array<Scalars['String']>;
  timestamp: Scalars['DateTime'];
  forwardingStatus: ForwardingStatus;
  forwardingStatusDetails: Array<Scalars['String']>;
  direction?: Maybe<FlowDirection>;
  rejectedReason?: Maybe<RejectedReason>;
  rejectedReasonMessage?: Maybe<Scalars['String']>;
  /** this is "request" or "response" flow */
  requestOrResponse?: Maybe<Scalars['String']>;
  /** https://github.com/cilium/cilium/blob/2896f853fe123d353ef9900a09afbcda94b2ab54/pkg/monitor/api/types.go#L132 */
  ciliumEventSubType?: Maybe<Scalars['String']>;
};

/** Connection object for flow. */
export type FlowConnection = {
  __typename?: 'FlowConnection';
  pageInfo: PageInfo;
  edges: Array<FlowEdge>;
};

export enum FlowDirection {
  INGRESS = 'INGRESS',
  EGRESS = 'EGRESS',
}

/** Describes L7 DNS Response */
export type FlowDnsResponse = {
  __typename?: 'FlowDnsResponse';
  query: Scalars['String'];
  ips: Array<Scalars['String']>;
  rcode: Scalars['String'];
};

export type FlowDnsResponseInput = {
  query: Scalars['String'];
  ips: Array<Scalars['String']>;
  rcode: Scalars['String'];
};

/** Edge object for flow. */
export type FlowEdge = {
  __typename?: 'FlowEdge';
  cursor: Scalars['String'];
  node: Flow;
};

export type FlowFiltersInput = {
  /**
   * Returns flows observed in this cluster. This field is mutually exclusive with the
   * deploymentId field.
   */
  clusterId?: Maybe<Scalars['String']>;
  /**
   * Returns flows observed in this deployment. This field is mutually exclusive with
   * the clusterId field.
   */
  deploymentId?: Maybe<Scalars['String']>;
  /** Returns flows with a timestamp greater than this timestamp. */
  after?: Maybe<Scalars['DateTime']>;
  /** Returns flows with a timestamp less than this timestamp. */
  before?: Maybe<Scalars['DateTime']>;
  /** Returns flows if the forwarding status matches. */
  forwardingStatus?: Maybe<ForwardingStatus>;
  /** More granular filtering for rejected flows with specific reasons. */
  rejectedReason?: Maybe<Array<RejectedReason>>;
  /** Filter flows by source endpoint labels. */
  sourceLabels?: Maybe<Array<LabelInput>>;
  /** Filter flows by destination endpoint labels. */
  destinationLabels?: Maybe<Array<LabelInput>>;
  /**
   * Filter flows by source or destination endpoints. This filter option returns flows
   * whose source or destination endpoint labels match the provided labels.
   */
  labels?: Maybe<Array<LabelInput>>;
  /** Filter out flows by source or destination endpoints, which labels contains the specified labels. */
  excludeLabels?: Maybe<Array<LabelInput>>;
  /** Filter flows by source IP address. */
  sourceIpAddress?: Maybe<Scalars['String']>;
  /** Filter flows by destination IP address. */
  destinationIpAddress?: Maybe<Scalars['String']>;
  /** Filter flows by destination DNS name. */
  destinationDnsName?: Maybe<Scalars['String']>;
  /** Filter flows by source seccurity ID. */
  sourceSecurityId?: Maybe<Scalars['Int']>;
  /** Filter flows by destination seccurity ID. */
  destinationSecurityId?: Maybe<Scalars['Int']>;
  /** Filter flows by destination port. */
  destinationPort?: Maybe<Scalars['Int']>;
  /** Filter interapp flows */
  interappTraffic?: Maybe<Array<Maybe<Scalars['String']>>>;
  /** Filter inbound flows */
  inboundTraffic?: Maybe<Array<Maybe<Scalars['String']>>>;
  /** Filter outbound flows */
  outboundTraffic?: Maybe<Array<Maybe<Scalars['String']>>>;
  /** If set true, only show flows where source namespace is not equal destination namespace */
  crossNamespaceOnly?: Maybe<Scalars['Boolean']>;
  /** Filter by http status code */
  httpStatusCode?: Maybe<Scalars['String']>;
};

export type FlowHttpHeader = {
  __typename?: 'FlowHttpHeader';
  key: Scalars['String'];
  value: Scalars['String'];
};

export type FlowHttpHeaderInput = {
  key: Scalars['String'];
  value: Scalars['String'];
};

/** Describes L7 HTTP Response */
export type FlowHttpResponse = {
  __typename?: 'FlowHttpResponse';
  code: Scalars['Int'];
  method: Scalars['String'];
  url: Scalars['String'];
  protocol: Scalars['String'];
  headers: Array<FlowHttpHeader>;
};

export type FlowHttpResponseInput = {
  code: Scalars['Int'];
  method: Scalars['String'];
  url: Scalars['String'];
  protocol: Scalars['String'];
  headers: Array<FlowHttpHeaderInput>;
};

/** Describes Metrics Response */
export type FlowMetricsResponse = {
  __typename?: 'FlowMetricsResponse';
  latencyMs: Scalars['Float'];
};

export type FlowMetricsResponseInput = {
  latencyMs: Scalars['Float'];
};

export enum FlowStateChange {
  UNSPEC = 'UNSPEC',
  NEW = 'NEW',
  ESTABLISHED = 'ESTABLISHED',
  FIRST_ERROR = 'FIRST_ERROR',
  ERROR = 'ERROR',
  CLOSED = 'CLOSED',
}

/** Defines forwarding status. */
export enum ForwardingStatus {
  UNDEFINED_POLICY_DECISION = 'UNDEFINED_POLICY_DECISION',
  FORWARDED = 'FORWARDED',
  REJECTED = 'REJECTED',
  DROPPED = 'DROPPED',
}

export type HttpRewriteRule = {
  __typename?: 'HttpRewriteRule';
  /** Global ID. */
  id: Scalars['ID'];
  /** Rewrite rule for HTTP methods, e.g. "^GET$" */
  method: Scalars['String'];
  /** Rewrite rule for HTTP request path, e.g. "^/jobs/([0-9]+)$". */
  path: Scalars['String'];
};

export type HttpRewriteRuleInput = {
  /** Global ID. If this field is set, the server stores it as is. Otherwise it generates one. */
  id?: Maybe<Scalars['ID']>;
  /** Rewrite rule for HTTP methods, e.g. "^GET$" */
  method: Scalars['String'];
  /** Rewrite rule for HTTP request path, e.g. "^/jobs/([0-9]+)$". */
  path: Scalars['String'];
};

/** Represents a Kubernetes network policy. */
export type KubernetesNetworkPolicy = {
  __typename?: 'KubernetesNetworkPolicy';
  /** Namespace this KNP belongs to. */
  namespace: Scalars['String'];
  /** Name of the KNP. */
  name: Scalars['String'];
  /** Timestamp at which this KNP was created. */
  creationTimestamp: Scalars['DateTime'];
  /** The full KNP in YAML format. */
  yaml: Scalars['String'];
};

/** Label */
export type Label = {
  __typename?: 'Label';
  key: Scalars['String'];
  value: Scalars['String'];
};

export type LabelInput = {
  key: Scalars['String'];
  value: Scalars['String'];
};

export type MutationOutput = {
  /** Error message. This field is set to null if the mutation succeeded. */
  error?: Maybe<Scalars['String']>;
};

/** Page information for a connection object. */
export type PageInfo = {
  __typename?: 'PageInfo';
  /** Indicates whether there is a next page in the connection. */
  hasNextPage: Scalars['Boolean'];
  /** Indicates whether there is a previous page in the connection. */
  hasPreviousPage: Scalars['Boolean'];
  /** A cursor that points to the first element in the page. */
  startCursor: Scalars['String'];
  /** A cursor that points to the last element in the page. */
  endCursor: Scalars['String'];
};

export type Pod = {
  __typename?: 'Pod';
  namespace: Scalars['String'];
  name: Scalars['String'];
  hostNetwork: Scalars['Boolean'];
};

/** PodStatus represents status of each K8s pod */
export type PodStatus = {
  __typename?: 'PodStatus';
  /** Status of the pod. */
  status: ClusterComponentStatus;
  /** (optional) Error message. This field is set to null if the status is not ERROR. */
  error?: Maybe<Scalars['String']>;
  /** Name of the node e.g. minikube where the pod is running. */
  hostname: Scalars['String'];
  /** Name of the namespace where this policy has been appied. */
  namespace: Scalars['String'];
  /** Name of the Pod. */
  name: Scalars['String'];
  /** True if the pod is running in host networking mode. */
  hostNetwork: Scalars['Boolean'];
  /** Software version of the pod. */
  version: Scalars['String'];
};

export type PolicySpecs = {
  __typename?: 'PolicySpecs';
  policyNamespace: Scalars['String'];
  policyName: Scalars['String'];
  type: PolicyTypeEnum;
  ingressSpecs: Array<Scalars['String']>;
  egressSpecs: Array<Scalars['String']>;
};

export type PolicySpecsFilterInput = {
  clusterId: Scalars['String'];
  labels?: Maybe<Array<LabelInput>>;
};

export enum PolicyTypeEnum {
  CILIUM_NETWORK_POLICY = 'CILIUM_NETWORK_POLICY',
  KUBERNETES_NETWORK_POLICY = 'KUBERNETES_NETWORK_POLICY',
}

export type Protocol = {
  __typename?: 'Protocol';
  /** id of a protocol, hash */
  id: Scalars['ID'];
  /** L3/L4 Protocol, e.g. TCP/UDP/ICMP */
  l34Protocol: Scalars['String'];
  /**
   * List of source endpoints that are allowed to access this service. If this field is set, the service is assumed to be
   * L3/L4 only. For services that have L7 information, this field is set to null.
   */
  allowedSources: Array<Scalars['ID']>;
  allowedSourcesDisabled: Array<Scalars['ID']>;
  /**
   * Optional L4 specific field
   * ex: 9080
   */
  port?: Maybe<Scalars['Int']>;
  /**
   * Optional L7 specific fields
   * L7 protocol, e.g. HTTP. This field is set to null for L3/L4 only services.
   */
  l7Protocol?: Maybe<Scalars['String']>;
  /** List of HTTP rewrite rules. This field is set to null for L3/L4 only services and non-HTTP services. */
  httpRewriteRules?: Maybe<Array<HttpRewriteRule>>;
  /** List of functions provided by this service. This field is set to null for L3/L4 only services. */
  functions?: Maybe<Array<AppFunction>>;
  /**
   * Application-level protocol. For example, the user can set this field to "elasticsearch" to indicate that it's
   * elasticsearch that's running on this HTTP port.
   */
  applicationProtocol?: Maybe<Scalars['String']>;
};

export type ProtocolInput = {
  id?: Maybe<Scalars['ID']>;
  /** L3/L4 Protocol, e.g. TCP/UDP/ICMP */
  l34Protocol: Scalars['String'];
  allowedSources: Array<Scalars['ID']>;
  allowedSourcesDisabled: Array<Scalars['ID']>;
  /** ex: 9080 */
  port?: Maybe<Scalars['Int']>;
  /**
   * Optional L7 specific fields
   * L7 protocol, e.g. HTTP. This field is set to null for L3/L4 only services.
   */
  l7Protocol?: Maybe<Scalars['String']>;
  /** List of HTTP rewrite rules. This field is set to null for L3/L4 only services and non-HTTP services. */
  httpRewriteRules?: Maybe<Array<HttpRewriteRuleInput>>;
  /** List of functions provided by this service. This field is set to null for L3/L4 only services. */
  functions?: Maybe<Array<AppFunctionInput>>;
  /**
   * Application-level protocol. For example, the user can set this field to "elasticsearch" to indicate that it's
   * elasticsearch that's running on this HTTP port.
   */
  applicationProtocol?: Maybe<Scalars['String']>;
};

export type Query = {
  __typename?: 'Query';
  /**
   * Returns the user that’s currently signed in, or null if the user is not signed in.
   * Specify orgName to swich to a specific organization.
   */
  viewer?: Maybe<User>;
};

export type QueryViewerArgs = {
  orgName?: Maybe<Scalars['String']>;
};

/**
 * Hand-picked collection of reasons that are exposed to the UI for advanced filtering.
 * All possible values: https://github.com/cilium/cilium/blob/master/pkg/monitor/api/drop.go#L27
 */
export enum RejectedReason {
  CT_MAP_INSERTION_FAILED = 'CT_MAP_INSERTION_FAILED',
  CT_TRUNCATED_OR_INVALID_HEADER = 'CT_TRUNCATED_OR_INVALID_HEADER',
  CT_UNKNOWN_L4_PROTOCOL = 'CT_UNKNOWN_L4_PROTOCOL',
  ERROR_CORRECTING_L3_CHECKSUM = 'ERROR_CORRECTING_L3_CHECKSUM',
  ERROR_CORRECTING_L4_CHECKSUM = 'ERROR_CORRECTING_L4_CHECKSUM',
  ERROR_RETREIVING_TUNNEL_KEY = 'ERROR_RETREIVING_TUNNEL_KEY',
  ERROR_WRITING_TO_PACKET = 'ERROR_WRITING_TO_PACKET',
  INVALID_IPV6_HEADER = 'INVALID_IPV6_HEADER',
  INVALID_PACKET = 'INVALID_PACKET',
  INVALID_SOURCE_IP = 'INVALID_SOURCE_IP',
  IP_FRAGMENTATION_NOT_SUPPORTED = 'IP_FRAGMENTATION_NOT_SUPPORTED',
  LOCAL_HOST_UNREACHABLE = 'LOCAL_HOST_UNREACHABLE',
  MISSED_TAIL_CALL = 'MISSED_TAIL_CALL',
  NO_CONFIGURATION = 'NO_CONFIGURATION',
  NO_MAPPING_FOR_NAT = 'NO_MAPPING_FOR_NAT',
  NO_TUNNEL_ENCAPSULATION_ENDPOINT = 'NO_TUNNEL_ENCAPSULATION_ENDPOINT',
  POLICY_DENIED_L3 = 'POLICY_DENIED_L3',
  SERVICE_BACKEND_NOT_FOUND = 'SERVICE_BACKEND_NOT_FOUND',
  STALE_OR_UNROUTABLE_IP = 'STALE_OR_UNROUTABLE_IP',
  UNKNOWN_CONNECTION_TRACKING_STATE = 'UNKNOWN_CONNECTION_TRACKING_STATE',
  UNKNOWN_ICMPV4_CODE = 'UNKNOWN_ICMPV4_CODE',
  UNKNOWN_ICMPV4_TYPE = 'UNKNOWN_ICMPV4_TYPE',
  UNKNOWN_ICMPV6_CODE = 'UNKNOWN_ICMPV6_CODE',
  UNKNOWN_ICMPV6_TYPE = 'UNKNOWN_ICMPV6_TYPE',
  UNKNOWN_L3_TARGET_ADDRESS = 'UNKNOWN_L3_TARGET_ADDRESS',
  UNKNOWN_L4_PROTOCOL = 'UNKNOWN_L4_PROTOCOL',
  UNSUPPORTED_L2_PROTOCOL = 'UNSUPPORTED_L2_PROTOCOL',
  UNSUPPORTED_L3_PROTOCOL = 'UNSUPPORTED_L3_PROTOCOL',
  UNSUPPORTED_NAT_PROTOCOL = 'UNSUPPORTED_NAT_PROTOCOL',
}

/** A Covalent user. */
export type User = {
  __typename?: 'User';
  name: Scalars['String'];
  email: Scalars['String'];
  discoverCluster: DiscoverClusterResult;
  /** Returns a list of clusters that belong to this user. */
  clusters: Array<Cluster>;
  getCluster: Cluster;
  /** Returns the flow with a given ID. */
  flow: Flow;
  /** Returns flows. */
  flows: FlowConnection;
  /** Returns policy specs that match the specified filters. */
  policySpecs: Array<PolicySpecs>;
  /** Returns misc counters for dashboard */
  dashboardCounters: DashboardCounters;
};

/** A Covalent user. */
export type UserDiscoverClusterArgs = {
  clusterId: Scalars['String'];
  namespaces?: Maybe<Array<Scalars['String']>>;
  startedAfter: Scalars['DateTime'];
  excludedLabelKeys: Array<Scalars['String']>;
  nameLabelKeys: Array<Scalars['String']>;
  filterBy?: Maybe<FlowFiltersInput>;
};

/** A Covalent user. */
export type UserGetClusterArgs = {
  id: Scalars['String'];
};

/** A Covalent user. */
export type UserFlowArgs = {
  id: Scalars['String'];
  nextgenstore?: Maybe<Scalars['Boolean']>;
  labels?: Maybe<Array<LabelInput>>;
};

/** A Covalent user. */
export type UserFlowsArgs = {
  first?: Maybe<Scalars['Int']>;
  after?: Maybe<Scalars['String']>;
  last?: Maybe<Scalars['Int']>;
  before?: Maybe<Scalars['String']>;
  filterBy?: Maybe<FlowFiltersInput>;
  nextgenstore?: Maybe<Scalars['Boolean']>;
  groupSourceByNamespace?: Maybe<Scalars['Boolean']>;
  groupDestinationByNamespace?: Maybe<Scalars['Boolean']>;
  groupDestinationByDnsName?: Maybe<Scalars['Boolean']>;
  unaggregated?: Maybe<Scalars['Boolean']>;
};

/** A Covalent user. */
export type UserPolicySpecsArgs = {
  filterBy: PolicySpecsFilterInput;
};

/** A Covalent user. */
export type UserDashboardCountersArgs = {
  filterBy: DashboardCountersFiltersInput;
};
