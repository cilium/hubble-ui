import path from 'path';
import webpackPreprocessor from '@cypress/webpack-preprocessor';

type WebpackOptions = typeof webpackPreprocessor.defaultOptions;

export const webpackConfiguration = async (f: Cypress.FileObject) => {
  const opts = { ...webpackPreprocessor.defaultOptions };

  injectTypescriptLoader(opts);
  injectPathAliases(opts);

  return await webpackPreprocessor(opts)(f);
};

const injectTypescriptLoader = (opts: WebpackOptions) => {
  if (opts.webpackOptions == null) {
    opts.webpackOptions = {};
  }

  Object.assign(opts.webpackOptions, {
    resolve: {
      ...opts.webpackOptions?.resolve,
      extensions: ['.ts', '.js'],
    },
    module: {
      ...opts.webpackOptions.module,
      rules: (opts.webpackOptions.module?.rules || []).concat([
        {
          test: /\.ts$/,
          exclude: [/node_modules/],
          use: [
            {
              loader: 'ts-loader',
            },
          ],
        },
      ]),
    },
  });
};

const injectPathAliases = (opts: WebpackOptions) => {
  if (opts.webpackOptions == null) {
    opts.webpackOptions = {};
  }

  const aliases = createWebpackAliases();

  Object.assign(opts.webpackOptions, {
    resolve: {
      ...opts.webpackOptions.resolve,
      alias: {
        ...opts.webpackOptions.resolve?.alias,
        ...aliases,
      },
    },
  });
};

const createWebpackAliases = () => {
  return {
    '~e2e': path.resolve(__dirname, `../`),
  };
};
