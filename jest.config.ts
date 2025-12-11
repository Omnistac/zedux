import { Config } from '@jest/types'
import { pathsToModuleNameMapper, TsConfigCompilerOptionsJson } from 'ts-jest'

const compilerOptions: Omit<TsConfigCompilerOptionsJson, 'paths'> & {
  paths: Record<string, string[]>
} = {
  baseUrl: '.',
  declaration: true,
  esModuleInterop: true,
  forceConsistentCasingInFileNames: true,
  jsx: 'react',
  module: 'ESNext',
  moduleResolution: 'node',
  noImplicitAny: true,
  outDir: './dist',
  resolveJsonModule: true,
  skipLibCheck: true,
  strict: true,
  target: 'ES2015',
  types: ['@testing-library/jest-dom'],
  lib: ['ESNext', 'DOM'],
  paths: {
    '@zedux/atoms': ['./packages/atoms/src'],
    '@zedux/atoms/*': ['./packages/atoms/src/*'],
    '@zedux/core': ['./packages/core/src'],
    '@zedux/core/*': ['./packages/core/src/*'],
    '@zedux/immer': ['./packages/immer/src'],
    '@zedux/immer/*': ['./packages/immer/src/*'],
    '@zedux/machines': ['./packages/machines/src'],
    '@zedux/machines/*': ['./packages/machines/src/*'],
    '@zedux/react': ['./packages/react/src'],
    '@zedux/react/*': ['./packages/react/src/*'],
    '@zedux/stores': ['./packages/stores/src'],
    '@zedux/stores/*': ['./packages/stores/src/*'],
  },
}

compilerOptions.baseUrl

const config: Config.InitialOptions = {
  collectCoverage: true,
  collectCoverageFrom: ['**/src/**'],
  globals: {
    DEV: true,
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths || {}, {
    prefix: '<rootDir>/',
  }),
  modulePaths: [compilerOptions.baseUrl ?? ''],
  preset: 'ts-jest',
  roots: [
    '<rootDir>/packages/atoms/src',
    '<rootDir>/packages/atoms/test',
    '<rootDir>/packages/core/src',
    '<rootDir>/packages/core/test',
    '<rootDir>/packages/machines/src',
    '<rootDir>/packages/machines/test',
    '<rootDir>/packages/react/src',
    '<rootDir>/packages/react/test',
    '<rootDir>/packages/core/src',
    '<rootDir>/packages/core/test',
  ],
  setupFilesAfterEnv: ['./jest.setup.ts'],
  testEnvironment: 'jsdom',
  testRegex: '/test/.*\\.test\\.tsx?$',
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: compilerOptions,
      },
    ],
  },
}

export default config
