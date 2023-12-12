import { makeAutoObservable, makeObservable } from 'mobx';
import { GrpcWrappedError } from '~/api/grpc/error';

import { Notification } from '~/domain/notifications';
import { NamespaceDescriptor } from '~/domain/namespaces';
import { CustomError } from '~/api/customprotocol-core/errors';

import { Component, Intent, StatusEntry, Keys } from '~/ui/status-center';
import { StatusEntryBuilder } from '~/ui/status-center/status-entry-builder';
import { EventEmitter } from '~/utils/emitter';

export type StatusCenterOptions = {
  maxNotifications: number;
};

export enum Event {
  NewEntry = 'new-entry',
}

export type StatusEntryFlags = {
  isUpdated: boolean;
  wasPending: boolean;
};

export type NewEntryEvent = {
  entry: StatusEntry;
  entryFlags: StatusEntryFlags;
};

export type Handlers = {
  [Event.NewEntry]: (e: NewEntryEvent) => void;
};

// NOTE: This store is intended to be a place where latest errors can be
// NOTE: collected and later be observed by some UI component, who would be
// NOTE: responsible to notify (or not) a user about the current state of the UI.
// NOTE: This all should prevent intrusive Notifier red banners from being poped.
export class StatusCenter extends EventEmitter<Handlers> {
  public notifications: StatusEntry[] = [];

  // NOTE: Stores a ref to StatusEntry which was at the top of list when last
  // NOTE: time open.
  private _seenTop: StatusEntry | null = null;

  // NOTE: { entry.hash -> entry }
  private _pendingEntries: Map<string, StatusEntry> = new Map();
  private _keyedEntries: Map<string, StatusEntry> = new Map();

  constructor(private opts: StatusCenterOptions) {
    super(true);

    makeObservable(this);
  }

  public onNewEntry(fn: Handlers[Event.NewEntry]): this {
    this.on(Event.NewEntry, fn);
    return this;
  }

  public get criticalPreview(): StatusEntry | null {
    const entries = this.notifications;
    const n = entries.length;

    if (n === 0) return null;

    // NOTE: We are going to show critical pending entry until it is done, no
    // NOTE: matter if it is seen or not.
    for (const [_, pendingEntry] of this._pendingEntries) {
      if (pendingEntry.isCritical || pendingEntry.isError) return pendingEntry;
    }

    // NOTE: Move on until the already read entry is encountered
    for (let i = n - 1; i >= 0 && this._seenTop !== entries[i]; --i) {
      const entry = entries[i];
      if (entry.isCritical) return entry;
    }

    return null;
  }

  public get pendingEntriesList(): StatusEntry[] {
    return Array.from(this._pendingEntries.values()).reverse();
  }

  public get nonPendingEntriesList(): StatusEntry[] {
    return this.list.filter(e => {
      return !this.pendingEntriesMap.has(e.key || e.hash);
    });
  }

  public get pendingEntriesMap(): Map<string, StatusEntry> {
    return new Map(this._pendingEntries);
  }

  public get list(): StatusEntry[] {
    // TODO: replace this with something efficient
    return this.notifications.slice().reverse();
  }

  public get hasUnread(): boolean {
    const entries = this.notifications;
    const n = entries.length;
    if (n === 0) return false;

    return this._seenTop !== entries[n - 1];
  }

  public setSeen() {
    this._seenTop = this.list.find(e => !e.isPersistent) ?? null;
  }

  public getEntryByKey(key: string): StatusEntry | undefined {
    return this._keyedEntries.get(key);
  }

  public pushEntry(entry: StatusEntry) {
    // NOTE: Step 1: update entry's pending status
    const wasPending = this.applyPendingStatus(entry);

    // NOTE: Step 2: update entry if it is keyed or it is matched to the last
    // NOTE: pushed entry (i e if the same entry is on top of entries list)
    const isUpdated = this.tryUpdateExistingEntry(entry);

    // NOTE: Emit the info about this entry to outside so that UILayer could
    // properly control Notifier
    this.emit(Event.NewEntry, {
      entry,
      entryFlags: {
        wasPending,
        isUpdated,
      },
    });

    // NOTE: Step 3: complete all the entries which are referenced by entry.
    // NOTE: This will also complete all the entries that are referenced by
    // NOTE: entry we are going to complete. It means that all entries in this
    // NOTE: chain will be completed.
    const werePending = this.completeEntryDescendants(entry);

    // NOTE: Step 4: move all entries that were pending entries to the top
    // NOTE: of the list. Just for a better log comprehension.
    werePending.forEach(entry => {
      this.moveExistingEntryToTop(entry);
    });

    // NOTE: Step 5: in case when no such entry currently exists and nothing
    // NOTE: has been updated, we can create a new entry in the list
    if (isUpdated) return;
    this.pushLimited(entry);
  }

  public push(notification: Notification) {
    // NOTE: This case is handled by Controls data-layer
    if (notification.status != null) return;

    this.pushUINotification(notification);
  }

  public pushUINotification(n: Notification) {
    const entry = this.entryFromNotification(n).build();
    this.pushEntry(entry);
  }

  public pushError(
    err: Error,
    title?: string,
    humanDetails?: string,
    component?: Component | string,
  ) {
    console.log(err);
    const entry = this.builderFromError(err, title, humanDetails, component).build();

    return this.pushEntry(entry);
  }

  public pushServiceMapLogsUploadError(err: Error) {
    const entry = StatusEntryBuilder.new()
      .setIntent(Intent.Error)
      .setTitle('Failed to upload logs file')
      .setDetails(err.message)
      .setUnderlyingError(err)
      .setComponent(Component.HubbleUI)
      .build();

    this.pushEntry(entry);
  }

  public pushControlStreamErrors(errs: CustomError[]) {
    errs.forEach(err => {
      this.pushControlStreamError(err);
    });
  }

  public pushControlStreamError(err: CustomError) {
    const entry = StatusEntryBuilder.new()
      .setIntent(Intent.Critical)
      .setTitle('Server error occured')
      .setComponent(Component.HubbleUI)
      .setDetails(err.toString())
      .build();

    return this.pushEntry(entry);
  }

  public pushStreamsReconnecting() {
    const entry = StatusEntryBuilder.new()
      .setIntent(Intent.Error)
      .setTitle('Data streams are reconnecting...')
      .setComponent(Component.HubbleUI)
      .setPending(true)
      .setKey(Keys.DataStreamsReconnecting)
      .build();

    return this.pushEntry(entry);
  }

  public pushStreamsReconnectingDelay(delayMs: number) {
    // NOTE: We are goint to use existing Keys.DataStreamsReconnecting entry
    // NOTE: not to let entire notifications log to grow much
    const existingEntry = this.getEntryByKey(Keys.DataStreamsReconnecting);
    if (existingEntry == null || !existingEntry.isPending) return;

    const delaySeconds = (delayMs / 1000).toFixed(1);
    let details = `Next attempt in ${delaySeconds}s. `;
    if (existingEntry.underlyingError != null) {
      const errDetails = this.formatErrorDetails(existingEntry.underlyingError);
      details += `Last error details: ${errDetails}`;
    }

    // NOTE: Mutate existing entry right in place
    const updated = StatusEntryBuilder.new(existingEntry).setDetails(details).build();

    this.pushEntry(updated);
  }

  public pushStreamsReconnectFailed(err: Error) {
    const existingEntry = this.getEntryByKey(Keys.DataStreamsReconnecting);
    if (existingEntry == null || !existingEntry.isPending) return;

    const details =
      err == null ? existingEntry.details : `Last error details: ${this.formatErrorDetails(err)}`;

    const updated = StatusEntryBuilder.new(existingEntry)
      .setDetails(details)
      .setUnderlyingError(err)
      .setCardinalityPrefix('Attempt: ')
      .incCardinality()
      .build();

    this.pushEntry(updated);
  }

  public pushStreamsReconnected() {
    const existingEntry = this.getEntryByKey(Keys.DataStreamsReconnecting);
    const nAttempts = existingEntry?.cardinality || 1;

    const reconnectedEntry = StatusEntryBuilder.new()
      .setIntent(Intent.Success)
      .setTitle('Data streams are reconnected.')
      .setDetails(`Data streams were successfully reconnected after ${nAttempts} attempts.`)
      .setKeysToComplete([Keys.DataStreamsReconnecting])
      .build();

    this.pushEntry(reconnectedEntry);
  }

  public pushNamespaceIsNotObserved(ns: string) {
    const entry = StatusEntryBuilder.new()
      .setIntent(Intent.Info)
      .setTitle(`Namespace "${ns}" is still not observed`)
      .setDetails(`Hubble UI is watching for this namespace`)
      .setComponent(Component.HubbleUI)
      .setKey(`ns-${ns}-not-observed`)
      .build();

    console.log('namespace not observed entry: ', entry);
    this.pushEntry(entry);
  }

  public pushNamespaceIsObserved(ns: NamespaceDescriptor) {
    // NOTE: We are going to notify the user if previously we showed the
    // "not observed" notification
    const notObservedKey = `ns-${ns.namespace}-not-observed`;
    const notObserved = this.getEntryByKey(notObservedKey);
    if (notObserved == null) return;

    const entry = StatusEntryBuilder.new()
      .setIntent(Intent.Info)
      .setTitle(`Namespace "${ns.namespace} is appeared"`)
      .setDetails(`Hubble UI is capturing the namespace activity`)
      .setKeysToComplete([notObservedKey])
      .build();

    this.pushEntry(entry);
  }

  public pushFetchUISettingsError(err: Error) {
    const grpcErr = GrpcWrappedError.fromError(err);
    const entry = StatusEntryBuilder.new()
      .setTitle('Failed to load UI settings')
      .setUnderlyingError(err);

    if (grpcErr != null) {
      this.fillEntryWithGrpcError(entry, grpcErr);
    } else {
      entry.setDetails(err.message);
    }

    return this.pushEntry(entry.setIntent(Intent.Critical).build());
  }

  private applyPendingStatus(entry: StatusEntry): boolean {
    const key = entry.key || entry.hash;
    const wasPending = this._pendingEntries.has(key);

    if (entry.isPending) {
      this._pendingEntries.set(key, entry);
    } else {
      this._pendingEntries.delete(key);
    }

    return wasPending;
  }

  private tryUpdateExistingEntry(entry: StatusEntry): boolean {
    let existingUpdated = false;

    // NOTE: If it is non-keyed, the only way we can try to update it is by
    // NOTE: checking whether it is last pushed entry
    if (entry.key == null) {
      const nEntries = this.notifications.length;
      const topEntry = this.notifications[nEntries - 1];

      if (nEntries > 0 && topEntry.hash === entry.hash) {
        topEntry.occuredAgain(entry);
        existingUpdated = true;
      }

      return existingUpdated;
    }

    // NOTE: Now, lets make it on non-keyed case
    const existing = this._keyedEntries.get(entry.key);
    if (!existing) {
      // NOTE: Okay, there is no such keyed entry, let's remember current one
      this._keyedEntries.set(entry.key, entry);
      console.log(`remembering keyed entry: `, entry.key, entry);
      return false;
    }

    existing.occuredAgain(entry);
    return true;
  }

  private moveExistingEntryToTop(entry: StatusEntry) {
    // NOTE: This rude O(n) search is justified by the length of entry list and
    // NOTE: rareness of such movements (i e when entry does transition from
    // NOTE: pending to non-pending)
    const currentIdx = this.notifications.findIndex(e => {
      return e.hash === entry.hash || (entry.key != null && e.key === entry.key);
    });

    if (currentIdx !== -1) {
      const [removed] = this.notifications.splice(currentIdx, 1);

      this.pushLimited(removed);
    }
  }

  private completeEntryDescendants(entry: StatusEntry): StatusEntry[] {
    const keys = Array.from(entry.keysToComplete ?? []);
    const pendingEntries: StatusEntry[] = [];

    while (keys.length > 0) {
      const key = keys.pop();
      if (key == null) continue;

      const desc = this.getEntryByKey(key);
      if (desc == null) continue;

      if (desc.isPending) pendingEntries.push(desc);
      desc.isPending = false;
      this.applyPendingStatus(desc);

      if (desc.key != null) {
        this._keyedEntries.delete(desc.key);
        desc.key = null;
      }

      if (desc.keysToComplete != null) {
        keys.push(...desc.keysToComplete);
      }
    }

    return pendingEntries;
  }

  // NOTE: This means that GrpcError can totally drive how StatusEntry will be
  // NOTE: constructed.
  private builderFromGrpcError(err: GrpcWrappedError): StatusEntryBuilder {
    return this.fillEntryWithGrpcError(StatusEntryBuilder.new(), err);
  }

  private builderFromError(
    err: Error,
    title?: string,
    humanDetails?: string,
    component?: Component | string,
  ): StatusEntryBuilder {
    if (err instanceof GrpcWrappedError) {
      return this.builderFromGrpcError(err);
    }

    const parsedGrpcErr = GrpcWrappedError.fromError(err);
    if (parsedGrpcErr != null) {
      return this.builderFromGrpcError(parsedGrpcErr);
    }

    return StatusEntryBuilder.new()
      .setIntent(Intent.Error)
      .setTitle(title ?? 'Unrecognized error occurred')
      .setDetails(humanDetails ?? err.message)
      .setComponent(component ?? Component.HubbleUI)
      .setUnderlyingError(err);
  }

  private fillEntryWithGrpcError(
    builder: StatusEntryBuilder,
    err: GrpcWrappedError,
  ): StatusEntryBuilder {
    const intent =
      StatusEntry.parseIntent(err.metadata['intent']?.[0]) ?? err.isOk ? Intent.Info : Intent.Error;

    return builder
      .setIntent(intent)
      .setTitle(builder.statusEntry.title || err.metadata['title']?.[0] || 'GRPC error occured')
      .setDetails(builder.statusEntry.details || this.formatErrorDetails(err))
      .setComponent(err.metadata['component']?.[0] || Component.HubbleUI)
      .setUnderlyingError(err);
  }

  private formatErrorDetails(err: Error): string {
    if (err instanceof GrpcWrappedError) {
      if (!!err.message?.length) return err.message;

      // TODO: Consider to render grpc metadata somehow, maybe in EventLogEntry
      return `GRPC details: code: ${err.code}, message: ${err.message}.`;
    }

    return err.message;
  }

  private entryFromNotification(n: Notification): StatusEntryBuilder {
    console.log('notification: ', n);
    const isCritical = n.isK8sUnavailable;
    const isError = n.isRelayReconnecting;
    const isWarning = !!n.noPermission;
    const isSuccess = !!n.connState?.relayConnected || !!n.connState?.k8sConnected;

    // NOTE: Info matches the case of n.noActivity
    const intent = isCritical
      ? Intent.Critical
      : isError
        ? Intent.Error
        : isWarning
          ? Intent.Warning
          : isSuccess
            ? Intent.Success
            : Intent.Info;

    const msg = n.isK8sUnavailable
      ? 'Connection to Kubernetes has been lost. Check your deployment and ' + 'refresh this page.'
      : n.isK8sConnected
        ? 'Connection to Kubernetes has been established.'
        : n.isRelayReconnecting
          ? 'Connection to hubble-relay has been lost. Reconnecting...'
          : n.isRelayConnected
            ? 'Connection to hubble-relay has been established.'
            : n.isNoActivityInNamespace
              ? 'There are no pods in selected namespace'
              : n.isNoPermission
                ? `You have no permissions to watch over "${n.noPermission?.resource}" resource`
                : 'Unknown notification: ' + JSON.stringify(n);

    const err = n.noPermission ? new Error(n.noPermission.error) : null;
    const component = n.isRelayRelated
      ? Component.HubbleRelay
      : n.isClusterRelated
        ? Component.Cluster
        : n.isNoActivityInNamespace
          ? Component.HubbleUI
          : Component.HubbleUI;

    const isPending = n.isRelayReconnecting;
    const key = n.isRelayReconnecting ? Keys.ReconnectingToHubbleRelay : void 0;

    const keysToComplete = [];
    if (n.isRelayConnected) {
      keysToComplete.push(Keys.ReconnectingToHubbleRelay);
    }

    return StatusEntryBuilder.new()
      .setIntent(intent)
      .setTitle(msg)
      .setPending(isPending)
      .setKey(key)
      .setKeysToComplete(keysToComplete)
      .setUnderlyingError(err)
      .setComponent(component);
  }

  private pushLimited(n: StatusEntry) {
    if (this.notifications.length + 1 > this.opts.maxNotifications) {
      const [removed] = this.notifications.splice(0, 1);

      if (this._seenTop == removed) {
        this._seenTop = null;
      }

      if (removed.key != null) {
        this._keyedEntries.delete(removed.key);
      }

      this._pendingEntries.delete(removed.hash);
    }

    this.notifications.push(n);
  }
}
