var MinifyPlugin = require('babel-minify-webpack-plugin');
const CompressionPlugin = require('compression-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
var fs = require('fs');
var ip = require('ip');
var path = require('path');
var webpack = require('webpack');
const HtmlWebPackPlugin = require('html-webpack-plugin');

const pkg = require('./package.json');

const PORT = process.env.PORT || 3000;

const production = process.env.NODE_ENV === 'production';

const PLUGINS = [
  // Hot swap please!
  new webpack.HotModuleReplacementPlugin(),

  // Define env variables
  new webpack.EnvironmentPlugin({
    NODE_ENV: process.env.NODE_ENV,
    PACKAGE_VERSION: `${pkg.version}`
  })
];

if (production) {
  // compress and optimize code for production
  PLUGINS.push(new webpack.optimize.AggressiveMergingPlugin());
  PLUGINS.push(new CompressionPlugin());
  PLUGINS.push(
    // Serves the html
    new CopyWebpackPlugin([
      {
        // Note:- No wildcard is specified hence will copy all files and folders
        from: 'assets', // Will resolve to RepoDir/src/assets
        to: 'assets' // Copies all files from above dest to dist/assets
      },
      {
        from: 'public', // Will resolve to RepoDir/src/assets
        to: '' // Copies all files from above dest to dist/assets
      },
      {
        from: '*.html',
        to: ''
      }
    ])
  );
}

module.exports = {
  devServer: {
    disableHostCheck: true,
    hotOnly: true,
    host: '0.0.0.0'
  },
  entry: {
    build: './src/index.js'
  },
  output: {
    path: `${__dirname}/build`,
    filename: '[name].js',
    globalObject: 'this'
  },
  mode: process.env.NODE_ENV || 'development',
  watch: !production,
  watchOptions: {
    ignored: ['node_modules', 'dist']
  },
  node: {
    fs: 'empty' // fixes bug with Draco making reference to fs from node
  },
  optimization: {
    minimize: production,
    splitChunks: {
      chunks: 'async',
      minSize: 30000,
      maxSize: 0,
      minChunks: 1,
      maxAsyncRequests: 5,
      maxInitialRequests: 3,
      automaticNameDelimiter: '~',
      name: true,
      cacheGroups: {
        vendors: {
          test: /[\\/]node_modules[\\/]/,
          priority: -10
        },
        default: {
          minChunks: 2,
          priority: -20,
          reuseExistingChunk: true
        }
      }
    }
  },
  plugins: PLUGINS,
  module: {
    rules: [
      {
        test: /\.js/,
        exclude: /(node_modules)/,
        use: ['babel-loader', 'aframe-super-hot-loader']
      },
      {
        test: /\.html/,
        exclude: /(node_modules)/,
        use: [
          'aframe-super-hot-html-loader',
          {
            loader: 'super-nunjucks-loader',
            options: {
              globals: {
                HOST: ip.address(),
                IS_PRODUCTION: process.env.NODE_ENV === 'production'
              },
              path: process.env.NUNJUCKS_PATH || path.join(__dirname, 'src')
            }
          },
          {
            loader: 'html-require-loader',
            options: {
              root: path.resolve(__dirname, 'src')
            }
          }
        ]
      },
      {
        test: /\.glsl/,
        exclude: /(node_modules)/,
        loader: 'webpack-glsl-loader'
      },
      {
        test: /\.css$/,
        exclude: /(node_modules)/,
        use: ['style-loader', 'css-loader']
      },
      {
        test: /\.png|\.jpg/,
        exclude: /(node_modules)/,
        use: ['url-loader']
      }
    ]
  }
};
