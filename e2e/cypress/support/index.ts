import './commands';

import { QueryOpts } from './commands';

declare global {
  namespace Cypress {
    interface Chainable {
      query(attr: string): Chainable<JQuery<HTMLElement>>;
      queryLike(attr: string): Chainable<JQuery<HTMLElement>>;
      queryAttrs(attrs: object): Chainable<JQuery<HTMLElement>>;
      parentAttrs(attrs: object): Chainable<JQuery<HTMLElement>>;
      inViewport(): Chainable<JQuery<HTMLElement>>;
    }
  }
}
