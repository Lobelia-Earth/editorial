/* eslint-disable no-console */

const path = require('path');
const webpack = require('webpack'); // eslint-disable-line

module.exports = (env = {}) => {
  const fProduction = env.NODE_ENV === 'production';

  console.log(`Compiling for production: ${fProduction}`);

  const cssLoader = {
    loader: 'css-loader',
  };

  const sassLoader = {
    loader: 'sass-loader',
    options: { indentedSyntax: true },
  };

  const styleRules = (loaders) => [{ loader: 'style-loader' }].concat(loaders);

  return {
    // -------------------------------------------------
    // Input (entry point)
    // -------------------------------------------------
    entry: { app: ['./src/client/startup.js'] },

    // -------------------------------------------------
    // Output
    // -------------------------------------------------
    output: {
      filename: '[name].bundle.js',
      path: path.resolve(process.cwd(), 'lib/public/assets'),
      publicPath: '/assets/',
    },

    // -------------------------------------------------
    // Configuration
    // -------------------------------------------------
    devtool: fProduction ? undefined : 'eval',

    plugins: [],

    module: {
      rules: [
        {
          test: /\.(js|jsx)$/,
          loader: 'babel-loader',
          exclude: [/node_modules/],
        },
        {
          test: /\.(otf|eot|svg|ttf|woff|woff2)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
          loader: 'file-loader',
        },
        {
          test: /\.css$/,
          use: styleRules([cssLoader]),
        },
        {
          test: /\.sass$/,
          use: styleRules([cssLoader, sassLoader]),
        },
        {
          test: /\.png$/,
          loader: 'file-loader',
        },
      ],
    },
  };
};
