import webpack, { PathData } from 'webpack'
import path from 'path'
import HtmlBundlerPlugin from 'html-bundler-webpack-plugin'
import ImageMinimizerPlugin from 'image-minimizer-webpack-plugin'
import 'webpack-dev-server'

export type BuildMode = 'production' | 'development'
export interface BuildEnv {
  mode: BuildMode
  port: number
  apiUrl: string
}

export default (env: BuildEnv) => {

  const mode = env?.mode || 'development';
  const PORT = env?.port || 3000;
  const isDev = mode === 'development';

  const config: webpack.Configuration = {
    mode,
    devtool: isDev ? 'inline-source-map' : 'source-map',
    stats: 'normal', // 'verbose' | 'minimal'

    output: {
      path: path.resolve(__dirname, 'dist'),
      clean: true,
    },
    resolve: {
      extensions: ['.ts', '.js'],
      preferAbsolute: true,
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },

    plugins: [
      new HtmlBundlerPlugin({
        entry: 'src/pages', // <= the path to templates
        entryFilter: [/index\.html$/], // <= process only matched template files to exclude partials
        filename: ({ chunk }: PathData) =>
          chunk?.name === 'home/index' ? 'index.html' : '[name].html',
        js: {
          // output filename of extracted JS from source script loaded in HTML via `<script>` tag
          filename: 'assets/js/[name].[contenthash:8].js',
        },
        css: {
          // output filename of extracted CSS from source style loaded in HTML via `<link>` tag
          filename: 'assets/css/[name].[contenthash:8].css',
        },
        minify: 'auto',
        loaderOptions: {
          root: __dirname,
          sources: [
            {
              tag: 'meta',
              attributes: ['content'],
              // allow to handlen an image in the 'content' attribute of the 'meta' tag
              // when the 'property' attribute contains one of: 'og:image', 'og:video'
              filter: ({ attributes }) => {
                const attrName = 'property'
                const attrValues = ['og:image', 'og:video'] // allowed values of the property
                if (!attributes[attrName] || attrValues.indexOf(attributes[attrName]) < 0) {
                  return false // return false to disable processing
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
          test: /\.(css|sass|scss)$/,
          use: ['css-loader', 'sass-loader'],
        },
        {
          test: /\.(png|jpe?g|svg|ico)/,
          type: 'asset/resource',
          generator: {
            filename: 'assets/img/[name].[hash:8][ext]',
          },
        },
      ],
    },
    optimization: {
      minimizer: [
        '...',
        new ImageMinimizerPlugin({
          minimizer: {
            implementation: ImageMinimizerPlugin.sharpMinify,
            options: {
              encodeOptions: {
                jpeg: {
                  // https://sharp.pixelplumbing.com/api-output#jpeg
                  quality: 100,
                },
                webp: {
                  // https://sharp.pixelplumbing.com/api-output#webp
                  lossless: true,
                },
                avif: {
                  // https://sharp.pixelplumbing.com/api-output#avif
                  lossless: true,
                },

                // png by default sets the quality to 100%, which is same as lossless
                // https://sharp.pixelplumbing.com/api-output#png
                png: {
                  quality: 100,
                },

                // gif does not support lossless compression at all
                // https://sharp.pixelplumbing.com/api-output#gif
                gif: {},
              },
            },
          },
        }),
      ],
    },

    // enable HMR with live reload
    devServer: {
      port: PORT,
      open: true,
      compress: true,
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
  }

  return config
}

// export default config
