export enum StreamKind {
  Event = 'event-stream',
  Control = 'control-stream',
}

export type ReconnectState = {
  stream: StreamKind;
  attempt: number;
  lastError?: any;
  delay?: number;
};
