import _ from 'lodash';

import { sizes, zIndex } from './vars';
export { sizes, zIndex };

export * as d3 from './d3';
export * as mobx from './mobx';

export function setCSSVars(vars: Record<string, number>) {
  Object.keys(vars).forEach(key => {
    const cssVar = `--${_.kebabCase(key)}`;
    const varValue = `${vars[key]}px`;

    document.documentElement.style.setProperty(cssVar, varValue);
  });
}

export function setCSSVarsZIndex(vars: Record<string, number>) {
  Object.keys(vars).forEach(key => {
    const cssVar = `--${_.kebabCase(key)}-z-index`;
    const varValue = String(vars[key]);
    document.documentElement.style.setProperty(cssVar, varValue);
  });
}
