import { DataLayer } from '~/data-layer';
import { Store } from '~/store';
import { UILayer } from '~/ui-layer';
import { Router } from '~/router';
import { Environment } from '~/environment';

import { EventEmitter } from '~/utils/emitter';

export type RenderFn<R> = (e: Element, app: Application) => R;

export enum Event {
  BeforeMount = 'before-mount',
  Mounted = 'mounted',
}

export type Handlers = {
  [Event.Mounted]: (app: Application) => void;
  [Event.BeforeMount]: (app: Application) => void;
};

export class Application<RenderResult = any> extends EventEmitter<Handlers> {
  public constructor(
    public environment: Environment,
    public router: Router,
    public store: Store,
    public dataLayer: DataLayer,
    public uiLayer: UILayer,
    private renderFn: RenderFn<RenderResult>,
  ) {
    super(true);
  }

  public get ui() {
    return this.uiLayer;
  }

  public onMounted(fn: Handlers[Event.Mounted]): this {
    this.on(Event.Mounted, fn);
    return this;
  }

  public onBeforeMount(fn: Handlers[Event.BeforeMount]): this {
    this.on(Event.BeforeMount, fn);
    return this;
  }

  public mount(dst: string | Element): RenderResult {
    const elem = dst instanceof Element ? dst : document.querySelector(dst);

    if (elem == null) {
      const elemStr = dst instanceof Element ? ' ' : ` "${dst}" `;
      throw new Error(
        `Failed to find element${elemStr}to mount the application. Try
        to refresh the page and if this error repeats please write directly to
        dima@isovalent.com, renat@isovalent.com or stacy.kim@isovalent.com.`,
      );
    }

    this.emit(Event.BeforeMount, this);
    this.applyTheme();
    const result = this.renderFn(elem, this);
    this.emit(Event.Mounted, this);

    return result;
  }

  // NOTE: Put part of theme controlling here since we only support light theme
  // for now.
  private applyTheme() {
    const html = document.documentElement;
    const body = document.querySelector('body');
    if (!body) {
      console.error(`failed to query <body> element on the page, theme is not applied`);
      return;
    }

    const themeClass = 'light';

    html.classList.add(`${themeClass}`);
    body.classList.add(`bp4-${themeClass}`);
  }
}
