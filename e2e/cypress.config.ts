import { defineConfig } from 'cypress';
import path from 'path';

import { webpackConfiguration } from './cypress/webpack';

export default defineConfig({
  projectId: '6to9oy',
  e2e: {
    specPattern: `cypress/scenarios/**/*.cy.{js,jsx,ts,tsx}`,
    baseUrl: process.env.BASE_URL ?? 'http://127.0.0.1:8080',
    supportFile: path.resolve(__dirname, 'cypress/support/index.ts'),
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
