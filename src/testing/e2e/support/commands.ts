import _ from 'lodash';
import { E2E_PREFIX } from '~/testing/constants';

export type QueryOpts = {
  inViewport?: boolean;
};

Cypress.Commands.add('query', (testId: string, ...args) => {
  return cy.get(`[${E2E_PREFIX}="${testId}"]`, ...args);
});

Cypress.Commands.add('queryLike', (selector: string, ...args) => {
  return cy.get(`[${E2E_PREFIX}*="${selector}"]`, ...args);
});

const attrsToSelector = (attrs: object): string => {
  const sel = Object.entries(attrs).reduce((sels, pair) => {
    const attrKey = pair[0].startsWith(E2E_PREFIX) ? pair[0] : `${E2E_PREFIX}-${pair[0]}`;

    const sel = `[${attrKey}="${pair[1]}"]`;
    return sels.concat(sel);
  }, [] as string[]);

  return sel.join('');
};

Cypress.Commands.add('queryAttrs', (attrs: object, ...args) => {
  return cy.get(attrsToSelector(attrs), ...args);
});

Cypress.Commands.add('queryAttrKeys', (attrs: string[], ...args) => {
  const sel = attrs.map(attr => `[${E2E_PREFIX}-${attr}]`).join('');

  return cy.get(sel, ...args);
});

Cypress.Commands.add('parentAttrs', { prevSubject: true }, (subj, attrs: object) => {
  return subj.parent(attrsToSelector(attrs));
});

Cypress.Commands.add('parentQuery', { prevSubject: true }, (subj, testId: string) => {
  return subj.parent(`[${E2E_PREFIX}="${testId}"]`);
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

Cypress.Commands.add(
  'attrValue',
  { prevSubject: true },
  (subj: JQuery<HTMLElement>, attrName: string) => {
    const key = `${E2E_PREFIX}-${attrName}`;
    const dataset = subj.data();

    // NOTE: We have to do this conversion since jQuery transforms dataset.
    const camelCaseKey = _.camelCase(key);

    return Object.hasOwn(dataset, camelCaseKey) ? dataset[camelCaseKey] : null;
  },
);

// Hide requests in Cypress console:
const app = window.top;
if (app && !app.document.head.querySelector('[data-hide-command-log-request]')) {
  const style = app.document.createElement('style');
  style.innerHTML = '.command-name-request, .command-name-xhr { display: none }';
  style.setAttribute('data-hide-command-log-request', '');

  app.document.head.appendChild(style);
}
