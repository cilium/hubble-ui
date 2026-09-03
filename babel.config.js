module.exports = {
  presets: ['@babel/preset-env'],
  plugins: [['@babel/plugin-proposal-decorators', { version: '2023-11' }]],
  overrides: [
    {
      test: ['**/*.ts'],
      presets: [['@babel/preset-typescript', { onlyRemoveTypeImports: false }]],
    },
    {
      test: ['**/*.tsx'],
      presets: [
        ['@babel/preset-typescript', { onlyRemoveTypeImports: false }],
        '@babel/preset-react',
      ],
    },
    {
      test: ['**/*.jsx'],
      presets: ['@babel/preset-react'],
    },
  ],
  env: {
    test: {
      presets: [['@babel/preset-env', { targets: { node: 'current' } }]],
    },
  },
};
