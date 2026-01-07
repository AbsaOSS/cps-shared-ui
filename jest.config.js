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
      statements: 25,
      branches: 20,
      functions: 20,
      lines: 25
    }
  }
};
