import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { configureVite } from '../vite-base-config'

export default configureVite({
  getConfig: () => ({
    plugins: [
      react({
        jsxRuntime: 'classic',
      }),
    ],
    resolve: {
      alias: {
        '@zedux/react': resolve(__dirname, 'src'),
      },
    },
  }),
  moduleName: 'ZeduxReact',
  // don't add `@zedux/core` or `@zedux/atoms` to globals - @zedux/react prod
  // builds bundle them
})
