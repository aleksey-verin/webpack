import webpack from 'webpack';
import path from 'path';
import fs from 'fs';
import HtmlBundlerPlugin from 'html-bundler-webpack-plugin';
import ImageMinimizerPlugin from "image-minimizer-webpack-plugin"
import 'webpack-dev-server';
// const path = require('path');
// const HtmlBundlerPlugin = require('html-bundler-webpack-plugin');

// import path from 'path';

// Определение типа для возвращаемого объекта
interface EntryPoints {
    [key: string]: string;
}

function generateEntryPoints(): EntryPoints {
    const pagesDir = path.join(__dirname, 'src/pages');
    const dirs = fs.readdirSync(pagesDir, { withFileTypes: true });

    const entryPoints: EntryPoints = {};

    // Перебор всех каталогов в директории страниц
    dirs.forEach(dir => {
        if (dir.isDirectory()) {
            const indexPath = path.join(pagesDir, dir.name, 'index.html');
            if (fs.existsSync(indexPath)) {
                const key = dir.name === 'home' ? 'index' : `${dir.name}/index`;
                entryPoints[key] = './' + path.relative(__dirname, indexPath);
            }
        }
    });

    return entryPoints;
}

const isProd = !process.argv.find((str) => str.includes('development'));

const config: webpack.Configuration = {

    mode: isProd ? 'production' : 'development',
    devtool: isProd ? 'source-map' : 'inline-source-map', 
    stats: 'normal', // 'verbose' | 'minimal'
  
    output: {
      path: path.resolve(__dirname, 'dist'),
      clean: true
    },
    resolve: {
      extensions: ['.ts', '.js'],
      preferAbsolute: true,
      alias: {
        '@': path.resolve(__dirname, 'src'),
      }
    },
    entry: generateEntryPoints(),
    // entry: {
    //   // define HTML templates here
    //   index: './src/pages/home/index.html',  // => dist/index.html
    //   'about/index': './src/pages/about/index.html', // => dist/about/index.html
    //   'buy/index': './src/pages/buy/index.html', // => dist/about/index.html

    // },
    
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
        minify: isProd ? true : 'auto',
        loaderOptions: {
          root: __dirname,
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
    optimization: {
      minimizer: [
        "...",
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
                png: {},
  
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

export default config;