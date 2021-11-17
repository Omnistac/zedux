import { resolve } from 'path'
import TsconfigPathsPlugin from 'tsconfig-paths-webpack-plugin'
import { DefinePlugin } from 'webpack'

const DEV = process.env.NODE_ENV === 'development'

export default {
  devtool: DEV ? 'inline-source-map' : 'source-map',
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
    filename: DEV ? 'react-zedux.js' : 'react-zedux.min.js',
    path: resolve('dist'),
  },
  plugins: [new DefinePlugin({})],
  resolve: {
    extensions: ['.ts', '.tsx'],
    plugins: [
      new TsconfigPathsPlugin({
        configFile: 'tsconfig.webpack.json',
      }),
    ],
  },
}
