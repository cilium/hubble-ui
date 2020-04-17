import _ from 'lodash';

import { sizes } from './vars';
export { sizes };

export function setCSSVars(vars: Record<string, number>) {
  Object.keys(vars).forEach(key => {
    const cssVar = `--${_.kebabCase(key)}`;
    const varValue = `${vars[key]}px`;

    document.documentElement.style.setProperty(cssVar, varValue);
  });
}
