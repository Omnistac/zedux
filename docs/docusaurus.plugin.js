const { resolve } = require('path')

module.exports = (context, options) => {
  return {
    name: 'zedux-plugin',
    configureWebpack: (config, isServer, utls) => {
      return {
        resolve: {
          alias: {
            '@zedux/core': resolve('../packages/core/src'),
            '@zedux/react': resolve('../packages/react/src'),
            react: resolve('node_modules/react'),
            'react-dom': resolve('node_modules/react-dom'),
          },
        },
      }
    },
  }
}
