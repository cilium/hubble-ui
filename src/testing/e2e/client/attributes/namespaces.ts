import { SharedParts } from './types';

export class NSAttributes {
  public static readonly NS_LIST_SELECTOR = 'ns-list';

  constructor(private readonly fns: SharedParts) {}

  public listSelector() {
    return this.fns.sel(NSAttributes.NS_LIST_SELECTOR);
  }

  public entry(ns?: string) {
    if (!ns) return {};

    return this.fns.attrs({
      availability: 'r',
      name: ns,
    });
  }
}
