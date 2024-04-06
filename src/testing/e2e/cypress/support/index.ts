import './commands';

declare global {
  namespace Cypress {
    interface Chainable {
      query(attr: string): Chainable<JQuery<HTMLElement>>;
      queryLike(attr: string): Chainable<JQuery<HTMLElement>>;
      queryAttrs(attrs: object): Chainable<JQuery<HTMLElement>>;
      queryAttrKeys(attrs: string[]): Chainable<JQuery<HTMLElement>>;
      parentAttrs(attrs: object): Chainable<JQuery<HTMLElement>>;
      attrValue(attrName: string): Chainable<string | null>;
      inViewport(): Chainable<JQuery<HTMLElement>>;
    }
  }

  interface Window {
    debugTools: any;
  }
}
