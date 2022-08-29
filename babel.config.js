module.exports = {
  presets: ['@babel/preset-react', '@babel/preset-env'],
  env: {
    test: {
      presets: [
        ['@babel/preset-env', { targets: { node: 'current' } }],
        '@babel/preset-react',
      ],
    },
  },
};
