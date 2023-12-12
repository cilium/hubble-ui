import { AttrsFn, SelectorFn } from './types';

import { NSAttributes } from './namespaces';
import { TopbarAttributes } from './topbar';
import { CardAttributes } from './card';
import { ServiceMapAttributes } from './service-map';

export class Attributes {
  public readonly ns: NSAttributes;
  public readonly topbar: TopbarAttributes;
  public readonly serviceMap: ServiceMapAttributes;
  public readonly card: CardAttributes;

  public isEnabled: boolean = true;
  public dataAttrPrefix: string;
  public dataSelPrefix: string;

  constructor(enabled: boolean, dataAttrPrefix: string, dataSelPrefix: string) {
    this.isEnabled = enabled;
    this.dataAttrPrefix = dataAttrPrefix;
    this.dataSelPrefix = dataSelPrefix;

    this.ns = new NSAttributes(this.selectorFn, this.attrsFn);
    this.topbar = new TopbarAttributes(this.selectorFn, this.attrsFn);
    this.card = new CardAttributes(this.selectorFn, this.attrsFn);
    this.serviceMap = new ServiceMapAttributes(this.selectorFn, this.attrsFn);
  }

  public setEnabled(e: boolean): this {
    console.log(`setEnabled:`, e);
    this.isEnabled = e;
    return this;
  }

  public get attrsFn(): AttrsFn {
    return (obj: any): any => {
      if (!this.isEnabled) return {};

      const updatedObj: any = {};
      Object.keys(obj).forEach(key => {
        const updatedKey = `data-${this.dataAttrPrefix}-${key}`;

        updatedObj[updatedKey] = obj[key];
      });

      return updatedObj;
    };
  }

  public get selectorFn(): SelectorFn {
    return (sel: string): any => {
      if (!this.isEnabled) return {};

      const key = `data-${this.dataSelPrefix}`;
      return { [key]: sel };
    };
  }
}

export const attributes = new Attributes(true, 'test', 'test');
