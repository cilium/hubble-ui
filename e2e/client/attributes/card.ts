import { AttrsFn, SelectorFn } from './types';

export class CardAttributes {
  public static readonly ROOT_CONTAINER_SEL = 'card-div';
  public static readonly VIS_CONTAINER_SEL = 'visible-cards';

  constructor(
    private readonly sel: SelectorFn,
    private readonly attrs: AttrsFn,
  ) { }

  public selector() {
    return this.sel(CardAttributes.ROOT_CONTAINER_SEL);
  }

  public visibleContainer() {
    return this.sel(CardAttributes.VIS_CONTAINER_SEL);
  }
}
