import { resolve } from 'path'
import TsconfigPathsPlugin from 'tsconfig-paths-webpack-plugin'

export default {
  devtool: 'source-map',
  entry: './src/index.ts',
  externals: {
    react: 'React',
  },
  mode: process.env.NODE_ENV,
  module: {
    rules: [
      {
        test: /\.tsx?$/,
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
  output: {
    filename:
      process.env.NODE_ENV === 'development'
        ? 'react-zedux.js'
        : 'react-zedux.min.js',
    path: resolve('dist'),
  },
  plugins: [],
  resolve: {
    extensions: ['.ts', '.tsx'],
    plugins: [
      new TsconfigPathsPlugin({
        configFile: 'tsconfig.webpack.json',
      }),
    ],
  },
}
