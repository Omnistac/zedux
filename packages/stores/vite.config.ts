import { resolve } from 'path'
import { configureVite } from '../vite-base-config'

export default configureVite({
  getConfig: () => ({
    resolve: {
      alias: {
        '@zedux/atoms-bundled': resolve(__dirname, '../atoms/dist/esm'),
        '@zedux/stores': resolve(__dirname, 'src'),
      },
    },
  }),
  globals: {
    '@zedux/atoms': 'ZeduxAtoms',
    // don't add `@zedux/core` to globals - @zedux/stores prod builds bundle it
  },
  moduleName: 'ZeduxStores',
})
