import babelParser from '@babel/eslint-parser';
import prettierPlugin from 'eslint-plugin-prettier';

export default [
  {
    ignores: ['src/proto/**', 'server/public/**', 'backend/**', 'build/**', 'node_modules/**'],
  },
  {
    files: ['**/*.{ts,tsx,js,jsx,mjs}'],
    languageOptions: {
      parser: babelParser,
      parserOptions: {
        requireConfigFile: true,
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    plugins: { prettier: prettierPlugin },
    rules: {
      'prettier/prettier': 'error',
      // Babel parses TypeScript, but ESLint core cannot distinguish type-only
      // references from runtime references. Keep semantic unused checks in
      // TypeScript/compiler tooling instead of reporting false positives here.
      'no-unused-vars': 'off',
    },
  },
];
