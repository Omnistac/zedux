import { Config } from '@jest/types'
import { pathsToModuleNameMapper, RawCompilerOptions } from 'ts-jest'
import { compilerOptions } from './tsconfig.json'

const jestCompilerOptions: RawCompilerOptions = {
  ...(compilerOptions as any),
  lib: [...compilerOptions.lib, 'DOM'],
  paths: {
    '@zedux/atoms': ['./packages/atoms/src'],
    '@zedux/atoms/*': ['./packages/atoms/src/*'],
    '@zedux/core': ['./packages/core/src'],
    '@zedux/core/*': ['./packages/core/src/*'],
    '@zedux/machines': ['./packages/machines/src'],
    '@zedux/machines/*': ['./packages/machines/src/*'],
    '@zedux/react': ['./packages/react/src'],
    '@zedux/react/*': ['./packages/react/src/*'],
  },
}

const config: Config.InitialOptions = {
  collectCoverage: true,
  collectCoverageFrom: ['**/src/**'],
  globals: {
    DEV: true,
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  moduleNameMapper: pathsToModuleNameMapper(jestCompilerOptions.paths || {}, {
    prefix: '<rootDir>/',
  }),
  modulePaths: [compilerOptions.baseUrl],
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
  ],
  setupFilesAfterEnv: ['./jest.setup.ts'],
  testEnvironment: 'jsdom',
  testRegex: '/test/.*\\.test\\.tsx?$',
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: jestCompilerOptions,
      },
    ],
  },
}

export default config
