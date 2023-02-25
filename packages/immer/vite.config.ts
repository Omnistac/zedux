import { defineConfig, LibraryOptions, PluginOption } from 'vite'
import dts from 'vite-plugin-dts'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import { resolve } from 'path'

const isDev = process.env.MODE === 'development'

const basePlugins = [react(), tsconfigPaths()]
const constants = { DEV: isDev.toString() }

const packages: Record<
  string,
  {
    define: Record<string, string>
    globals: Record<string, string>
    lib: LibraryOptions
    outDir: string
    plugins: (PluginOption | PluginOption[])[]
  }
> = {
  main: {
    define: constants,
    globals: {
      '@zedux/react': 'Zedux',
      immer: 'Immer',
      react: 'React',
      'react-dom': 'ReactDOM',
      'react-dom/client': 'ReactDOMClient',
    },
    lib: {
      entry: resolve('./src/index.ts'),
      fileName: format => `zedux-immer.${format}${isDev ? '' : '.min'}.js`,
      name: 'Zedux',
    },
    outDir: isDev ? 'dist/immer' : 'dist',
    plugins: [
      dts({
        include: isDev ? [resolve('./src')] : [],
      }),
      ...basePlugins,
    ],
  },
}

const pkg = packages[process.env.PACKAGE || 'main']

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    lib: pkg.lib,
    minify: isDev ? false : 'esbuild',
    outDir: pkg.outDir,
    rollupOptions: {
      external: Object.keys(pkg.globals),
      output: {
        globals: pkg.globals,
      },
    },
    sourcemap: true,
  },
  define: pkg.define,
  plugins: pkg.plugins,
  server: {
    port: 3030,
  },
})
