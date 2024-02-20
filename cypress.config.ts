import { defineConfig } from 'cypress';

import webpackPreprocessor from '@cypress/webpack-preprocessor';

import mainWebpackConfig from './webpack.config';

export const webpackConfiguration = async (f: Cypress.FileObject) => {
  const opts = { webpackOptions: { ...mainWebpackConfig, plugins: [] } };

  return await webpackPreprocessor(opts as any)(f);
};

export default defineConfig({
  projectId: '6to9oy',
  e2e: {
    specPattern: `src/testing/e2e/cypress/scenarios/**/*.cy.{js,jsx,ts,tsx}`,
    baseUrl: process.env.BASE_URL ?? 'http://127.0.0.1:8080',
    supportFile: 'src/testing/e2e/cypress/support/index.ts',
    chromeWebSecurity: false,
    env: {
      username: 'admin@example.com',
      password: 'password',
    },
    setupNodeEvents: (on, _config) => {
      on('file:preprocessor', async f => await webpackConfiguration(f));
    },
  },
});
