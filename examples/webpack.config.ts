import { resolve } from 'path'
import HtmlWebpackPlugin from 'html-webpack-plugin'

export default {
  entry: './src/index.tsx',
  devtool: 'inline-source-map',
  devServer: {
    contentBase: resolve('public'),
    compress: true,
    historyApiFallback: true,
    port: 9000,
  },
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    alias: {
      '@src': resolve('../src'),
      '@zedux': resolve('../src'),
    },
    extensions: ['.tsx', '.ts', '.js'],
  },
  output: {
    filename: 'bundle.js',
    path: resolve('dist'),
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: resolve('public/index.html'),
    }),
  ],
}
