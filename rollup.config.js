import babel from 'rollup-plugin-babel'
import replace from 'rollup-plugin-replace'
import resolve from 'rollup-plugin-node-resolve'
import uglify from 'rollup-plugin-uglify'

const env = process.env.NODE_ENV

const plugins = [
  babel({
    exclude: 'node_modules/**'
  }),

  replace({
    'process.env.NODE_ENV': JSON.stringify(env) // quote the value
  }),

  resolve()
]

if (env === 'production') {
  plugins.push(
    uglify({
      compress: {
        pure_getters: true,
        unsafe: true,
        unsafe_comps: true,
        warnings: false
      }
    })
  )
}

export default {
  input: 'src/index.js',
  output: {
    file: 'dist/zedux.js',
    format: 'umd',
    name: 'Zedux'
  },
  plugins
}
