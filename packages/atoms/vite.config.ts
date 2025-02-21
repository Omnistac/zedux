import { resolve } from 'path'
import { configureVite } from '../vite-base-config'

export default configureVite({
  getConfig: () => ({
    resolve: {
      alias: {
        '@zedux/atoms': resolve(__dirname, 'src'),
      },
    },
  }),
  moduleName: 'ZeduxAtoms',
  // don't add `@zedux/core` to globals - if we go back to using the core
  // package here, @zedux/atoms prod builds will bundle it
})
