import { defineConfig } from 'cypress';
import path from 'path';

import { webpackConfiguration } from './e2e/cypress/webpack';

export default defineConfig({
  projectId: '6to9oy',
  e2e: {
    specPattern: `e2e/cypress/scenarios/**/*.cy.{js,jsx,ts,tsx}`,
    baseUrl: process.env.BASE_URL ?? 'http://127.0.0.1:8080',
    supportFile: path.resolve(__dirname, 'e2e/cypress/support/index.ts'),
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
