/* eslint-disable @typescript-eslint/no-var-requires */
const autoprefixer = require('autoprefixer');
const path = require('path');
const webpack = require('webpack');

const Dotenv = require('dotenv-webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
const CircularDependencyPlugin = require('circular-dependency-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
/* eslint-enable @typescript-eslint/no-var-requires */

const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development';

const stylesLoaders = sassEnabled => {
  const sassOpts = {
    modules: {
      mode: 'local',
      localIdentName: '[name]_[local]_[hash:base64:5]',
    },
    importLoaders: 2,
    localsConvention: 'camelCase',
    sourceMap: true,
  };

  const cssOpts = {
    modules: false,
    importLoaders: 1,
    localsConvention: 'camelCase',
    sourceMap: true,
  };

  const cssLoaderOpts = sassEnabled ? sassOpts : cssOpts;

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
      options: cssLoaderOpts,
    },
    {
      loader: 'postcss-loader',
      options: {
        sourceMap: true,
        plugins: [autoprefixer()],
      },
    },
  ].concat(
    sassEnabled
      ? [
          {
            loader: 'sass-loader',
            options: {
              sourceMap: true,
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
    path: path.resolve(__dirname, '../server/public'),
    filename: 'bundle.js',
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
      '~': path.resolve(__dirname, './src/'),
      '~common': path.resolve(__dirname, './../common/src/'),
    }
  },
  module: {
    rules: [
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
        use: stylesLoaders(false),
      },
      {
        test: /\.s[ac]ss$/,
        use: stylesLoaders(true),
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
      filename: 'bundle.css',
      chunkFilename: '[id].chunk.bundle.css',
    }),
    new Dotenv({
      path: `.env${isProduction ? '.production' : '.development'}`,
    }),
    new HtmlWebpackPlugin({
      filename: path.resolve(__dirname, `../server/public/index.html`),
      template: path.resolve(__dirname, `./src/index.html`),
      chunksSortMode: 'auto',
      minify: true,
    }),
  ].concat(
    isDevelopment
      ? []
      : [
          new OptimizeCSSAssetsPlugin({
            cssProcessorOptions: {
              map: {
                inline: false,
                annotation: true,
              },
            },
            cssProcessorPluginOptions: {
              preset: ['default', { discardComments: { removeAll: true } }],
            },
          }),
        ],
  ),
};
