import React from 'react';
import {
  Intent,
  IToaster,
  Toast,
  IToasterProps,
  IconName,
} from '@blueprintjs/core';

import {
  Notification,
  DismissAction,
  UpdateAction,
  ShowAction,
  DismissHandler,
} from '~/notifier/notification';
import { NotifierPosition } from '~/notifier/general';
import * as helpers from '~/notifier/helpers';

interface NotificationData {
  intent: Intent;
  message: React.ReactNode;
  timeout: number;
  icon: IconName;
}

type Actions = [ShowAction, DismissAction, UpdateAction];
type Message = React.ReactNode;

export interface Props {
  position?: NotifierPosition;
  maxNotifications?: number;
}

export class Notifier {
  public static readonly timeout = 5000;
  public static readonly maxNotificationsOnScreen = 5;

  public static prepareToasterProps(props: Props): IToasterProps {
    const position = helpers.position(
      props.position ?? NotifierPosition.TopCenter,
    );

    const maxToasts =
      props.maxNotifications ?? Notifier.maxNotificationsOnScreen;

    return { position, maxToasts };
  }

  private toaster: IToaster | null = null;

  public setBackend(toaster: IToaster) {
    this.toaster = toaster;
  }

  public showSimple(
    message: Message,
    timeout?: number,
    icon?: IconName,
  ): Notification {
    return this.simple(message, timeout, icon).show()!;
  }

  public showInfo(
    message: Message,
    timeout?: number,
    icon?: IconName,
  ): Notification {
    return this.info(message, timeout, icon).show()!;
  }

  public showSuccess(
    message: Message,
    timeout?: number,
    icon?: IconName,
  ): Notification {
    return this.success(message, timeout, icon).show()!;
  }

  public showError(
    message: Message,
    timeout?: number,
    icon?: IconName,
  ): Notification {
    return this.error(message, timeout, icon).show()!;
  }

  public showWarning(
    message: Message,
    timeout?: number,
    icon?: IconName,
  ): Notification {
    return this.warning(message, timeout, icon).show()!;
  }

  // These methods dont call show() on newly created notification
  public simple(
    message: Message,
    timeout: number = Notifier.timeout,
    icon: IconName = 'info-sign',
  ): Notification {
    this.setupCheck();

    return this.createNotification(Intent.NONE, message, timeout, icon);
  }

  public info(
    message: Message,
    timeout: number = Notifier.timeout,
    icon: IconName = 'info-sign',
  ): Notification {
    this.setupCheck();

    return this.createNotification(Intent.PRIMARY, message, timeout, icon);
  }

  public success(
    message: Message,
    timeout: number = Notifier.timeout,
    icon: IconName = 'tick-circle',
  ): Notification {
    this.setupCheck();

    return this.createNotification(Intent.SUCCESS, message, timeout, icon);
  }

  public error(
    message: Message,
    timeout: number = Notifier.timeout,
    icon: IconName = 'error',
  ): Notification {
    this.setupCheck();

    return this.createNotification(Intent.DANGER, message, timeout, icon);
  }

  public warning(
    message: Message,
    timeout: number = Notifier.timeout,
    icon: IconName = 'warning-sign',
  ): Notification {
    this.setupCheck();

    return this.createNotification(Intent.WARNING, message, timeout, icon);
  }

  public dismissAll() {
    this.setupCheck();
    this.toaster!.clear();
  }

  private createNotification(
    intent: Intent,
    message: Message,
    timeout: number,
    icon: IconName,
  ): Notification {
    const notificationData = { intent, message, timeout, icon };
    const acts = this.createNotificationActions(
      notificationData as NotificationData,
    );

    return new Notification(...acts);
  }

  private createNotificationActions(d: NotificationData): Actions {
    const intent = d.intent;
    const show: ShowAction = (dmHandler?: DismissHandler) => {
      return this.toaster!.show({ ...d, onDismiss: dmHandler });
    };

    const dismiss: DismissAction = (id: string) => {
      return this.toaster!.dismiss(id);
    };

    const update: UpdateAction = (
      id: string,
      message: Message,
      timeout?: number,
    ) => {
      timeout = timeout ?? d.timeout;
      this.toaster!.show({ message, intent, timeout }, id);
    };

    return [show, dismiss, update];
  }

  private setupCheck() {
    if (this.toaster != null) return;

    throw new Error(`you must call notifier.setup() once before using it `);
  }
}
