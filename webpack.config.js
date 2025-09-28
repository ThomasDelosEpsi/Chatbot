// webpack.config.js
const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
require('dotenv').config(); // charge .env à la racine

module.exports = {
  entry: './src/main.tsx',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.[contenthash].js',
    clean: true,
    publicPath: '/',
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    alias: {
      '@ui': path.resolve(__dirname, 'src/components/ui'),
      '@utils': path.resolve(__dirname, 'src/components/utils'),
    },
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: { loader: 'ts-loader', options: { transpileOnly: true } },
        exclude: /node_modules/,
      },
      { test: /\.css$/i, use: ['style-loader', 'css-loader', 'postcss-loader'] },
      { test: /\.(png|jpe?g|gif|svg)$/i, type: 'asset/resource' },
      { test: /\.md$/i, type: 'asset/source' },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      templateContent: `
        <!doctype html>
        <html lang="fr">
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <title>Chatbot</title>
          </head>
          <body>
            <div id="root"></div>
          </body>
        </html>
      `,
    }),

    // ⬇️ ICI (dans plugins) : injection des variables pour le front
    new webpack.DefinePlugin({
      'process.env.SUPABASE_URL': JSON.stringify(process.env.SUPABASE_URL),
      'process.env.SUPABASE_ANON_KEY': JSON.stringify(process.env.SUPABASE_ANON_KEY),
    }),
  ],

  devServer: {
    port: 5173,                // ok, garde si tu veux
    historyApiFallback: true,
    static: false,             // ou { directory: path.join(__dirname, 'public') } si tu as un /public
    open: true,
    hot: true,
  },

  mode: 'development',
  devtool: 'source-map',
};
