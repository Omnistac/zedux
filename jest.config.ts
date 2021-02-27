import { Config } from '@jest/types'
import { pathsToModuleNameMapper } from 'ts-jest/utils'
import { compilerOptions } from './tsconfig.json'

const jestCompilerOptions = {
  ...compilerOptions,
  lib: [...compilerOptions.lib, 'DOM'],
}

const config: Config.InitialOptions = {
  collectCoverage: true,
  collectCoverageFrom: ['**/src/**'],
  globals: {
    'process.env.NODE_ENV': 'development',
    'ts-jest': {
      tsconfig: jestCompilerOptions,
    },
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, {
    prefix: '<rootDir>/',
  }),
  preset: 'ts-jest',
  roots: [
    '<rootDir>/packages/core/src',
    '<rootDir>/packages/core/test',
    '<rootDir>/packages/react/src',
    '<rootDir>/packages/react/test',
  ],
  testEnvironment: 'node',
  testRegex: '/test/.*\\.test\\.tsx?$',
}

export default config
