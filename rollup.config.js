import babel from 'rollup-plugin-babel'
import replace from 'rollup-plugin-replace'
import uglify from 'rollup-plugin-uglify'


const env = process.env.NODE_ENV


const plugins = [
  babel({
    babelrc: false,
    exclude: 'node_modules/**',
    presets: [
      'es2015-rollup',
      'react',
      'stage-0'
    ],
    plugins: [
      'transform-decorators-legacy'
    ]
  }),

  replace({
    'process.env.NODE_ENV': JSON.stringify(env) // quote the value
  })
]


if (env === 'production') {
  plugins.push(uglify({
    compress: {
      pure_getters: true,
      unsafe: true,
      unsafe_comps: true,
      warnings: false
    }
  }))
}


const config = {
  input: 'src/index.js',
  output: {
    file: 'dist/zedux.js',
    format: 'umd'
  },
  name: 'Zedux',
  plugins,
  external: [
    'react',
    'react-dom',
    'redux',
    'zedux'
  ],
  globals: {
    react: 'React',
    'react-dom': 'ReactDOM',
    redux: 'Redux',
    zedux: 'Zedux'
  }
}


export default config
