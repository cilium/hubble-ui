import './commands';

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Get one or more DOM elements for which test attribute matches the value passed. The querying behavior of this command matches exactly how $(…) works in jQuery.
       *
       * @example
       * // matches <div data-test="test-id" />
       * cy.query("test-id");
       */
      query(testId: string): Chainable<JQuery<HTMLElement>>;
      /**
       * Get one or more DOM elements for which any test attributes matches the value passed.
       *
       * @see {@link Cypress.query}
       *
       * @example
       * // matches <div data-test-visibility="visible" />
       * // matches <div data-test-status="visible" />
       * cy.queryLike("visible");
       */
      queryLike(testId: string): Chainable<JQuery<HTMLElement>>;
      /**
       * Get on or more DOM elements that provided test attributes match their values.
       *
       * @example
       * // matches <div data-test-visibility="visible" data-test-name="card" />
       * // but won't match <div data-test-visibility="hidden" data-test-name="card" />
       * cy.queryAttrs({ visibility: "visible", name: "card" });
       */
      queryAttrs(attrs: object): Chainable<JQuery<HTMLElement>>;
      /**
       * Get on or more DOM elements that have the provided test attributes.
       *
       * @example
       * // matches <div data-test-visibility="visible" data-test-name="card" />
       * // matches <div data-test-visibility="hidden" data-test-name="card" />
       * cy.queryAttrKeys(["visibility", "name"])
       */
      queryAttrKeys(attrs: string[]): Chainable<JQuery<HTMLElement>>;
      /**
       * Get the parent of each element in the current set that matches the test attribute.
       *
       * @example
       * children.parentQuery("test-id");
       */
      parentQuery(testId: string): Chainable<JQuery<HTMLElement>>;
      /**
       * Get the parent of each element in the current set that test attributes matched the values passed.
       *
       * @example
       * children.parentAttrs({ visibility: "visible"});
       */
      parentAttrs(attrs: object): Chainable<JQuery<HTMLElement>>;
      /**
       * Get the value of the test attributes of the current set
       *
       * @example
       * // currentSet = $([<div data-test-visibility="visible" />, ...]);
       * // returns ["visible", "hidden", ...]
       * currentSet.attrValue("visibility");
       */
      attrValue(attrName: string): Chainable<string | null>;
      /**
       * Check that every elements in the current set is displayed in the currentviewport
       */
      inViewport(): Chainable<JQuery<HTMLElement>>;
    }
  }

  interface Window {
    debugTools: any;
  }
}
