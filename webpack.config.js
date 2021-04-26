/* eslint-disable @typescript-eslint/no-var-requires */
const autoprefixer = require('autoprefixer');
const path = require('path');
const webpack = require('webpack');
const inliner = require('@vgrid/sass-inline-svg');
const packageImporter = require('node-sass-package-importer');

const Dotenv = require('dotenv-webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CircularDependencyPlugin = require('circular-dependency-plugin');
/* eslint-enable @typescript-eslint/no-var-requires */

const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development';

const stylesLoaders = ({ enableSass, enableModules }) => {
  const sassOpts = {
    modules: enableModules
      ? {
          mode: 'local',
          localIdentName: '[name]_[local]_[hash:base64:5]',
        }
      : false,
    importLoaders: 2,
    localsConvention: 'camelCase',
    sourceMap: true,
  };

  const cssOpts = {
    modules: enableModules
      ? {
          mode: 'local',
          localIdentName: '[name]_[local]_[hash:base64:5]',
        }
      : false,
    importLoaders: 1,
    localsConvention: 'camelCase',
    sourceMap: true,
  };

  return [
    {
      loader: MiniCssExtractPlugin.loader,
      options: {
        hmr: isDevelopment,
        sourceMap: true,
      },
    },
    {
      loader: 'css-loader',
      options: enableSass ? sassOpts : cssOpts,
    },
    {
      loader: 'postcss-loader',
      options: {
        sourceMap: true,
        plugins: [autoprefixer()],
      },
    },
  ].concat(
    enableSass
      ? [
          {
            loader: 'sass-loader',
            options: {
              sourceMap: true,
              implementation: require('sass'),
              sassOptions: {
                importer: packageImporter(),
                functions: {
                  ...require('@vgrid/sass-inline-svg'),
                  'svg-icon($path, $selectors: null)': inliner(
                    path.join(__dirname, 'src/icons/blueprint'),
                    {
                      optimize: true,
                      encodingFormat: 'uri',
                    },
                  ),
                },
              },
            },
          },
        ]
      : [],
  );
};

module.exports = {
  target: 'web',
  entry: (isDevelopment ? [] : []).concat([
    path.resolve(__dirname, './src/index.tsx'),
  ]),
  mode: isProduction ? 'production' : 'development',
  watch: isDevelopment,
  devtool: isProduction ? 'source-map' : 'inline-source-map',
  output: {
    path: path.resolve(__dirname, './server/public'),
    filename: isProduction
      ? 'bundle.[name].[contenthash].js'
      : 'bundle.[name].js',
    publicPath: '/',
    devtoolModuleFilenameTemplate: isProduction
      ? undefined
      : '[absolute-resource-path]',
  },
  stats: {
    colors: true,
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.jsx', '.json', '.mjs'],
    alias: {
      '~backend': path.resolve(__dirname, './backend'),
      '~': path.resolve(__dirname, './src/'),
    },
  },
  module: {
    rules: [
      {
        oneOf: [
          {
            test: /\.ts(x?)$/,
            exclude: /node_modules/,
            use: ['babel-loader', 'ts-loader'],
          },
          {
            enforce: 'pre',
            test: /\.(js|jsx|mjs|ts|tsx)$/,
            loader: 'source-map-loader',
            include: path.resolve(__dirname, 'src'),
          },
          {
            test: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/],
            loader: 'url-loader',
            options: {
              limit: 10000,
              name: 'static/media/[name].[hash:8].[ext]',
            },
          },
          {
            test: /\.svg$/,
            exclude: /node_modules/,
            use: ['svg-react-loader'],
          },
          {
            test: /\.css$/,
            use: stylesLoaders({ enableSass: false, enableModules: false }),
          },
          {
            test: /.blueprint\.scss$/,
            use: stylesLoaders({ enableSass: true, enableModules: false }),
          },
          {
            test: /\.s[ac]ss$/,
            use: stylesLoaders({ enableSass: true, enableModules: true }),
          },
        ],
      },
    ],
  },
  plugins: [
    new CircularDependencyPlugin({
      exclude: /node_modules/,
      failOnError: true,
      allowAsyncCycles: false,
      cwd: process.cwd(),
    }),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
      'process.env.BLUEPRINT_NAMESPACE': JSON.stringify('bp3'),
    }),
    new MiniCssExtractPlugin({
      filename: 'bundle.[name].[contenthash].css',
      chunkFilename: '[id].chunk.bundle.[name].[contenthash].css',
    }),
    new Dotenv({
      path: `.env${isProduction ? '.production' : '.development'}`,
    }),
    new HtmlWebpackPlugin({
      filename: path.resolve(__dirname, `./server/public/index.html`),
      template: path.resolve(__dirname, `./src/index.html`),
      chunksSortMode: 'auto',
      minify: true,
    }),
  ],
};
