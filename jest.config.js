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
  coverageThresholds: {
    'projects/cps-ui-kit/src/**/*.ts': {
      statements: 80,
      branches: 80,
      functions: 80,
      lines: 80
    },
    'projects/composition/src/**/*.ts': {
      statements: 60,
      branches: 60,
      functions: 60,
      lines: 60
    }
  }
};
