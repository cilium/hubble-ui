import { SharedParts } from './types';

export class MapAttributes {
  constructor(private readonly fns: SharedParts) {}

  public arrowsForegroundSelector() {
    return this.fns.sel('arrows-foreground');
  }
}
