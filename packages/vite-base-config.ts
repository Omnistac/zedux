import {
  ConfigEnv,
  defineConfig,
  mergeConfig,
  UserConfig,
  UserConfigFn,
} from 'vite'

export interface ViteBaseConfigOptions {
  config?: UserConfig
  globals?: Record<string, string>
  moduleName: string
}

const baseGlobals = {
  react: 'React',
  'react-dom': 'ReactDOM',
  'react-dom/client': 'ReactDOMClient',
}

/**
 * Get the vite base config to manipulate it yourself. Usage:
 *
 * ```ts
 * import { getViteBaseConfig } from './packages/vite-base-config';
 *
 * export default defineConfig((env) => {
 *   const baseConfig = getViteBaseConfig(env)
 *   const modifiedConfig = ...modify baseConfig...
 *   return modifiedConfig
 * })
 * ```
 */
export const getViteBaseConfig = async (
  { mode }: ConfigEnv,
  { config = {}, globals = {}, moduleName }: ViteBaseConfigOptions
): Promise<UserConfig> => {
  const baseConfig: UserConfig = {
    build: {
      lib: {
        entry: './src/index.ts', // relative to package directory
        fileName: format =>
          `${moduleName
            .replace(/(\w)([A-Z])/g, '$1-$2')
            .toLowerCase()}.${format}.min.js`,
        name: moduleName,
      },
      minify: 'esbuild',
      sourcemap: true,
      rollupOptions: {
        external: [...Object.keys(baseGlobals), ...Object.keys(globals)],
        output: {
          globals: { ...baseGlobals, ...globals },
        },
      },
    },
    define: {
      DEV: JSON.stringify(false),
      'process.env.NODE_ENV': JSON.stringify(mode),
    },
    server: {
      open: true,
      port: 3000, // override via cli --port option
    },
  }

  return mergeConfig(baseConfig, config)
}

/**
 * A useful standalone configurator for the Zedux npm packages. Usage:
 *
 * ```ts
 * // vite.config.ts
 * import { configureVite } from '../vite-base-config';
 *
 * export default configureVite({
 *   moduleName: 'Zedux',
 * });
 * ```
 */
export const configureVite = ({
  getConfig = () => ({}),
  globals,
  moduleName,
}: Omit<ViteBaseConfigOptions, 'config'> & {
  getConfig?: (env: ConfigEnv) => UserConfig
}) => {
  return defineConfig(env => {
    return getViteBaseConfig(env, {
      config: getConfig(env),
      globals,
      moduleName,
    })
  }) as UserConfigFn
}
