import React from 'react';
import { Intent, OverlayToaster, OverlayToasterProps, IconName } from '@blueprintjs/core';

import {
  Notification,
  DismissAction,
  UpdateAction,
  ShowAction,
  DismissHandler,
} from '~/notifier/notification';
import { NotifierPosition } from '~/notifier/general';
import * as helpers from '~/notifier/helpers';
import { StatusEntry } from '~/ui/status-center';

import { StatusEntryMessage } from '~/components/StatusEntryMessage/StatusEntryMessage';

interface NotificationData {
  intent: Intent;
  message: React.ReactNode;
  timeout: number;
  icon: IconName;
}

type Options = Omit<Partial<NotificationData>, 'message'> & {
  key?: string;
};

type Actions = [ShowAction, DismissAction, UpdateAction];
type Message = React.ReactNode;

export interface Props {
  position?: NotifierPosition;
  maxNotifications?: number;
}

export class Notifier {
  public static readonly timeout = 5000;
  public static readonly maxNotificationsOnScreen = 5;

  public static prepareToasterProps(props: Props): OverlayToasterProps {
    const position = helpers.position(props.position ?? NotifierPosition.TopCenter);

    const maxToasts = props.maxNotifications ?? Notifier.maxNotificationsOnScreen;

    return { position, maxToasts };
  }

  private static optionsToData(opts: Options, message: Message): NotificationData {
    return {
      timeout: opts.timeout ?? Notifier.timeout,
      icon: opts.icon ?? 'info-sign',
      intent: opts.intent ?? Intent.PRIMARY,
      message,
    };
  }

  private toaster: OverlayToaster | null = null;
  private notificationsCache: Map<string, Notification> = new Map();

  public setBackend(toaster: OverlayToaster) {
    this.toaster = toaster;
  }

  public showStatusEntry(e: StatusEntry, wasPending = false) {
    const message = (
      <StatusEntryMessage
        entry={e}
        iconHidden={true}
        componentHidden={true}
        intentHidden={true}
        backgrounded={true}
      />
    );

    const notif = this.cached(e.key);
    if (notif != null) {
      const timeout =
        wasPending && !e.isPending ? Notifier.timeout : e.isPending ? 0 : Notifier.timeout;

      notif.update(message, timeout);

      return;
    }

    const opts: Options = {
      key: e.key || void 0,
      timeout: e.isPending || e.isPersistent ? 0 : Notifier.timeout,
    };

    if (e.isError || e.isCritical) {
      this.showError(message, opts);
    } else if (e.isWarning) {
      this.showWarning(message, opts);
    } else if (e.isSuccess) {
      this.showSuccess(message, opts);
    } else if (e.isInfo) {
      this.showInfo(message, opts);
    } else {
      this.showSimple(message, opts);
    }
  }

  public showSimple(message: Message, opts?: Options): Notification {
    return this.simple(message, opts).show()!;
  }

  public showInfo(message: Message, opts?: Options): Notification {
    return this.info(message, opts).show()!;
  }

  public showSuccess(message: Message, opts?: Options): Notification {
    return this.success(message, opts).show()!;
  }

  public showError(message: Message, opts?: Options): Notification {
    return this.error(message, opts).show()!;
  }

  public showWarning(message: Message, opts?: Options): Notification {
    return this.warning(message, opts).show()!;
  }

  // These methods dont call show() on newly created notification
  public simple(message: Message, opts?: Options): Notification {
    this.setupCheck();

    opts = this.ensureOptions(opts, Intent.NONE);
    return this.createNotification(message, opts);
  }

  public info(message: Message, opts?: Options): Notification {
    this.setupCheck();

    opts = this.ensureOptions(opts, Intent.PRIMARY);
    return this.createNotification(message, opts);
  }

  public success(message: Message, opts?: Options): Notification {
    this.setupCheck();

    opts = this.ensureOptions(opts, Intent.SUCCESS, 'tick-circle');
    return this.createNotification(message, opts);
  }

  public error(message: Message, opts?: Options): Notification {
    this.setupCheck();

    opts = this.ensureOptions(opts, Intent.DANGER, 'error');
    return this.createNotification(message, opts);
  }

  public warning(message: Message, opts?: Options): Notification {
    this.setupCheck();

    opts = this.ensureOptions(opts, Intent.WARNING, 'warning-sign');
    return this.createNotification(message, opts);
  }

  public cached(key?: string | null): Notification | null {
    return key ? this.notificationsCache.get(key) || null : null;
  }

  public hideBykeys(...keys: string[]) {
    keys.forEach(key => {
      const notif = this.cached(key);
      notif?.hide();
    });
  }

  public dismissAll() {
    this.setupCheck();
    this.toaster!.clear();
  }

  private createNotification(message: Message, opts: Options): Notification {
    if (opts.key != null) {
      const cached = this.notificationsCache.get(opts.key);
      if (cached != null) return cached;
    }

    const notificationData = Notifier.optionsToData(opts, message);
    const acts = this.createNotificationActions(notificationData);
    const notification = new Notification(...acts);

    if (opts.key != null) {
      this.notificationsCache.set(opts.key, notification);

      notification.onDismiss(() => {
        this.notificationsCache.delete(opts.key!);
      });
    }

    return notification;
  }

  private createNotificationActions(d: NotificationData): Actions {
    const intent = d.intent;
    const show: ShowAction = (dmHandler?: DismissHandler) => {
      return this.toaster!.show({ ...d, onDismiss: dmHandler });
    };

    const dismiss: DismissAction = (id: string) => {
      return this.toaster!.dismiss(id);
    };

    const update: UpdateAction = (key: string, message?: Message, timeout?: number) => {
      timeout = timeout ?? d.timeout;
      message = message ?? d.message;
      const icon = d.icon;

      this.toaster!.show({ message, intent, timeout, icon }, key);
    };

    return [show, dismiss, update];
  }

  private ensureOptions(
    opts?: Options,
    intent: Intent = Intent.PRIMARY,
    icon: IconName = 'info-sign',
  ): Options {
    if (opts == null) {
      return {
        intent,
        icon,
        key: void 0,
        timeout: Notifier.timeout,
      };
    }

    opts.intent = intent;
    opts.icon = icon;

    return opts;
  }

  private setupCheck() {
    if (this.toaster != null) return;

    throw new Error(`you must call notifier.setup() once before using it `);
  }
}
