import { isTestingEnv } from '~/environment';
import { E2E_PREFIX } from '~/testing/constants';
/**
 * This function take either a string as parameter or an object and returns
 * test attributes if env.NODE_ENV is dev, or env.E2E_TEST_MODE is set to true.
 *
 * If it gets a string, it returns an object with the common data attributes
 * we use to store id. If it takes an object, it returns the same object with
 * all the keys prefixed with the suffix we use for e2e tests.
 *
 * @example
 * // returns { "data-test": "my-value" }
 * getTestAttributes("my-value");
 * @example
 * // returns { "data-test-my-attribute": "my-value" }
 * getTestAttributes({ "my-attribute": "my-value "});
 */
export const getTestAttributes = (
  sel: string | { [attr: string]: string },
): { [attr: string]: string } => {
  if (!isTestingEnv()) return {};

  if (typeof sel !== 'string') {
    const attributes = Object.keys(sel).map(attr => ({
      [`${E2E_PREFIX}-${attr}`]: sel[attr],
    }));

    return Object.assign({}, ...attributes);
  }
  return { [E2E_PREFIX]: sel };
};
