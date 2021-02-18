const { resolve } = require("path")

module.exports = ({ config }) => {
  const newConfig = {
    ...config,
    resolve: {
      ...config.resolve,
      alias: {
        ...config.resolve.alias,
        'core-js/modules': resolve('node_modules/core-js/modules'),
        '@src': resolve('./src'),
        '@zedux/core': resolve('../core/src')
      },
      modules: [
        ...config.resolve.modules,
        resolve('../core'),
        resolve('../../node_modules')
      ],
      plugins: [
        ...config.resolve.plugins,

      ]
    }
  }

  return newConfig
}