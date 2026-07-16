module.exports = {
  roots: ['<rootDir>/projects'],
  preset: 'jest-preset-angular',
  moduleNameMapper: {
    '^lodash-es$': 'lodash',
    '^cps-ui-kit$': '<rootDir>/projects/cps-ui-kit/src/public-api.ts'
  },
  transformIgnorePatterns: [
    'node_modules/(?!(.*.mjs$|@angular/common/locales/.*.js$))'
  ],
  transform: {
    '^.+.(ts|js|mjs|html|svg)$': [
      'jest-preset-angular',
      {
        diagnostics: false,
        stringifyContentPathRegex: '.(html|svg)$'
      }
    ]
  },
  testEnvironment: 'jest-environment-jsdom',
  setupFiles: ['zone.js'],
  setupFilesAfterEnv: ['<rootDir>/jest-setup.ts'],
  coverageReporters: ['text', 'html', 'lcov', 'json-summary'],
  collectCoverageFrom: [
    'projects/cps-ui-kit/src/**/*.ts',
    'projects/composition/src/**/*.ts',
    '!projects/**/node_modules/**',
    '!projects/**/*.spec.ts',
    '!projects/**/testing/**',
    '!projects/**/public-api.ts',
    '!projects/cps-ui-kit/src/lib/primeng-temp/**',
    '!projects/cps-ui-kit/src/lib/primeuix-temp/**'
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
