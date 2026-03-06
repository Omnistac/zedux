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
  globals: {
    '@zedux/react': 'ZeduxReact',
    '@tanstack/react-router': 'TanstackReactRouter',
    react: 'React',
  },
  moduleName: 'ZeduxTanstackReactRouter',
})
