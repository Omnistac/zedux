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
    '@zedux/react$': '<rootDir>/packages/react/src',
    '@zedux/react/(.*)$': '<rootDir>/packages/react/src/$1',
    '@zedux/react-test/(.*)$': '<rootDir>/packages/react/test/$1',
  },
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
