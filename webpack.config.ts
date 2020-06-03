import { resolve } from 'path'

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
              configFile: resolve('tsconfig.webpack.json')
            }
          }
        ],
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    alias: {
      '@src': resolve('src')
    },
    extensions: ['.ts']
  },
  output: {
    filename: 'zedux.js',
    path: resolve('dist')
  },
  plugins: []
}
