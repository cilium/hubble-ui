module.exports = {
  presets: ['@babel/preset-react', '@babel/preset-env'],
  plugins: [
    '@babel/transform-runtime',
    '@babel/plugin-proposal-nullish-coalescing-operator',
    '@babel/plugin-proposal-optional-chaining',
  ],
};
