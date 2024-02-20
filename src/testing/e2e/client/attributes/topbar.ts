import { SharedParts } from './types';

export class TopbarAttributes {
  public static readonly ROOT_CONTAINER_SEL = 'topbar';

  constructor(private readonly fns: SharedParts) {}

  public selector() {
    return this.fns.sel(TopbarAttributes.ROOT_CONTAINER_SEL);
  }
}
