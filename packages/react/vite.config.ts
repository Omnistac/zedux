import { defineConfig, LibraryOptions, PluginOption } from 'vite'
import dts from 'vite-plugin-dts'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import { join, resolve, sep } from 'path'

const baseGlobals = {
  react: 'React',
  'react-dom': 'ReactDOM',
}
const basePlugins = [react(), tsconfigPaths()]
const distDir = resolve('dist')
const numDistPathNodes = distDir.split(sep).filter(Boolean).length

const packages: Record<
  string,
  {
    globals: Record<string, string>
    lib: LibraryOptions
    outDir: string
    plugins: (PluginOption | PluginOption[])[]
  }
> = {
  devtools: {
    globals: {
      ...baseGlobals,
      '@zedux/react': 'Zedux',
    },
    lib: {
      entry: resolve('./src/devtools/index.ts'),
      fileName: 'zedux-react-devtools',
      name: 'ZeduxDevtools',
    },
    outDir: 'dist/react/devtools',
    plugins: [
      dts({
        include: resolve('./src/devtools'),
        outputDir: 'dist/react',
      }),
      ...basePlugins,
    ],
  },
  main: {
    globals: baseGlobals,
    lib: {
      entry: resolve('./src/index.ts'),
      fileName: 'zedux-react',
      name: 'Zedux',
    },
    outDir: 'dist/react',
    plugins: [
      dts({
        beforeWriteFile: (filePath, content) => {
          const nodes = filePath.split(sep).filter(Boolean)
          const numRelativeNodes = nodes.length - 1 - numDistPathNodes
          const relativeDistPath = Array(numRelativeNodes).fill('..').join('/')

          return {
            content: content.replace(
              /(^|\n)(im|ex)port ((.|\n)*?) from '(.*)?'/gm,
              (match, capture1, capture2, capture3, capture4, capture5) => {
                const base = `${capture1}${capture2}port ${capture3} from `

                if (!capture5.startsWith('@zedux'))
                  return `${base}'${capture5}'`

                const importNodes = capture5.split('/')

                return `${base}'${join(
                  relativeDistPath,
                  importNodes[1],
                  'src',
                  ...importNodes.slice(2)
                )}'`
              }
            ),
          }
        },
        include: [resolve('./src'), resolve('../core/src')],
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
    outDir: pkg.outDir,
    rollupOptions: {
      external: Object.keys(pkg.globals),
      output: {
        globals: pkg.globals,
      },
    },
    sourcemap: true,
  },
  plugins: pkg.plugins,
  server: {
    port: 3030,
  },
})
