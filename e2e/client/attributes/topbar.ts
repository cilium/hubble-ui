import { AttrsFn, SelectorFn } from './types';

export class TopbarAttributes {
  public static readonly ROOT_CONTAINER_SEL = 'topbar';

  constructor(
    private readonly sel: SelectorFn,
    private readonly attrs: AttrsFn,
  ) { }

  public selector() {
    return this.sel(TopbarAttributes.ROOT_CONTAINER_SEL);
  }
}
