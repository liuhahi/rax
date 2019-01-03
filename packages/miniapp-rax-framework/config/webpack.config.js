const { NODE_ENV, DEBUG } = process.env;
const { resolve } = require('path');
const webpack = require('webpack');
const address = require('address');
const chalk = require('chalk');
const dayjs = require('dayjs');

const atagVersion = '0.1.34';
const { version: frameworkVersion } = require('../package.json');

/**
 * If debug mode is enabled,
 * it will use local ip to provide atag.js
 */
const isDebug = DEBUG === 'true';
const localIP = address.ip();

const LOCAL_ATAG_SERVE_PORT = 9001;
const LOCAL_FRAMEWORK_SERVE_PORT = 8003;

const ATAG_URL = isDebug
  ? `http://${localIP}:${LOCAL_ATAG_SERVE_PORT}/atag.js`
  : `https://g.alicdn.com/code/npm/atag/${atagVersion}/dist/atag.js`;

console.log(`
-----
${chalk.bgGreen('Build for versions')}:
  miniapp-framework: ${chalk.green(frameworkVersion)}
  atag: ${chalk.green(atagVersion)}
-----
`);

module.exports = new Promise((done) => {
  const config = {
    mode: NODE_ENV || 'development',
    devtool: NODE_ENV === 'development' ? 'inline-source-map' : false,
    entry: require('./entry'),
    output: {
      globalObject: 'this',
    },
    node: {
      /**
       * Prevent webpack from injecting useless setImmediate polyfill because Vue
       * source contains it (although only uses it if it's native).
       */
      setImmediate: false,
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          loader: 'babel-loader',
          options: require('./babel.config'),
        },
        {
          test: /webpack-hot-client/,
          loader: 'null-loader',
        },
        {
          test: /\.(png|jpg|gif)$/,
          loader: 'url-loader',
          options: {
            limit: 8192,
          },
        },
      ],
    },
    resolve: {
      alias: {
        shared: resolve('shared'),
        core: resolve('core'),
        platforms: resolve('platforms'),
        vendors: resolve('vendors'),
        packages: resolve('packages'),

        RAX_SOURCE:
          NODE_ENV === 'development'
            ? 'rax/dist/rax.js'
            : 'rax/dist/rax.min.js',
      },
    },
    externals: [
      function(context, request, callback) {
        // eslint-disable-line
        if (/^@(core|weex-module)\//.test(request)) {
          return callback(null, `commonjs2 ${request}`);
        }
        callback();
      },
    ],
    // disable dev server all!!
    // for Native JSC can not run sockjs
    devServer: {
      hot: false,
      inline: false,
      port: LOCAL_FRAMEWORK_SERVE_PORT,
    },
    plugins: [
      new webpack.EnvironmentPlugin(['NODE_ENV']),

      new webpack.DefinePlugin({
        ATAG_URL: JSON.stringify(ATAG_URL),
      }),
      //
      // /**
      //  * native renderer.html
      //  */
      // new HtmlWebpackPlugin({
      //   filename: 'native/renderer.html',
      //   template: 'native/renderer.ejs.html',
      //   inject: false,
      //   templateParameters(compilation) {
      //     const data = {
      //       isDebug,
      //       atagVersion,
      //       frameworkVersion,
      //     };
      //
      //     if (isDebug) {
      //       Object.assign(data, {
      //         debugAtagURL: `http://${localIP}:${LOCAL_ATAG_SERVE_PORT}/atag.js`,
      //         debugFrameworkNativeRendererURL: `http://${localIP}:${LOCAL_FRAMEWORK_SERVE_PORT}/native/renderer.js`
      //       });
      //     }
      //
      //     return data;
      //   },
      // }),
      //
      // /**
      //  * h5 master.ejs
      //  */
      // new HtmlWebpackPlugin({
      //   filename: 'h5/master.html',
      //   template: 'h5/master.ejs.html',
      //   inject: false,
      //   templateParameters(compilation) {
      //     return {
      //       injectManifestCode:
      //         'window.APP_MANIFEST = <%- appConfig %>;',
      //       frameworkVersion,
      //     };
      //   },
      // }),

      new webpack.BannerPlugin({
        banner: `MiniApp Framework: ${frameworkVersion} Bulit at: ${dayjs().format('YYYY.MM.DD HH:mm:ss')}`,
      }),
    ],

  };

  done(config);
});
