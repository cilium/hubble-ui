import path from 'node:path';
import * as url from 'node:url';
import webpack from 'webpack';

import { sassNodeModulesLoadPaths, sassSvgInlinerFactory } from '@blueprintjs/node-build-scripts';
import Dotenv from 'dotenv-webpack';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import CircularDependencyPlugin from 'circular-dependency-plugin';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

const nodeEnv = process.env.NODE_ENV || 'development';
const isProduction = nodeEnv.startsWith('prod');
const isDevelopment = nodeEnv.startsWith('dev');

const sassfunctions = {
  /**
   * Sass function to inline a UI icon svg and change its path color.
   *
   * Usage:
   * svg-icon("16px/icon-name.svg", (path: (fill: $color)) )
   */
  'svg-icon($path, $selectors: null)': sassSvgInlinerFactory(
    path.join(__dirname, 'src/icons/blueprint'),
    {
      optimize: true,
      encodingFormat: 'uri',
    },
  ),
};

const stylesLoaders = ({ enableSass, enableModules }) => {
  const sassOpts = {
    modules: enableModules
      ? {
          mode: 'local',
          namedExport: false,
          localIdentName: '[name]_[local]_[hash:base64:5]',
          exportLocalsConvention: 'camelCase',
        }
      : false,
    importLoaders: 2,
    sourceMap: true,
    url: false,
  };

  const cssOpts = {
    modules: enableModules
      ? {
          mode: 'local',
          namedExport: false,
          localIdentName: '[name]_[local]_[hash:base64:5]',
          exportLocalsConvention: 'camelCase',
        }
      : false,
    importLoaders: 1,
    sourceMap: true,
    url: false,
  };

  return [
    {
      loader: MiniCssExtractPlugin.loader,
    },
    {
      loader: 'css-loader',
      options: enableSass ? sassOpts : cssOpts,
    },
  ].concat(
    enableSass
      ? [
          {
            loader: 'sass-loader',
            options: {
              sourceMap: true,
              sassOptions: {
                loadPaths: sassNodeModulesLoadPaths,
                functions: sassfunctions,
              },
            },
          },
        ]
      : [],
  );
};

export default {
  target: 'web',
  entry: path.resolve(__dirname, './src/index.tsx'),
  mode: isProduction ? 'production' : 'development',
  watch: isDevelopment,
  devtool: isProduction ? 'source-map' : 'inline-source-map',
  output: {
    path: path.resolve(__dirname, './server/public'),
    filename: isProduction ? 'bundle.[name].[contenthash].js' : 'bundle.[name].js',
    devtoolModuleFilenameTemplate: isProduction ? undefined : '[absolute-resource-path]',
    assetModuleFilename: 'static/media/[name].[hash:8][ext][query]',
  },
  stats: {
    colors: true,
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.jsx', '.json', '.mjs'],
    alias: {
      '~backend': path.resolve(__dirname, './backend'),
      '~': path.resolve(__dirname, './src/'),
      '~e2e': path.resolve(__dirname, './src/testing/e2e/'),
    },
  },
  module: {
    rules: [
      {
        enforce: 'pre',
        test: /\.(js|jsx|mjs|ts|tsx)$/,
        loader: 'source-map-loader',
        include: path.resolve(__dirname, 'src'),
      },
      {
        test: /\.js$/,
        type: 'javascript/auto',
      },
      {
        test: /\.ts(x?)$/,
        exclude: /node_modules/,
        use: ['babel-loader', 'ts-loader'],
      },
      {
        test: /\.(bmp|gif|jpg|jpeg|png|woff|woff2|eot|ttf)$/,
        type: 'asset',
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
        exclude: /.blueprint\.scss$/,
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
