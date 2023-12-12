import React from 'react';

export type DismissAction = (id: string) => void;
export type UpdateAction = (id: string, message: React.ReactNode, timeout?: number) => void;
export type ShowAction = (dismissHandler?: DismissHandler) => string;

export type DismissHandler = (timeouted: boolean) => void;

export class Notification {
  private isDismissed: boolean;
  private dismissHandlers: DismissHandler[];
  private notificationId: string | null;

  private dismissAction: DismissAction;
  private updateAction: UpdateAction;
  private showAction: ShowAction;

  constructor(show: ShowAction, dismiss: DismissAction, update: UpdateAction) {
    this.notificationId = null;
    this.isDismissed = false;
    this.dismissHandlers = [];

    this.showAction = show;
    this.updateAction = update;
    this.dismissAction = dismiss;
  }

  public show(): Notification | null {
    if (this.dismissed) return null;
    if (this.notificationId != null) return this;

    this.notificationId = this.showAction((timeouted: boolean) => {
      this.runOnDismiss(timeouted);
    });

    return this;
  }

  public hide() {
    return this.dismiss();
  }

  public dismiss() {
    if (this.inactive) return;

    this.dismissAction(this.notificationId!);
    this.isDismissed = true;
  }

  public onDismiss(handler: DismissHandler) {
    this.dismissHandlers.push(handler);
  }

  public update(message: React.ReactNode, timeout?: number): Notification | null {
    if (this.inactive) return null;

    this.updateAction(this.notificationId!, message, timeout);

    return this;
  }

  private runOnDismiss(timeouted: boolean) {
    const handlers = this.dismissHandlers;
    this.dismissHandlers = [];

    handlers.forEach(handler => {
      handler(timeouted);
    });
  }

  public get dismissed() {
    return this.isDismissed;
  }

  public get id(): string | null {
    return this.notificationId;
  }

  public get isActive(): boolean {
    return !this.dismissed && this.notificationId != null;
  }

  private get inactive(): boolean {
    return this.dismissed || this.notificationId == null;
  }
}
