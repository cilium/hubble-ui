import { AttrsFn, SelectorFn, SharedParts } from './types';

import { NSAttributes } from './namespaces';
import { CardAttributes } from './card';
import { ServiceMapAttributes } from './service-map';
import { MapAttributes } from './map';
import { TopbarAttributes } from './topbar';

export class Attributes {
  public readonly ns: NSAttributes;
  public readonly topbar: TopbarAttributes;
  public readonly serviceMap: ServiceMapAttributes;
  public readonly card: CardAttributes;
  public readonly map: MapAttributes;

  public isEnabled: boolean = true;
  public dataAttrPrefix: string;
  public dataSelPrefix: string;

  constructor(enabled: boolean, dataAttrPrefix: string, dataSelPrefix: string) {
    this.isEnabled = enabled;
    this.dataAttrPrefix = dataAttrPrefix;
    this.dataSelPrefix = dataSelPrefix;

    this.ns = new NSAttributes(this.shared);
    this.topbar = new TopbarAttributes(this.shared);
    this.card = new CardAttributes(this.shared);
    this.serviceMap = new ServiceMapAttributes(this.shared);
    this.map = new MapAttributes(this.shared);
  }

  public setEnabled(e: boolean): this {
    console.log(`e2e attibutes setEnabled:`, e);
    this.isEnabled = e;
    return this;
  }

  public attrNameFn(name: string): string {
    const prefix = `data-${this.dataAttrPrefix}`;
    return name.startsWith(prefix) ? name : `${prefix}-${name}`;
  }

  public selNameFn(name: string): string {
    const prefix = `data-${this.dataSelPrefix}`;
    return name.startsWith(prefix) ? name : `${prefix}-${name}`;
  }

  public nullOr<T, A extends unknown[]>(fn: (...args: A) => T): (...args: A) => T | null {
    if (!this.isEnabled) return () => null;

    return fn;
  }

  public get attrsFn(): AttrsFn {
    // NOTE: `obj` should contains a plain object with keys you want to have
    // on DOM element. These keys will be transformed into data attributes.
    return (obj: any): any => {
      if (!this.isEnabled) return {};

      return Object.keys(obj).reduce((updatedObj, key) => {
        const updatedKey = this.attrNameFn(key);

        updatedObj[updatedKey] = obj[key];
        return updatedObj;
      }, {} as any);
    };
  }

  public get selectorFn(): SelectorFn {
    return (sel: string): any => {
      if (!this.isEnabled) return {};

      const key = `data-${this.dataSelPrefix}`;
      return { [key]: sel };
    };
  }

  public get shared(): SharedParts {
    return {
      attrs: this.attrsFn,
      sel: this.selectorFn,
      attrName: n => this.attrNameFn(n),
    };
  }
}

// TODO: It's not right to have it as global instance
export const attributes = new Attributes(true, 'test', 'test');
