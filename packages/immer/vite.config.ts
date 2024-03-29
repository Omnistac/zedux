import { configureVite } from '../vite-base-config'

export default configureVite({
  globals: {
    '@zedux/atoms': 'ZeduxAtoms',
    immer: 'Immer',
  },
  moduleName: 'ZeduxImmer',
})
