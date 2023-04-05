import { configureVite } from '../vite-base-config'

export default configureVite({
  globals: {
    '@zedux/react': 'ZeduxReact',
    immer: 'Immer',
  },
  moduleName: 'ZeduxImmer',
})
