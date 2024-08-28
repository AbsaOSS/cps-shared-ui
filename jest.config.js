module.exports = {
  roots: ['<rootDir>/projects'],
  moduleNameMapper: {
    '^lodash-es$': 'lodash'
  },
  setupFilesAfterEnv: ['<rootDir>/jest-setup.ts']
};
