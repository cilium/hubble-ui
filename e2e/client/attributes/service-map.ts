import { AttrsFn, SelectorFn } from './types';

export class ServiceMapAttributes {
  constructor(
    private readonly sel: SelectorFn,
    private readonly attrs: AttrsFn,
  ) { }

  public cardHeader(caption: string) {
    return this.attrs({
      cardHeader: caption,
    });
  }
}
