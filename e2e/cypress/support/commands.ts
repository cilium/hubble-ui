import { attributes } from '~e2e/client/attributes';

export type QueryOpts = {
  inViewport?: boolean;
};

const dataSelPrefix = attributes.dataSelPrefix;
const dataAttrPrefix = attributes.dataAttrPrefix;

Cypress.Commands.add('query', (selector: string, ...args) => {
  return cy.get(`[data-${dataSelPrefix}=${selector}]`, ...args);
});

Cypress.Commands.add('queryLike', (selector: string, ...args) => {
  return cy.get(`[data-${dataSelPrefix}*=${selector}]`, ...args);
});

const selAttrPrefix = `data-${dataAttrPrefix}`;
const attrsToSelector = (attrs: object): string => {
  const sel = Object.entries(attrs).reduce((sels, pair) => {
    const attrKey = pair[0].startsWith(selAttrPrefix) ? pair[0] : `${selAttrPrefix}-${pair[0]}`;

    const sel = `[${attrKey}=${pair[1]}]`;
    return sels.concat(sel);
  }, [] as string[]);

  return sel.join('');
};

Cypress.Commands.add('queryAttrs', (attrs: object, ...args) => {
  return cy.get(attrsToSelector(attrs), ...args);
});

Cypress.Commands.add('parentAttrs', { prevSubject: true }, (subj, attrs: object) => {
  return subj.parent(attrsToSelector(attrs));
});

Cypress.Commands.add('inViewport', { prevSubject: true }, (subj: JQuery<HTMLElement>) => {
  const viewportWidth = Cypress.config(`viewportWidth`);
  const viewportHeight = Cypress.config(`viewportHeight`);

  cy.wrap(subj).should('satisfy', () => {
    let result = false;
    subj.each((i, elem) => {
      const bbox = elem.getBoundingClientRect();
      console.log(`elem ${i}`, bbox);

      const leftIsOk = bbox.left >= 0 && bbox.left <= viewportWidth;
      const topIsOk = bbox.top >= 0 && bbox.top <= viewportHeight;

      result = result && leftIsOk && topIsOk;
    });

    return result;
  });
});
