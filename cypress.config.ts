import { defineConfig } from 'cypress';

import webpackPreprocessor from '@cypress/webpack-preprocessor';

import mainWebpackConfig from './webpack.config';
import HtmlWebpackPlugin from 'html-webpack-plugin';

export const webpackConfiguration = async (f: Cypress.FileObject) => {
  // HtmlWebpackPlugin is clashing with cypress own html file process
  const plugins = mainWebpackConfig.plugins.filter(f => !(f instanceof HtmlWebpackPlugin));
  const opts = { webpackOptions: { ...mainWebpackConfig, plugins } };

  return await webpackPreprocessor(opts as any)(f);
};

export default defineConfig({
  projectId: '6to9oy',
  e2e: {
    specPattern: `src/testing/e2e/scenarios/**/*.cy.{js,jsx,ts,tsx}`,
    baseUrl: process.env.BASE_URL ?? 'http://127.0.0.1:8080',
    supportFile: 'src/testing/e2e/support/index.ts',
    chromeWebSecurity: false,
    env: {
      username: 'admin@example.com',
      password: 'password',
    },
    setupNodeEvents: on => {
      on('file:preprocessor', async f => await webpackConfiguration(f));
    },
  },
});
