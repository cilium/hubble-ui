export enum ConnectEventKind {
  Failed = 'failed',
  AttemptDelay = 'attempt-delay',
  Success = 'attempt-success',
  Disconnected = 'disconnected',
}

export class ConnectEvent {
  public static new(kind: ConnectEventKind) {
    return new ConnectEvent(kind);
  }

  public static newFailed() {
    return ConnectEvent.new(ConnectEventKind.Failed);
  }

  public static newAttemptDelay() {
    return ConnectEvent.new(ConnectEventKind.AttemptDelay);
  }

  public static newSuccess() {
    return ConnectEvent.new(ConnectEventKind.Success);
  }

  public static newDisconnected() {
    return ConnectEvent.new(ConnectEventKind.Disconnected);
  }

  public attempt?: number;
  public delay?: number;
  public error?: any;
  public isAllReconnected?: boolean;

  constructor(public kind: ConnectEventKind) {}

  public get isSuccess() {
    return this.kind === ConnectEventKind.Success;
  }

  public get isAttemptDelay() {
    return this.kind === ConnectEventKind.AttemptDelay;
  }

  public get isFailed() {
    return this.kind === ConnectEventKind.Failed;
  }

  public get isDisconnected() {
    return this.kind === ConnectEventKind.Disconnected;
  }

  public setAttempt(att: number): this {
    this.attempt = att;
    return this;
  }

  public setDelay(d: number): this {
    this.delay = d;
    return this;
  }

  public setError(err: any): this {
    this.error = err;
    return this;
  }

  public setAllReconnected(ar: boolean): this {
    this.isAllReconnected = ar;
    return this;
  }
}
