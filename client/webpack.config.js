/* eslint-disable @typescript-eslint/no-var-requires */
const autoprefixer = require('autoprefixer');
const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
const Dotenv = require('dotenv-webpack');
const CircularDependencyPlugin = require('circular-dependency-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
/* eslint-enable @typescript-eslint/no-var-requires */

const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development';

module.exports = {
  target: 'web',
  entry: (isDevelopment ? [] : []).concat([
    path.resolve(__dirname, './src/index.tsx'),
  ]),
  mode: isProduction ? 'production' : 'development',
  watch: isDevelopment,
  devtool: isProduction ? 'source-map' : 'inline-cheap-module-source-map',
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
    plugins: [new TsconfigPathsPlugin()],
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx|mjs)$/,
        loader: 'source-map-loader',
        enforce: 'pre',
        include: path.resolve(__dirname, 'src'),
      },
      {
        oneOf: [
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
            use: {
              loader: 'svg-react-loader',
            },
          },
          {
            test: /\.mjs$/,
            type: 'javascript/auto',
          },
          {
            test: /\.(js|jsx)$/,
            use: [
              {
                loader: 'babel-loader',
              },
            ],
            exclude: path.resolve(__dirname, 'node_modules'),
          },
          {
            test: /\.(ts|tsx)$/,
            use: [
              {
                loader: 'babel-loader',
              },
              {
                loader: 'ts-loader',
                options: {
                  experimentalWatchApi: true,
                },
              },
            ],
            exclude: path.resolve(__dirname, 'node_modules'),
          },
          {
            test: /\.css$/,
            use: [
              {
                loader: MiniCssExtractPlugin.loader,
                options: {
                  hmr: isDevelopment,
                  sourceMap: true,
                },
              },
              {
                loader: 'css-loader',
                options: {
                  modules: false,
                  importLoaders: 1,
                  localsConvention: 'camelCase',
                  sourceMap: true,
                },
              },
              {
                loader: 'postcss-loader',
                options: {
                  sourceMap: true,
                  plugins: [autoprefixer()],
                },
              },
            ],
          },
          {
            test: /\.scss$/,
            use: [
              {
                loader: MiniCssExtractPlugin.loader,
                options: {
                  hmr: isDevelopment,
                  sourceMap: true,
                },
              },
              {
                loader: 'css-loader',
                options: {
                  modules: {
                    mode: 'local',
                    localIdentName: '[name]_[local]_[hash:base64:5]',
                  },
                  importLoaders: 2,
                  localsConvention: 'camelCase',
                  sourceMap: true,
                },
              },
              {
                loader: 'postcss-loader',
                options: {
                  sourceMap: true,
                  plugins: [autoprefixer()],
                },
              },
              {
                loader: 'sass-loader',
                options: {
                  sourceMap: true,
                },
              },
            ],
          },
          {
            exclude: [/\.(js|jsx|ts|tsx|mjs)$/, /\.html$/, /\.json$/],
            loader: 'file-loader',
            options: {
              name: 'static/media/[name].[hash:8].[ext]',
            },
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
      filename: 'bundle.css',
      chunkFilename: '[id].chunk.bundle.css',
    }),
    new Dotenv({
      path: `.env${isProduction ? '.production' : '.development'}`,
    }),
    new HtmlWebpackPlugin({
      filename: path.resolve(__dirname, `../server/public/index.html`),
      template: path.resolve(__dirname, `./src/index.html`),
      chunksSortMode: 'dependency',
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
