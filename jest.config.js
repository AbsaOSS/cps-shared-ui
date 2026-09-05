const collectCoverageFrom =
  process.env.COVERAGE_PROJECT === 'cps-ui-kit'
    ? [
        'projects/cps-ui-kit/src/**/*.ts',
        '!projects/**/node_modules/**',
        '!projects/**/*.spec.ts',
        '!projects/**/testing/**',
        '!projects/**/public-api.ts',
        '!projects/cps-ui-kit/src/lib/components/cps-scheduler/cps-scheduler.utils.ts',
        '!projects/cps-ui-kit/src/lib/primeng-temp/**',
        '!projects/cps-ui-kit/src/lib/primeuix-temp/**'
      ]
    : [
        'projects/cps-ui-kit/src/**/*.ts',
        'projects/composition/src/**/*.ts',
        '!projects/**/node_modules/**',
        '!projects/**/*.spec.ts',
        '!projects/**/testing/**',
        '!projects/**/public-api.ts',
        '!projects/cps-ui-kit/src/lib/primeng-temp/**',
        '!projects/cps-ui-kit/src/lib/primeuix-temp/**'
      ];

const coverageThreshold =
  process.env.COVERAGE_PROJECT === 'cps-ui-kit'
    ? {
        global: {
          statements: 10,
          branches: 0,
          functions: 0,
          lines: 10
        },
        './projects/cps-ui-kit/src/**/*.ts': {
          statements: 90,
          branches: 90,
          functions: 90,
          lines: 90
        }
      }
    : {
        global: {
          statements: 10,
          branches: 0,
          functions: 0,
          lines: 10
        }
      };

module.exports = {
  roots: ['<rootDir>/projects'],
  coverageDirectory: '<rootDir>/coverage',
  preset: 'jest-preset-angular',
  moduleNameMapper: {
    '^lodash-es$': 'lodash',
    '^cps-ui-kit$': '<rootDir>/projects/cps-ui-kit/src/public-api.ts',
    '^cps-telemetry$': '<rootDir>/projects/cps-telemetry/src/public-api.ts',
    '^cps-telemetry/rum$':
      '<rootDir>/projects/cps-telemetry/rum/src/public-api.ts'
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
  collectCoverageFrom,
  coverageThreshold
};
