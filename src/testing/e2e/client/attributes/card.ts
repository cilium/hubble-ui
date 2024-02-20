import { SharedParts } from './types';

export class CardAttributes {
  public static readonly ROOT_CONTAINER_SEL = 'card-div-root';
  public static readonly VIS_CONTAINER_SEL = 'visible-cards';

  constructor(private readonly fns: SharedParts) {}

  public selector() {
    return this.fns.sel(CardAttributes.ROOT_CONTAINER_SEL);
  }

  public visibleContainer() {
    return this.fns.sel(CardAttributes.VIS_CONTAINER_SEL);
  }
}
