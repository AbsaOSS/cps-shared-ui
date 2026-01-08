module.exports = {
  roots: ['<rootDir>/projects'],
  moduleNameMapper: {
    '^lodash-es$': 'lodash'
  },
  setupFilesAfterEnv: ['<rootDir>/jest-setup.ts'],
  coverageReporters: ['text', 'html', 'lcov', 'json-summary'],
  collectCoverageFrom: [
    'projects/cps-ui-kit/src/**/*.ts',
    'projects/composition/src/**/*.ts',
    '!projects/**/node_modules/**',
    '!projects/**/*.spec.ts',
    '!projects/**/testing/**',
    '!projects/**/public-api.ts'
  ],
  coverageThreshold: {
    global: {
      statements: 10,
      branches: 0,
      functions: 0,
      lines: 10
    }
  }
};
