import { resolve } from 'path'
import TsconfigPathsPlugin from 'tsconfig-paths-webpack-plugin'

export default {
  entry: './src/index.ts',
  devtool: 'source-map',
  mode: process.env.NODE_ENV,
  module: {
    rules: [
      {
        test: /\.ts?$/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              configFile: resolve('tsconfig.webpack.json'),
            },
          },
        ],
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.ts'],
    plugins: [
      new TsconfigPathsPlugin({
        configFile: 'tsconfig.webpack.json',
      }),
    ],
  },
  output: {
    filename: 'react-zedux.js',
    path: resolve('dist'),
  },
  plugins: [],
}
