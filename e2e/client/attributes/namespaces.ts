import { AttrsFn, SelectorFn } from './types';

export class NSAttributes {
  public static readonly NS_LIST_SELECTOR = 'ns-list';

  constructor(
    private readonly sel: SelectorFn,
    private readonly attrs: AttrsFn,
  ) { }

  public listSelector() {
    return this.sel(NSAttributes.NS_LIST_SELECTOR);
  }

  public availability(relay: boolean, timescape: boolean) {
    return this.attrs({
      availability: relay && timescape ? `rt` : relay ? 'r' : 't',
    });
  }
}
