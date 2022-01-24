export enum EventKind {
  StreamError = 'stream-error',
  StreamEnd = 'stream-end',
  StreamsReconnected = 'streams-reconnected',
  StreamsReconnecting = 'streams-reconnecting',
  FlowsDiff = 'flows-diff',
  StoreMocked = 'store-mocked',
  NamespaceAdded = 'namespace-added',
  Notification = 'notification',
  DataModeSwitched = 'data-mode-switched',
  FlowsPageLoadingStarted = 'flows-page-loading-started',
  FlowsPageLoadingFinished = 'flows-page-loading-finished',
  FlowsPageLoadingFailed = 'flows-page-loading-failed',
  FullFlowLoadingStarted = 'full-flow-loading-started',
  FullFlowLoadingFinished = 'full-flow-loading-finished',
  FullFlowLoadingFailed = 'full-flow-loading-failed',
  TimescapePodsLoadingStarted = 'timescape-pods-loading-started',
  TimescapePodsLoadingFailed = 'timescape-pods-loading-failed',
  TimescapePodsLoadingFinished = 'timescape-pods-loading-finished',
  TimescapeFlowStatsLoadingStarted = 'timescape-flow-stats-loading-started',
  TimescapeFlowStatsLoadingFailed = 'timescape-flow-stats-loading-failed',
  TimescapeFlowStatsLoadingFinished = 'timescape-flow-stats-loading-finished',
}

// TODO: kind for process event stream ?
export enum StreamKind {
  Control = 'control',
  ServiceMap = 'service-map',
  PolicyEditor = 'policy-editor',
  TimescapePodProcessEvents = 'timescape-pod-process-events',
}
