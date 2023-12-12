import { makeAutoObservable } from 'mobx';

export enum Intent {
  Info = 'info',
  Success = 'success',
  Debug = 'debug',
  Warning = 'warning',
  Error = 'error',
  Critical = 'critical',
}

const intentValues = new Set(Object.values(Intent));

export enum Keys {
  DataStreamsReconnecting = 'data-streams-reconnecting',
  ReconnectingToHubbleRelay = 'reconnecting-to-hubble-relay',
  ReconnectedToHubbleRelay = 'reconnected-to-hubble-relay',
}

// NOTE: Well, this is basically a human label denoting regarding what an entry
// NOTE: was generated.
export enum Component {
  HubbleUI = 'hubble-ui',
  HubbleRelay = 'hubble-relay',
  Cluster = 'cluster',
}

export class StatusEntry {
  private _hash: string;

  public intent: Intent;
  public title: string;
  public details?: string | null;
  public component?: string | null;
  public isPersistent?: boolean | null;

  // NOTE: isPending denotes that this StatusEntry is continueing to evolve
  public isPending: boolean;

  // NOTE: Cardinality is amount of same entries generated in a row
  public cardinality: number;
  public cardinalityPrefix?: string;
  public underlyingError?: Error | null;

  // NOTE: Key is a string thay uniquely identifies StatusEntry in StatusCenter.
  // NOTE: You have to set this if you want duplicated entries to be squashed.
  // NOTE: Squashing is basically incrementing cardinality and leaving only one
  // NOTE: instance of StatusEntry in a StatusCenter log.
  public key?: string | null;

  // NOTE: Applying an entry with non-empty keysToComplete keys set should
  // NOTE: completes entries with such keys. To complete is to make it
  // NOTE: non-pending.
  public keysToComplete?: Set<string>;
  public occuredAt: Date;

  public static empty(): StatusEntry {
    return new StatusEntry(Intent.Debug, '');
  }

  public static parseIntent(maybeIntent?: string): Intent | null {
    if (!maybeIntent) return null;
    if (intentValues.has(maybeIntent as any)) return maybeIntent as Intent;
    return null;
  }

  constructor(
    int: Intent,
    title: string,
    component?: string | null,
    err?: Error | null,
    key?: string | null,
    keysToComplete?: Set<string>,
  ) {
    this.intent = int;
    this.title = title;
    this.component = component || Component.HubbleUI;
    this.underlyingError = err;
    this.cardinality = 1;
    this.key = key;
    this.isPending = false;
    this.isPersistent = false;
    this.keysToComplete = keysToComplete;

    this.occuredAt = new Date();
    this._hash = Math.random().toString(36).slice(2);

    makeAutoObservable(this, void 0, {
      autoBind: true,
    });
  }

  public get hash(): string {
    return this._hash;
  }

  public get isCritical() {
    return this.intent === Intent.Critical;
  }

  public get isError() {
    return this.intent === Intent.Error;
  }

  public get isWarning() {
    return this.intent === Intent.Warning;
  }

  public get isSuccess() {
    return this.intent === Intent.Success;
  }

  public get isInfo() {
    return this.intent === Intent.Info;
  }

  public get isDebug() {
    return this.intent === Intent.Debug;
  }

  // NOTE: Call this method when the same event occured multiple times
  public occuredAgain(entry: StatusEntry) {
    this.title = entry.title;
    this.intent = entry.intent;
    this.component = entry.component;
    this.details = entry.details;
    this.cardinality = entry.cardinality;
    this.cardinalityPrefix = entry.cardinalityPrefix;
    this.isPending = entry.isPending;
    this.occuredAt = entry.occuredAt;
    this.key = entry.key;
    // TODO: It's probably worth to accumulate such errors in array
    this.underlyingError = entry.underlyingError;
  }
}
