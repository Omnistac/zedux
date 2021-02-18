module.exports = {
  collectCoverage: true,
  collectCoverageFrom: ['**/src/**'],
  globals: {
    'process.env.NODE_ENV': 'development',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  moduleNameMapper: {
    '@zedux/core$': '<rootDir>/packages/core/src',
    '@zedux/core/(.*)$': '<rootDir>/packages/core/src/$1',
    '@zedux/core-test/(.*)$': '<rootDir>/packages/core/test/$1',
  },
  preset: 'ts-jest',
  roots: ['<rootDir>/packages/core/src', '<rootDir>/packages/core/test'],
  testEnvironment: 'node',
  testRegex: '/test/.*\\.test\\.ts$',
}
