'use strict';
const path = require('path');

module.exports = {
  entry: {
    index: path.join(__dirname, '../src/index.tsx'),
  },
  output: {
    path: path.join(__dirname, '../dist'),
    filename: '[name].bundle.js',
  },
  resolve: {
    extensions: [ '.tsx', '.ts', '.js' ]
  },
  mode: 'production',
  target: 'web',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: {
          loader: 'ts-loader',
        },
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: [
          'style-loader',
          'postcss-loader',
        ]
      }
    ]
  }
}