const path = require('path');
const HtmlBundlerPlugin = require('html-bundler-webpack-plugin');

module.exports = {
  output: {
    path: path.join(__dirname, 'dist/'),
    clean: true
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },

  entry: {
    // define HTML templates here
    index: './src/pages/home/index.html',  // => dist/index.html
    'about/index': './src/pages/about/index.html', // => dist/about/index.html
  },

  plugins: [
    new HtmlBundlerPlugin({
      js: {
        // output filename of extracted JS from source script loaded in HTML via `<script>` tag
        filename: 'assets/js/[name].[contenthash:8].js',
      },
      css: {
        // output filename of extracted CSS from source style loaded in HTML via `<link>` tag
        filename: 'assets/css/[name].[contenthash:8].css',
      },
      loaderOptions: {
        root: path.join(__dirname, 'src'),
        sources: [
          {
            tag: 'meta',
            attributes: ['content'],
            // allow to handlen an image in the 'content' attribute of the 'meta' tag
            // when the 'property' attribute contains one of: 'og:image', 'og:video'
            filter: ({ attributes }) => {
              const attrName = 'property';
              const attrValues = ['og:image', 'og:video']; // allowed values of the property
              if (!attributes[attrName] || attrValues.indexOf(attributes[attrName]) < 0) {
                return false; // return false to disable processing
              }
              // return true or undefined to enable processing
            },
          },
        ],
      },
    }),
  ],

  module: {
    rules: [
      {
        test: /\.html$/,
        loader: HtmlBundlerPlugin.loader, // HTML loader
      },
      // styles
      {
        test: /\.(css|sass|scss)$/,
        use: ['css-loader', 'sass-loader'],
      },
      // images
      {
        test: /\.(png|jpe?g|svg|ico)/,
        type: 'asset/resource',
        generator: {
          filename: 'assets/img/[name].[hash:8][ext]',
        },
      },
    ],
  },

  // enable HMR with live reload
  devServer: {
    static: {
      directory: path.join(__dirname, 'dist'),
    },
    watchFiles: {
      paths: ['src/**/*.*'],
      options: {
        usePolling: true,
      },
    },
  },
};
