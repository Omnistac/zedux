import { Config } from '@jest/types'
import { RawCompilerOptions } from 'ts-jest'
import { pathsToModuleNameMapper } from 'ts-jest/utils'
import { compilerOptions } from './tsconfig.json'

const jestCompilerOptions: RawCompilerOptions = {
  ...(compilerOptions as any),
  lib: [...compilerOptions.lib, 'DOM'],
}

const config: Config.InitialOptions = {
  collectCoverage: true,
  collectCoverageFrom: ['**/src/**'],
  globals: {
    DEV: true,
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
  setupFilesAfterEnv: ['./jest.setup.ts'],
  testEnvironment: 'jsdom',
  testRegex: '/test/.*\\.test\\.tsx?$',
}

export default config
